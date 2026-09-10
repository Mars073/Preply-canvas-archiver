/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Viewer — three-level navigation: classroom (one tutor) → page (listed once)
 * → versions, gathered in the History panel.
 *
 * The model is derived from the index at load time; no storage migration.
 *   classroomId -> a Preply classroom, therefore a tutor
 *   canvasId    -> one Canvas page
 *   snapshot    -> one dated version of that page
 */

/**
 * Extension API root.
 *
 * Firefox exposes `browser`, Chrome exposes `chrome`. Under MV3 both return
 * promises for the APIs used here, so an alias is enough — shipping the Mozilla
 * polyfill would mean an npm dependency for three calls.
 *
 * Redeclared in each file rather than shared: the Chrome service worker loads a
 * single script and cannot import a common module without a build step.
 */
const api = globalThis.browser ?? globalThis.chrome;

const INDEX_KEY = 'pca:index';

const elRooms = document.getElementById('room-list');
const elPages = document.getElementById('page-list');
const elFilter = document.getElementById('filter');
// The <span>, not its container: renderUsage() writes with textContent, which
// would wipe the repository link sitting next to it.
const elUsage = document.getElementById('usage-text');
const elTopbar = document.getElementById('topbar');
const elMeta = document.getElementById('meta');
const elTitle = document.getElementById('doc-title');
const elDoc = document.getElementById('doc');
const elSheet = document.getElementById('sheet');
const elPlaceholder = document.getElementById('placeholder');
const elMenu = document.getElementById('more-menu');
const btnMore = document.getElementById('btn-more');
const btnFocus = document.getElementById('btn-focus');
const elReading = document.getElementById('reading');
const elScroll = document.getElementById('scroll');
const linkPreply = document.getElementById('btn-preply');
const elHistory = document.getElementById('history');

/**
 * Whether the history panel is open.
 *
 * The panel is no longer toggled with the `hidden` attribute: it has to stay
 * in the layout to slide, and `[hidden]` forces `display:none`, which cancels
 * every transition. `.open` carries the state; `visibility` in CSS does what
 * `hidden` used to do for assistive technology and the tab order.
 *
 * @returns {boolean}
 */
function historyOpen() {
  return elHistory.classList.contains('open');
}
const elHList = document.getElementById('hlist');
const btnHistory = document.getElementById('btn-history');

/**
 * @typedef {{key:string, canvasId:string, classroomId:string, page:string,
 *            title:string, ts:string, chars:number}} IndexEntry
 * @typedef {{id:string, number:string, entries:IndexEntry[], label:string|null,
 *            lines:string[], folded:{out:string,map:number[]}[]}} Page
 * @typedef {{id:string, tutor:string, title:string, pages:Map<string,Page>}} Room
 */

/** @type {Map<string, Room>} */
let rooms = new Map();
/** @type {Room|null} */
let curRoom = null;
/** @type {Page|null} */
let curPage = null;
/** Snapshot on screen, augmented with its key. @type {object|null} */
let curSnap = null;

/* ----------------------------------------------------- interface state */

const PREFS_KEY = 'pca:prefs';

/**
 * Persistent interface state.
 *
 * Kept in `storage.local` rather than `localStorage`: a temporary add-on gets a
 * fresh UUID on every load, hence a fresh origin and an empty `localStorage`.
 * `storage.local` is keyed by extension id and survives reloads.
 *
 * `zoom` at `null` means never chosen: the default step is resolved at
 * initialisation, once ZOOM_STEPS is known.
 *
 * @type {{zoom:number|null, roomId:string|null, pageId:string|null, focus:boolean}}
 */
let prefs = { zoom: null, roomId: null, pageId: null, focus: false };

/**
 * Loads preferences. An unreadable store leaves the defaults in place.
 *
 * @returns {Promise<void>}
 */
async function loadPrefs() {
  try {
    const stored = await api.storage.local.get(PREFS_KEY);
    if (stored[PREFS_KEY]) prefs = { ...prefs, ...stored[PREFS_KEY] };
  } catch (e) {
    console.warn('[pca] preferences unreadable', e);
  }
}

/** Writes preferences without blocking the interface. @returns {void} */
function savePrefs() {
  api.storage.local.set({ [PREFS_KEY]: prefs })
    .catch((e) => console.warn('[pca] preferences not written', e));
}

const LABELS_KEY = 'pca:labels';

/**
 * Page names chosen by hand, indexed by canvasId.
 *
 * Stored apart from snapshots: a name belongs to the page, not to a version. It
 * has to survive both the archiving of a new version and the deletion of the
 * one that was on screen when it was typed.
 *
 * @type {Record<string, string>}
 */
let labels = {};

/**
 * Loads custom names. An unreadable store leaves the table empty, in which case
 * the labels derived from content take over.
 *
 * @returns {Promise<void>}
 */
async function loadLabels() {
  try {
    const stored = await api.storage.local.get(LABELS_KEY);
    labels = stored[LABELS_KEY] || {};
  } catch (e) {
    console.warn('[pca] page names unreadable', e);
  }
}

/** Writes custom names. @returns {void} */
function saveLabels() {
  api.storage.local.set({ [LABELS_KEY]: labels })
    .catch((e) => console.warn('[pca] page names not written', e));
}

const AVATARS_KEY = 'pca:avatars';

/**
 * Tutor avatars as data URIs, by classroomId.
 *
 * Stored once per classroom rather than in every snapshot: they belong to the
 * tutor, not to a dated version.
 *
 * @type {Record<string, string>}
 */
let avatars = {};

/**
 * Loads avatars. On failure the tutor initial takes over.
 *
 * @returns {Promise<void>}
 */
async function loadAvatars() {
  try {
    const stored = await api.storage.local.get(AVATARS_KEY);
    avatars = stored[AVATARS_KEY] || {};
  } catch (e) {
    console.warn('[pca] avatars unreadable', e);
  }
}

const IMAGE_PREFIX = 'pca:img:';

/**
 * Puts captured images back into a document.
 *
 * Snapshots hold only a content hash in `data-pca-img`, because the same
 * picture recurs in every version of a page and storing it per version would
 * multiply it. The bytes live once under `pca:img:<hash>` and are reattached
 * here, at display time.
 *
 * A hash with no matching entry is marked rather than left as a silent empty
 * frame.
 *
 * @param {ParentNode} root - the displayed document, or a detached copy.
 * @returns {Promise<void>}
 */
async function resolveImages(root) {
  const nodes = [...root.querySelectorAll('img[data-pca-img]')];
  if (nodes.length === 0) return;

  const hashes = [...new Set(nodes.map((n) => n.dataset.pcaImg))];
  const stored = await api.storage.local.get(hashes.map((h) => IMAGE_PREFIX + h));

  for (const node of nodes) {
    const uri = stored[IMAGE_PREFIX + node.dataset.pcaImg];
    if (uri) node.src = uri;
    else node.setAttribute('data-pca-missing', '');
  }
}

const ORDER_KEY = 'pca:order';

/**
 * Page rank as Preply presents it, by classroom then by canvasId.
 *
 * Every Canvas page is a distinct canvasId, and nothing in a snapshot says
 * where it sits in the sequence. Only the thumbnail bar knows, and the content
 * script is what reads it.
 *
 * @type {Record<string, Record<string, {index: number, num: string}>>}
 */
let order = {};

/**
 * Loads known ranks. On failure sorting falls back to reverse-chronological
 * archiving order.
 *
 * @returns {Promise<void>}
 */
async function loadOrder() {
  try {
    const stored = await api.storage.local.get(ORDER_KEY);
    order = stored[ORDER_KEY] || {};
  } catch (e) {
    console.warn('[pca] page order unreadable', e);
  }
}

/**
 * Displayed name of a page: the chosen name, else the label derived from its
 * content, else the Preply page number.
 *
 * @param {Page} page
 * @returns {string}
 */
function pageName(page) {
  return labels[page.id] || page.label || t('pageFallback', [page.number]);
}

/* ------------------------------------------------------------------ utils */

const elStatus = document.getElementById('sr-status');

/**
 * Announces a change to assistive technology.
 *
 * The viewer swaps documents with no page load: without a live region nothing
 * signals that you are looking at something else. The text is cleared then set
 * again on the next tick, or two identical announcements in a row go unnoticed.
 *
 * @param {string} message
 * @returns {void}
 */
