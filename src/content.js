/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Content script — injects the archive and quick-print buttons into the Canvas
 * toolbar, and serialises the ProseMirror document into standalone HTML.
 *
 * Anchoring: `[data-qa-id]` and `[data-preply-ds-component]` only. Preply's CSS
 * classes are content-hashed per build (`_CanvasLayout_5ah64_13`) and do not
 * survive a deployment.
 */

/**
 * Extension API root.
 *
 * Firefox exposes `browser`, Chrome exposes `chrome`. Under MV3 both return
 * promises for the APIs used here, so an alias is enough — shipping the Mozilla
 * polyfill would mean an npm dependency for three calls.
 *
 * Redeclared in each file rather than shared: Chrome's service worker loads a
 * single script and cannot import a common module without a build step.
 */
const api = globalThis.browser ?? globalThis.chrome;

const SEL_TOOLBAR = '[data-qa-id="canvas-toolbar"]';
// Two ways to the same node, which is the point: the editor div carries both
// data-qa-id and a hand-written class, and losing this selector is the one
// failure that stops everything — no snapshot, no autosave, and a yellow flash
// for the whole explanation. TipTapEditor is not hashed like the layout
// wrappers around it (_TextEditorLayout_1mqtd_3, StyledEditorContentCore-sc-…),
// so it survives a build; whether it survives a rename is another matter, which
// is why it is the second alternative and not the first.
const SEL_EDITOR = '[data-qa-id="text-editor"] .ProseMirror, .TipTapEditor .ProseMirror';
const SEL_THUMB = '[data-qa-id="canvas-thumbnail"]';
// Reference icon button, cloned to inherit Preply's styling.
const SEL_REF_BUTTON = '[data-qa-id="canvas-toolbar"] button[data-preply-ds-component="IconButton"]';
const SEL_AVATAR = '[data-preply-ds-component="Avatar"] img';
const SEL_ACTIVE_THUMB = '[data-qa-id="canvas-thumbnail"] a[data-active="true"]';
const BTN_ID = 'pca-save-button';

/**
 * Whether the reader asked their system to stop moving things.
 *
 * Read on each use, not latched: the setting can change while a lesson is open.
 */
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const AUTOSAVE_DELAY_MS = 60_000;

/**
 * Longest an edited document waits for its autosave, however busy the lesson.
 *
 * The delay above restarts on every mutation, and the other participants'
 * carets are mutations too. A lesson where someone is always typing or moving
 * would never go quiet for a whole minute, and would only be archived once it
 * was over — if the tab was still open by then.
 */
const AUTOSAVE_MAX_WAIT_MS = 180_000;

/** Last serialisation stored, so an unchanged document is not duplicated. @type {string|null} */
let lastSavedHtml = null;
/** @type {number|undefined} */
let autosaveTimer;
/** When the oldest unsaved mutation arrived, in ms since the epoch; 0 when none. */
let dirtySince = 0;
/** @type {MutationObserver|null} */
let editorObserver = null;
/** Editor node the observer is bound to. @type {Element|null} */
let observedEditor = null;
/** URL path of the Canvas page the pending autosave belongs to. */
let observedPage = '';

/** Refuses anything larger than this as an inline lesson image. */
const MAX_IMAGE_BYTES = 4_000_000;

/**
 * Content hash of a byte buffer, hex encoded.
 *
 * @param {ArrayBuffer} buffer
 * @returns {Promise<string>} 64 hex characters.
 */
async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Images already captured on this page, by absolute URL.
 *
 * Autosave runs for the whole lesson, and each run used to download, hash and
 * encode every picture again only to find the same hashes — inside somebody
 * else's page, on a document where usually only the text had moved. A URL that
 * has answered once is taken at its word for the rest of the page's life; a
 * picture served under a new link is fetched again.
 *
 * Only successes are kept: an image that failed is retried on the next capture.
 *
 * @type {Map<string, {hash: string, uri: string}>}
 */
const capturedImages = new Map();

