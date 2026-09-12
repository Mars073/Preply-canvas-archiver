# Build instructions

For Mozilla add-on reviewers, and for anyone reproducing the packages.

## Requirements

- **Operating system:** any Unix-like system. Verified on Debian 12 and on
  Windows 11 through Git Bash.
- **Programs:** `bash` (4.0 or later) and the POSIX tools it comes with —
  `sed`, `awk`, `grep`, `printf`, `cp`, `mkdir`. Plus one of `zip` (any
  version) or PowerShell 5.1, whichever is present.

  On the PowerShell path the script does **not** use `Compress-Archive`:
  PowerShell 5.1 writes `\` as the entry separator, which the ZIP format
  forbids — APPNOTE 4.4.17.1 requires `/` — and which yields a package a store
  may reject or extract flat. The entries are written one at a time through
  `System.IO.Compression` with normalised names instead. Nothing has to be
  installed for that; it ships with Windows.
- **No `node`, no `npm`, no bundler, no transpiler, no minifier.** There is no
  package manager step and no dependency to install. The JavaScript that ships
  is the JavaScript in this repository.

## Reproducing the submitted packages

From the repository root:

```sh
bash tools/build-icons.sh   # regenerates src/icons.js
bash tools/package.sh       # writes dist/*.zip
```

Two packages come out. `dist/preply-canvas-archiver-firefox-<version>.zip` is
the file submitted to addons.mozilla.org; the `-chrome-` one goes to both the
Chrome Web Store and Microsoft Edge Add-ons, which take the same MV3 package
unchanged.

`tools/package.sh` copies `src/` verbatim, minus `manifest.chrome.json`,
`globals.d.ts` and `context.md`, and adds `THIRD-PARTY.md` and `LICENSE`. It
compiles nothing.

## The one generated file

`src/icons.js` is the only file in the package that a tool produces, which is
why this source archive is submitted at all.

`tools/build-icons.sh` reads every `assets/phosphor/*.svg`, extracts the `<path>`
data, and re-emits it with `fill="currentColor"` in place of Phosphor's
hardcoded `fill="#000000"`, so each icon inherits the colour of its button. It
is generated rather than hand-copied because a typo inside a path several
hundred characters long is invisible and undebuggable.

The output is plain, readable JavaScript: one exported object of SVG strings.
It is not minified, concatenated or transpiled. Running the script on an
unmodified checkout reproduces `src/icons.js` byte for byte.

Icon paths are Phosphor Icons, © 2023 Phosphor Icons, MIT licensed. The full
notice is in `THIRD-PARTY.md`, shipped inside every package.

## Everything else

Every other file in `src/` is hand-written and ships unchanged. `viewer.js` and
`content.js` in particular are the original sources, commented and annotated
with JSDoc; the validator's `unknownMinifiedFiles` heuristic misreads them.