function announce(message) {
  elStatus.textContent = '';
  requestAnimationFrame(() => { elStatus.textContent = message; });
}

/**
 * Preply course languages mapped to BCP-47 tags.
 *
 * Without `lang` on the document itself, a speech synthesiser reads Polish with
 * French rules — the content becomes unlistenable.
 */
const LANG_TAGS = {
  polish: 'pl', french: 'fr', english: 'en', spanish: 'es', german: 'de',
  italian: 'it', portuguese: 'pt', russian: 'ru', chinese: 'zh', japanese: 'ja',
  korean: 'ko', arabic: 'ar', dutch: 'nl', turkish: 'tr', swedish: 'sv',
  ukrainian: 'uk', czech: 'cs', greek: 'el', hebrew: 'he', hindi: 'hi',
  norwegian: 'nb', danish: 'da', finnish: 'fi', romanian: 'ro', hungarian: 'hu',
};

/**
 * Language tag of a snapshot.
 *
 * The field set at capture wins; otherwise the archived URL is re-read, shaped
 * /edu/<language>/classroom-v2/… — which covers snapshots taken before that
 * field existed. An unknown language returns an empty string: inheriting the
 * interface language beats asserting a wrong one.
 *
 * @param {{course?: string, url?: string}} snap
 * @returns {string} BCP-47 tag, or empty when undetermined.
 */
function langOf(snap) {
  const fromUrl = /\/edu\/([a-z-]+)\/classroom-v2\//i.exec(snap.url || '');
  const raw = snap.course || (fromUrl ? fromUrl[1] : '');
  return raw ? (LANG_TAGS[raw.toLowerCase()] || '') : '';
}

/**
 * Formats an ISO timestamp into a short relative label.
 *
 * @param {string} iso
 * @returns {string} e.g. "Today 18:42" or "12 March 2026 09:26".
 */
function fmt(iso) {
  const d = new Date(iso);
  const now = new Date();
  const hm = d.toLocaleTimeString(UI_LOCALE, { hour: '2-digit', minute: '2-digit' });
  const days = Math.round((new Date(now.toDateString()) - new Date(d.toDateString())) / 86400000);
  if (days === 0) return t('todayAt', [hm]);
  if (days === 1) return t('yesterdayAt', [hm]);
  return `${d.toLocaleDateString(UI_LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })} ${hm}`;
}

/**
 * Extracts the tutor name from the Preply tab title.
 *
 * @param {string} title - e.g. "Salle de classe avec Paula".
 * @returns {string} the name, or the whole title when no pattern matches.
 */
function tutorOf(title) {
  return tutorFromTitle(title) || 'Unknown classroom';
}

/** Elements treated as a standalone line when extracting text. */
const BLOCK_TAGS = /^(P|LI|H[1-6]|TD|TH|BLOCKQUOTE|PRE|FIGCAPTION)$/;

/**
 * Letters that no Unicode normalisation decomposes.
 *
 * These are not accented letters but letters in their own right: NFKD leaves
 * them alone. Without this table, searching "slonce" would never find "słońce",
 * nor "oe" find "œuf", nor "strasse" find "straße".
 * Expansions to several letters are intended, and handled by foldWithMap.
 */
const FOLD_MAP = new Map(Object.entries({
  ł: 'l', ø: 'o', đ: 'd', ð: 'd', þ: 'th', æ: 'ae', œ: 'oe', ß: 'ss',
  ı: 'i', ħ: 'h', ŋ: 'n', ŧ: 't', ĸ: 'k', ŀ: 'l', ĳ: 'ij', ſ: 's',
}));

const FOLD_RE = new RegExp(`[${[...FOLD_MAP.keys()].join('')}]`, 'g');

/**
 * Folds a string for comparison: no diacritics, no case.
 *
 * Three passes, in this order:
 *   1. NFKD — splits letter + combining mark, and flattens compatibility forms
 *      (full width, typographic ligatures, superscripts).
 *   2. removal of every Unicode mark (`\p{M}`), not just the Latin block: this
 *      also covers Greek, Cyrillic, Hebrew, Arabic and Vietnamese.
 *   3. lower case, then the table of indecomposable letters.
 *
 * Turkish converges correctly: `İ` loses its dot at step 2, `ı` is flattened at
 * step 3, and both end up as `i`.
 *
 * @param {string} s
 * @returns {string}
 */
function fold(s) {
  return s.normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(FOLD_RE, (c) => FOLD_MAP.get(c));
}

/**
 * Folds a line while keeping a map back to the original indices.
 *
 * Essential: folding changes lengths — `ß` becomes two letters, an accented
 * character loses one — so an index found in the folded string does not point
 * at the same character in the displayed one. We fold code point by code point
 * and record, for each folded position, its source position.
 *
 * Iteration goes by code point (`for...of`) rather than by UTF-16 unit:
 * splitting a surrogate pair would yield two half-characters.
 *
 * @param {string} s
 * @returns {{out: string, map: number[]}}
 */
function foldWithMap(s) {
  let out = '';
  const map = [];
  let i = 0;
  for (const ch of s) {
    const f = fold(ch);
    for (let k = 0; k < f.length; k++) { out += f[k]; map.push(i); }
    i += ch.length; // 1 ou 2 unites UTF-16
  }
  return { out, map };
}

/**
 * Normalised text of a block, as used for search and for comparison.
 *
 * `\s` already covers the non-breaking space in JavaScript: the previous class
 * [\s<U+00A0>] held an invisible character, redundant and a trap on re-reading.
 *
 * @param {Element} el
 * @returns {string}
 */
function blockText(el) {
  return el.textContent.replace(/\s+/g, ' ').trim();
}

/**
 * Text-bearing blocks of a document, in reading order.
 *
 * Empty blocks are dropped: those are ProseMirror's countless single-break
 * paragraphs, of no interest to search or to comparison.
 *
 * Single source of block splitting. The diff aligns a snapshot's lines to the
 * displayed DOM nodes by position, so two diverging walks would shift every
 * marker.
 *
 * @param {ParentNode} root
 * @returns {Element[]}
 */
function blockNodes(root) {
  const out = [];
  const visit = (el) => {
    for (const child of el.children) {
      // An <li> holding a <p> must not yield the same line twice.
      if (BLOCK_TAGS.test(child.tagName) && !child.querySelector('p,li,td,th')) {
        if (blockText(child)) out.push(child);
      } else {
        visit(child);
      }
    }
  };
  visit(root);
  return out;
}

/**
 * Splits a snapshot into logical lines and derives the page label from them.
 *
 * Preply does not name its pages — the thumbnail bar only gives a number. The
 * label is therefore reconstructed from the first non-empty line.
 *
 * @param {string} html
 * @returns {{label: string, lines: string[]}}
 */
/**
 * Strips collaboration carets from a parsed snapshot.
 *
 * They are ProseMirror decorations, not document content: one per connected
 * peer, carrying that person's name in a label. Left in, the tutor's name
 * appears wedged mid-sentence, and because the label is real text it also
 * reaches the page list, the search excerpts and every diff.
 *
 * cloneEditor() removes them at capture time, so this only repairs snapshots
 * taken before that fix. It is cheap, it runs on a detached copy, and stored
 * data is never rewritten — an archive is not edited after the fact.
 *
 * .ProseMirror-widget is ProseMirror's own class for widget decorations and
 * the caret classes come from the Tiptap collaboration extension. Both are
 * upstream library names, not the content-hashed classes Preply generates per
 * build, so anchoring on them does not break the rule against doing so.
 *
 * @param {ParentNode} root
 * @returns {void}
 */
function stripWidgets(root) {
  for (const el of root.querySelectorAll('.ProseMirror-widget,[class*="collaboration-carets"]')) {
    el.remove();
  }
}

function parseSnapshot(html) {
  const box = document.createElement('div');
  box.innerHTML = html;
  stripWidgets(box);

  const lines = blockNodes(box).map(blockText);
  const first = lines[0] || '';

  return {
    label: first ? (first.length > 44 ? first.slice(0, 44) + '…' : first) : t('pageNoText'),
    lines,
  };
}

