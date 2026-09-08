/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Viewer — navigation a trois niveaux : salle de classe (un professeur) →
 * page (listee une seule fois) → versions, reunies dans le volet Historique.
 *
 * Le modele est derive de l'index a chaud ; aucune migration du stockage.
 *   classroomId -> une salle Preply, donc un professeur
 *   canvasId    -> une page du Canvas
 *   instantane  -> une version datee de cette page
 */

/**
 * Racine de l'API d'extension.
 *
 * Firefox expose `browser`, Chrome expose `chrome`. En MV3 les deux renvoient
 * des promesses sur les API utilisees ici, un alias suffit donc — embarquer le
 * polyfill Mozilla serait une dependance npm pour trois appels.
 *
 * Redeclare dans chaque fichier plutot que partage : le service worker de
 * Chrome ne charge qu'un seul script et ne peut pas importer un module commun
 * sans etape de build.
 */
const api = globalThis.browser ?? globalThis.chrome;

const INDEX_KEY = 'pca:index';

const elRooms = document.getElementById('room-list');
const elPages = document.getElementById('page-list');
const elFilter = document.getElementById('filter');
// Le <span> et non le conteneur : renderUsage() ecrit en textContent, ce qui
// effacerait le lien vers le depot pose a cote.
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
const elHistory = document.getElementById('history');
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
/** Instantane affiche, augmente de sa cle. @type {object|null} */
let curSnap = null;

/* ------------------------------------------------------- preferences d'UI */

const PREFS_KEY = 'pca:prefs';

/**
 * Etat d'interface persistant.
 *
 * Stocke dans `storage.local` et non dans `localStorage` : un module temporaire
 * recoit un UUID neuf a chaque chargement, donc une origine neuve et un
 * `localStorage` vide. `storage.local` est clé par l'ID de l'extension et
 * survit aux rechargements.
 *
 * `zoom` a `null` signifie « jamais choisi » : le palier par defaut sera
 * resolu a l'initialisation, une fois ZOOM_STEPS connu.
 *
 * @type {{zoom:number|null, roomId:string|null, pageId:string|null, focus:boolean}}
 */
let prefs = { zoom: null, roomId: null, pageId: null, focus: false };

/**
 * Charge les preferences. Une lecture impossible laisse les valeurs par defaut.
 *
 * @returns {Promise<void>}
 */
async function loadPrefs() {
  try {
    const stored = await api.storage.local.get(PREFS_KEY);
    if (stored[PREFS_KEY]) prefs = { ...prefs, ...stored[PREFS_KEY] };
  } catch (e) {
    console.warn('[pca] préférences illisibles', e);
  }
}

/** Ecrit les preferences, sans bloquer l'interface. @returns {void} */
function savePrefs() {
  api.storage.local.set({ [PREFS_KEY]: prefs })
    .catch((e) => console.warn('[pca] préférences non écrites', e));
}

const LABELS_KEY = 'pca:labels';

/**
 * Noms de page choisis a la main, indexes par canvasId.
 *
 * Stockes a part des instantanes : un nom appartient a la page, pas a une
 * version. Il doit survivre a l'archivage d'une nouvelle version comme a la
 * suppression de celle qui etait affichee quand on l'a saisi.
 *
 * @type {Record<string, string>}
 */
let labels = {};

/**
 * Charge les noms personnalises. Une lecture impossible laisse la table vide,
 * auquel cas les libelles derives du contenu reprennent la main.
 *
 * @returns {Promise<void>}
 */
async function loadLabels() {
  try {
    const stored = await api.storage.local.get(LABELS_KEY);
    labels = stored[LABELS_KEY] || {};
  } catch (e) {
    console.warn('[pca] noms de page illisibles', e);
  }
}

/** Ecrit les noms personnalises. @returns {void} */
function saveLabels() {
  api.storage.local.set({ [LABELS_KEY]: labels })
    .catch((e) => console.warn('[pca] noms de page non écrits', e));
}

const AVATARS_KEY = 'pca:avatars';

