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

/**
 * Serialises the ProseMirror node into standalone HTML.
 *
 * Preply's colours are obfuscated tokens (`var(--0d2c1d)`) defined in one of
 * their stylesheets. They are resolved to computed values at capture time, so
 * the resulting HTML depends on no external CSS.
 *
 * @param {Element} editor - the live `.ProseMirror` node.
 * @returns {string} cleaned innerHTML, with no editing attributes left.
 * @throws {TypeError} when `editor` is not an Element.
 */
function serializeEditor(editor) {
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

  for (const el of clone.querySelectorAll('[contenteditable]')) el.removeAttribute('contenteditable');
  for (const el of clone.querySelectorAll('[tabindex]')) el.removeAttribute('tabindex');

  return clone.innerHTML;
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
function buildSnapshot() {
  const editor = document.querySelector(SEL_EDITOR);
  if (!editor) return null;

  const m = location.pathname.match(/\/classroom-v2\/(\d+)\/canvas\/(\d+)/);
  const lang = location.pathname.match(/\/edu\/([a-z-]+)\//i);
  const active = document.querySelector(SEL_ACTIVE_THUMB);

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
    html: serializeEditor(editor),
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
  const snap = buildSnapshot();
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

  await api.runtime.sendMessage({ type: 'pca:save', snapshot: snap });
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

// The app is a SPA: the toolbar is unmounted and remounted with no page load.
new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true });
sync();