/**
 * Extracts a short text preview of a snapshot.
 *
 * @param {string} html
 * @returns {string}
 */
function excerpt(html) {
  const box = document.createElement('div');
  box.innerHTML = html;
  stripWidgets(box);
  const t = box.textContent.replace(/\s+/g, ' ').trim();
  return t.length > 120 ? t.slice(0, 120) + '…' : t;
}

/* ------------------------------------------------------------------ model */

/**
 * Rebuilds the three-level model from the index.
 *
 * @returns {Promise<void>}
 */
async function loadModel() {
  const stored = await api.storage.local.get(INDEX_KEY);
  /** @type {IndexEntry[]} */
  const index = stored[INDEX_KEY] || [];
  index.sort((a, b) => (a.ts < b.ts ? 1 : -1));

  rooms = new Map();
  for (const e of index) {
    let room = rooms.get(e.classroomId);
    if (!room) {
      room = { id: e.classroomId, tutor: tutorOf(e.title), title: e.title, pages: new Map() };
      rooms.set(e.classroomId, room);
    }
    let page = room.pages.get(e.canvasId);
    if (!page) {
      page = { id: e.canvasId, number: e.page, entries: [], label: null, lines: [], folded: [] };
      room.pages.set(e.canvasId, page);
    }
    page.entries.push(e);
  }
}

/**
 * Loads the page content of a classroom from each page's newest version:
 * label, lines, and folded lines for search.
 *
 * Folding is computed once here rather than on every keystroke in the filter:
 * `fold()` normalises character by character, which would be noticeable on a
 * document of several thousand signs.
 *
 * @param {Room} room
 * @returns {Promise<void>}
 */
async function resolvePageContent(room) {
  const missing = [...room.pages.values()].filter((p) => p.label === null);
  if (missing.length === 0) return;

  const keys = missing.map((p) => p.entries[0].key);
  const store = await api.storage.local.get(keys);

  for (const p of missing) {
    const snap = store[p.entries[0].key];
    if (!snap) {
      p.label = t('snapshotMissing');
      p.lines = [];
      p.folded = [];
      continue;
    }
    const parsed = parseSnapshot(snap.html);
    p.label = parsed.label;
    p.lines = parsed.lines;
    p.folded = parsed.lines.map(foldWithMap);
  }
}

/**
 * Finds the first folded occurrence in a page's lines.
 *
 * @param {Page} page
 * @param {string} needle - already folded by `fold()`.
 * @returns {{line: string, start: number, end: number}|null}
 */
function findMatch(page, needle) {
  const folded = page.folded || [];
  for (let i = 0; i < folded.length; i++) {
    const at = folded[i].out.indexOf(needle);
    if (at === -1) continue;
    const map = folded[i].map;
    return {
      line: page.lines[i],
      start: map[at],
      end: map[Math.min(at + needle.length - 1, map.length - 1)] + 1,
    };
  }
  return null;
}

/**
 * Builds the excerpt around an occurrence, the term in bold.
 *
 * Assembled as DOM nodes rather than HTML: the content comes from lessons and
 * must never be interpreted as markup.
 *
 * @param {{line: string, start: number, end: number}} hit
 * @returns {DocumentFragment}
 */
function excerptAround(hit) {
  const CONTEXT = 34;
  const from = Math.max(0, hit.start - CONTEXT);
  const to = Math.min(hit.line.length, hit.end + CONTEXT);

  const frag = document.createDocumentFragment();
  frag.append((from > 0 ? '…' : '') + hit.line.slice(from, hit.start));

  const strong = document.createElement('strong');
  strong.textContent = hit.line.slice(hit.start, hit.end);
  frag.append(strong);

  frag.append(hit.line.slice(hit.end, to) + (to < hit.line.length ? '…' : ''));
  return frag;
}

/* ---------------------------------------------------------------- render */

/** Renders the classroom column. */
function renderRooms() {
  elRooms.textContent = '';

  if (rooms.size === 0) {
    const li = document.createElement('li');
    const p = document.createElement('p');
    p.className = 'empty-filter';
    p.textContent = t('noArchives');
    li.append(p);
    elRooms.append(li);
    return;
  }

  for (const room of rooms.values()) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'room';
    // Set on the current item only: `aria-current="false"` everywhere else is
    // valid but chatty when spoken.
    if (curRoom && curRoom.id === room.id) b.setAttribute('aria-current', 'true');

    // The avatar and the chevron are purely decorative: the name that follows
    // says it all. Leaving them readable would announce "P, Paula, chevron".
    const av = document.createElement('span');
    av.className = 'av';
    av.setAttribute('aria-hidden', 'true');

    const portrait = avatars[room.id];
    if (portrait) {
      // Data URI: no network request, so the avatar survives offline.
      const img = document.createElement('img');
      img.src = portrait;
      img.alt = '';
      // If the data URI is corrupt, fall back to the initial rather than leave
      // a broken image.
      img.addEventListener('error', () => {
        av.classList.remove('has-img');
        av.textContent = room.tutor.slice(0, 1).toUpperCase();
      });
      av.classList.add('has-img');
      av.append(img);
    } else {
      av.textContent = room.tutor.slice(0, 1).toUpperCase();
    }

    const nm = document.createElement('span');
    nm.className = 'nm';
    const name = document.createElement('b');
    name.textContent = room.tutor;
    const count = document.createElement('span');
    const n = room.pages.size;
    count.textContent = tn('pageCount', n);
    nm.append(name, count);

    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.setAttribute('aria-hidden', 'true');
    chev.append(icon('caret-right'));

    b.append(av, nm, chev);
    b.addEventListener('click', () => selectRoom(room));
    li.append(b);
    elRooms.append(li);
  }
}

/**
 * Pages of a classroom, newest archived first.
 *
 * Explicit sort rather than relying on the Map insertion order, which was only
 * correct as a side effect of how the index was sorted.
 *
 * @param {Room} room
 * @returns {Page[]}
 */
function pagesOf(room) {
  const known = order[room.id] || {};

  return [...room.pages.values()].sort((a, b) => {
    const ia = known[a.id] ? known[a.id].index : undefined;
    const ib = known[b.id] ? known[b.id].index : undefined;

    // Preply order when it is known for both pages.
    if (Number.isFinite(ia) && Number.isFinite(ib)) return ia - ib;
    // A page of unknown rank goes after those we can place: slotting it in at
    // random would be worse than appending it.
    if (Number.isFinite(ia)) return -1;
    if (Number.isFinite(ib)) return 1;
    // Historical fallback: most recently archived first.
    return a.entries[0].ts < b.entries[0].ts ? 1 : -1;
  });
}

/** Renders the page column of the current classroom. */
function renderPages() {
  elPages.textContent = '';
  if (!curRoom) return;
  const needle = fold(elFilter.value.trim());

  let shown = 0;

  for (const page of pagesOf(curRoom)) {
    // Search runs over the newest version's content. The label being its first
    // line, the same pass covers it.
    const hit = needle ? findMatch(page, needle) : null;
    // A hand-typed name exists nowhere in the archived content, so it has to be
    // searched separately — otherwise renaming a page would hide it.
    const nameHit = needle && !hit && fold(pageName(page)).includes(needle);
    if (needle && !hit && !nameHit) continue;
    shown++;

    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'page';
    // "page" rather than "true": that is the token meant for the current item
    // of a navigation, and it is announced as "current page".
    if (curPage && curPage.id === page.id) b.setAttribute('aria-current', 'page');

    const ic = document.createElement('span');
    ic.className = 'ic';
    ic.append(icon('file-text'));

    const tx = document.createElement('span');
    tx.className = 'tx';

    const title = document.createElement('b');
    title.textContent = pageName(page);

    const sub = document.createElement('span');
    if (hit) {
      sub.className = 'hit';
      sub.append(excerptAround(hit));
    } else {
      const v = page.entries.length;
      sub.textContent = `${fmt(page.entries[0].ts)} · ${tn('versionCount', v)}`;
    }

    tx.append(title, sub);
    b.append(ic, tx);
    b.addEventListener('click', () => selectPage(page));
    li.append(b);
    elPages.append(li);
  }

  if (needle && shown === 0) {
    const li = document.createElement('li');
    const p = document.createElement('p');
    p.className = 'empty-filter';
    p.textContent = t('noMatch');
    li.append(p);
    elPages.append(li);
  }

  // The filter is typed at the keyboard: without an announcement nothing says
  // the list has shrunk, nor by how much.
  if (needle) announce(tn('pagesFound', shown, [elFilter.value.trim()]));
}