/**
 * Avatars des professeurs en data URI, par classroomId.
 *
 * Stockes une fois par salle et non dans chaque instantane : ils appartiennent
 * au professeur, pas a une version datee.
 *
 * @type {Record<string, string>}
 */
let avatars = {};

/**
 * Charge les avatars. En cas d'echec, l'initiale du professeur prend le relais.
 *
 * @returns {Promise<void>}
 */
async function loadAvatars() {
  try {
    const stored = await api.storage.local.get(AVATARS_KEY);
    avatars = stored[AVATARS_KEY] || {};
  } catch (e) {
    console.warn('[pca] avatars illisibles', e);
  }
}

const ORDER_KEY = 'pca:order';

/**
 * Rang des pages tel que Preply les presente, par salle puis par canvasId.
 *
 * Chaque page du Canvas est un canvasId distinct ; rien dans un instantane ne
 * dit ou elle se situe dans la sequence. Seule la barre de vignettes le sait,
 * et c'est le content script qui la releve.
 *
 * @type {Record<string, Record<string, {index: number, num: string}>>}
 */
let order = {};

/**
 * Charge les rangs connus. En cas d'echec, le tri retombe sur l'ordre
 * antichronologique d'archivage.
 *
 * @returns {Promise<void>}
 */
async function loadOrder() {
  try {
    const stored = await api.storage.local.get(ORDER_KEY);
    order = stored[ORDER_KEY] || {};
  } catch (e) {
    console.warn('[pca] ordre des pages illisible', e);
  }
}

/**
 * Nom affiche d'une page : le nom choisi, sinon le libelle derive du contenu,
 * sinon le numero Preply.
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
 * Annonce un changement aux technologies d'assistance.
 *
 * Le viewer change de document sans rechargement : sans region live, rien ne
 * signale qu'on regarde autre chose. Le texte est vide puis repose au tick
 * suivant, sinon deux annonces identiques d'affilee passent inapercues.
 *
 * @param {string} message
 * @returns {void}
 */
function announce(message) {
  elStatus.textContent = '';
  requestAnimationFrame(() => { elStatus.textContent = message; });
}

/**
 * Langues de cours Preply vers etiquettes BCP-47.
 *
 * Sans `lang` juste sur le document, une synthese vocale lit le polonais avec
 * les regles du francais — le contenu devient inecoutable.
 */
const LANG_TAGS = {
  polish: 'pl', french: 'fr', english: 'en', spanish: 'es', german: 'de',
  italian: 'it', portuguese: 'pt', russian: 'ru', chinese: 'zh', japanese: 'ja',
  korean: 'ko', arabic: 'ar', dutch: 'nl', turkish: 'tr', swedish: 'sv',
  ukrainian: 'uk', czech: 'cs', greek: 'el', hebrew: 'he', hindi: 'hi',
  norwegian: 'nb', danish: 'da', finnish: 'fi', romanian: 'ro', hungarian: 'hu',
};

/**
 * Etiquette de langue d'un instantane.
 *
 * Priorite au champ pose a la capture ; sinon on relit l'URL archivee, de la
 * forme /edu/<langue>/classroom-v2/... — ce qui couvre les instantanes pris
 * avant l'ajout du champ. Une langue inconnue renvoie une chaine vide : mieux
 * vaut heriter du francais que d'affirmer une langue fausse.
 *
 * @param {{course?: string, url?: string}} snap
 * @returns {string} etiquette BCP-47, ou '' si indeterminee.
 */
function langOf(snap) {
  const fromUrl = /\/edu\/([a-z-]+)\/classroom-v2\//i.exec(snap.url || '');
  const raw = snap.course || (fromUrl ? fromUrl[1] : '');
  return raw ? (LANG_TAGS[raw.toLowerCase()] || '') : '';
}

/**
 * Formate un horodatage ISO en libelle relatif court.
 *
 * @param {string} iso
 * @returns {string} par ex. "Aujourd'hui 18:42" ou "12 mars 2026 09:26".
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
 * Extrait le nom du professeur du titre de l'onglet Preply.
 *
 * @param {string} title - par ex. "Salle de classe avec Paula".
 * @returns {string} le nom, ou le titre complet si le motif ne correspond pas.
 */
