/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Content script — injects an archive button into the Canvas toolbar and
 * serialises the ProseMirror document into standalone HTML.
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
const SEL_EDITOR = '[data-qa-id="text-editor"] .ProseMirror';
const SEL_THUMB = '[data-qa-id="canvas-thumbnail"]';
// Reference icon button, cloned to inherit Preply's styling.
const SEL_REF_BUTTON = '[data-qa-id="canvas-toolbar"] button[data-preply-ds-component="IconButton"]';
const SEL_AVATAR = '[data-preply-ds-component="Avatar"] img';
const SEL_ACTIVE_THUMB = '[data-qa-id="canvas-thumbnail"] a[data-active="true"]';
const BTN_ID = 'pca-save-button';

const AUTOSAVE_DELAY_MS = 60_000;

/** Last serialisation stored, so an unchanged document is not duplicated. @type {string|null} */
let lastSavedHtml = null;
/** @type {number|undefined} */
let autosaveTimer;
/** @type {MutationObserver|null} */
let editorObserver = null;

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

    try {
      const res = await fetch(new URL(src, location.href).href, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error(`${buffer.byteLength} bytes`);

      const hash = await sha256(buffer);
      img.removeAttribute('src');
      img.setAttribute('data-pca-img', hash);

      // The blob is sent every time; the background writes it only when the
      // hash is unknown, so a recurring image costs one message and no storage.
      blobs[hash] = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(new Blob([buffer], { type: res.headers.get('content-type') || 'image/png' }));
      });
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
  const reply = await api.runtime.sendMessage({ type: 'pca:save', snapshot: snap });
  if (reply && reply.error) throw new Error(reply.error);

  lastSavedHtml = snap.html;
  return 'saved';
}

/**
 * Builds the archive button, modelled on the toolbar's icon buttons.
 *
 * Styling is inherited by cloning an existing button, never copied: Preply's
 * classes and the CSS custom properties they reference are hashed on every
 * build. A standalone fallback covers the case where the toolbar offers no
 * reference button.
 *
 * @returns {HTMLButtonElement}
 */
function makeButton() {
  const LABEL = t('archiveButton');

  // Cloning an existing icon button beats copying its classes: those are hashed
  // per build (ButtonBase--variant-ghost__ezCgl), and so are the CSS variables
  // they point at. The clone inherits the look AND the :hover, :active and
  // :focus-visible states without us having to know any of them — and survives
  // their deployments.
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

  // The button sits against the right edge of the bar, so it needs an offset —
  // which the clone cannot inherit, the original not being at the end of a row.
  btn.style.marginRight = '4px';

  btn.id = BTN_ID;
  btn.type = 'button';
  // Icon-only button: without an accessible name it is announced as "button"
  // and nothing else. The title doubles as a mouse tooltip.
  btn.setAttribute('aria-label', LABEL);
  btn.title = LABEL;

  // icons.js is loaded before content.js in the manifest. `icon()` builds an SVG
  // with no intrinsic size, so we reuse the computed size of the one being
  // replaced — their stylesheet sizes it through a rule we should not guess.
  const glyph = icon('tray-arrow-down-bold');
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
      btn.setAttribute('aria-label', LABEL);
      btn.title = LABEL;
      btn.disabled = false;
    }, 2000);
  };

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const r = await capture(true);
      if (r === 'saved') flash('#19ac91', t('archiveDone'));
      else flash('#f6c823', t('archiveNoCanvas'));
    } catch (e) {
      flash('#f54238', t('archiveFailed'));
      console.error('[pca] capture failed', e);
    }
  });

  return btn;
}

/** Re-injects the button and (re)binds autosave when the Canvas is mounted. */
function sync() {
  const toolbar = document.querySelector(SEL_TOOLBAR);
  const editor = document.querySelector(SEL_EDITOR);

  // Injected into the bar's parent, not the bar itself: that parent is a flex
  // container with `justify-content: space-between`, so the button settles on
  // the right and stays visible when the toolbar scrolls horizontally.
  const host = toolbar ? (toolbar.parentElement || toolbar) : null;
  if (host && !host.querySelector('#' + BTN_ID)) host.appendChild(makeButton());

  if (editor && !editorObserver) {
    editorObserver = new MutationObserver(() => {
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => capture(false).catch(console.error), AUTOSAVE_DELAY_MS);
    });
    editorObserver.observe(editor, { childList: true, subtree: true, characterData: true });
  } else if (!editor && editorObserver) {
    editorObserver.disconnect();
    editorObserver = null;
    lastSavedHtml = null;
  }
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