/**
 * Downloads the images of a serialised document and replaces their `src` with
 * a content hash.
 *
 * Preply serves Canvas images from presigned S3 links that expire within hours,
 * so an archive keeping the URL looks right today and shows empty frames next
 * week. The bytes have to be captured while the link is still valid.
 *
 * Content addressing rather than inlining: the same image appears in every
 * version of a page, and inlining would store it once per version. Keyed by
 * hash it is stored once for the whole archive.
 *
 * Mutates `clone` in place: `src` is dropped and `data-pca-img` holds the hash.
 * An image that cannot be fetched keeps its original URL and gains
 * `data-pca-unreachable`, so a broken frame is at least explained.
 *
 * @param {Element} clone - detached copy of the editor.
 * @returns {Promise<Record<string, string>>} new blobs, hash -> data URI.
 */
async function harvestImages(clone) {
  /** @type {Record<string, string>} */
  const blobs = {};

  await Promise.all([...clone.querySelectorAll('img')].map(async (img) => {
    const src = img.getAttribute('src');
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    if (!src || src.startsWith('data:')) return;

    const url = new URL(src, location.href).href;

    // The blob is sent every time; the background writes it only when the
    // hash is unknown, so a recurring image costs one message and no storage.
    const known = capturedImages.get(url);
    if (known) {
      img.removeAttribute('src');
      img.setAttribute('data-pca-img', known.hash);
      blobs[known.hash] = known.uri;
      return;
    }

    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error(`${buffer.byteLength} bytes`);

      const hash = await sha256(buffer);
      /** @type {string} */
      const uri = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(new Blob([buffer], { type: res.headers.get('content-type') || 'image/png' }));
      });

      // Rewritten only once the bytes are in hand. Done before the encoding, a
      // failure there left markup pointing at a hash with no picture behind it.
      img.removeAttribute('src');
      img.setAttribute('data-pca-img', hash);
      blobs[hash] = uri;
      capturedImages.set(url, { hash, uri });
    } catch (e) {
      img.setAttribute('data-pca-unreachable', src);
      console.warn('[pca] image not captured', src, e);
    }
  }));

  return blobs;
}

/**
 * Copies the ProseMirror node and strips it of everything Preply-specific.
 *
 * Preply's colours are obfuscated tokens (`var(--0d2c1d)`) defined in one of
 * their stylesheets. They are resolved to computed values here, so the stored
 * HTML depends on no external CSS.
 *
 * Returns the clone rather than its innerHTML: the caller still has to harvest
 * the images, which is asynchronous, before the markup is final.
 *
 * @param {Element} editor - the live `.ProseMirror` node.
 * @returns {Element} a detached clone, cleaned of editing attributes.
 * @throws {TypeError} when `editor` is not an Element.
 */
function cloneEditor(editor) {
  if (!(editor instanceof Element)) throw new TypeError('editor must be an Element');

  const clone = editor.cloneNode(true);
  const src = editor.querySelectorAll('*');
  const dst = clone.querySelectorAll('*');

  const reColor = /(^|;)\s*color\s*:/;
  const reBg = /background-color\s*:/;

  for (let i = 0; i < src.length; i++) {
    const inline = src[i].getAttribute('style');
    if (!inline || !inline.includes('var(--')) continue;
    const computed = getComputedStyle(src[i]);
    if (reColor.test(inline)) dst[i].style.color = computed.color;
    if (reBg.test(inline)) dst[i].style.backgroundColor = computed.backgroundColor;
  }

  // Collaboration carets are decorations, not content: ProseMirror injects one
  // per connected peer, carrying that person's name in a label. Archived, the
  // tutor's name ends up wedged mid-sentence, and being real text it reaches
  // the page list, the search excerpts and every diff as well.
  //
  // Removed AFTER the colour walk above, never before: that loop pairs the two
  // node lists by index, and deleting from the clone first would shift them
  // apart and repaint the wrong elements.
  //
  // .ProseMirror-widget belongs to ProseMirror and the caret classes to the
  // Tiptap collaboration extension. Both are upstream library names, stable
  // across builds, unlike the content-hashed classes Preply generates — so
  // this does not breach the rule against anchoring on their CSS.
  for (const el of clone.querySelectorAll('.ProseMirror-widget,[class*="collaboration-carets"]')) {
    el.remove();
  }

  // Nothing executable, nothing that styles beyond this document, nothing that
  // reaches the network. innerHTML never runs a <script>, but a <style> applies
  // at once and to the whole page it lands in — an archive could restyle the
  // viewer around itself — and a <link> or an <iframe> would fetch from a page
  // whose whole claim is that it never does. The print frame is the sharper
  // case: srcdoc content is parsed normally, so a script there would run.
  for (const el of clone.querySelectorAll('script,style,link,meta,base,iframe,object,embed')) {
    el.remove();
  }

  // Inline handlers survive innerHTML as attributes and fire on their event.
  // The default MV3 policy blocks them on extension pages, but the print frame
  // inherits Preply's, which is not ours to rely on.
  for (const el of clone.querySelectorAll('*')) {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
    }
  }

  for (const el of clone.querySelectorAll('[contenteditable]')) el.removeAttribute('contenteditable');
  for (const el of clone.querySelectorAll('[tabindex]')) el.removeAttribute('tabindex');

  return clone;
}

