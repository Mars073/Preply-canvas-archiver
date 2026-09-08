#!/usr/bin/env bash
# Regenere src/icons.js depuis assets/phosphor/*.svg.
#
# Les fichiers Phosphor portent fill="#000000" en dur. On extrait les traces et
# on les re-emet avec fill="currentColor", pour que chaque icone prenne la
# couleur de son bouton. Generation par script et non recopie a la main : sur
# des traces de plusieurs centaines de caracteres, une faute de frappe est
# invisible et indebogable.
#
# Usage, depuis la racine du projet :  bash tools/build-icons.sh
set -euo pipefail

cd "$(dirname "$0")/.."

{
printf '%s\n' "/**"
printf '%s\n' " * Icones Phosphor, generees depuis icons/*.svg."
printf '%s\n' " *"
printf '%s\n' " * NE PAS EDITER A LA MAIN : relancer tools/build-icons.sh apres avoir ajoute"
printf '%s\n' " * ou remplace un fichier dans assets/phosphor/."
printf '%s\n' " */"
printf '%s\n' ""
printf '%s\n' "const ICON_NS = 'http://www.w3.org/2000/svg';"
printf '%s\n' ""
printf '%s\n' "/** @type {Record<string, string>} nom Phosphor -> attribut d du path. */"
printf '%s\n' "const ICON_PATHS = {"
for f in assets/phosphor/*.svg; do
  name=$(basename "$f" .svg)
  d=$(grep -o 'd="[^"]*"' "$f" | sed 's/^d="//; s/"$//')
  printf "  '%s': '%s',\n" "$name" "$d"
done
printf '%s\n' "};"
printf '%s\n' ""
printf '%s\n' "/**"
printf '%s\n' " * Construit une icone inline, decorative."
printf '%s\n' " *"
printf '%s\n' " * @param {string} name - cle de ICON_PATHS."
printf '%s\n' " * @returns {SVGSVGElement}"
printf '%s\n' " * @throws {RangeError} si le nom ne correspond a aucune icone."
printf '%s\n' " */"
printf '%s\n' "function icon(name) {"
printf '%s\n' "  const d = ICON_PATHS[name];"
printf '%s\n' "  if (!d) throw new RangeError('icône inconnue : ' + name);"
printf '%s\n' ""
printf '%s\n' "  const svg = document.createElementNS(ICON_NS, 'svg');"
printf '%s\n' "  svg.setAttribute('viewBox', '0 0 256 256');"
printf '%s\n' "  svg.setAttribute('fill', 'currentColor');"
printf '%s\n' "  svg.setAttribute('aria-hidden', 'true');"
printf '%s\n' "  svg.setAttribute('focusable', 'false');"
printf '%s\n' "  svg.classList.add('icon');"
printf '%s\n' ""
printf '%s\n' "  const path = document.createElementNS(ICON_NS, 'path');"
printf '%s\n' "  path.setAttribute('d', d);"
printf '%s\n' "  svg.appendChild(path);"
printf '%s\n' "  return svg;"
printf '%s\n' "}"
printf '%s\n' ""
printf '%s\n' "/**"
printf '%s\n' " * Insere les icones des elements portant data-icon, sans doublon."
printf '%s\n' " *"
printf '%s\n' " * Le balisage declare le nom, le script fournit le trace : aucun SVG n est"
printf '%s\n' " * recopie dans viewer.html."
printf '%s\n' " *"
printf '%s\n' " * @param {ParentNode} [root=document]"
printf '%s\n' " * @returns {void}"
printf '%s\n' " */"
printf '%s\n' "function paintIcons(root = document) {"
printf '%s\n' "  for (const el of root.querySelectorAll('[data-icon]')) {"
printf '%s\n' "    if (el.querySelector('svg.icon')) continue;"
printf '%s\n' "    try {"
printf '%s\n' "      el.prepend(icon(el.dataset.icon));"
printf '%s\n' "    } catch (e) {"
printf '%s\n' "      console.warn('[pca]', e.message);"
printf '%s\n' "    }"
printf '%s\n' "  }"
printf '%s\n' "}"
} > src/icons.js

printf 'icons.js regenere : %s icones\n' "$(ls assets/phosphor/*.svg | wc -l)"
