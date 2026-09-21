# CLAUDE.md — working rules for this repository

Browser extension that archives the Canvas pages of a Preply lesson and reads
them back outside class hours. Firefox is the primary target; Chrome is a port
built from the same source, and Microsoft Edge takes the Chrome package
unchanged. Three listings, two packages, one source.

**Read `context.md` before touching architecture, and `src/context.md` before
editing any file under `src/`.** Update both when a change affects them.

## Doctrine

The personal-project doctrine ("à ma sauce") applies to this repository. The
deviations below are deliberate and take precedence over it.

| Rule | Status here |
|---|---|
| Fully containerised | **Deviation.** No toolchain exists — no npm, no bundler, no build step for the code itself. Docker is used once, on demand, to rasterise `logo.svg` into the PNG sizes Chrome requires. Nothing is installed on the host. |
| Enforced JSDoc types | **Partial.** `jsconfig.json` sets `checkJs`, so the editor checks our own code. There is no blocking `typecheck` step — a conscious choice, not an oversight. Extension APIs are typed `any` in `src/globals.d.ts` to avoid an npm dependency. |
| Storage key prefix | Keys are prefixed `pca:`, after the product initials. The prefix is frozen: renaming it would orphan every archive already stored, for no user-visible gain. |
| UI language | The interface is localised (`src/_locales/`), not English-only. Code, comments and docs are English. |
| Vue, Fastify, Tailwind | Not applicable. This is a zero-dependency extension: plain DOM, plain CSS. |

## Hard rules

- **Never commit.** Suggest a Conventional Commits message at a milestone; the
  author runs it.
- **No dependency may be added** without an explicit decision. The absence of a
  toolchain is a feature of this project, not an accident.
- **Never anchor on Preply's CSS classes.** They are content-hashed per build
  (`ButtonBase--variant-ghost__ezCgl`, `_CanvasLayout_5ah64_13`) and so are the
  CSS custom properties they reference (`var(--255ddc)`). Anchor only on
  `[data-qa-id]`, `[data-testid]` and `[data-preply-ds-component]`, or resolve
  values from the live DOM at runtime.
- **Snapshots stay whole and independent.** No delta chains, no shared bases. A
  corrupted snapshot must cost one version, never the history after it.
- **Accessibility is not optional** and overrides visual preference. Known
  deviations are listed in `context.md`; do not add new ones silently.

## Versioning

Semantic versioning, with one adjustment: **the compatibility surface is
`storage.local`, not a public API.** Nobody calls this code; what users own is
their archive. A key renamed or a payload reshaped without a migration destroys
it, and that is what earns a major bump.

| Change | Bump |
|---|---|
| Storage layout changed with no migration path | major |
| Visible feature, new locale, new permission | minor |
| Fix, styling, translation, documentation | patch |
| Preply selector repaired after one of their deployments | patch, released quickly |

While the version stays `0.x`, the storage format is explicitly unstable and a
minor bump may still break archives. Say so in the release notes when it does.

**The version string must be one to four dot-separated integers**, each below
65536. Chrome accepts nothing else — no `-beta`, no `+build`, no leading zeros,
and Edge enforces the same rule, being the same engine. Firefox is more
permissive, but one format for all three stores costs nothing.

`src/manifest.json` and `src/manifest.chrome.json` must always carry the same
version. The release workflow refuses to build when they disagree, or when the
tag does not match them.

## Generated files — never edit by hand

| File | Regenerate with |
|---|---|
| `src/icons.js` | `bash tools/build-icons.sh` (sources: `assets/phosphor/*.svg`) |
| `src/icons/logo-*.png` | one-off Docker run, see `context.md` |
| `docs/index.html`, `docs/<lang>/index.html`, `docs/sitemap.xml` | `bash tools/build-pages.sh` (sources: `tools/pages/`) |
| `dist/**` | `bash tools/package.sh` |

## Verification

There is no unit test suite and none is wanted. Verify at behaviour level:
load the extension, archive a page during a lesson, read it back, print it.
Nothing in this repository has ever been executed by an agent — every change is
unverified until the author loads it in a browser and reads the console.
