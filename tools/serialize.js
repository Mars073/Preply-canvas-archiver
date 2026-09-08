/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * High-fidelity serialisation of Preply's Tiptap document.
 *
 * Principle: none of Preply's CSS is carried over. Styles are read *computed*
 * off the live DOM and written inline, but only the values that differ from a
 * reference:
 *   - inherited properties -> compared to the parent, or everything duplicates
 *   - box properties       -> compared to the UA default for the same tag,
 *                             measured inside a sandbox iframe
 * The result no longer depends on any external stylesheet.
 *
 * Usable as-is in the console of a lesson page: the script runs and downloads a
 * preview. `window.pcaSerialize()` stays available afterwards.
 */
(() => {
  const EDITOR_SEL = '[data-qa-id="text-editor"]';

  /** Inherited properties: diffed against the parent. */
  const INHERITED = [
    'color', 'font-family', 'font-size', 'font-style', 'font-weight',
    'font-variant', 'font-feature-settings', 'letter-spacing', 'line-height',
    'text-align', 'text-indent', 'text-transform', 'white-space', 'word-spacing',
    'word-break', 'overflow-wrap', 'direction', 'text-decoration-line',
    'text-decoration-color', 'text-decoration-style', 'text-decoration-thickness',
    'text-underline-offset', 'list-style-type', 'list-style-position',
    'border-collapse', 'border-spacing', 'caption-side', 'empty-cells',
  ];

  /** Box properties: diffed against the UA default for the same tag. */
  const BOXED = [
    'display', 'vertical-align', 'opacity', 'visibility', 'float', 'clear',
    'background-color', 'background-image', 'background-size',
    'background-position', 'background-repeat', 'background-clip',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
    'box-shadow', 'table-layout', 'text-shadow', 'mix-blend-mode',
  ];

  /**
   * Tags whose size is frozen. Elsewhere we abstain: writing the computed width
   * of a <p> would freeze the layout to the capture window.
   */
  const SIZED = new Set(['IMG', 'TABLE', 'TD', 'TH', 'COL', 'COLGROUP', 'VIDEO']);

  /** Ancestors required for a tag's UA default to be correct. */
  const SCAFFOLD = {
    TD: ['TABLE', 'TBODY', 'TR'], TH: ['TABLE', 'THEAD', 'TR'],
    TR: ['TABLE', 'TBODY'], TBODY: ['TABLE'], THEAD: ['TABLE'],
    TFOOT: ['TABLE'], COL: ['TABLE', 'COLGROUP'], COLGROUP: ['TABLE'],
    LI: ['UL'], DT: ['DL'], DD: ['DL'],
  };

  /** Attributes stripped from the clone: editing, React hooks, Preply classes. */
  const DROP_ATTRS = [
    'contenteditable', 'tabindex', 'spellcheck', 'translate', 'autocorrect',
    'autocapitalize', 'role', 'class', 'srcset', 'sizes', 'loading',
  ];

  /** @type {HTMLIFrameElement|null} */
  let sandbox = null;
  /** @type {Map<string, CSSStyleDeclaration>} */
  const defaultsCache = new Map();

  /**
   * Creates the sandbox iframe, aligned on the editor's typography so that
   * margins expressed in `em` resolve to the same pixels.
   *
   * @param {Element} editor
   * @returns {Document}
   */
  function ensureSandbox(editor) {
    if (sandbox) return sandbox.contentDocument;
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;height:600px;border:0';
    document.body.appendChild(f);
    const cs = getComputedStyle(editor);
    const b = f.contentDocument.body;
    b.style.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
    b.style.margin = '0';
    sandbox = f;
    return f.contentDocument;
  }

  /**
   * Computed style of a blank element of the same tag, correctly nested.
   *
   * @param {string} tag - tag name in upper case.
   * @param {Element} editor
   * @returns {CSSStyleDeclaration|null} `null` when the tag cannot be created.
   */
  function defaultsFor(tag, editor) {
    if (defaultsCache.has(tag)) return defaultsCache.get(tag);
    const doc = ensureSandbox(editor);
    let cs = null;
    try {
      let host = doc.body;
      for (const anc of SCAFFOLD[tag] || []) {
        const n = doc.createElement(anc);
        host.appendChild(n);
        host = n;
      }
      const el = doc.createElement(tag);
      host.appendChild(el);
      cs = getComputedStyle(el);
      // Force resolution before the node can be recycled.
      void cs.display;
    } catch {
      cs = null;
    }
    defaultsCache.set(tag, cs);
    return cs;
  }

  /**
   * Writes onto `dst` the computed styles of `src` that differ from the
   * references.
   *
   * @param {Element} src - live node.
   * @param {Element} dst - its detached clone.
   * @param {CSSStyleDeclaration|null} parentCS - computed style of the live parent.
   * @param {Element} editor
   * @returns {CSSStyleDeclaration} the computed style of `src`, for recursion.
   */
  function inlineOne(src, dst, parentCS, editor) {
    const cs = getComputedStyle(src);
    const def = defaultsFor(src.tagName, editor);
    const out = [];

    for (const p of INHERITED) {
      const v = cs.getPropertyValue(p);
      if (!v) continue;
      if (parentCS && v === parentCS.getPropertyValue(p)) continue;
      out.push(`${p}:${v}`);
    }

    for (const p of BOXED) {
      const v = cs.getPropertyValue(p);
      if (!v) continue;
      if (def && v === def.getPropertyValue(p)) continue;
      out.push(`${p}:${v}`);
    }

    if (SIZED.has(src.tagName)) {
      for (const p of ['width', 'height', 'max-width', 'object-fit']) {
        const v = cs.getPropertyValue(p);
        if (v && v !== 'none' && v !== 'auto') out.push(`${p}:${v}`);
      }
    }

    for (const a of DROP_ATTRS) dst.removeAttribute(a);
    if (out.length) dst.setAttribute('style', out.join(';'));
    return cs;
  }

  /**
   * Walks the live tree and its clone in parallel.
   *
   * @param {Element} src
   * @param {Element} dst
   * @param {CSSStyleDeclaration|null} parentCS
   * @param {Element} editor
   * @param {{nodes: number}} stats
   * @returns {void}
   */
  function walk(src, dst, parentCS, editor, stats) {
    const cs = inlineOne(src, dst, parentCS, editor);
    stats.nodes++;
    const sc = src.children;
    const dc = dst.children;
    for (let i = 0; i < sc.length; i++) walk(sc[i], dc[i], cs, editor, stats);
  }

  /**
   * Replaces every image `src` with a data URI.
   *
   * Essential: Canvas visuals are served from presigned S3 URLs that expire
   * within hours. An archive that keeps the URL is wrong on a delay — it looks
   * fine today and shows empty frames in two days.
   *
   * @param {Element} clone
   * @returns {Promise<{inlined: number, failed: number, bytes: number}>}
   */
  async function inlineImages(clone) {
    const imgs = [...clone.querySelectorAll('img')];
    let inlined = 0;
    let failed = 0;
    let bytes = 0;

    await Promise.all(imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      try {
        // `same-origin` and not `include`: cookies go to preply.com, needed for
        // /files/…, but not to S3, where a credentialed request would be
        // rejected by CORS even though the URL is already signed.
        const res = await fetch(new URL(src, location.href).href, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const url = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result);
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(blob);
        });
        img.setAttribute('src', url);
        bytes += url.length;
        inlined++;
      } catch (e) {
        img.setAttribute('data-pca-unreachable', src);
        failed++;
        console.warn('[pca] image not fetched', src, e);
      }
    }));

    return { inlined, failed, bytes };
  }

  /**
   * Serialises the editor into standalone HTML.
   *
   * @param {Element} [editor] - defaults to the first `[data-qa-id="text-editor"]`.
   * @returns {Promise<{html: string, stats: object}>}
   * @throws {Error} when no editor is present in the document.
   */
  async function pcaSerialize(editor) {
    const root = editor || document.querySelector(EDITOR_SEL);
    if (!root) throw new Error(`no ${EDITOR_SEL} in this document`);

    const clone = root.cloneNode(true);
    const stats = { nodes: 0 };

    walk(root, clone, null, root, stats);

    // The width of the text column decides where lines break. It is carried as
    // `max-width` rather than `width`: the archive frames like Preply on a wide
    // screen, and stays able to shrink.
    const rootWidth = getComputedStyle(root).width;
    if (rootWidth && rootWidth !== 'auto') clone.style.maxWidth = rootWidth;

    const images = await inlineImages(clone);

    if (sandbox) { sandbox.remove(); sandbox = null; defaultsCache.clear(); }

    const html = clone.outerHTML;
    return {
      html,
      stats: {
        ...stats,
        images,
        bytes: html.length,
        fonts: [...new Set([...clone.querySelectorAll('[style*="font-family"]')]
          .map((e) => e.style.fontFamily))].slice(0, 10),
      },
    };
  }

  window.pcaSerialize = pcaSerialize;

  // --- console harness: produces a downloadable preview for comparison.
  pcaSerialize().then(({ html, stats }) => {
    const page = `<!doctype html><html lang="pl"><head><meta charset="utf-8">
<title>Faithful preview — ${document.title}</title>
<style>body{margin:0;background:#f4f4f8}
main{max-width:900px;margin:24px auto;padding:32px;background:#fff;
  border:1px solid #dcdce5;border-radius:12px}
@media print{body{background:#fff}main{max-width:none;margin:0;padding:0;border:0}}
</style></head><body><main>${html}</main></body></html>`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([page], { type: 'text/html' }));
    a.download = 'preply-canvas-fidele.html';
    a.click();
    console.log('[pca] serialisation complete', stats);
  }).catch((e) => console.error('[pca] failed', e));
})();