/**
 * Shows a snapshot in the main pane.
 *
 * @param {IndexEntry} entry
 * @returns {Promise<void>}
 * @throws {Error} when the index references a snapshot missing from storage.
 */
/**
 * Address of an archived page back on Preply.
 *
 * The captured location is preferred: it is the page that was actually open.
 * It is validated rather than trusted — it comes from storage, and an href is
 * a place a hostile value could reach the browser.
 *
 * Older snapshots without one are rebuilt from the parts, which is possible
 * only when the taught language is known: it is a path segment, and guessing
 * it would send the reader somewhere that is not their classroom.
 *
 * @param {object} snap
 * @returns {string|null} null when no address can be established.
 */
function preplyUrl(snap) {
  if (typeof snap.url === 'string' && snap.url.startsWith('https://preply.com/')) {
    return snap.url;
  }
  if (!snap.course || !snap.classroomId || snap.classroomId === 'unknown') return null;

  const room = `https://preply.com/edu/${snap.course}/classroom-v2/${snap.classroomId}`;
  return snap.canvasId && snap.canvasId !== 'unknown'
    ? `${room}/canvas/${snap.canvasId}`
    : room;
}

async function showSnapshot(entry) {
  const store = await api.storage.local.get(entry.key);
  const snap = store[entry.key];
  if (!snap) throw new Error(`missing snapshot: ${entry.key}`);

  // Opening or closing the history panel re-renders the SAME snapshot, only to
  // add or strip the comparison marks. Scrolling back to the top there throws
  // the reader out of the passage they were reading; it is only right when the
  // document being shown actually changes.

  const sameDocument = curSnap !== null && curSnap.key === entry.key;
  const keptScroll = sameDocument ? elScroll.scrollTop : 0;

  curSnap = { ...snap, key: entry.key };
  // The archived document is written as HTML because that is what it is. The
  // linter flags this, and the risk it names is real in principle: a tutor
  // could paste an inline handler into the Canvas. Two things close it —
  // innerHTML never executes a <script>, and the default MV3 CSP
  // (script-src 'self', no override in either manifest) blocks inline
  // handlers on extension pages. Declaring a content_security_policy that
  // relaxes script-src would reopen it.
  // Built detached, then swapped in one go. Assigning innerHTML and resolving
  // the images afterwards paints an intermediate document: resolveImages()
  // awaits storage, so for a frame or two the images have no src and no
  // height. The page was visibly shorter, the scrollbar came and went, and
  // the centred sheet slid sideways and back on every history toggle.
  const built = document.createElement('div');
  built.innerHTML = snap.html;
  stripWidgets(built);
  await resolveImages(built);
  elDoc.replaceChildren(...built.childNodes);
  const tag = langOf(snap);
  if (tag) elDoc.lang = tag;
  else elDoc.removeAttribute('lang');

  elSheet.hidden = false;
  elPlaceholder.hidden = true;
  elTopbar.hidden = false;
  elTitle.textContent = pageName(curPage);

  // Hidden rather than left dead when nothing can be built: a link that goes
  // nowhere is worse than no link.
  const back = preplyUrl(snap);
  linkPreply.hidden = back === null;
  if (back !== null) linkPreply.href = back;

  // A single discreet line: metadata must not compete with the title, which is
  // what the pills used to do.
  const versions = curPage.entries.length;
  elMeta.textContent =
    `${tn('snapshotCount', versions)} · ${curRoom.tutor} · ${fmt(snap.ts)}`;

  for (const li of elHList.querySelectorAll('.ver')) {
    const isCurrent = li.dataset.key === entry.key;
    li.classList.toggle('current', isCurrent);
    const open = li.querySelector('.ver-open');
    if (isCurrent) open.setAttribute('aria-current', 'true');
    else open.removeAttribute('aria-current');
  }


  // The diff enriches elMeta, so it has to run before the announcement.
  await applyDiff(entry);

  // Restored after the diff, not before: inserting the deleted lines changes
  // the height above the viewport, so an earlier restore would land elsewhere.
  elScroll.scrollTop = keptScroll;
  announce(t('snapshotAnnounce', [elTitle.textContent, fmt(snap.ts), elMeta.textContent]));
}

/** Past this, the dynamic programming table costs too much memory. */
const MAX_DIFF_LINES = 1200;

/**
 * Edit script between two lists of lines, by longest common subsequence.
 *
 * Textbook dynamic programming, O(n*m). Lesson notes run to a few hundred
 * lines, so the table is on the order of 100 KB — implementing Myers for that
 * would be gold-plating. MAX_DIFF_LINES guards against the pathological case.
 *
 * @param {string[]} a - previous version.
 * @param {string[]} b - displayed version.
 * @returns {{t: 'eq'|'add'|'del', i?: number, j?: number}[]}
 */
function diffLines(a, b) {
  const n = a.length;
  const m = b.length;

  /** @type {Uint32Array[]} */
  const dp = [];
  for (let i = 0; i <= n; i++) dp.push(new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ t: 'eq', j }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: 'del', i }); i++; }
    else { ops.push({ t: 'add', j }); j++; }
  }
  while (i < n) { ops.push({ t: 'del', i }); i++; }
  while (j < m) { ops.push({ t: 'add', j }); j++; }
  return ops;
}

/**
 * Marks in the displayed document what changed since the previous version.
 *
 * The diff is a **view**, never a storage format: both snapshots stay whole and
 * independent, and the computation is thrown away on every render. A delta
 * chain would make each version depend on all the ones before it, which is the
 * opposite of what an archive should guarantee.
 *
 * No effect while the History panel is closed: comparison is that panel's
 * reading mode, not a separate state to drive.
 *
 * @param {IndexEntry} entry - the snapshot currently on screen.
 * @returns {Promise<void>}
 */
async function applyDiff(entry) {
  if (!historyOpen() || !curPage) return;

  const pos = curPage.entries.findIndex((e) => e.key === entry.key);
  const previous = curPage.entries[pos + 1];
  if (!previous) {
    elMeta.textContent += t('diffFirstVersion');
    return;
  }

  const stored = await api.storage.local.get(previous.key);
  const prev = stored[previous.key];
  if (!prev) return;

  const before = parseSnapshot(prev.html).lines;
  // The same blocks, in the same order, on both sides: blockNodes() is the
  // single source of splitting, so a line index points at the right node.
  const blocks = blockNodes(elDoc);
  const after = blocks.map(blockText);

  if (before.length > MAX_DIFF_LINES || after.length > MAX_DIFF_LINES) {
    elMeta.textContent += t('diffTooLong');
    return;
  }

  const ops = diffLines(before, after);
  let added = 0;
  let removed = 0;
  /** @type {string[]} */
  let pending = [];

  /**
   * Inserts the accumulated deleted lines just before the block that followed
   * them. `null` places the remainder at the end of the document.
   *
   * @param {Element|null} anchor
   * @returns {void}
   */
  const flush = (anchor) => {
    for (const text of pending) {
      const ghost = document.createElement('p');
      ghost.className = 'pca-del';
      const tag = document.createElement('span');
      tag.className = 'sr-only';
      tag.textContent = t('srRemoved');
      ghost.append(tag, text);
      if (anchor) anchor.before(ghost);
      else elDoc.append(ghost);
    }
    pending = [];
  };

  for (const op of ops) {
    if (op.t === 'del') { pending.push(before[op.i]); removed++; continue; }

    const node = blocks[op.j];
    flush(node);
    if (op.t === 'add') {
      node.classList.add('pca-add');
      // Colour alone says nothing to a speech synthesiser.
      const tag = document.createElement('span');
      tag.className = 'sr-only';
      tag.textContent = t('srAdded');
      node.prepend(tag);
      added++;
    }
  }
  flush(null);

  elMeta.textContent += added || removed
    ? t('diffSummary', [added, removed])
    : t('diffIdentical');
}