/**
 * Reads the page order from the thumbnail bar.
 *
 * Every Canvas page is a distinct canvasId; only this bar says in which order
 * Preply presents them. `data-index` is the absolute index within the full
 * list, not the position in the DOM.
 *
 * CAUTION: the bar is virtualised (react-virtuoso). Only rendered thumbnails
 * exist in the DOM, so one reading sees the visible window alone. The indices
 * stay correct but the list may be partial — hence the merge on the background
 * side rather than a replacement.
 *
 * @returns {{id: string, index: number|null, num: string}[]}
 */
function readPageOrder() {
  const out = [];
  for (const thumb of document.querySelectorAll(SEL_THUMB)) {
    const link = thumb.querySelector('a[href*="/canvas/"]');
    if (!link) continue;

    const m = /\/canvas\/(\d+)/.exec(link.getAttribute('href') || '');
    if (!m) continue;

    const holder = thumb.closest('[data-index]');
    const index = holder ? Number(holder.dataset.index) : NaN;
    const numEl = link.querySelector('p');

    out.push({
      id: m[1],
      index: Number.isFinite(index) ? index : null,
      num: numEl ? numEl.textContent.trim() : '',
    });
  }
  return out;
}

/**
 * Fetches the tutor's avatar and converts it to a data URI.
 *
 * Inlined rather than referenced: a remote URL would force the viewer to call
 * Preply on every open, and would show a broken avatar offline — precisely the
 * situation this tool exists to avoid.
 *
 * The lesson header holds several avatars (student, participants). The one
 * whose neighbouring label ends with the tutor's name is kept, rather than
 * whichever comes first.
 *
 * @param {string} title - tab title, shaped like "… with <tutor>".
 * @returns {Promise<string>} data URI, or '' when unavailable.
 */