function tutorOf(title) {
  return tutorFromTitle(title) || 'Unknown classroom';
}

/** Elements traites comme une ligne autonome dans l'extraction de texte. */
const BLOCK_TAGS = /^(P|LI|H[1-6]|TD|TH|BLOCKQUOTE|PRE|FIGCAPTION)$/;

/**
 * Lettres qu'aucune normalisation Unicode ne decompose.
 *
 * Ce ne sont pas des lettres accentuees mais des lettres a part entiere : NFKD
 * les laisse intactes. Sans cette table, chercher « slonce » ne trouverait
 * jamais « słońce », ni « oe » « œuf », ni « strasse » « straße ».
 * Les expansions vers plusieurs lettres sont voulues et gerees par foldWithMap.
 */
const FOLD_MAP = new Map(Object.entries({
  ł: 'l', ø: 'o', đ: 'd', ð: 'd', þ: 'th', æ: 'ae', œ: 'oe', ß: 'ss',
  ı: 'i', ħ: 'h', ŋ: 'n', ŧ: 't', ĸ: 'k', ŀ: 'l', ĳ: 'ij', ſ: 's',
}));

const FOLD_RE = new RegExp(`[${[...FOLD_MAP.keys()].join('')}]`, 'g');

/**
 * Plie une chaine pour la comparaison : sans diacritiques, sans casse.
 *
 * Trois passes, dans cet ordre :
 *   1. NFKD — decompose lettre + marque combinante, et rabat les formes de
 *      compatibilite (pleine chasse, ligatures typographiques, exposants).
 *   2. suppression de toutes les marques Unicode (`\p{M}`), pas seulement du
 *      bloc latin : couvre aussi le grec, le cyrillique, l'hebreu, l'arabe,
 *      le vietnamien.
 *   3. minuscules, puis la table des lettres indecomposables.
 *
 * Le turc converge correctement : `İ` perd son point en 2, `ı` est rabattu
 * en 3, les deux donnent `i`.
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
 * Plie une ligne en conservant la correspondance vers les indices d'origine.
 *
 * Indispensable : le pliage change les longueurs — `ß` devient deux lettres, un
 * caractere accentue en perd une — donc un indice trouve dans la chaine pliee
 * ne designe pas le meme caractere dans la chaine affichee. On plie point de
 * code par point de code et on note, pour chaque position pliee, la position
 * source correspondante.
 *
 * L'iteration se fait par point de code (`for...of`) et non par unite UTF-16 :
 * decouper une paire de substitution donnerait deux demi-caracteres.
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
 * Texte normalise d'un bloc, tel qu'utilise pour la recherche et la comparaison.
 *
 * \s couvre deja l'espace insecable en JavaScript : l'ancienne classe
 * [\s<U+00A0>] contenait un caractere invisible, redondant et piegeux a relire.
 *
 * @param {Element} el
 * @returns {string}
 */
function blockText(el) {
  return el.textContent.replace(/\s+/g, ' ').trim();
}

/**
 * Blocs porteurs de texte d'un document, dans l'ordre de lecture.
 *
 * Les blocs vides sont ecartes : ce sont les innombrables paragraphes a simple
 * saut de ligne de ProseMirror, sans interet ni pour la recherche ni pour la
 * comparaison.
 *
 * Source unique du decoupage. Le diff aligne les lignes d'un instantane sur les
 * elements du DOM affiche par leur position : deux parcours divergents
 * decaleraient tout le marquage.
 *
 * @param {ParentNode} root
 * @returns {Element[]}
 */
