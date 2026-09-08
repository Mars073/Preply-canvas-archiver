/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Serialisation haute-fidelite du document Tiptap de Preply.
 *
 * Principe : on n'emporte aucun CSS de Preply. On lit les styles *calcules* sur
 * le DOM vivant et on les ecrit en ligne, mais uniquement les valeurs qui
 * different d'une reference :
 *   - proprietes heritees      -> comparees au parent (sinon tout est duplique)
 *   - proprietes de boite      -> comparees au defaut UA du meme tag, mesure
 *                                 dans une iframe bac a sable
 * Le resultat ne depend plus d'aucune feuille externe.
 *
 * Utilisable tel quel dans la console de la page du cours : le script s'execute
 * et telecharge un apercu. `window.pcaSerialize()` reste disponible ensuite.
 */
(() => {
  const EDITOR_SEL = '[data-qa-id="text-editor"]';

  /** Proprietes heritees : diff contre le parent. */
  const INHERITED = [
    'color', 'font-family', 'font-size', 'font-style', 'font-weight',
    'font-variant', 'font-feature-settings', 'letter-spacing', 'line-height',
    'text-align', 'text-indent', 'text-transform', 'white-space', 'word-spacing',
    'word-break', 'overflow-wrap', 'direction', 'text-decoration-line',
    'text-decoration-color', 'text-decoration-style', 'text-decoration-thickness',
    'text-underline-offset', 'list-style-type', 'list-style-position',
    'border-collapse', 'border-spacing', 'caption-side', 'empty-cells',
  ];

  /** Proprietes de boite : diff contre le defaut UA du meme tag. */
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
   * Tags dont on fige la taille. Ailleurs on s'en abstient : ecrire la largeur
   * calculee d'un <p> gelerait la mise en page a la fenetre de capture.
   */
  const SIZED = new Set(['IMG', 'TABLE', 'TD', 'TH', 'COL', 'COLGROUP', 'VIDEO']);

  /** Ancetres necessaires pour que le defaut UA d'un tag soit juste. */
  const SCAFFOLD = {
    TD: ['TABLE', 'TBODY', 'TR'], TH: ['TABLE', 'THEAD', 'TR'],
    TR: ['TABLE', 'TBODY'], TBODY: ['TABLE'], THEAD: ['TABLE'],
    TFOOT: ['TABLE'], COL: ['TABLE', 'COLGROUP'], COLGROUP: ['TABLE'],
    LI: ['UL'], DT: ['DL'], DD: ['DL'],
  };

  /** Attributs retires du clone : edition, hooks React, classes Preply. */
  const DROP_ATTRS = [
    'contenteditable', 'tabindex', 'spellcheck', 'translate', 'autocorrect',
    'autocapitalize', 'role', 'class', 'srcset', 'sizes', 'loading',
  ];

  /** @type {HTMLIFrameElement|null} */
  let sandbox = null;
  /** @type {Map<string, CSSStyleDeclaration>} */
  const defaultsCache = new Map();

  /**
   * Cree l'iframe bac a sable, calee sur la typographie de l'editeur pour que
   * les marges exprimees en `em` se resolvent aux memes pixels.
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
   * Style calcule d'un element vierge du meme tag, correctement imbrique.
   *
   * @param {string} tag - nom de balise en majuscules.
   * @param {Element} editor
   * @returns {CSSStyleDeclaration|null} `null` si le tag ne peut pas etre instancie.
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
      // Force la resolution avant que le noeud ne soit potentiellement recycle.
      void cs.display;
    } catch {
      cs = null;
    }
    defaultsCache.set(tag, cs);
    return cs;
  }

  /**
   * Ecrit sur `dst` les styles calcules de `src` qui different des references.
   *
   * @param {Element} src - noeud vivant.
   * @param {Element} dst - son clone detache.
   * @param {CSSStyleDeclaration|null} parentCS - style calcule du parent vivant.
   * @param {Element} editor
   * @returns {CSSStyleDeclaration} le style calcule de `src`, pour la recursion.
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
   * Parcourt en parallele l'arbre vivant et son clone.
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
   * Remplace chaque `src` d'image par une data URI.
   *
   * Indispensable : les visuels du Canvas sont servis par des URL S3 presignees
   * qui expirent en quelques heures. Une archive qui garde l'URL est fausse a
   * retardement.
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
        // `same-origin` et non `include` : les cookies partent vers preply.com
        // (necessaires pour /files/...), mais pas vers S3, ou une requete
        // creditee serait rejetee par le CORS alors que l'URL est deja signee.
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
        console.warn('[pca] image non recuperee', src, e);
      }
    }));

    return { inlined, failed, bytes };
  }

  /**
   * Serialise l'editeur en HTML autonome.
   *
   * @param {Element} [editor] - par defaut le premier `[data-qa-id="text-editor"]`.
   * @returns {Promise<{html: string, stats: object}>}
   * @throws {Error} si aucun editeur n'est present dans le document.
   */
  async function pcaSerialize(editor) {
    const root = editor || document.querySelector(EDITOR_SEL);
    if (!root) throw new Error(`aucun ${EDITOR_SEL} dans ce document`);

    const clone = root.cloneNode(true);
    const stats = { nodes: 0 };

    walk(root, clone, null, root, stats);

    // La largeur de la colonne de texte conditionne l'endroit ou les lignes
    // cassent. On l'emporte en `max-width` et non en `width` : l'archive cadre
    // comme chez Preply sur un ecran large, et reste capable de retrecir.
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

  // --- harnais console : produit un apercu telechargeable pour comparaison.
  pcaSerialize().then(({ html, stats }) => {
    const page = `<!doctype html><html lang="pl"><head><meta charset="utf-8">
<title>Aperçu fidèle — ${document.title}</title>
<style>body{margin:0;background:#f4f4f8}
main{max-width:900px;margin:24px auto;padding:32px;background:#fff;
  border:1px solid #dcdce5;border-radius:12px}
@media print{body{background:#fff}main{max-width:none;margin:0;padding:0;border:0}}
</style></head><body><main>${html}</main></body></html>`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([page], { type: 'text/html' }));
    a.download = 'preply-canvas-fidele.html';
    a.click();
    console.log('[pca] serialisation terminee', stats);
  }).catch((e) => console.error('[pca] echec', e));
})();