async function grabAvatar(title) {
  const tutor = tutorFromTitle(title);
  if (!tutor) return '';

  let src = '';
  for (const img of document.querySelectorAll(SEL_AVATAR)) {
    const box = img.closest('[data-preply-ds-component="LayoutFlex"]');
    const label = box ? box.querySelector('p') : null;
    if (label && label.textContent.trim().endsWith(tutor)) {
      src = img.currentSrc || img.src;
      break;
    }
  }
  if (!src) return '';

  try {
    const res = await fetch(new URL(src, location.href).href, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    // Guard rail: an avatar weighs a few kilobytes. Beyond that we caught
    // something else, and the initial beats storing a large blob.
    if (blob.size > 200_000) return '';

    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('[pca] avatar not fetched', e);
    return '';
  }
}

/**
 * Builds the snapshot to store from the page's current state.
 *
 * @returns {{canvasId: string, classroomId: string, page: string, course: string, title: string, url: string, ts: string, order: object[], html: string}|null}
 *   `null` when the Canvas is not on screen.
 */
async function buildSnapshot() {
  const editor = document.querySelector(SEL_EDITOR);
  if (!editor) return null;

  const m = location.pathname.match(/\/classroom-v2\/(\d+)\/canvas\/(\d+)/);
  const lang = location.pathname.match(/\/edu\/([a-z-]+)\//i);
  const active = document.querySelector(SEL_ACTIVE_THUMB);

  // The clone is prepared first, then its images are downloaded while their
  // presigned links are still valid, and only then is innerHTML read.
  const clone = cloneEditor(editor);
  const images = await harvestImages(clone);

  return {
    classroomId: m ? m[1] : 'unknown',
    canvasId: m ? m[2] : 'unknown',
    page: active ? active.textContent.trim() : '1',
    // Language being taught, read from the URL ("polish", "spanish"…). The
    // viewer maps it to a BCP-47 tag and sets it on the document: without it a
    // screen reader speaks Polish with French rules.
    course: lang ? lang[1].toLowerCase() : '',
    title: document.title,
    url: location.href,
    ts: new Date().toISOString(),
    order: readPageOrder(),
    images,
    html: clone.innerHTML,
  };
}

/**
 * Captures and hands over to the background.
 *
 * @param {boolean} manual - true when triggered by the button, which forces a
 *   write even if the content is unchanged.
 * @returns {Promise<'saved'|'unchanged'|'no-canvas'>}
 */
async function capture(manual) {
  const snap = await buildSnapshot();
  if (!snap) return 'no-canvas';
  if (!manual && snap.html === lastSavedHtml) return 'unchanged';

  snap.avatar = await grabAvatar(snap.title);

  // Trace kept on purpose: the page order depends on a virtualised bar, hence
  // on a partial DOM. Without this log an empty reading is indistinguishable
  // from a failing write.
  console.debug('[pca] archiving', {
    canvas: snap.canvasId,
    classroom: snap.classroomId,
    order: snap.order,
  });

  // The reply is checked, now that there is one to check. Until the listener
  // kept the channel open this resolved to undefined on Chrome whatever
  // happened, and the button went green on a capture that was never written.
  const reply = await api.runtime.sendMessage({ type: 'pca:save', snapshot: snap, manual });
  if (reply && reply.error) throw new Error(reply.error);

  lastSavedHtml = snap.html;
  // The background compares with what is stored, which this script cannot
  // see: a page reopened as it was archived is found unchanged there.
  return reply && reply.unchanged ? 'unchanged' : 'saved';
}

/** Ids of what is injected, so nothing is added twice. */
const BTN_PRINT_ID = 'pca-print-button';
const BTN_GROUP_ID = 'pca-buttons';

/**
 * Scale the quick print is laid out at.
 *
 * Preply composes for a screen at 20px, which on paper is generous and costs
 * pages. `zoom` and not `font-size`, for the reason the viewer documents: the
 * markup carries `font-size:20px` inline on its spans, and an inline value
 * beats any rule a stylesheet can write. `zoom` scales every computed length
 * instead, so the line breaks fall where Preply put them.
 *
 * It arrived in Firefox 126 and this add-on supports 115. Below that the
 * declaration is ignored and the page prints full size — larger than intended,
 * never broken.
 */
const PRINT_ZOOM = 0.75;

/**
 * Style sheet the printed copy carries, and all it carries.
 *
 * Not the viewer's print sheet moved here — that one knows about comparison
 * marks and a document header that do not exist on this side. What it holds is
 * what Preply's own styling gave the document and a bare clone cannot inherit,
 * measured rather than guessed: every rule below answers a drift found by
 * comparing computed styles between the live editor and this frame.
 *
 * The margin resets are the ones that matter. A browser gives `p`, `ul` and
 * `li` a margin of one em top and bottom; Preply removes it and spaces its
 * blocks another way. Left in, every paragraph gained 20px above and below —
 * an archive of a lesson printed half as many words per page.
 *
 * `break-spaces` is the editor's own value: a run of spaces is kept as typed,
 * which in a language lesson is sometimes the point.
 */
const PRINT_CSS = `
  @page{margin:16mm}
  body{margin:0;color:#121117;zoom:${PRINT_ZOOM};white-space:break-spaces;
    font:20px/1.4 "Figtree","Noto Sans",-apple-system,"Segoe UI",Roboto,sans-serif}
  p,ul,ol,li,blockquote,h1,h2,h3,h4{margin:0}
  /* Preply indents the item, not the list. Left to the browser it is the other
     way round — 40px of list padding and no item margin — which shifts every
     bullet and pulls the text away from it. */
  ul,ol{padding-left:0}
  li{margin-left:16px}
  img{max-width:100%}
  hr{border:1px solid #dcdce5;margin:8px 0}
  /* None of this comes from the markup: it is Preply's stylesheet, which a
     clone does not carry. Their tables span the column, where one left to
     itself shrinks to its content; their header cells are tinted and read
     left, where a browser leaves them plain and centres them; and the cell
     stays bold while the paragraph inside it does not. */
  table{border-collapse:collapse;width:100%}
  td,th{border:1px solid #dcdce5;padding:8px 16px;background:#fff}
  th{background:#f4f4f8;text-align:left}
  th p{font-weight:400}
`;

/**
 * Prints the Canvas on screen, without archiving it.
 *
 * The quick way out, next to the archive button rather than instead of it: the
 * viewer's export stays the reference copy, this one is for wanting a PDF
 * before leaving the lesson.
 *
 * The document is cloned into an isolated iframe and that frame is printed, so
 * nothing is written into Preply's page — no print style sheet injected into
 * their document, nothing to keep in step with their markup. Printing the page
 * itself would have meant hiding their entire interface by hand, which is a
 * rule this add-on does not break.
 *
 * @returns {Promise<boolean>} false when there is no Canvas on the page.
 */
async function printCanvas() {
  const editor = document.querySelector(SEL_EDITOR);
  if (!editor) return false;

  const clone = cloneEditor(editor);

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;left:-9999px;width:0;height:0;border:0';

  // srcdoc, never document.open(): the frame inherits the page's origin, and a
  // content script writing into it is refused outright — "The operation is
  // insecure". Setting an attribute is not a security-checked operation, and
  // nothing here ever reaches for contentDocument.
  frame.srcdoc = `<!doctype html><meta charset="utf-8">`
    + `<style>${PRINT_CSS}</style>${clone.innerHTML}`;

  // load fires once the frame's subresources have arrived, images included.
  // They keep their original URLs, unlike an archived copy: those links are
  // still valid in this session, and fetching them again to inline them would
  // only make the reader wait. Printing before they land gives empty frames.
  const ready = new Promise((done) => { frame.onload = done; });
  document.body.append(frame);
  await ready;

  frame.contentWindow.focus();
  frame.contentWindow.print();

  // Removed after the dialog has had the document: taking it away too early
  // cancels the print on some browsers.
  setTimeout(() => frame.remove(), 1000);
  return true;
}
/**
 * Builds one toolbar button, modelled on the ones Preply already has there.
 *
 * Styling is inherited by cloning an existing button, never copied: their
 * classes and the CSS custom properties those reference are hashed on every
 * build. The clone brings the look and the :hover, :active and :focus-visible
 * states with it, none of which we would otherwise know. A standalone fallback
 * covers a toolbar that offers no reference button.
 *
 * @param {{id: string, glyph: string, label: string,
 *          run: (flash: (color: string, label: string) => void) => Promise<void>}} spec
 *   `run` receives the feedback function: a button with no text left has only
 *   colour to answer with, and only the action knows what it should say.
 * @returns {HTMLButtonElement}
 */
function makeButton(spec) {
  const ref = document.querySelector(SEL_REF_BUTTON);
  const btn = ref ? ref.cloneNode(true) : document.createElement('button');

  if (ref) {
    // A clone carries the original's identity: ids, test hooks and ARIA state
    // must go, or two buttons answer to the same name.
    for (const attr of ['data-qa-id', 'data-testid', 'aria-expanded',
      'aria-haspopup', 'aria-disabled', 'data-state', 'disabled', 'tabindex']) {
      btn.removeAttribute(attr);
    }
  } else {
    // Fallback when the toolbar holds no reference button.
    btn.style.cssText = 'display:flex;align-items:center;justify-content:center;'
      + 'flex:0 0 auto;margin:4px;padding:6px;border:0;border-radius:8px;'
      + 'background:transparent;color:inherit;cursor:pointer';
  }

  // The buttons sit against the right edge of the bar, so they need an offset —
  // which the clone cannot inherit, the original not being at the end of a row.
  btn.style.marginRight = '4px';

  btn.id = spec.id;
  btn.type = 'button';
  // Icon-only button: without an accessible name it is announced as "button"
  // and nothing else. The title doubles as a mouse tooltip.
  btn.setAttribute('aria-label', spec.label);
  btn.title = spec.label;

  // icons.js is loaded before content.js in the manifest. `icon()` builds an SVG
  // with no intrinsic size, so we reuse the computed size of the one being
  // replaced — their stylesheet sizes it through a rule we should not guess.
  const glyph = icon(spec.glyph);
  const oldGlyph = btn.querySelector('svg');
  if (oldGlyph) {
    const cs = getComputedStyle(ref.querySelector('svg'));
    glyph.style.width = cs.width;
    glyph.style.height = cs.height;
    oldGlyph.replaceWith(glyph);
  } else {
    glyph.style.width = '20px';
    glyph.style.height = '20px';
    glyph.style.display = 'block';
    btn.append(glyph);
  }

  /**
   * Turns the icon into a spinner for as long as the action runs.
   *
   * Archiving fetches every image and a print waits on them too, which on a
   * lesson full of screenshots is long enough for a motionless button to look
   * like one that ignored the click.
   *
   * Animated through the Web Animations API rather than a keyframe rule: the
   * button lives in Preply's page, and adding a stylesheet to somebody else's
   * document to spin one icon is a poor trade — this touches nothing outside
   * the element itself.
   *
   * @returns {() => void} puts the real icon back.
   */
  const spin = () => {
    const spinner = icon('circle-notch-bold');
    spinner.style.cssText = glyph.style.cssText;
    // An <svg> takes its transform origin from the border box, which is what we
    // want, but only once it has one: without an explicit centre a partial box
    // makes it wobble around a corner instead of turning on itself.
    spinner.style.transformOrigin = '50% 50%';
    glyph.replaceWith(spinner);

    const turn = reducedMotion.matches ? null : spinner.animate(
      [{ transform: 'rotate(0turn)' }, { transform: 'rotate(1turn)' }],
      { duration: 800, iterations: Infinity, easing: 'linear' },
    );

    return () => {
      if (turn) turn.cancel();
      spinner.replaceWith(glyph);
    };
  };

  /**
   * Temporary feedback, carried by colour rather than by a label: there is no
   * text left to swap.
   *
   * @param {string} color
   * @param {string} label
   * @returns {void}
   */
  const flash = (color, label) => {
    btn.style.color = color;
    btn.setAttribute('aria-label', label);
    btn.title = label;
    setTimeout(() => {
      // Empty string, not 'inherit': removing the inline override hands control
      // back to Preply's classes, hover states included.
      btn.style.color = '';
      btn.setAttribute('aria-label', spec.label);
      btn.title = spec.label;
      btn.disabled = false;
    }, 2000);
  };

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const settle = spin();
    try {
      await spec.run(flash);
    } catch (e) {
      flash('#f54238', t('archiveFailed'));
      console.error('[pca]', spec.id, 'failed', e);
    } finally {
      // finally, not after the await: a failure has to give the icon back too,
      // or the button spins for ever on the one occasion it matters.
      settle();
    }
  });

  return btn;
}

