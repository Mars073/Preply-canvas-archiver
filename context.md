# context.md — architecture and decisions

Companion to `CLAUDE.md`, which holds the working rules. This file holds what
the code cannot say about itself: why it is shaped this way, and what was
learned about Preply along the way.

## Data flow

```
Preply lesson page                     extension pages
──────────────────                     ───────────────
content.js                             viewer.html + viewer.js
  reads .ProseMirror                     rebuilds the model from the index
  resolves computed colours              renders one snapshot at a time
  strips widgets and executables         diffs it against the previous one
  reads the thumbnail bar order        crash.js
  fetches the tutor avatar               catches what nobody else did
  prints through an isolated frame       loaded first, guards the rest
        │  runtime.sendMessage
        ▼
background.js  ──►  storage.local  ──►  storage.onChanged  ──►  viewer refresh
```

The viewer never talks to Preply, and the content script never reads storage.
The archive itself — index, snapshots, order, avatars, images — is written by
the background alone, serialised, since `storage.local` offers no transaction
and two writers would each rewrite an index built before the other's change.
The viewer writes only its own two keys, `pca:labels` and `pca:prefs`, which
nothing else touches.

## Storage layout

| Key | Shape | Owner |
|---|---|---|
| `pca:index` | `[{key, canvasId, classroomId, page, title, ts, chars}]`, newest first | background |
| `pca:snap:<canvasId>:<ts>` | one snapshot `{html, title, url, course, page, ts, …}` | background |
| `pca:order` | `{classroomId: {canvasId: {index, num}}}` | background |
| `pca:avatars` | `{classroomId: dataUri}` | background |
| `pca:labels` | `{canvasId: name}` — user-chosen page names | viewer |
| `pca:prefs` | `{zoom, roomId, pageId, focus}` | viewer |
| `pca:img:<sha256>` | one captured image, as a data URI | background |

Four things live outside snapshots on purpose: **order**, **avatars**,
**labels** and **images** belong to a page, a classroom or the archive at large,
not to a dated version. Storing them per snapshot would duplicate kilobytes
across dozens of versions. Images are keyed by content hash and swept when no
snapshot refers to them any more.

## What was learned about Preply

Facts established by inspecting a live lesson, not assumed:

- **The "Canvas" is not an HTML canvas.** It is a Tiptap/ProseMirror document
  synchronised over Yjs. The content is plain DOM with inline styles.
- **Each Canvas page is a distinct `canvasId`.** A classroom URL looks like
  `/edu/<language>/classroom-v2/<classroomId>/canvas/<canvasId>`. Nothing in a
  page says where it sits in the sequence.
- **Only the thumbnail bar knows the page order**, through `data-index`, and it
  is virtualised: a reading sees the visible window alone.
- **Colours are obfuscated tokens** (`var(--0d2c1d)`) defined in Preply's own
  stylesheet, so a captured document is meaningless without resolving them.
- **The editor renders in Figtree at 20 px** over a 1089 px text column.
- **The tutor's name exists only inside a localised sentence** — "Salle de
  classe avec Paula", "Classroom with Paula" — never as data.
- **The live cursors of the other participants are inside the document.** Yjs
  and Tiptap render one ProseMirror widget decoration per connected peer,
  carrying that person's name in a label, and it sits between two words of
  the paragraph being edited. Captured as-is it becomes part of the archive:
  the tutor's name mid-sentence, and, being real text, in the page list, the
  search excerpts and every diff. Stripped at capture, and again on display so
  archives taken before that keep reading correctly.
- **Not every Preply class is hashed.** The layout wrappers are
  (`_TextEditorLayout_1mqtd_3`, `StyledEditorContentCore-sc-54cab196-0`), but
  `TipTapEditor` and `CanvasThumbnailScreenshotTarget` are written by hand and
  survive a build. They are worth a **second** alternative behind a
  `data-qa-id`, never a first: surviving a build is not surviving a rename,
  and only the data attributes are declared as test hooks.
- **`.ProseMirror-widget` and `collaboration-carets__*` are the exception to the
  rule below.** They come from ProseMirror and from the Tiptap collaboration
  extension, not from Preply's build, so they are stable and safe to anchor on.
- **CSS classes and CSS variable names are content-hashed per build.** Anchor on
  `data-qa-id`, `data-testid`, `data-preply-ds-component`, or resolve from the
  live DOM.

## Design decisions

