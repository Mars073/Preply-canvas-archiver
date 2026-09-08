#!/usr/bin/env bash
# Assemble les paquets Firefox et Chrome dans dist/.
#
# Le seul traitement est le choix du manifeste : les deux navigateurs exigent un
# fichier nomme manifest.json, et leurs manifestes divergent sur trois points
# (background scripts vs service_worker, icones SVG vs PNG, cle gecko). Le reste
# de src/ est copie tel quel — aucun bundler, aucune transformation.
#
# Usage, depuis la racine du projet :  bash tools/package.sh
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(grep -m1 '"version"' src/manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo "version $VERSION"

for target in firefox chrome; do
  out="dist/$target"
  rm -rf "$out"
  mkdir -p "$out"

  # Tout src/ sauf les manifestes, qui sont poses ensuite sous leur nom final.
  for entry in src/*; do
    case "$(basename "$entry")" in
      manifest.chrome.json|globals.d.ts) continue ;;
      *) cp -r "$entry" "$out/" ;;
    esac
  done
  if [ "$target" = chrome ]; then cp src/manifest.chrome.json "$out/manifest.json"; fi

  # Les deux paquets embarquent SVG et PNG. Les PNG sont inutiles a Firefox et
  # pesent 23 Ko : on accepte ce surplus pour garder un chemin de build unique,
  # et parce que logo.svg sert de favicon au viewer dans les deux navigateurs.
  echo "  $out prêt ($(find "$out" -type f | wc -l) fichiers)"

  archive="dist/preply-canvas-archiver-$target-$VERSION.zip"
  rm -f "$archive"
  if command -v zip >/dev/null 2>&1; then
    (cd "$out" && zip -qr "../../$archive" .)
    echo "  $archive"
  elif command -v powershell.exe >/dev/null 2>&1; then
    # Repli Windows : pas de zip dans Git Bash, mais Compress-Archive existe.
    MSYS_NO_PATHCONV=1 powershell.exe -NoProfile -Command \
      "Compress-Archive -Path '$out/*' -DestinationPath '$archive' -Force" >/dev/null
    echo "  $archive"
  else
    echo "  (pas de zip disponible : le dossier $out est prêt à charger tel quel)"
  fi
done