const elHMenu = document.getElementById('hmenu');
const btnHMore = document.getElementById('hmore');
const btnDropSame = document.getElementById('btn-drop-same');
const btnDropOld = document.getElementById('btn-drop-old');

/**
 * Keys the two bulk actions would delete, refreshed by renderHistory().
 *
 * Collected while the rows are built rather than recomputed on click: the
 * comparison is already done there, and doing it twice invites the menu to
 * promise one count and delete another.
 *
 * @type {{same: string[], old: string[]}}
 */
let bulk = { same: [], old: [] };

/**
 * How many versions a sweep has to cover before the menu offering it appears.
 *
 * Strictly more than this, so the menu shows from three onwards. Below that,
 * the row menus do the same job without an extra step.
 */
const BULK_FROM = 2;

/** Row whose actions menu is open, or null. @type {HTMLElement|null} */
let verMenuRow = null;

/**
 * Opens the actions menu of one version row, closing any other.
 *
 * Only ever one is open, so the state is a single reference rather than a
 * flag per row: closing the previous one cannot then be forgotten. Passing
 * null closes whatever is open.
 *
 * @param {HTMLElement|null} row - the <li> to open, or null to close.
 * @returns {void}
 */
function setVerMenu(row) {
  if (verMenuRow && verMenuRow !== row) {
    verMenuRow.querySelector('.ver-menu').hidden = true;
    verMenuRow.querySelector('.ver-more').setAttribute('aria-expanded', 'false');
  }
  verMenuRow = row;
  if (!row) return;

  row.querySelector('.ver-menu').hidden = false;
  row.querySelector('.ver-more').setAttribute('aria-expanded', 'true');
  // Measured after being shown: a hidden element has no box to measure.
  const menu = row.querySelector('.ver-menu');
  menu.classList.remove('up');
  const list = elHList.getBoundingClientRect();
  if (menu.getBoundingClientRect().bottom > list.bottom) menu.classList.add('up');

  const first = row.querySelector('.ver-menu .mi');
  if (first) first.focus();
}

/** Whether a version row menu is open. @returns {boolean} */
function verMenuOpen() {
  return verMenuRow !== null && !verMenuRow.querySelector('.ver-menu').hidden;
}

/**
 * First place two versions of a page diverge.
 *
 * Deliberately not the full LCS that applyDiff() runs: the common prefix is the
 * same under either method, so the first divergence is exact, and finding it
 * costs one linear scan instead of a quadratic table per row in the list.
 *
 * @param {string[]} before - the older version, block by block.
 * @param {string[]} after - the newer one.
 * @returns {{text: string, added: boolean}|null} null when nothing changed.
 */
function firstChange(before, after) {
  const shared = Math.min(before.length, after.length);
  let i = 0;
  while (i < shared && before[i] === after[i]) i++;

  if (i < after.length) return { text: after[i], added: true };
  if (i < before.length) return { text: before[i], added: false };
  return null;
}

/**
 * Fills the History panel: one row per stored version, newest first.
 *
 * Each row shows where that version parted from the one before it, rather than
 * the opening lines of the document. The top of a page barely moves from one
 * archive to the next, so an excerpt taken there looked identical thirteen
 * times over and told the reader nothing.
 *
 * Every snapshot is parsed once and its blocks reused as the "after" of its own
 * row and the "before" of the row above it, so the list costs one parse per
 * version, as it did when it only showed an excerpt.
 *
 * @returns {Promise<void>}
 */
async function renderHistory() {
  // The rows are about to be discarded: the reference to the open one must not
  // outlive them, or the next close would reach into a detached node.
  setBulkMenu(false);
  setVerMenu(null);
  elHList.textContent = '';
  if (!curPage) return;

  bulk = { same: [], old: [] };
  const store = await api.storage.local.get(curPage.entries.map((e) => e.key));
  const blocks = curPage.entries.map((e) => {
    const snap = store[e.key];
    return snap ? parseSnapshot(snap.html).lines : null;
  });

  curPage.entries.forEach((e, i) => {
    const when = fmt(e.ts);
    const isCurrent = curSnap && curSnap.key === e.key;

    // The oldest version has nothing behind it: its opening lines ARE what it
    // introduced, so the excerpt falls back to them.
    const after = blocks[i];
    const before = blocks[i + 1];
    let change = null;
    if (after && before) change = firstChange(before, after);

    // A version identical to the one before it recorded nothing: archiving
    // fires a minute after the last edit, so an idle page produces these.
    if (after && before && !change) bulk.same.push(e.key);
    if (i > 0) bulk.old.push(e.key);

    let summary;
    if (!after) summary = t('versionMissing');
    else if (!before) summary = after[0] || t('emptyVersion');
    else if (!change) summary = t('noChange');
    else summary = change.added ? t('lineAdded', [change.text]) : t('lineRemoved', [change.text]);

    const item = document.createElement('li');
    item.className = isCurrent ? 'ver current' : 'ver';
    item.dataset.key = e.key;

    // Open button and menu button are siblings. An earlier version nested a
    // <button> inside a role="button" container: forbidden nesting, and the
    // screen reader announced a single control.
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'ver-open';
    if (isCurrent) open.setAttribute('aria-current', 'true');

    const stamp = document.createElement('b');
    stamp.textContent = when;

    const ex = document.createElement('div');
    ex.className = 'ex';
    if (change) ex.classList.add(change.added ? 'added' : 'removed');
    // The sign is decoration: the accessible name below already says added or
    // removed in words, and a screen reader reading "plus" would add nothing.
    if (change) {
      const sign = document.createElement('span');
      sign.className = 'sign';
      sign.setAttribute('aria-hidden', 'true');
      sign.textContent = change.added ? '+' : '\u2212';
      ex.append(sign);
    }
    ex.append(change ? change.text : summary);

    open.append(stamp, ex);
    open.setAttribute('aria-label', t('openVersion', [when, summary]));
    // then, not await: the scroll has to happen once applyDiff has laid the
    // marks down, and showSnapshot is what runs it.
    open.addEventListener('click', () => {
      showSnapshot(e).then(revealDiff).catch(console.error);
    });

    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'ver-more';
    more.dataset.icon = 'dots-three';
    more.setAttribute('aria-haspopup', 'true');
    more.setAttribute('aria-expanded', 'false');
    // The visible control repeats from row to row: the accessible name has to
    // say which version it acts on, or the list announces the same thing
    // thirteen times.
    more.setAttribute('aria-label', t('versionActions', [when]));

    const menu = document.createElement('div');
    menu.className = 'ver-menu';
    menu.hidden = true;
    menu.setAttribute('aria-label', t('versionActions', [when]));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'mi danger';
    del.dataset.icon = 'trash';
    del.append(t('deleteVersion'));
    del.setAttribute('aria-label', t('deleteVersionLabel', [when]));
    // Wrapped rather than attached as an async listener: the reply is now
    // checked, so this can reject, and an async listener rejects into nothing.
    const removeOne = async () => {
      setVerMenu(null);
      const reply = await api.runtime.sendMessage({ type: 'pca:delete', keys: [e.key] });
      if (reply && reply.error) throw new Error(reply.error);
      announce(t('versionDeleted', [when]));
      await refresh({ keepSelection: true });
    };
    del.addEventListener('click', () => { removeOne().catch(console.error); });

    menu.append(del);
    more.addEventListener('click', (ev) => {
      ev.stopPropagation();
      setVerMenu(menu.hidden ? item : null);
    });

    item.append(open, more, menu);
    paintIcons(item);
    elHList.append(item);
  });

  syncBulkMenu();
}

/** Affiche l'occupation reelle du stockage de l'extension. @returns {Promise<void>} */
async function renderUsage() {
  const versions = [...rooms.values()]
    .flatMap((r) => [...r.pages.values()])
    .reduce((n, p) => n + p.entries.length, 0);

  // Asked of the platform rather than added up from the index. The index
  // knows each snapshot in characters, which is neither bytes nor the whole
  // story: the pictures are stored apart and are what actually fills the
  // quota, so a total built from it reads several times under the truth on
  // exactly the archives where the figure would matter.
  //
  // storage.local.getBytesInUse landed in Firefox 144, and this add-on
  // supports 115. Where it is missing the count stands alone: no figure is
  // better than one that is wrong in the reassuring direction.
  let bytes = null;
  try {
    if (typeof api.storage.local.getBytesInUse === 'function') {
      bytes = await api.storage.local.getBytesInUse(null);
    }
  } catch (e) {
    console.warn('[pca] storage size unavailable', e);
  }

  elUsage.textContent = bytes === null
    ? tn('snapshotCount', versions)
    : t('storageUsage', [tn('snapshotCount', versions), (bytes / 1048576).toFixed(2)]);
}

