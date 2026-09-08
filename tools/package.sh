#!/usr/bin/env bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# Builds the Firefox and Chrome packages into dist/.
#
# The only processing is picking a manifest: both browsers require a file named
# manifest.json, and the two manifests diverge on three points (background
# scripts vs service_worker, SVG vs PNG icons, the gecko key). Everything else
# in src/ is copied verbatim — no bundler, no transformation.
#
# Usage, from the project root:  bash tools/package.sh
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(grep -m1 '"version"' src/manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo "version $VERSION"

for target in firefox chrome; do
  out="dist/$target"
  rm -rf "$out"
  mkdir -p "$out"

  # All of src/ except the Chrome manifest, laid down afterwards under its final
  # name, and the type declarations, which are for the editor only.
  for entry in src/*; do
    case "$(basename "$entry")" in
      manifest.chrome.json|globals.d.ts) continue ;;
      *) cp -r "$entry" "$out/" ;;
    esac
  done
  if [ "$target" = chrome ]; then cp src/manifest.chrome.json "$out/manifest.json"; fi

  # Legal notices travel with the package, not only with the repository. The MIT
  # licence of the embedded icon paths requires its notice to accompany every
  # copy, and a published .xpi or .crx is a copy. LICENSE is copied when it
  # exists — the project has not chosen one yet.
  cp THIRD-PARTY.md "$out/"
  [ -f LICENSE ] && cp LICENSE "$out/"

  # Both packages carry the SVG and the PNGs. The PNGs are useless to Firefox
  # and weigh 23 KB: that surplus buys a single build path, and logo.svg is the
  # viewer's favicon in both browsers anyway.
  echo "  $out ready ($(find "$out" -type f | wc -l) files)"

  archive="dist/preply-canvas-archiver-$target-$VERSION.zip"
  rm -f "$archive"
  if command -v zip >/dev/null 2>&1; then
    (cd "$out" && zip -qr "../../$archive" .)
    echo "  $archive"
  elif command -v powershell.exe >/dev/null 2>&1; then
    # Windows fallback: Git Bash ships no zip, but Compress-Archive exists.
    MSYS_NO_PATHCONV=1 powershell.exe -NoProfile -Command \
      "Compress-Archive -Path '$out/*' -DestinationPath '$archive' -Force" >/dev/null
    echo "  $archive"
  else
    echo "  (no zip available: the $out folder is ready to load as-is)"
  fi
done