**Whole snapshots, never deltas.** Git itself stores whole objects and only
packs deltas as a later optimisation; the "git is diffs" model is wrong. At
~16 KB per version, storage is a non-problem — roughly 13 MB a year at three
lessons a week. A delta chain would make every version depend on all previous
ones, which is the opposite of what an archive should guarantee.

**The diff is a view, not a format.** It is recomputed on every render from two
whole snapshots and thrown away. It appears only while the history panel is
open.

**Computed styles are resolved at capture time**, never referenced. The same
principle covers colours, the archive button's styling — cloned from a live
Preply button rather than copied by class name — and images, inlined as data
URIs because Preply's asset URLs are presigned and expire.

**An archived document is allowlisted, not scrubbed.** `sanitize.js` is the
one definition, loaded by the content script and the viewer alike, and applied
at capture and again on display, so archives taken under an older rule are
covered too. Elements, attributes and URL schemes survive only if named;
an unknown element is unwrapped rather than dropped, because Preply may add a
node to its editor at any deployment and losing its text would be worse than
losing its tag. Only containers that are dangerous or empty without their tag
(`script`, `style`, `iframe`, `svg`, `form`…) go whole. CSS is the one
denylist: inline styles carry the archive's look in Preply's own vocabulary,
so only what could position content over the viewer or fetch (`url()`,
`image-set()`) is removed.

The viewer parses stored markup with `DOMParser`, which is inert: markup
assigned to an element of the live page starts loading its images and fires
handlers before any cleaning runs. Image sources other than `data:image/` are
kept only at capture, where they still have to be downloaded, and in the print
frame; on display the viewer reaches no network. Links open in a new tab, and
only `http`, `https` and `mailto` survive — a `javascript:` link was the hole
the denylist left, live in a standalone export opened outside any policy. The
print frame is the other place with no extension CSP behind it: its srcdoc is
parsed under Preply's.

**Quick print goes through an isolated frame.** The clone is handed to an iframe
by `srcdoc` and that frame is printed. Never `document.open()`: a content script
writing into a frame that inherits the page origin is refused as insecure.
Printing Preply's page instead would have meant hiding their whole interface
with a stylesheet written against their markup, which is the trade this add-on
refuses everywhere else.

**The document styling is measured, not chosen.** Both the viewer and the print
sheet carry what Preply gives the document and a bare clone cannot inherit —
block margins, list indentation, cell padding, header tint. Every value came
from comparing computed styles between a live Canvas and the rendered archive.
The ones invented before were all wrong, and the interface's own `ul` reset had
been eating every bullet in every lesson.

**Panels move with `transform`, and focus moves with `preventScroll`.** Only
`transform` and `opacity` are animated, because they are painted after layout
and so cannot shift anything else. The trap is elsewhere: moving focus into a
panel that is still travelling makes the browser scroll an ancestor to bring
the focused element into view. `#main` carries `overflow:hidden`, which makes
it a scroll container even though it shows no bar, so the whole page slid
sideways on every history toggle. Any focus sent into an animated panel needs
`focus({ preventScroll: true })`.

**The document is swapped whole.** `showSnapshot()` builds it in a detached
node, resolves its images there, and hands it over in one `replaceChildren()`.
Assigning `innerHTML` first and awaiting the images afterwards paints a
document whose images have no height yet, which changes the page height and
moves the scrollbar. For the same reason the scrollbar gutter is reserved with
`overflow-y:scroll` rather than left to `auto`.

**Firefox 115 is the floor, for the ESR.** Nothing in the code needs it: the
newest DOM API used is `replaceChildren`, from Firefox 78, and MV3 itself
settles the rest. 115 is a deliberate reach down to the extended-support
release, so an add-on about keeping lesson notes still installs on a machine
someone else administers.

It is paid for three times, and each is handled by detection rather than by
raising the floor:

- MV3 host permissions are granted at install only from Firefox 127, and every
  browser lets the user withdraw them later. Without them the content script
  is never injected and the Preply page shows nothing. The background marks
  the toolbar icon with a badge, opens the viewer on a first install without
  access, and the viewer shows a notice whose button calls
  `permissions.request()` — from the click itself, which the API requires.

- `zoom` arrives in Firefox 126. Below it the zoom group hides itself
  (`CSS.supports`) rather than offering three dead buttons.
- `storage.local.getBytesInUse` arrives in Firefox 144. Below it the footer
  shows the snapshot count with no size, since the only figure that could be
  computed instead would be wrong in the reassuring direction.

