/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Sanitiser — the one definition of what an archived document may contain.
 *
 * Loaded by the content script, which cleans a capture before storing it, and
 * by the viewer, which cleans every stored document again before showing or
 * exporting it: archives taken under an older, looser rule are covered too,
 * and stored data is never rewritten.
 *
 * Allowlist, not denylist. The previous rule named what to remove, and so let
 * through whatever it had not thought of — `<a href="javascript:…">` among
 * them, which runs on a click in an exported file opened outside any policy.
 * Here an element, an attribute or a URL scheme is kept only if named below.
 *
 * Fidelity is the counterweight: Preply can add a node to its editor at any
 * deployment. An element not on the list is therefore unwrapped — its text and
 * children stay, only the tag goes — and only containers that are dangerous or
 * meaningless without their tag are dropped whole.
 *
 * CSS is the one denylist, and deliberately: an archive's look lives in inline
 * styles whose full vocabulary is Preply's to choose, so what goes is only what
 * can escape the document (positioning over the viewer) or reach the network.
 */

/** Elements removed together with everything inside them. Lower case, as localName gives. */
const SANITIZE_DROP = new Set([
  'script', 'style', 'template', 'noscript', 'iframe', 'frame', 'frameset',
  'object', 'embed', 'applet', 'link', 'meta', 'base', 'title', 'svg', 'math',
  'form', 'button', 'select', 'textarea', 'audio', 'video', 'source', 'track',
  'canvas', 'dialog',
]);

/** Elements kept as they are. Anything else is unwrapped. */
const SANITIZE_KEEP = new Set([
  'p', 'br', 'span', 'div', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
  'ins', 'mark', 'code', 'pre', 'sub', 'sup', 'small', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'hr',
  'a', 'img', 'figure', 'figcaption', 'label', 'input',
  'table', 'caption', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
]);

/**
 * Attributes any kept element may carry.
 *
 * `class` is not among them: Preply's are hashed per build and style nothing
 * outside their page, and the ones that mattered — carets and widgets — are
 * acted on before attributes are filtered.
 */
const SANITIZE_ATTRS = new Set([
  'style', 'dir', 'lang', 'title',
  'data-pca-img', 'data-pca-unreachable', 'data-pca-missing',
]);