/* -------------------------------------------------------------- selection */

/**
 * Selects a classroom and its most recently archived page.
 *
 * @param {Room} room
 * @returns {Promise<void>}
 */
async function selectRoom(room) {
  // Below the breakpoint the two panels share one column, and choosing a
  // classroom is what moves the pages panel over it. Above it the class is
  // inert: no rule outside the media query reads it.
  document.body.classList.add('drill');
  curRoom = room;
  curPage = null;
  await resolvePageContent(room);
  renderRooms();
  renderPages();
  const first = pagesOf(room)[0];
  if (first) {
    await selectPage(first);
  } else {
    // Classroom with no page: remember the classroom anyway.
    prefs.roomId = room.id;
    prefs.pageId = null;
    savePrefs();
  }
}

/**
 * Selects a page and shows one of its versions, the newest by default.
 *
 * @param {Page} page
 * @param {string} [entryKey] - version to restore instead of the newest.
 * @returns {Promise<void>}
 */
/**
 * Brings the first occurrence of the search term to the middle of the reading
 * area and flashes it.
 *
 * Folds accents and case exactly as the page filter does, so a search for
 * "slonce" lands on "słońce". Folding can change length — "œ" becomes two
 * characters — so the position is mapped back through foldWithMap() rather
 * than reused as-is.
 *
 * Lines the diff inserted are skipped: a deleted line is no longer part of the
 * document, and sending the reader to struck-through text would misdirect.
 *
 * Does nothing when the term matches only the page title, or nothing at all.
 * The reader is then left at the top, where a document normally opens.
 *
 * @param {string} needle - already folded, as fold() returns it.
 * @returns {void}
 */
/**
 * Whether the reader asked their system to stop moving things.
 *
 * Kept as the live MediaQueryList and read on each use rather than latched to
 * a boolean: the setting can change while the tab is open, and a value read
 * once at load would go on animating for someone who has just turned it off.
 *
 * The guard sits here and not in the stylesheet with the others because the
 * scroll is animated by scrollTo(), which no media query reaches.
 */
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Scrolls the reading area so a rectangle sits in its middle.
 *
 * Centred rather than merely brought on screen: something pinned against an
 * edge loses the lines around it that give it its meaning.
 *
 * @param {DOMRect} box - viewport coordinates, as getBoundingClientRect gives.
 * @returns {void}
 */
function centreOn(box) {
  const view = elScroll.getBoundingClientRect();
  const offset = (box.top - view.top) - (elScroll.clientHeight - box.height) / 2;

  // Smooth here, and only here. Set on the container in CSS it would also
  // animate the scroll restore in showSnapshot(), which puts the reader back
  // where they were and must not be seen travelling to get there.
  elScroll.scrollTo({
    top: Math.max(0, elScroll.scrollTop + offset),
    behavior: reducedMotion.matches ? 'auto' : 'smooth',
  });
}

/**
 * Brings the first comparison mark into the middle of the reading area.
 *
 * Called when a version is picked from the History panel, and only then. Doing
 * it on every showSnapshot() would mean merely opening the panel threw the
 * reader to the first change, which is the opposite of keeping their place.
 *
 * Silent when the version changed nothing, or when the panel is closed and no
 * mark was laid down.
 *
 * @returns {void}
 */
function revealDiff() {
  const first = elDoc.querySelector('.pca-add,.pca-del');
  if (first) centreOn(first.getBoundingClientRect());
}

function revealMatch(needle) {
  if (!needle) return;

  const walker = document.createTreeWalker(elDoc, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement && node.parentElement.closest('.pca-del')) continue;

    const { out, map } = foldWithMap(node.nodeValue);
    const at = out.indexOf(needle);
    if (at === -1) continue;

    const end = at + needle.length;
    const range = document.createRange();
    range.setStart(node, map[at]);
    range.setEnd(node, end < map.length ? map[end] : node.nodeValue.length);

    // A wrapped span rather than an overlay: it travels with the text, so the
    // mark stays on the word if the reader scrolls while it is still fading.
    // The range never crosses an element boundary — matching is done one text
    // node at a time — which is the condition surroundContents() imposes.
    const mark = document.createElement('span');
    mark.className = 'pca-hit';
    range.surroundContents(mark);

    // Unwrapped once the fade is over, and normalize() welds the text node back
    // together. Without it every search would leave the document a little more
    // fragmented, and blockText() would still read the same string while the
    // DOM underneath drifted further from the archived one.
    mark.addEventListener('animationend', () => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    }, { once: true });

    centreOn(mark.getBoundingClientRect());
    return;
  }
}

async function selectPage(page, entryKey) {
  curPage = page;
  prefs.roomId = curRoom ? curRoom.id : null;
  prefs.pageId = page.id;
  savePrefs();
  renderPages();

  // An explicit key is honoured only when that version still exists: it may
  // have been deleted between two renders.
  const wanted = entryKey && page.entries.find((e) => e.key === entryKey);
  await showSnapshot(wanted || page.entries[0]);

  // After the snapshot, never before: showSnapshot() sets the scroll position
  // itself, so a jump to the match has to have the last word on it.
  revealMatch(fold(elFilter.value.trim()));
  if (historyOpen()) await renderHistory();
}

/**
 * Reloads the model and restores the selection where possible.
 *
 * @param {{keepSelection?: boolean, showKey?: string}} [opts] - `showKey` pins a
 *   specific version instead of falling back to the page's newest one.
 * @returns {Promise<void>}
 */
async function refresh(opts = {}) {
  // The remembered selection is the default target. Any reference that has
  // become invalid — page deleted, classroom gone — falls back silently to the
  // first available entry.
  const roomId = (opts.keepSelection && curRoom?.id) || prefs.roomId;
  const pageId = (opts.keepSelection && curPage?.id) || prefs.pageId;

  await loadModel();
  renderRooms();
  await renderUsage();

  const room = (roomId && rooms.get(roomId)) || rooms.values().next().value;
  if (!room) {
    curRoom = curPage = curSnap = null;
    elPages.textContent = '';
    elSheet.hidden = true;
    elPlaceholder.hidden = false;
    elTopbar.hidden = true;
    elHistory.classList.remove('open');
    btnHistory.setAttribute('aria-pressed', 'false');
    return;
  }

  curRoom = room;
  await resolvePageContent(room);
  renderRooms();

  const page = (pageId && room.pages.get(pageId)) || pagesOf(room)[0];
  if (page) await selectPage(page, opts.showKey);
  else renderPages();
}

/* ---------------------------------------------------------------- actions */

/**
 * Opens or closes the History panel.
 *
 * The document is re-rendered either way: opening brings up the comparison with
 * the previous version, closing removes it. Starting again from the stored
 * snapshot is safer than undoing the marking node by node.
 *
 * A single function because there are three ways to close — the button, the
 * cross, Escape — and two of them used to forget to re-render, leaving the diff
 * on screen with the panel shut.
 *
 * @param {boolean} open
 * @returns {Promise<void>}
 */
async function setHistory(open) {
  elHistory.classList.toggle('open', open);
  btnHistory.setAttribute('aria-pressed', String(open));

  if (open) await renderHistory();

  const shown = curSnap && curPage
    ? curPage.entries.find((e) => e.key === curSnap.key)
    : null;
  if (shown) await showSnapshot(shown);

  // On opening, the panel sits far from the button in DOM order: without moving
  // focus, tabbing would carry on through the toolbar. On closing, focus has to
  // return to where it started.
  // preventScroll is not a nicety here. The heading lives inside the panel,
  // which at this instant is still translated off to the right, and #main is
  // a scroll container because of its overflow:hidden. Focusing normally makes
  // the browser scroll the heading into view, which slides every bit of the
  // page sideways until the panel lands. The panel is already on its way in;
  // nothing needs scrolling to reach it.
  if (open) document.getElementById('history-head').focus({ preventScroll: true });
  else btnHistory.focus();
}