/** Re-injects the buttons and (re)binds autosave when the Canvas is mounted. */
function sync() {
  const toolbar = document.querySelector(SEL_TOOLBAR);
  const editor = document.querySelector(SEL_EDITOR);

  // Injected into the bar's parent, not the bar itself: that parent is a flex
  // container with `justify-content: space-between`, so what we add settles on
  // the right and stays visible when the toolbar scrolls horizontally.
  const host = toolbar ? (toolbar.parentElement || toolbar) : null;

  // One group, never the buttons directly. space-between spreads whatever it
  // holds: with the bar and a single button it pinned that button to the right,
  // but a second one turned three children into left, centre and right, and the
  // two icons ended up half a toolbar apart. Wrapped, the parent still counts
  // two children and the pair stays together.
  let group = host && host.querySelector('#' + BTN_GROUP_ID);
  if (host && !group) {
    group = document.createElement('div');
    group.id = BTN_GROUP_ID;
    group.style.cssText = 'display:flex;align-items:center;flex:0 0 auto';
    host.appendChild(group);
  }

  // Print first, archive last: the archive button keeps the edge of the bar,
  // where it has always been.
  if (group && !group.querySelector('#' + BTN_PRINT_ID)) {
    group.appendChild(makeButton({
      id: BTN_PRINT_ID,
      glyph: 'printer-bold',
      label: t('printButton'),
      run: async (flash) => {
        if (await printCanvas()) flash('#19ac91', t('printButton'));
        else flash('#f6c823', t('archiveNoCanvas'));
      },
    }));
  }
  if (group && !group.querySelector('#' + BTN_ID)) {
    group.appendChild(makeButton({
      id: BTN_ID,
      glyph: 'tray-arrow-down-bold',
      label: t('archiveButton'),
      run: async (flash) => {
        const r = await capture(true);
        if (r === 'saved') flash('#19ac91', t('archiveDone'));
        else flash('#f6c823', t('archiveNoCanvas'));
      },
    }));
  }

  // A pending save belongs to a page, and a page is its URL — not the node that
  // happens to render it. Keyed to the node, as it first was, any remount on
  // the same page threw the pending save away and restarted the clock, and a
  // node that changes often enough kept autosave from ever firing.
  //
  // On a real change of page it has to go: the document it was waiting for is
  // gone, and left to fire it would archive the page just opened, unedited.
  // What it held is lost unless the button was used — AUTOSAVE_MAX_WAIT_MS
  // bounds how much.
  const page = location.pathname;
  if (page !== observedPage) {
    observedPage = page;
    lastSavedHtml = null;
    clearTimeout(autosaveTimer);
    dirtySince = 0;
  }

  // Compared by identity, not by presence. Checking only whether an observer
  // existed kept it on the first editor ever found: if Preply replaces the node
  // without a frame in between where none is mounted, the observer went on
  // watching a detached tree and autosave stopped for the rest of the lesson.
  if (editor !== observedEditor) {
    if (editorObserver) editorObserver.disconnect();
    editorObserver = null;
    observedEditor = editor;

    // Traced, like the archiving itself: how often Preply swaps this node is
    // not known, and a line per swap is how to find out. console.debug, so it
    // shows only with the console's verbose level.
    console.debug('[pca] editor', editor ? 'bound' : 'lost', page);

    if (editor) {
      editorObserver = new MutationObserver(scheduleAutosave);
      editorObserver.observe(editor, { childList: true, subtree: true, characterData: true });

      // A page is archived for being opened, not only for being edited: a
      // lesson moves through pages nobody types on, and those are part of it.
      // Counted as a change, so it waits for the document to settle like any
      // other; the background drops it if that version is already stored.
      scheduleAutosave();
    }
  }
}

