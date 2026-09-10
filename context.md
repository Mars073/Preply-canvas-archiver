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
  reads the thumbnail bar order          diffs it against the previous one
  fetches the tutor avatar
        │  runtime.sendMessage
        ▼
background.js  ──►  storage.local  ──►  storage.onChanged  ──►  viewer refresh
```

The viewer never talks to Preply, and the content script never reads storage.
Everything crosses through the background, which owns every write.

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

It is paid for twice, and both are handled by feature detection rather than
by raising the floor:

- `zoom` arrives in Firefox 126. Below it the zoom group hides itself
  (`CSS.supports`) rather than offering three dead buttons.
- `storage.local.getBytesInUse` arrives in Firefox 144. Below it the footer
  shows the snapshot count with no size, since the only figure that could be
  computed instead would be wrong in the reassuring direction.

Raising the floor would buy those two back and cost every ESR user. If it is
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

One source, two packages. `tools/package.sh` copies `src/` and swaps the
manifest: Firefox uses `manifest.json` directly — so `src/` can be loaded as-is
during development — while Chrome gets `manifest.chrome.json` renamed. The
divergences are `background.scripts` vs `service_worker`, SVG vs PNG icons, and
the `browser_specific_settings` key.

## Known gaps

- **Nothing here has ever been executed by an agent.** Every change is
  unverified until loaded in a browser.
- **The capture path has never run end to end since the restructuring.** The
  viewer is verified in Firefox and in Chrome, on 0.1.2, loaded from
  `dist/chrome/`: it opens, renders and localises. Button injection, capture,
  page order, avatar and image harvesting have not been exercised in either
  browser — they all need a live lesson, which is the one thing no test here
  can fake.
- **`tools/serialize.js` is not wired in.** It inlines every computed style, not
  colours alone, which would raise fidelity further. `cloneEditor()` handles
  colours and images; the rest awaits a console test during a lesson.
- **Accessibility deviations**, deliberate and documented: non-text contrast
  below 3:1 on control borders (WCAG 1.4.11), no reflow at 320 px (1.4.10), and
  diff additions signalled by colour alone (1.4.1).
- **Retroactive archiving is impossible.** Only pages visited while the
  extension is active can be captured, and snapshots taken before images were
  content-addressed still point at URLs that expired long ago.