btnHistory.addEventListener('click', () => {
  setHistory(!historyOpen()).catch(console.error);
});

document.getElementById('hclose').addEventListener('click', () => {
  setHistory(false).catch(console.error);
});

/* ------------------------------------------------- secondary actions menu */

/**
 * Opens or closes the menu, keeping the aria attribute in step.
 *
 * @param {boolean} open
 * @returns {void}
 */
function setMenu(open) {
  elMenu.hidden = !open;
  btnMore.setAttribute('aria-expanded', String(open));
  if (!open) return;
  const first = elMenu.querySelector('.mi');
  if (first) first.focus();
}


/**
 * Writes the two bulk entries from the counts the last render established.
 *
 * An entry with nothing to act on is disabled rather than hidden: a menu whose
 * items come and go moves the remaining one under a pointer already on its way,
 * and "0 unchanged versions" is itself the answer to the question being asked.
 *
 * @returns {void}
 */
function syncBulkMenu() {
  btnDropSame.replaceChildren(tn('dropSame', bulk.same.length));
  btnDropSame.disabled = bulk.same.length === 0;
  btnDropOld.replaceChildren(tn('dropOld', bulk.old.length));
  btnDropOld.disabled = bulk.old.length === 0;

  // The whole menu goes away below the threshold. Sweeping two versions is
  // two clicks on the rows themselves, so the entry point would only add a
  // step; it earns its place once the list is long enough that deleting one
  // by one is the tedious way round.
  const worth = bulk.same.length > BULK_FROM || bulk.old.length > BULK_FROM;
  if (!worth) setBulkMenu(false);
  btnHMore.hidden = !worth;

  paintIcons(elHMenu);
}

/**
 * Opens or closes the History panel's own actions menu.
 *
 * @param {boolean} open
 * @returns {void}
 */
function setBulkMenu(open) {
  elHMenu.hidden = !open;
  btnHMore.setAttribute('aria-expanded', String(open));
  if (!open) return;
  const first = elHMenu.querySelector('.mi:not([disabled])');
  if (first) first.focus();
}

/**
 * Deletes several versions of the page at once, after confirmation.
 *
 * The confirmation names the count, because neither action is reversible and
 * the reader cannot see from the menu which rows are about to go.
 *
 * @param {string[]} keys
 * @param {string} question - already-translated confirmation text.
 * @returns {Promise<void>}
 */
async function deleteMany(keys, question) {
  setBulkMenu(false);
  if (keys.length === 0 || !confirm(question)) return;

  const reply = await api.runtime.sendMessage({ type: 'pca:delete', keys });
  if (reply && reply.error) throw new Error(reply.error);
  announce(tn('versionsDeleted', keys.length));
  await refresh({ keepSelection: true });
}

btnHMore.addEventListener('click', (e) => {
  e.stopPropagation();
  setBulkMenu(elHMenu.hidden);
});

btnDropSame.addEventListener('click', () => {
  deleteMany(bulk.same, tn('confirmDropSame', bulk.same.length)).catch(console.error);
});

btnDropOld.addEventListener('click', () => {
  deleteMany(bulk.old, tn('confirmDropOld', bulk.old.length)).catch(console.error);
});

btnMore.addEventListener('click', (e) => {
  e.stopPropagation();
  setMenu(elMenu.hidden);
});

// Click outside the menu closes it, without swallowing the click.
document.addEventListener('click', (e) => {
  if (!elHMenu.hidden && !e.target.closest('#hmore-wrap')) setBulkMenu(false);
  if (verMenuOpen() && !e.target.closest('.ver')) setVerMenu(null);
  if (elMenu.hidden || e.target.closest('#more-wrap')) return;
  setMenu(false);
});

// Leaving by keyboard: without this the menu stayed open behind the user after
// a tab, and kept aria-expanded at true.
document.getElementById('more-wrap').addEventListener('focusout', (e) => {
  if (elMenu.hidden) return;
  if (e.relatedTarget && e.relatedTarget.closest('#more-wrap')) return;
  setMenu(false);
});

/**
 * Escape closes the most recently opened layer, one per press: the menu first
 * if it is open, then the History panel.
 */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;

  if (elTitle.isContentEditable) {
    e.stopPropagation();
    endTitleEdit(false);
    elTitle.focus();
    return;
  }
  if (!elHMenu.hidden) {
    e.stopPropagation();
    setBulkMenu(false);
    btnHMore.focus();
    return;
  }
  if (verMenuOpen()) {
    e.stopPropagation();
    const back = verMenuRow.querySelector('.ver-more');
    setVerMenu(null);
    back.focus();
    return;
  }
  if (!elMenu.hidden) {
    e.stopPropagation();
    setMenu(false);
    btnMore.focus();
    return;
  }
  if (historyOpen()) {
    e.stopPropagation();
    // Same path as the cross and the button: closing must also strip the
    // comparison marks from the document.
    setHistory(false).catch(console.error);
  }
}, true);

/* -------------------------------------------------------------- mode focus */

/**
 * Applies focus mode and remembers it.
 *
 * @param {boolean} on
 * @returns {void}
 */
function setFocusMode(on) {
  document.body.classList.toggle('focus', on);
  btnFocus.setAttribute('aria-pressed', String(on));

  // The caret shows the movement it triggers, not the current state: left to
  // fold the panels away, right to bring them back.
  btnFocus.replaceChildren(icon(on ? 'caret-right' : 'caret-left'));

  // The button has no text left, so its name must live in aria-label — without
  // it, it is mute to a screen reader.
  const label = on ? t('focusShow') : t('focusHide');
  btnFocus.setAttribute('aria-label', label);
  btnFocus.title = label;
  announce(on ? t('panelsHidden') : t('panelsShown'));

  prefs.focus = on;
  savePrefs();
}

/**
 * Leaves the pages panel and shows the classrooms one again.
 *
 * Only reachable below the breakpoint, where the button is the sole way back:
 * the classrooms panel is covered, so it cannot be clicked.
 *
 * @returns {void}
 */
function backToRooms() {
  document.body.classList.remove('drill');
  // preventScroll for the same reason as the history heading: the panel it
  // belongs to is still travelling, and #main is a scroll container.
  document.getElementById('rooms-head').focus({ preventScroll: true });
  announce(t('backToRooms'));
}

document.getElementById('back-rooms').addEventListener('click', backToRooms);

btnFocus.addEventListener('click', () => setFocusMode(!document.body.classList.contains('focus')));

/* ------------------------------------------------------ renaming a page */

/** Value shown before editing, so it can be cancelled. @type {string|null} */
let titleBefore = null;

/** Switches the title into editing and selects its content. @returns {void} */
function startTitleEdit() {
  if (!curPage || elTitle.isContentEditable) return;
  titleBefore = elTitle.textContent;
  elTitle.contentEditable = 'true';
  elTitle.focus();

  const range = document.createRange();
  range.selectNodeContents(elTitle);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * Leaves editing mode.
 *
 * An empty name, or one identical to the label derived from the content,
 * creates no entry: the page falls back to its automatic label, which will then
 * follow its future versions instead of being frozen.
 *
 * @param {boolean} commit - false to cancel and restore the initial value.
 * @returns {void}
 */
function endTitleEdit(commit) {
  if (!elTitle.isContentEditable) return;

  const value = elTitle.textContent.replace(/\s+/g, ' ').trim();
  elTitle.contentEditable = 'false';
  getSelection().removeAllRanges();

  if (!commit) {
    elTitle.textContent = titleBefore;
    titleBefore = null;
    return;
  }

  const derived = curPage.label || t('pageFallback', [curPage.number]);
  if (value && value !== derived) labels[curPage.id] = value;
  else delete labels[curPage.id];

  saveLabels();
  elTitle.textContent = pageName(curPage);

  announce(t('pageRenamed', [pageName(curPage)]));
  renderPages();
  titleBefore = null;
}

elTitle.addEventListener('dblclick', startTitleEdit);

elTitle.addEventListener('keydown', (e) => {
  if (!elTitle.isContentEditable) {
    // Enter from the keyboard: the double-click alone would exclude keyboard use.
    if (e.key === 'Enter') { e.preventDefault(); startTitleEdit(); }
    return;
  }
  // A title is one line: Enter commits instead of inserting a break.
  if (e.key === 'Enter') { e.preventDefault(); endTitleEdit(true); }
});

elTitle.addEventListener('blur', () => endTitleEdit(true));

// A paste from a web page would inject markup into the title. execCommand is
// deprecated but remains the only reliable way to paste plain text into a
// contenteditable while keeping the browser's native undo.
elTitle.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text');
  document.execCommand('insertText', false, text.replace(/\s+/g, ' ').trim());
});