Raising the floor would buy the last two back — not the first, since a
withdrawn permission happens on any version — and cost every ESR user. If it is
ever raised, it should be because something cannot be detected and degraded,
not to tidy away a warning.

**`zoom`, not `font-size`.** Archived content carries inline `font-size: 20px`
from Preply, which a typographic zoom would leave untouched. `zoom` scales every
computed length, column width included, so line breaks stay where Preply put
them.

**`storage.local`, not `localStorage`.** A temporary add-on gets a fresh UUID on
every load, hence a fresh origin and an empty `localStorage`. `storage.local` is
keyed by extension id and survives.

**`Intl.PluralRules` for counts.** The i18n API has no plural support; Russian
and Polish need three forms. See `src/context.md`.

## Packaging

One source, two packages, three stores. `tools/package.sh` copies `src/` and
swaps the manifest: Firefox uses `manifest.json` directly — so `src/` can be
loaded as-is during development — while Chrome gets `manifest.chrome.json`
renamed. The divergences are `background.scripts` vs `service_worker`, SVG vs
PNG icons, and the `browser_specific_settings` key.

Microsoft Edge Add-ons takes the Chrome package unchanged: Edge is Chromium and
reads the same MV3 manifest, so there is no third build and no third manifest.
What differs per store is the listing, and the extension id — each store derives
its own from its own key, so the three ids have nothing in common.

## Landing page

`docs/` is the GitHub Pages site, generated by `tools/build-pages.sh` from
`tools/pages/`: `style.css`, one module per language (`en.js` is the reference
shape — the build fails when another lacks a field), and `build.js`, which
writes one static page per language and the sitemap.

One URL per language, plain HTML: `/` is English and `x-default`, then `/fr/`,
`/es/`, `/pl/`, `/ru/`, `/zh/`. No script, no redirect, no language detection —
the menu is ordinary links. Every page carries a self canonical and the full,
reciprocal `hreflang` set; the sitemap repeats it. Chinese is Simplified, as the
extension's `zh_CN` locale is, hence `zh-Hans`.

The copy must stay defensible: say a Canvas may be hard to find again, never
that Preply deletes it. The FAQ is visible HTML and mirrored in `FAQPage`
structured data; keep answers to what the extension does.

`docs/robots.txt` is not read by crawlers: a project site lives under
`mars073.github.io/Preply-canvas-archiver/`, and robots rules are only fetched
from the host root. Submit the sitemap in Search Console instead.

## Known gaps

- **Nothing here has ever been executed by an agent.** Every change is
  unverified until loaded in a browser.
- **The capture path has run end to end, in live lessons only.** Firefox and
  Chromium 153 (September 2026): button injection, manual and automatic
  capture, every page of the lesson, images included on Chromium — so the
  presigned image host answers the content script's cross-origin fetch. A
  one-hour lesson produced nine distinct autosaves, so the one-minute quiet
  window does occur during real teaching.

  Still unobserved: whether Preply replaces the editor node when switching
  Canvas page (the observer now follows it either way), and the quick print
  path. Nothing automates any of it.
- **Autosave can lose the last minute of a page.** Opening a page counts as a
  change, so every page visited is archived, not only those edited; an
  automatic capture identical to the page's newest stored version is dropped
  by the background. It waits for a minute without mutation, or three minutes
  after the first unsaved change, whichever comes first. Changes still pending when the reader leaves the page or closes
  the tab are not captured: by then the URL names another page and a detached
  node has no computed style. The manual button is the only guarantee.
- **`tools/serialize.js` is not wired in.** It inlines every computed style, not
  colours alone, which would raise fidelity further. `cloneEditor()` handles
  colours and images; the rest awaits a console test during a lesson.
- **Accessibility deviations**, deliberate and documented: non-text contrast
  below 3:1 on control borders (WCAG 1.4.11), no reflow at 320 px (1.4.10), and
  diff additions signalled by colour alone (1.4.1).

  The two buttons injected into Preply's toolbar report their outcome by
  tinting the icon: green `#19ac91` (about 2.9:1 on white) and yellow `#f6c823`
  (about 1.6:1), below 1.4.11, and colour alone (1.4.1). The accessible name
  changes with it, but nothing announces the change. Accepted: the spinner
  shows the action is running, and the outcome is judged minor next to it.
- **Retroactive archiving is impossible.** Only pages visited while the
  extension is active can be captured, and snapshots taken before images were
  content-addressed still point at URLs that expired long ago.