/**
 * Debounces autosave, but never past AUTOSAVE_MAX_WAIT_MS from the first
 * unsaved change.
 *
 * @returns {void}
 */
function scheduleAutosave() {
  const now = Date.now();
  if (dirtySince === 0) dirtySince = now;

  clearTimeout(autosaveTimer);
  const wait = Math.min(AUTOSAVE_DELAY_MS, dirtySince + AUTOSAVE_MAX_WAIT_MS - now);
  autosaveTimer = setTimeout(autosave, Math.max(0, wait));
}

/**
 * Runs the automatic capture.
 *
 * Marked clean before capturing, not after: a mutation arriving while the
 * images are fetched belongs to the next save, and must start its own clock.
 *
 * @returns {void}
 */
function autosave() {
  dirtySince = 0;
  // The outcome is traced: 'unchanged' and 'no-canvas' are silent otherwise,
  // and from the outside they look exactly like an autosave that never ran.
  capture(false)
    .then((outcome) => console.debug('[pca] autosave', outcome))
    .catch(console.error);
}

/** Set while a sync is already scheduled for the next frame. */
let syncQueued = false;

/**
 * Coalesces sync() to at most once per frame.
 *
 * The observer watches the whole document, because the app is a SPA and the
 * toolbar is unmounted and remounted with no page load. During a lesson that
 * document is a live collaborative editor: every keystroke of the tutor's, and
 * every caret the server echoes back, delivers a batch. Running two
 * querySelector calls on each of them is work done inside somebody else's
 * page, several times a second, to answer a question whose answer changes
 * perhaps twice in a lesson.
 *
 * @returns {void}
 */
function queueSync() {
  if (syncQueued) return;
  syncQueued = true;
  requestAnimationFrame(() => {
    syncQueued = false;
    sync();
  });
}

new MutationObserver(queueSync).observe(document.documentElement, { childList: true, subtree: true });
sync();
