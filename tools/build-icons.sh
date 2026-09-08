#!/usr/bin/env bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
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

emit() { printf '%s\n' "$1"; }

{
emit "/* This Source Code Form is subject to the terms of the Mozilla Public"
emit " * License, v. 2.0. If a copy of the MPL was not distributed with this"
emit " * file, You can obtain one at https://mozilla.org/MPL/2.0/. */"
emit ""
emit "/**"
emit " * Phosphor Icons, generated from assets/phosphor/*.svg."
emit " *"
emit " * Icon paths: Copyright (c) 2023 Phosphor Icons, MIT licensed."
emit " * Full notice in THIRD-PARTY.md, shipped inside every package."
emit " *"
emit " * DO NOT EDIT BY HAND: rerun tools/build-icons.sh after adding or replacing"
emit " * a file in assets/phosphor/."
emit " */"
emit ""
emit "const ICON_NS = 'http://www.w3.org/2000/svg';"
emit ""
emit "/** @type {Record<string, string>} Phosphor name -> the path d attribute. */"
emit "const ICON_PATHS = {"
for f in assets/phosphor/*.svg; do
  name=$(basename "$f" .svg)
  d=$(grep -o 'd="[^"]*"' "$f" | sed 's/^d="//; s/"$//')
  printf "  '%s': '%s',\n" "$name" "$d"
done
emit "};"
emit ""
emit "/**"
emit " * Builds an inline, decorative icon."
emit " *"
emit " * @param {string} name - key of ICON_PATHS."
emit " * @returns {SVGSVGElement}"
emit " * @throws {RangeError} when the name matches no icon."
emit " */"
emit "function icon(name) {"
emit "  const d = ICON_PATHS[name];"
emit "  if (!d) throw new RangeError('unknown icon: ' + name);"
emit ""
emit "  const svg = document.createElementNS(ICON_NS, 'svg');"
emit "  svg.setAttribute('viewBox', '0 0 256 256');"
emit "  svg.setAttribute('fill', 'currentColor');"
emit "  svg.setAttribute('aria-hidden', 'true');"
emit "  svg.setAttribute('focusable', 'false');"
emit "  svg.classList.add('icon');"
emit ""
emit "  const path = document.createElementNS(ICON_NS, 'path');"
emit "  path.setAttribute('d', d);"
emit "  svg.appendChild(path);"
emit "  return svg;"
emit "}"
emit ""
emit "/**"
emit " * Fills in the icons of every element carrying data-icon, without duplicates."
emit " *"
emit " * Markup declares the name, the script supplies the path: no SVG is copied"
emit " * into viewer.html."
emit " *"
emit " * @param {ParentNode} [root=document]"
emit " * @returns {void}"
emit " */"
emit "function paintIcons(root = document) {"
emit "  for (const el of root.querySelectorAll('[data-icon]')) {"
emit "    if (el.querySelector('svg.icon')) continue;"
emit "    try {"
emit "      el.prepend(icon(el.dataset.icon));"
emit "    } catch (e) {"
emit "      console.warn('[pca]', e.message);"
emit "    }"
emit "  }"
emit "}"
} > src/icons.js

printf 'src/icons.js regenerated: %s icons\n' "$(ls assets/phosphor/*.svg | wc -l)"
