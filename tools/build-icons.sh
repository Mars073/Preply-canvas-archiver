#!/usr/bin/env bash
# Regenerates src/icons.js from assets/phosphor/*.svg.
#
# Phosphor files carry a hardcoded fill="#000000". The paths are extracted here
# and re-emitted with fill="currentColor", so every icon takes the colour of its
# button. Generated rather than hand-copied: on paths several hundred characters
# long, a typo is invisible and undebuggable.
#
# Usage, from the project root:  bash tools/build-icons.sh
set -euo pipefail

cd "$(dirname "$0")/.."

{
printf '%s\n' "/**"
printf '%s
' " * Phosphor Icons, generated from assets/phosphor/*.svg."
printf '%s
' " *"
printf '%s
' " * Icon paths: Copyright (c) 2023 Phosphor Icons, MIT licensed."
printf '%s
' " * Full notice in THIRD-PARTY.md at the repository root."
printf '%s\n' " *"
printf '%s\n' " * DO NOT EDIT BY HAND: rerun tools/build-icons.sh after adding or replacing"
printf '%s\n' " * a file in assets/phosphor/."
printf '%s\n' " */"
printf '%s\n' ""
printf '%s\n' "const ICON_NS = 'http://www.w3.org/2000/svg';"
printf '%s\n' ""
printf '%s\n' "/** @type {Record<string, string>} Phosphor name -> the path d attribute. */"
printf '%s\n' "const ICON_PATHS = {"
for f in assets/phosphor/*.svg; do
  name=$(basename "$f" .svg)
  d=$(grep -o 'd="[^"]*"' "$f" | sed 's/^d="//; s/"$//')
  printf "  '%s': '%s',\n" "$name" "$d"
done
printf '%s\n' "};"
printf '%s\n' ""
printf '%s\n' "/**"
printf '%s\n' " * Builds an inline, decorative icon."
printf '%s\n' " *"
printf '%s\n' " * @param {string} name - key of ICON_PATHS."
printf '%s\n' " * @returns {SVGSVGElement}"
printf '%s\n' " * @throws {RangeError} when the name matches no icon."
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
printf '%s\n' " * Fills in the icons of every element carrying data-icon, without duplicates."
printf '%s\n' " *"
printf '%s\n' " * Markup declares the name, the script supplies the path: no SVG is copied"
printf '%s\n' " * into viewer.html."
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

printf 'src/icons.js regenerated: %s icons\n' "$(ls assets/phosphor/*.svg | wc -l)"
