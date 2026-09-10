# Privacy

Preply Canvas Archiver has no server, no account and no analytics. Nothing
leaves your browser on its own. One thing can leave it if you decide to send
it — an error report — and that is described below.

## What it stores

Everything is written to your browser's local extension storage, on your own
machine:

- the HTML of the Canvas pages you archive, and every version you keep;
- the lesson title, tutor name, page number and timestamps that come with them;
- your tutor's avatar image, copied into local storage so the archive still
  displays offline;
- your own preferences: zoom level, the classroom and page you were last
  reading, which panel you had open, and any page you renamed.

## What it sends

Nothing automatically. There is no outbound request to any server owned by this
project, because there is no such server.

The only network traffic the extension causes by itself goes to `preply.com`,
while you are already on a lesson page: it downloads the images shown in your
Canvas and your tutor's avatar, so they can be stored alongside the text. Those
are requests to a site you are already logged into and already viewing.

## Reporting an error

When something fails, the archive viewer shows what went wrong and offers a
**Report** link. Nothing is transmitted when it appears.

Following that link opens a new GitHub issue with three things filled in: the
extension version, your browser's user-agent string, and the error message with
its stack trace. It carries no archived content — no lesson text, no page name,
no tutor name.

It opens as a **draft**. You can read it, edit it and close the tab without
sending anything. An error message can occasionally contain an internal
identifier of one of your pages, which is exactly why it is opened for review
rather than submitted for you.

If you never follow that link, nothing is sent.

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
<https://github.com/Mars073/Preply-canvas-archiver/issues>.