/** Further attributes, per element. */
const SANITIZE_ATTRS_BY_TAG = {
  a: new Set(['href']),
  img: new Set(['src', 'alt', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
  col: new Set(['span', 'width']),
  colgroup: new Set(['span', 'width']),
  ol: new Set(['start', 'type', 'reversed']),
  li: new Set(['value']),
  input: new Set(['type', 'checked']),
};

/** Link schemes a reader may follow. */
const SANITIZE_LINK_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/** Remote image schemes, allowed only where `remoteImages` says so. */
const SANITIZE_IMAGE_SCHEMES = new Set(['http:', 'https:']);

/**
 * CSS properties that could lay content over the viewer or out of its sheet.
 * Tested with any vendor prefix removed.
 */
const SANITIZE_CSS_ESCAPES = /^(position|inset|top|right|bottom|left|z-index|transform|translate|rotate|scale|animation|transition|content|cursor|pointer-events)(-|$)/;

/** CSS values that make the browser fetch something. */
const SANITIZE_CSS_FETCHES = /(url|image-set|image|cross-fade|element|expression)\s*\(/i;

/**
 * Resolves a URL and returns it only when its scheme is allowed.
 *
 * Resolved against the document's base: on Preply at capture, which turns a
 * relative link into the absolute one stored; on the extension page at
 * display, where an old relative link resolves to the extension's own scheme
 * and is dropped rather than sent somewhere it never pointed.
 *
 * @param {string} raw
 * @param {Set<string>} schemes - protocols, colon included.
 * @returns {string|null} the absolute URL, or null when refused.
 */
function sanitizeUrl(raw, schemes) {
  try {
    const url = new URL(raw.trim(), document.baseURI);
    return schemes.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Removes the declarations that escape the document or fetch, then writes the
 * attribute back from what the browser parsed.
 *
 * Written back even when nothing was removed: a declaration the browser could
 * not parse is absent from `el.style` and so would survive untouched in the
 * raw attribute, unread by this browser but not necessarily by the next one.
 *
 * @param {HTMLElement} el
 * @returns {void}
 */
function sanitizeStyle(el) {
  const style = el.style;
  for (let i = style.length - 1; i >= 0; i--) {
    const prop = style[i];
    if (SANITIZE_CSS_ESCAPES.test(prop.replace(/^-[a-z]+-/, ''))
        || SANITIZE_CSS_FETCHES.test(style.getPropertyValue(prop))) {
      style.removeProperty(prop);
    }
  }

  const text = style.cssText;
  if (text) el.setAttribute('style', text);
  else el.removeAttribute('style');
}

/**
 * Cleans a document tree in place.
 *
 * Collaboration carets and ProseMirror widgets go first, while their classes
 * are still there to find them by: they are decorations, one per connected
 * peer, carrying that person's name — archived, the tutor's name lands
 * mid-sentence and reaches the page list, the search and every diff. Both
 * names belong to upstream libraries, not to Preply's hashed build, so
 * anchoring on them does not breach the rule against Preply's CSS.
 *
 * @param {ParentNode} root - a detached clone or the body of an inert document.
 *   Its own attributes are left alone; only its descendants are cleaned.
 * @param {{remoteImages: boolean}} options - `remoteImages` keeps `http(s)`
 *   image sources, which the capture still has to download and the print frame
 *   still has to show. Everywhere else only `data:image/` survives: the viewer
 *   never reaches the network.
 * @returns {void}
 */
function sanitizeTree(root, options) {
  for (const el of root.querySelectorAll('.ProseMirror-widget,[class*="collaboration-carets"]')) {
    el.remove();
  }

  // A static list, taken once: unwrapping moves children rather than copying
  // them, so they are still in it and still visited. Nodes that went with a
  // dropped ancestor are skipped.
  for (const el of root.querySelectorAll('*')) {
    if (!root.contains(el)) continue;
    const name = el.localName;

    if (SANITIZE_DROP.has(name)) { el.remove(); continue; }
    if (!SANITIZE_KEEP.has(name)) { el.replaceWith(...el.childNodes); continue; }

    const own = SANITIZE_ATTRS_BY_TAG[name];
    for (const attr of [...el.attributes]) {
      if (!SANITIZE_ATTRS.has(attr.name) && !(own && own.has(attr.name))) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.hasAttribute('style')) sanitizeStyle(/** @type {HTMLElement} */ (el));

    if (name === 'a') {
      const href = el.getAttribute('href');
      const safe = href === null ? null : sanitizeUrl(href, SANITIZE_LINK_SCHEMES);
      if (safe) {
        el.setAttribute('href', safe);
        // A link followed inside the viewer would replace the archive with
        // the page it points at.
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      } else {
        el.removeAttribute('href');
      }
    } else if (name === 'img') {
      const src = (el.getAttribute('src') || '').trim();
      if (/^data:image\//i.test(src)) continue;
      const safe = src && options.remoteImages
        ? sanitizeUrl(src, SANITIZE_IMAGE_SCHEMES)
        : null;
      if (safe) el.setAttribute('src', safe);
      else el.removeAttribute('src');
    } else if (name === 'input') {
      // Only a task-list checkbox has any business in a lesson, and it is a
      // record of a state, not a control.
      if (el.getAttribute('type') !== 'checkbox') { el.remove(); continue; }
      el.setAttribute('disabled', '');
    }
  }
}

/**
 * Parses stored snapshot markup without letting it do anything, then cleans it.
 *
 * A DOMParser document is inert: nothing in it loads, runs or fires, unlike
 * markup assigned to an element of the live page, where an `<img>` starts
 * downloading and an `onerror` fires before any cleaning has had its turn.
 *
 * @param {string} html
 * @returns {HTMLElement} the body of a detached document; its children can be
 *   moved into the page, which adopts them.
 */
function parseArchived(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  sanitizeTree(doc.body, { remoteImages: false });
  return doc.body;
}
