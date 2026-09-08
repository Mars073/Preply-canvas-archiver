# src/context.md — the shipped package

Everything in this folder ends up in both packages, except the two files
`tools/package.sh` filters out (`manifest.chrome.json`, `globals.d.ts`).
Read `../context.md` first for architecture and stored data.

## File map

| File | Role | Loaded in |
|---|---|---|
| `manifest.json` | Firefox manifest, and the one loaded during development | — |
| `manifest.chrome.json` | Chrome overrides, renamed at packaging | — |
| `i18n.js` | `t()`, `tn()`, `applyI18n()`, `tutorFromTitle()` | content script + viewer |
| `icons.js` | **generated** — Phosphor paths, `icon()`, `paintIcons()` | content script + viewer |
| `content.js` | button injection, capture, page order, avatar | Preply pages |
| `background.js` | the only writer to `storage.local` | service worker / event page |
| `viewer.html` / `viewer.js` | the archive reader | extension page |
| `globals.d.ts` | loose types so `checkJs` runs with no dependency | editor only |

Load order matters: `i18n.js` comes first everywhere, because `content.js` calls
`t()` while building its button and `viewer.js` calls it while wiring handlers.

## Preply selectors

Never anchor on a CSS class. These are the stable hooks, all verified against a
live lesson:

| Selector | Used for |
|---|---|
| `[data-qa-id="canvas-toolbar"]` | injection point — the button goes in its **parent**, a `space-between` flex, so it settles right |
| `[data-qa-id="text-editor"] .ProseMirror` | the document itself |
| `[data-qa-id="canvas-thumbnail"]` | page order, via the ancestor's `data-index` |
| `[data-qa-id="canvas-thumbnail"] a[data-active="true"]` | current page number |
| `[data-preply-ds-component="IconButton"]` | button cloned for its styling |
| `[data-preply-ds-component="Avatar"] img` | tutor avatar |

## Adding or changing a string

1. Add the key to **`_locales/en/messages.json`** — it is the reference and the
   `default_locale`.
2. Mirror it into the five others: `fr`, `es`, `ru`, `pl`, `zh_CN`.
3. Use it: `data-i18n` / `-label` / `-title` / `-placeholder` in the markup,
   `t('key', [subs])` in code.

For anything that varies with a count, use **`tn('key', n, [extra])`** and
declare the forms each language needs: `_one`/`_other` for en, fr, es;
`_one`/`_few`/`_many`/`_other` for ru and pl; `_other` alone for zh_CN. The
extension i18n API has no plural support — `tn()` asks `Intl.PluralRules` and
falls back to `_other`, which every locale must define.

Placeholders are positional: `$1` is the count in `tn()`, extras start at `$2`.

Cross-check keys before shipping:

```sh
grep -ohE "(^|[^A-Za-z])tn?\('[a-zA-Z]+'" viewer.js content.js i18n.js
grep -ohE 'data-i18n[a-z-]*="[a-zA-Z]+"' viewer.html
```

## viewer.js, in reading order

Preferences and caches (`prefs`, `labels`, `avatars`, `order`) — utilities
(`announce`, `fmt`, `fold`, `blockNodes`) — model (`loadModel`, `pagesOf`) —
rendering (`renderRooms`, `renderPages`, `showSnapshot`, `renderHistory`) —
diff (`diffLines`, `applyDiff`) — selection (`selectRoom`, `selectPage`,
`refresh`) — controls (history panel, menu, focus mode, rename, zoom) — live
updates — boot.

Two invariants worth keeping in mind:

- **`blockNodes()` is the single source of block splitting.** Search and diff
  both align lines to DOM nodes by position; two diverging walks would silently
  shift every diff marker.
- **`setHistory()` is the only way to open or close the history panel.** Three
  paths lead there — button, close icon, `Escape` — and two of them once forgot
  to re-render the document, leaving diff marks on a closed panel.

## Editing the CSS

Everything lives in the `<style>` block of `viewer.html`; there is no separate
stylesheet and no preprocessor. Tokens sit in `:root`: the palette is Preply's
own, extracted from their design tokens, and `--doc-width` / `--doc-pad-x`
reproduce their text column. Changing those two changes where lines break, so
the archive stops matching the source.

`[hidden]{display:none !important}` near the top is load-bearing: several ids
set `display`, and an id selector beats the user-agent `[hidden]` rule.
