#!/usr/bin/env bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# Regenerates the landing page in every language — docs/index.html,
# docs/<lang>/index.html — and docs/sitemap.xml, from tools/pages/.
#
# Node runs in a throwaway container: nothing is installed on the host, and the
# script needs no package.
#
# Usage, from the project root:  bash tools/build-pages.sh
set -euo pipefail

cd "$(dirname "$0")/.."

# Git Bash hands Docker a POSIX path it cannot mount; pwd -W gives the Windows one.
here=$(pwd -W 2>/dev/null || pwd)

MSYS_NO_PATHCONV=1 docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$here:/w" -w /w \
  node:lts-alpine node tools/pages/build.js
