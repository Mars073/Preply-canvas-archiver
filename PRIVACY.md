# Privacy

Preply Canvas Archiver has no server, no account and no analytics. Nothing you
do with it is sent anywhere.

## What it stores

Everything is written to your browser's local extension storage, on your own
machine:

- the HTML of the Canvas pages you archive, and every version you keep;
- the lesson title, tutor name, page number and timestamps that come with them;
- your tutor's avatar image, copied into local storage so the archive still
  displays offline;
- your own preferences: zoom level, last opened page, panel state, and any page
  you renamed.

## What it sends

Nothing. There is no outbound request to any server owned by this project,
because there is no such server.

The only network traffic the extension causes is to `preply.com` itself, while
you are already on a lesson page: it downloads the images shown in your Canvas
and your tutor's avatar, so they can be stored alongside the text. Those are
requests to a site you are already logged into and already viewing.

## Permissions, and why

| Permission | Reason |
|---|---|
| `preply.com` host access | read the Canvas of the lesson page in order to archive it |
| `storage` | keep the archive in your browser |
| `unlimitedStorage` | one lesson accumulates dozens of HTML versions |

## Removing your data

Uninstalling the extension deletes everything it stored. You can also delete a
single version, or a page and all its versions, from the archive viewer.

## Contact

Open an issue at
<https://github.com/Mars073/preply-canvas-archiver/issues>.