elFilter.addEventListener('input', renderPages);

document.getElementById('btn-print').addEventListener('click', () => window.print());

/**
 * Deletes every version of the page on screen.
 *
 * @returns {Promise<void>}
 * @throws {Error} when the background reports the deletion failed.
 */
async function deletePage() {
  setMenu(false);
  if (!curPage) return;

  const n = curPage.entries.length;
  const label = pageName(curPage);
  if (!confirm(tn('confirmDeletePage', n, [label]))) return;

  const reply = await api.runtime.sendMessage({ type: 'pca:delete', keys: curPage.entries.map((e) => e.key) });
  if (reply && reply.error) throw new Error(reply.error);

  curPage = null;
  await refresh({ keepSelection: true });
}

document.getElementById('btn-delete').addEventListener('click', () => { deletePage().catch(console.error); });

/**
 * Writes the snapshot on screen to a standalone HTML file.
 *
 * @returns {Promise<void>}
 */
async function exportSnapshot() {
  setMenu(false);
  if (!curSnap) return;

  // A copy is built and its images resolved, rather than reusing the document
  // on screen: that one may carry comparison marks.
  const sheet = document.createElement('div');
  sheet.innerHTML = curSnap.html;
  stripWidgets(sheet);
  await resolveImages(sheet);

  const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  const label = pageName(curPage);
  // The viewer stylesheet is taken as-is, then neutralised on the points
  // specific to the application. The overrides come AFTER `css`: at equal
  // specificity, the last rule wins.
  const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><title>${label}</title>
<style>
${css}
body{display:block;background:#fff;margin:0;padding:24px}
#sheet{margin:0 auto}
</style></head>
<body><div id="sheet"><article id="doc">${sheet.innerHTML}</article></div></body></html>`;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = `canvas-${curSnap.canvasId}-p${curSnap.page}-${curSnap.ts.slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('btn-export').addEventListener('click', () => { exportSnapshot().catch(console.error); });

/* ------------------------------------------------------------------- zoom */

/**
 * Zoom steps.
 *
 * We go through the `zoom` property rather than `font-size`: archived content
 * carries inline `font-size:20px` inherited from Preply's editor, which a
 * typographic zoom would leave untouched — only unstyled text would grow.
 * `zoom` multiplies every computed length, the column included, so line breaks
 * stay exactly where Preply put them.
 */
const ZOOM_STEPS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
const ZOOM_DEFAULT = ZOOM_STEPS.indexOf(1);

const elZoom = document.getElementById('zoom');
const btnZoomValue = document.getElementById('zoom-reset');

let zoomIndex = ZOOM_DEFAULT;

/**
 * Applies a zoom step to the document and remembers it.
 *
 * @param {number} index - index into ZOOM_STEPS, clamped to the ends.
 * @returns {void}
 */
function setZoom(index) {
  zoomIndex = Math.max(0, Math.min(ZOOM_STEPS.length - 1, index));
  const z = ZOOM_STEPS[zoomIndex];
  const percent = Math.round(z * 100);
  elDoc.style.zoom = String(z);
  btnZoomValue.textContent = PERCENT_FORMAT.format(z);
  // The visible label is only a number: the accessible name says what of.
  btnZoomValue.setAttribute('aria-label', t('zoomValueLabel', [percent]));
  announce(t('zoomAnnounce', [percent]));
  prefs.zoom = zoomIndex;
  savePrefs();
}

/** Wires the zoom group, or hides it when the browser has no zoom support. */
function initZoom() {
  if (!CSS.supports('zoom', '1.5')) {
    // Firefox before 126: better hidden than offering an inert button.
    elZoom.hidden = true;
    return;
  }
  setZoom(Number.isInteger(prefs.zoom) ? prefs.zoom : ZOOM_DEFAULT);

  document.getElementById('zoom-in').addEventListener('click', () => setZoom(zoomIndex + 1));
  document.getElementById('zoom-out').addEventListener('click', () => setZoom(zoomIndex - 1));
  btnZoomValue.addEventListener('click', () => setZoom(ZOOM_DEFAULT));
}

/* --------------------------------------------------------- live updates */

/** Collapses the background's burst of writes into a single re-render. */
let liveTimer;

/**
 * Keeps the viewer in step with archiving performed from Preply.
 *
 * Only structural keys are watched. `pca:prefs` and `pca:labels` are written by
 * this very page, and following them would trigger a re-render on every zoom
 * step and every rename.
 *
 * One archive write touches several keys in a row, hence the debounce: without
 * it a single click would rebuild the model three times.
 */
api.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (!['pca:index', 'pca:order', 'pca:avatars'].some((k) => k in changes)) return;

  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => {
    // Reading the newest version is the normal state during a lesson, so the
    // view follows the incoming one. Someone who deliberately opened an older
    // version stays put: being yanked away mid-read is worse than missing an
    // update they can still reach from the history panel.
    const onNewest = !curSnap || !curPage || curPage.entries[0].key === curSnap.key;

    refresh({ keepSelection: true, showKey: onNewest ? undefined : curSnap.key })
      .then(() => announce(t('archivesUpdated')))
      .catch(console.error);
  }, 300);
});

/* --------------------------------------------------------- scroll fades */

/**
 * How far the reader has to scroll before the top fade appears, in pixels.
 *
 * Not zero: the first pixels of scroll only lift the sheet away from the
 * toolbar, and a fade over the title while it is still fully readable draws
 * attention to nothing. It shows once real text has passed under the edge.
 */
const TOP_FADE_AT = 64;

let fadeTop = false;
let fadeBottom = false;

/**
 * Shows the top and bottom fades only while the document actually continues
 * past that edge.
 *
 * Called from a scroll handler, so it writes to the DOM only when the answer
 * changes: toggling a class that is already set still costs a style
 * invalidation, and scroll fires far more often than the state flips.
 *
 * The two edges are not symmetric. The top waits for TOP_FADE_AT, since the
 * first pixels of scroll hide nothing worth marking. The bottom answers as
 * soon as anything is out of sight, with a pixel of slack for fractional
 * scroll offsets — zoom and device pixel ratios fold into a value that never
 * reaches its bound exactly.
 *
 * @returns {void}
 */
function updateScrollFades() {
  const above = elScroll.scrollTop > TOP_FADE_AT;
  const below = elScroll.scrollTop + elScroll.clientHeight < elScroll.scrollHeight - 1;

  if (above !== fadeTop) {
    fadeTop = above;
    elReading.classList.toggle('fade-top', above);
  }
  if (below !== fadeBottom) {
    fadeBottom = below;
    elReading.classList.toggle('fade-bottom', below);
  }
}

elScroll.addEventListener('scroll', updateScrollFades, { passive: true });

// The edges also move when nothing is scrolled: a snapshot is swapped in, the
// diff inserts its deleted lines, an image resolves, the zoom changes, the
// window is resized. Observing both boxes catches all of it without a call
// sprinkled at each of those sites.
new ResizeObserver(updateScrollFades).observe(elScroll);
new ResizeObserver(updateScrollFades).observe(elDoc);

/* ------------------------------------------------------------------- boot */

(async () => {
  applyI18n();
  paintIcons();
  await loadPrefs();
  await loadLabels();
  await loadOrder();
  await loadAvatars();
  setFocusMode(prefs.focus === true);

  // Two frames, not one: the first still carries the pre-focus layout, so a
  // class dropped there would let the collapse animate on a page that was
  // meant to open already folded.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.remove('booting');
  }));
  initZoom();
  await refresh();
})().catch(console.error);