function blockNodes(root) {
  const out = [];
  const visit = (el) => {
    for (const child of el.children) {
      // Un <li> contenant un <p> ne doit pas produire deux fois la meme ligne.
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
 * Decoupe un instantane en lignes logiques et en derive le libelle de page.
 *
 * Preply ne nomme pas ses pages — la barre de vignettes ne fournit qu'un
 * numero. Le libelle est donc reconstruit depuis la premiere ligne non vide.
 *
 * @param {string} html
 * @returns {{label: string, lines: string[]}}
 */
function parseSnapshot(html) {
  const box = document.createElement('div');
  box.innerHTML = html;

  const lines = blockNodes(box).map(blockText);
  const first = lines[0] || '';

  return {
    label: first ? (first.length > 44 ? first.slice(0, 44) + '…' : first) : t('pageNoText'),
    lines,
  };
}

/**
 * Extrait un apercu textuel court d'un instantane.
 *
 * @param {string} html
 * @returns {string}
 */
function excerpt(html) {
  const box = document.createElement('div');
  box.innerHTML = html;
  const t = box.textContent.replace(/\s+/g, ' ').trim();
  return t.length > 120 ? t.slice(0, 120) + '…' : t;
}

/* ------------------------------------------------------------------ modele */

/**
 * Reconstruit le modele a trois niveaux depuis l'index.
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
 * Charge le contenu des pages d'une salle depuis leur version la plus recente :
 * libelle, lignes, et lignes pliees pour la recherche.
 *
 * Le pliage est calcule une fois ici et non a chaque frappe dans le filtre :
 * `fold()` normalise caractere par caractere, ce serait sensible sur un
 * document de plusieurs milliers de signes.
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
 * Cherche la premiere occurrence pliee dans les lignes d'une page.
 *
 * @param {Page} page
 * @param {string} needle - deja plie par `fold()`.
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
 * Construit l'extrait autour d'une occurrence, terme en gras.
 *
 * Assemble en noeuds DOM et non en HTML : le contenu vient des cours, il ne
 * doit jamais etre interprete comme du balisage.
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

/* ----------------------------------------------------------------- rendus */

/** Rend la colonne des salles de classe. */
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
    // Pose uniquement sur l'element courant : `aria-current="false"` partout
    // ailleurs est valide mais bavard a l'oral.
    if (curRoom && curRoom.id === room.id) b.setAttribute('aria-current', 'true');

    // L'avatar et le chevron sont purement decoratifs : le nom qui suit dit
    // deja tout. Les laisser lisibles ferait annoncer « P, Paula, chevron ».
    const av = document.createElement('span');
    av.className = 'av';
    av.setAttribute('aria-hidden', 'true');

    const portrait = avatars[room.id];
    if (portrait) {
      // Data URI : aucune requete reseau, donc l'avatar survit hors ligne.
      const img = document.createElement('img');
      img.src = portrait;
      img.alt = '';
      // Si la data URI est corrompue, on revient a l'initiale plutot que de
      // laisser une image cassee.
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
 * Pages d'une salle, antichronologiques : la plus recemment archivee en tete.
 *
 * Tri explicite plutot que de s'appuyer sur l'ordre d'insertion de la Map, qui
 * n'etait juste que par effet de bord du tri de l'index.
 *
 * @param {Room} room
 * @returns {Page[]}
 */
function pagesOf(room) {
  const known = order[room.id] || {};

  return [...room.pages.values()].sort((a, b) => {
    const ia = known[a.id] ? known[a.id].index : undefined;
    const ib = known[b.id] ? known[b.id].index : undefined;

    // Ordre de Preply quand il est connu pour les deux pages.
    if (Number.isFinite(ia) && Number.isFinite(ib)) return ia - ib;
    // Une page dont on ignore le rang passe apres celles qu'on sait placer :
    // l'inserer au hasard dans la sequence serait pire que de l'ajouter au bout.
    if (Number.isFinite(ia)) return -1;
    if (Number.isFinite(ib)) return 1;
    // Repli historique : la plus recemment archivee d'abord.
    return a.entries[0].ts < b.entries[0].ts ? 1 : -1;
  });
}

/** Rend la colonne des pages de la salle courante. */
function renderPages() {
  elPages.textContent = '';
  if (!curRoom) return;
  const needle = fold(elFilter.value.trim());

  let shown = 0;

  for (const page of pagesOf(curRoom)) {
    // La recherche porte sur le contenu de la version la plus recente. Le
    // libelle etant sa premiere ligne, il est couvert par la meme passe.
    const hit = needle ? findMatch(page, needle) : null;
    // Un nom saisi a la main n'existe pas dans le contenu archive : il faut le
    // chercher a part, sinon renommer une page la rendrait introuvable.
    const nameHit = needle && !hit && fold(pageName(page)).includes(needle);
    if (needle && !hit && !nameHit) continue;
    shown++;

    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'page';
    // « page » et non « true » : c'est le jeton prevu pour l'element courant
    // d'une navigation, et il s'annonce « page actuelle ».
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

  // Le filtre se tape au clavier : sans annonce, rien ne signale que la liste
  // s'est reduite, ni a combien.
  if (needle) announce(tn('pagesFound', shown, [elFilter.value.trim()]));
}

/**
 * Affiche un instantane dans le panneau principal.
 *
 * @param {IndexEntry} entry
 * @returns {Promise<void>}
 * @throws {Error} si l'index reference un instantane absent du stockage.
 */
async function showSnapshot(entry) {
  const store = await api.storage.local.get(entry.key);
  const snap = store[entry.key];
  if (!snap) throw new Error(`instantané manquant : ${entry.key}`);

  curSnap = { ...snap, key: entry.key };
  elDoc.innerHTML = snap.html;
  const tag = langOf(snap);
  if (tag) elDoc.lang = tag;
  else elDoc.removeAttribute('lang');

  elSheet.hidden = false;
  elPlaceholder.hidden = true;
  elTopbar.hidden = false;
  elTitle.textContent = pageName(curPage);

  // Une seule ligne discrete : les metadonnees ne doivent pas rivaliser avec
  // le titre, ce que faisaient les pastilles.
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

  document.getElementById('scroll').scrollTop = 0;

  // Le diff enrichit elMeta, donc il doit passer avant l'annonce.
  await applyDiff(entry);
  announce(`${elTitle.textContent}, version du ${fmt(snap.ts)}. ${elMeta.textContent}`);
}

/** Au-dela, la table de programmation dynamique coute trop de memoire. */
const MAX_DIFF_LINES = 1200;

/**
 * Script d'edition entre deux listes de lignes, par plus longue sous-sequence
 * commune.
 *
 * Programmation dynamique classique, en O(n*m). Sur des notes de cours on est a
 * quelques centaines de lignes, soit une table de l'ordre de 100 Ko — inutile
 * d'implementer Myers pour ca. Le garde-fou MAX_DIFF_LINES couvre l'aberration.
 *
 * @param {string[]} a - version precedente.
 * @param {string[]} b - version affichee.
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
 * Marque dans le document affiche ce qui a change depuis la version precedente.
 *
 * Le diff est une **vue**, jamais un format de stockage : les deux instantanes
 * restent entiers et independants, et le calcul est jete a chaque rendu. Une
 * chaine de deltas rendrait chaque version tributaire de toutes les
 * precedentes, ce qui est l'inverse de ce qu'on veut d'une archive.
 *
 * Sans effet si le volet Historique est ferme : la comparaison est le mode de
 * lecture de ce volet, pas un etat separe a piloter.
 *
 * @param {IndexEntry} entry - l'instantane actuellement affiche.
 * @returns {Promise<void>}
 */
async function applyDiff(entry) {
  if (elHistory.hidden || !curPage) return;

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
  // Les memes blocs, dans le meme ordre, des deux cotes : blockNodes() est la
  // source unique du decoupage, donc l'indice d'une ligne designe le bon noeud.
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
   * Insere les lignes supprimees accumulees, juste avant le bloc qui les
   * suivait. `null` place le reliquat en fin de document.
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
      // La couleur seule ne dit rien a une synthese vocale.
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

/**
 * Remplit le volet Historique avec les versions de la page courante.
 *
 * @returns {Promise<void>}
 */
async function renderHistory() {
  elHList.textContent = '';
  if (!curPage) return;

  const store = await api.storage.local.get(curPage.entries.map((e) => e.key));

  curPage.entries.forEach((e, i) => {
    const snap = store[e.key];
    const prev = curPage.entries[i + 1];
    const delta = prev ? e.chars - prev.chars : 0;

    const when = fmt(e.ts);
    const size = i === 0 ? t('newestVersion')
      : delta > 0 ? t('charsAdded', [delta])
        : delta < 0 ? t('charsRemoved', [Math.abs(delta)]) : t('sameContent');
    const isCurrent = curSnap && curSnap.key === e.key;

    const item = document.createElement('li');
    item.className = isCurrent ? 'ver current' : 'ver';
    item.dataset.key = e.key;

    // Bouton d'ouverture et bouton de suppression sont freres. L'ancienne
    // version imbriquait un <button> dans un conteneur role="button" :
    // imbrication interdite, et le lecteur d'ecran n'annoncait qu'un controle.
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'ver-open';
    if (isCurrent) open.setAttribute('aria-current', 'true');

    const when_ = document.createElement('b');
    when_.textContent = when;
    const sz = document.createElement('span');
    sz.className = 'sz';
    sz.textContent = size;
    const ex = document.createElement('div');
    ex.className = 'ex';
    ex.textContent = snap ? excerpt(snap.html) : '(introuvable)';
    open.append(when_, sz, ex);
    open.setAttribute('aria-label', t('openVersion', [when, size]));
    open.addEventListener('click', () => showSnapshot(e).catch(console.error));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.dataset.icon = 'trash';
    del.append(t('deleteVersion'));
    // Le libelle visible se repete d'une ligne a l'autre : l'intitule accessible
    // precise laquelle, faute de quoi la liste annonce treize fois la meme chose.
    del.setAttribute('aria-label', t('deleteVersionLabel', [when]));
    del.addEventListener('click', async () => {
      await api.runtime.sendMessage({ type: 'pca:delete', keys: [e.key] });
      announce(t('versionDeleted', [when]));
      await refresh({ keepSelection: true });
    });

    item.append(open, del);
    paintIcons(item);
    elHList.append(item);
  });
}

/** Affiche l'occupation reelle du stockage de l'extension. @returns {Promise<void>} */
async function renderUsage() {
  let bytes = 0;
  for (const room of rooms.values()) {
    for (const page of room.pages.values()) {
      for (const e of page.entries) bytes += e.chars;
    }
  }
  const versions = [...rooms.values()]
    .flatMap((r) => [...r.pages.values()])
    .reduce((n, p) => n + p.entries.length, 0);
  elUsage.textContent = t('storageUsage', [tn('snapshotCount', versions), (bytes / 1048576).toFixed(2)]);
}

/* -------------------------------------------------------------- selection */

/**
 * Selectionne une salle et sa page la plus recemment archivee.
 *
 * @param {Room} room
 * @returns {Promise<void>}
 */
async function selectRoom(room) {
  curRoom = room;
  curPage = null;
  await resolvePageContent(room);
  renderRooms();
  renderPages();
  const first = pagesOf(room)[0];
  if (first) {
    await selectPage(first);
  } else {
    // Salle sans page : on memorise quand meme la salle.
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
  if (!elHistory.hidden) await renderHistory();
}

/**
 * Reloads the model and restores the selection where possible.
 *
 * @param {{keepSelection?: boolean, showKey?: string}} [opts] - `showKey` pins a
 *   specific version instead of falling back to the page's newest one.
 * @returns {Promise<void>}
 */
async function refresh(opts = {}) {
  // La selection memorisee sert de cible par defaut. Toute reference devenue
  // invalide — page supprimee, salle disparue — retombe silencieusement sur la
  // premiere entree disponible.
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
    elHistory.hidden = true;
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
 * Ouvre ou ferme le volet Historique.
 *
 * Le document est re-rendu dans les deux sens : ouvrir fait apparaitre la
 * comparaison avec la version precedente, fermer la retire. Repartir de
 * l'instantane stocke est plus sur que defaire le marquage noeud par noeud.
 *
 * Fonction unique parce qu'il existe trois chemins de fermeture — le bouton,
 * la croix, Echap — et que deux d'entre eux oubliaient de redessiner, laissant
 * le diff affiche volet ferme.
 *
 * @param {boolean} open
 * @returns {Promise<void>}
 */
async function setHistory(open) {
  elHistory.hidden = !open;
  btnHistory.setAttribute('aria-pressed', String(open));

  if (open) await renderHistory();

  const shown = curSnap && curPage
    ? curPage.entries.find((e) => e.key === curSnap.key)
    : null;
  if (shown) await showSnapshot(shown);

  // A l'ouverture, le volet est loin du bouton dans l'ordre du DOM : sans
  // deplacement du focus, la tabulation continuerait dans la barre d'outils.
  // A la fermeture, le focus doit revenir a son point de depart.
  if (open) document.getElementById('history-head').focus();
  else btnHistory.focus();
}

btnHistory.addEventListener('click', () => {
  setHistory(elHistory.hidden).catch(console.error);
});

document.getElementById('hclose').addEventListener('click', () => {
  setHistory(false).catch(console.error);
});

/* ------------------------------------------- menu des actions secondaires */

/**
 * Ouvre ou ferme le menu, en tenant l'attribut aria a jour.
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

btnMore.addEventListener('click', (e) => {
  e.stopPropagation();
  setMenu(elMenu.hidden);
});

// Clic hors du menu : on referme, sans avaler le clic.
document.addEventListener('click', (e) => {
  if (elMenu.hidden || e.target.closest('#more-wrap')) return;
  setMenu(false);
});

// Sortie au clavier : sans ceci le menu restait ouvert derriere l'utilisateur
// apres une tabulation, et gardait aria-expanded a true.
document.getElementById('more-wrap').addEventListener('focusout', (e) => {
  if (elMenu.hidden) return;
  if (e.relatedTarget && e.relatedTarget.closest('#more-wrap')) return;
  setMenu(false);
});

/**
 * Esc ferme la couche la plus recemment ouverte, une par pression : le menu
 * d'abord s'il est ouvert, le volet Historique ensuite.
 */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;

  if (elTitle.isContentEditable) {
    e.stopPropagation();
    endTitleEdit(false);
    elTitle.focus();
    return;
  }
  if (!elMenu.hidden) {
    e.stopPropagation();
    setMenu(false);
    btnMore.focus();
    return;
  }
  if (!elHistory.hidden) {
    e.stopPropagation();
    // Meme chemin que la croix et le bouton : la fermeture doit aussi retirer
    // le marquage de comparaison du document.
    setHistory(false).catch(console.error);
  }
}, true);

/* -------------------------------------------------------------- mode focus */

/**
 * Applique le mode focus et le memorise.
 *
 * @param {boolean} on
 * @returns {void}
 */
function setFocusMode(on) {
  document.body.classList.toggle('focus', on);
  btnFocus.setAttribute('aria-pressed', String(on));

  // Le caret indique le mouvement declenche, pas l'etat courant : vers la
  // gauche pour replier les panneaux, vers la droite pour les redeployer.
  btnFocus.replaceChildren(icon(on ? 'caret-right' : 'caret-left'));

  // Le bouton n'a plus de texte : l'intitule doit vivre dans aria-label, sinon
  // il est muet pour un lecteur d'ecran.
  const label = on ? t('focusShow') : t('focusHide');
  btnFocus.setAttribute('aria-label', label);
  btnFocus.title = label;
  announce(on ? t('panelsHidden') : t('panelsShown'));

  prefs.focus = on;
  savePrefs();
}

btnFocus.addEventListener('click', () => setFocusMode(!document.body.classList.contains('focus')));

/* ------------------------------------------------- renommage d'une page */

/** Valeur affichee avant edition, pour pouvoir annuler. @type {string|null} */
let titleBefore = null;

/** Passe le titre en edition et selectionne son contenu. @returns {void} */
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
 * Sort du mode edition.
 *
 * Un nom vide, ou identique au libelle derive du contenu, ne cree pas d'entree :
 * la page retombe sur son libelle automatique, qui suivra alors ses futures
 * versions au lieu d'etre fige.
 *
 * @param {boolean} commit - false pour annuler et restaurer la valeur initiale.
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
    // Entree au clavier : le double-clic seul exclurait la navigation clavier.
    if (e.key === 'Enter') { e.preventDefault(); startTitleEdit(); }
    return;
  }
  // Un titre est une ligne : Entree valide au lieu d'inserer un saut.
  if (e.key === 'Enter') { e.preventDefault(); endTitleEdit(true); }
});

elTitle.addEventListener('blur', () => endTitleEdit(true));

// Un collage depuis une page web injecterait du balisage dans le titre.
// execCommand est deprecie mais reste le seul moyen fiable de coller du texte
// brut dans un contenteditable en conservant l'annulation native.
elTitle.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text');
  document.execCommand('insertText', false, text.replace(/\s+/g, ' ').trim());
});

elFilter.addEventListener('input', renderPages);

document.getElementById('btn-print').addEventListener('click', () => window.print());

document.getElementById('btn-delete').addEventListener('click', async () => {
  setMenu(false);
  if (!curPage) return;
  const n = curPage.entries.length;
  const label = pageName(curPage);
  if (!confirm(tn('confirmDeletePage', n, [label]))) return;
  await api.runtime.sendMessage({ type: 'pca:delete', keys: curPage.entries.map((e) => e.key) });
  curPage = null;
  await refresh({ keepSelection: true });
});

document.getElementById('btn-export').addEventListener('click', () => {
  setMenu(false);
  if (!curSnap) return;
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  const label = pageName(curPage);
  // La feuille du viewer est reprise telle quelle, puis neutralisee sur les
  // points propres a l'application. Les surcharges viennent APRES `css` :
  // a specificite egale, c'est la derniere regle qui gagne.
  const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><title>${label}</title>
<style>
${css}
body{display:block;background:#fff;margin:0;padding:24px}
#sheet{margin:0 auto}
</style></head>
<body><div id="sheet"><article id="doc">${curSnap.html}</article></div></body></html>`;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = `canvas-${curSnap.canvasId}-p${curSnap.page}-${curSnap.ts.slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ------------------------------------------------------------------- zoom */

/**
 * Paliers de zoom.
 *
 * On passe par la propriete `zoom` et non par `font-size` : le contenu archive
 * porte des `font-size:20px` en ligne heritees de l'editeur Preply, qu'un zoom
 * typographique laisserait intacts — seul le texte non stylise grandirait.
 * `zoom` multiplie toutes les longueurs calculees, colonne comprise, donc les
 * cesures de ligne restent exactement celles de Preply.
 */
const ZOOM_STEPS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
const ZOOM_DEFAULT = ZOOM_STEPS.indexOf(1);

const elZoom = document.getElementById('zoom');
const btnZoomValue = document.getElementById('zoom-reset');

let zoomIndex = ZOOM_DEFAULT;

/**
 * Applique un palier de zoom au document et le memorise.
 *
 * @param {number} index - indice dans ZOOM_STEPS, borne aux extremites.
 * @returns {void}
 */
function setZoom(index) {
  zoomIndex = Math.max(0, Math.min(ZOOM_STEPS.length - 1, index));
  const z = ZOOM_STEPS[zoomIndex];
  const percent = Math.round(z * 100);
  elDoc.style.zoom = String(z);
  btnZoomValue.textContent = `${percent} %`;
  // Le libelle visible n'est qu'un nombre : l'intitule accessible dit de quoi.
  btnZoomValue.setAttribute('aria-label', t('zoomValueLabel', [percent]));
  announce(t('zoomAnnounce', [percent]));
  prefs.zoom = zoomIndex;
  savePrefs();
}

/** Branche le groupe de zoom, ou le masque si le navigateur ne le gere pas. */
function initZoom() {
  if (!CSS.supports('zoom', '1.5')) {
    // Firefox anterieur a 126 : mieux vaut masquer que proposer un bouton inerte.
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

/* ------------------------------------------------------------------- boot */

(async () => {
  applyI18n();
  paintIcons();
  await loadPrefs();
  await loadLabels();
  await loadOrder();
  await loadAvatars();
  setFocusMode(prefs.focus === true);
  initZoom();
  await refresh();
})().catch(console.error);
