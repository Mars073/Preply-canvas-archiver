/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Background — persists snapshots in storage.local and opens the viewer.
 *
 * Storage layout:
 *   'pca:index'                  -> Array<{key, canvasId, classroomId, page, title, ts, chars}>
 *   'pca:snap:<canvasId>:<ts>'   -> one snapshot
 *   'pca:order'                  -> {classroomId: {canvasId: {index, num}}}
 *   'pca:avatars'                -> {classroomId: dataUri}
 *   'pca:img:<sha256>'           -> one captured image, as a data URI
 *
 * Images are content-addressed: the same picture recurs across the versions of
 * a page and often across pages, so it is stored once and referenced from the
 * markup by its hash. Orphans are swept after a deletion.
 */

/**
 * Extension API root.
 *
 * Firefox exposes `browser`, Chrome exposes `chrome`. Under MV3 both return
 * promises for the APIs used here, so an alias is enough — shipping the Mozilla
 * polyfill would mean an npm dependency for three calls.
 *
 * Redeclared in each file rather than shared: Chrome's service worker loads a
 * single script and cannot import a common module without a build step.
 *
 * Prefixed, like the storage keys below, although this file shares its scope
 * with no other at runtime. The editor checks every file under src/ as one
 * global program, and a name declared here and in viewer.js reads there as a
 * redeclaration — noise that would hide the real one, inside a single context,
 * which throws before the second file runs.
 */
const bgApi = globalThis.browser ?? globalThis.chrome;

const BG_INDEX_KEY = 'pca:index';
const BG_ORDER_KEY = 'pca:order';

/**
 * Merges the page order read from the thumbnail bar.
 *
 * Merge rather than replace: Preply's bar is virtualised, so any single reading
 * only holds the thumbnails visible at that moment. Accumulating successive
 * readings completes the order across lessons instead of overwriting it with
 * the latest visible window.
 *
 * @param {string} classroomId
 * @param {{id: string, index: number|null, num: string}[]} entries
 * @returns {Promise<void>}
 */
async function mergeOrder(classroomId, entries) {
  if (!classroomId || !Array.isArray(entries) || entries.length === 0) return;

  const stored = await bgApi.storage.local.get(BG_ORDER_KEY);
  const all = stored[BG_ORDER_KEY] || {};
  const room = all[classroomId] || {};

  for (const e of entries) {
    if (!e || !e.id || !Number.isFinite(e.index)) continue;
    room[e.id] = { index: e.index, num: e.num };
  }

  all[classroomId] = room;
  await bgApi.storage.local.set({ [BG_ORDER_KEY]: all });
}

const BG_IMAGE_PREFIX = 'pca:img:';

/** Matches the hash a captured image was rewritten to. */
const IMAGE_REF = /data-pca-img="([0-9a-f]{64})"/g;

/**
 * Hashes known to be in storage, for as long as this background lives.
 *
 * storage.local cannot say whether a key exists without returning its value,
 * and an image's value is the whole picture: every autosave read megabytes back
 * only to learn they were already there. The background is the only context
 * that writes or removes images, so this set cannot vouch for a picture that is
 * gone. A restart merely empties it, which costs one read.
 *
 * @type {Set<string>}
 */
const storedImages = new Set();

/**
 * Stores captured images, one entry per distinct content hash.
 *
 * Content-addressed rather than inlined into each snapshot: the same picture
 * appears in every version of a page, and often across pages. Keyed by hash it
 * is written once for the whole archive, and an already-known hash costs
 * nothing.
 *
 * @param {Record<string, string>} blobs - hash -> data URI.
 * @returns {Promise<number>} how many were new.
 */
async function saveImages(blobs) {
  const hashes = Object.keys(blobs || {}).filter((h) => !storedImages.has(h));
  if (hashes.length === 0) return 0;

  const keys = hashes.map((h) => BG_IMAGE_PREFIX + h);
  const known = await bgApi.storage.local.get(keys);

  /** @type {Record<string, string>} */
  const fresh = {};
  for (const h of hashes) {
    if (known[BG_IMAGE_PREFIX + h] === undefined) fresh[BG_IMAGE_PREFIX + h] = blobs[h];
  }

  const count = Object.keys(fresh).length;
  if (count > 0) await bgApi.storage.local.set(fresh);
  for (const h of hashes) storedImages.add(h);
  return count;
}

/** How many snapshots are read from storage at once while sweeping. */
const SCAN_BATCH = 25;

/**
 * Drops images the deleted snapshots were the last to refer to.
 *
 * Mark and sweep rather than reference counting: a counter drifts out of step
 * the first time a write fails halfway, and then either leaks forever or
 * deletes a picture still in use. Scanning what remains cannot be wrong.
 *
 * Only the candidates are scanned for, not the whole store. The previous
 * version read every snapshot and then every key in the profile — storage.local
 * has no quota here, so after a couple of years of lessons that is hundreds of
 * megabytes pulled into memory to delete one version. Now:
 *
 *   - deleting text-only versions costs nothing at all, there being no
 *     candidate to look for;
 *   - the surviving snapshots are read in batches, and the scan stops the
 *     moment every candidate has been seen alive, which is the usual case
 *     since a picture is normally in several versions of its page;
 *   - the store is never enumerated: only the candidate keys are removed.
 *
 * @param {Set<string>} candidates - hashes the deleted snapshots referred to.
 *   Consumed: what remains at the end is what got removed.
 * @returns {Promise<number>} how many were removed.
 */
async function sweepImages(candidates) {
  if (candidates.size === 0) return 0;

  const stored = await bgApi.storage.local.get(BG_INDEX_KEY);
  const index = stored[BG_INDEX_KEY] || [];

  for (let i = 0; i < index.length && candidates.size > 0; i += SCAN_BATCH) {
    const keys = index.slice(i, i + SCAN_BATCH).map((e) => e.key);
    const snapshots = await bgApi.storage.local.get(keys);

    for (const snap of Object.values(snapshots)) {
      if (!snap || typeof snap.html !== 'string') continue;
      for (const m of snap.html.matchAll(IMAGE_REF)) candidates.delete(m[1]);
      if (candidates.size === 0) break;
    }
  }

  if (candidates.size === 0) return 0;
  // Forgotten before the removal: should it fail halfway, the set must not go
  // on vouching for pictures that may be gone.
  for (const h of candidates) storedImages.delete(h);
  await bgApi.storage.local.remove([...candidates].map((h) => BG_IMAGE_PREFIX + h));
  return candidates.size;
}

const BG_AVATARS_KEY = 'pca:avatars';

/**
 * Stores a tutor's avatar, once per classroom.
 *
 * Only writes when it changed: archiving is frequent, and rewriting the same
 * few kilobytes on every capture buys nothing.
 *
 * @param {string} classroomId
 * @param {string} dataUri - data URI, or an empty string when capture failed.
 * @returns {Promise<void>}
 */
async function saveAvatar(classroomId, dataUri) {
  if (!classroomId || !dataUri) return;

  const stored = await bgApi.storage.local.get(BG_AVATARS_KEY);
  const all = stored[BG_AVATARS_KEY] || {};
  if (all[classroomId] === dataUri) return;

  all[classroomId] = dataUri;
  await bgApi.storage.local.set({ [BG_AVATARS_KEY]: all });
}

/**
 * Stores a snapshot and updates the index.
 *
 * An automatic capture identical to the newest stored version of its page is
 * not written: autosave archives every page the reader opens, and revisiting
 * one would otherwise add a copy per visit. The page order and the avatar are
 * still merged, since each reading of the thumbnail bar may know more. A manual
 * capture is always written — the reader asked for that version by name.
 *
 * @param {{canvasId: string, classroomId: string, page: string, title: string, url: string, ts: string, html: string, order?: object[], avatar?: string}} snap
 * @param {boolean} manual - true when the reader pressed the button.
 * @returns {Promise<{key: string, count: number, unchanged: boolean}>} `key` is
 *   the newest version of the page, which is the existing one when unchanged.
 * @throws {TypeError} when the snapshot has no `html` field.
 */
async function saveSnapshot(snap, manual) {
  if (!snap || typeof snap.html !== 'string') throw new TypeError('snapshot.html is required');

  const key = `pca:snap:${snap.canvasId}:${snap.ts}`;
  const stored = await bgApi.storage.local.get(BG_INDEX_KEY);
  const index = stored[BG_INDEX_KEY] || [];

  if (!manual) {
    // The index is newest first, so the first entry for the page is its latest.
    const latest = index.find((e) => e.canvasId === snap.canvasId);
    const previous = latest ? (await bgApi.storage.local.get(latest.key))[latest.key] : null;
    if (previous && previous.html === snap.html) {
      await mergeOrder(snap.classroomId, snap.order);
      await saveAvatar(snap.classroomId, snap.avatar);
      return { key: latest.key, count: index.length, unchanged: true };
    }
  }

  index.unshift({
    key,
    canvasId: snap.canvasId,
    classroomId: snap.classroomId,
    page: snap.page,
    title: snap.title,
    ts: snap.ts,
    chars: snap.html.length,
  });

  // The avatar is stripped before storing: it belongs to the classroom, not to
  // a version. Leaving it in would duplicate several kilobytes across every one
  // of a lesson's dozens of versions.
  const avatar = snap.avatar;
  delete snap.avatar;

  // Images travel with the snapshot but are stored apart, keyed by content
  // hash, and the markup keeps only the hash.
  const images = snap.images;
  delete snap.images;

  // Images before the snapshot that points at them. A failure in between then
  // leaves unreferenced pictures, which cost space and nothing else, rather
  // than a listed version whose pictures never arrived.
  await saveImages(images);
  await bgApi.storage.local.set({ [key]: snap, [BG_INDEX_KEY]: index });
  await mergeOrder(snap.classroomId, snap.order);
  await saveAvatar(snap.classroomId, avatar);
  return { key, count: index.length, unchanged: false };
}

/**
 * Deletes one or more snapshots and their index entries in a single pass.
 *
 * @param {string[]} keys - `pca:snap:*` keys. Unknown keys are ignored.
 * @returns {Promise<{removed: number, remaining: number, images: number}>} `images`
 *   counts the pictures the sweep dropped along with them.
 * @throws {TypeError} when `keys` is not an array.
 */
async function deleteSnapshots(keys) {
  if (!Array.isArray(keys)) throw new TypeError('keys must be an array');

  const doomed = new Set(keys);

  // Read before they are removed: once gone, nothing says which pictures they
  // held, and the sweep would be back to scanning the whole archive to guess.
  const going = await bgApi.storage.local.get([...doomed]);
  /** @type {Set<string>} */
  const candidates = new Set();
  for (const snap of Object.values(going)) {
    if (!snap || typeof snap.html !== 'string') continue;
    for (const m of snap.html.matchAll(IMAGE_REF)) candidates.add(m[1]);
  }

  const stored = await bgApi.storage.local.get(BG_INDEX_KEY);
  const index = (stored[BG_INDEX_KEY] || []).filter((e) => !doomed.has(e.key));

  await bgApi.storage.local.remove(keys);
  await bgApi.storage.local.set({ [BG_INDEX_KEY]: index });

  // After the index is written, never before: the sweep asks what survives,
  // and a stale index would list the versions just deleted as living proof
  // that their pictures are still needed.
  const images = await sweepImages(candidates);
  return { removed: doomed.size, remaining: index.length, images };
}

/**
 * Tail of the chain that serialises every write.
 *
 * saveSnapshot() and deleteSnapshots() both read pca:index, change it and
 * write it back. storage.local offers no transaction, so two of them in
 * flight together each write an index built before the other's change: one
 * of the two disappears from the list while its snapshot stays in storage,
 * occupying space and reachable by nothing.
 *
 * It is not a rare interleaving. The button forces a capture at the very
 * moment the autosave timer may fire, and the panel's sweeps delete while
 * that timer runs.
 *
 * @type {Promise<unknown>}
 */
let writes = Promise.resolve();

/**
 * Queues a write behind the ones already running.
 *
 * The chain absorbs rejections so one failure does not block every write
 * after it; the caller still receives its own.
 *
 * @template T
 * @param {() => Promise<T>} task
 * @returns {Promise<T>}
 */
function serialise(task) {
  const run = writes.then(task, task);
  writes = run.catch(() => {});
  return run;
}

/**
 * Message entry point.
 *
 * `return true` with sendResponse(), not a returned promise. Firefox honours
 * both; Chrome closes the channel on anything that is not literally true, so
 * the sender resolves to undefined at once and the service worker is free to
 * be shut down mid-write. saveSnapshot() alone makes five storage round trips,
 * one of them carrying the images.
 *
 * That is also why the caller was being lied to: the viewer refreshed before
 * a deletion had landed, and the content script flashed green on a capture
 * that may never have been written.
 */
bgApi.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  /** @type {Promise<unknown>|null} */
  let work = null;

  if (msg?.type === 'pca:save') work = serialise(() => saveSnapshot(msg.snapshot, msg.manual === true));
  // `key` is still accepted, for calls from an older viewer build.
  else if (msg?.type === 'pca:delete') work = serialise(() => deleteSnapshots(msg.keys || [msg.key]));

  if (!work) return undefined;

  work.then(sendResponse, (e) => {
    console.error('[pca] request failed', msg?.type, e);
    sendResponse({ error: String((e && e.message) || e) });
  });
  return true;
});

bgApi.action.onClicked.addListener(() => {
  bgApi.tabs.create({ url: bgApi.runtime.getURL('viewer.html') });
});

/**
 * The host access every capture depends on.
 *
 * Declared in host_permissions, which is not the same as granted. Firefox
 * before 127 does not grant MV3 host permissions at install, and every browser
 * lets the user withdraw them later. Without it the content script is never
 * injected: no button, no autosave, and nothing on screen to say why.
 */
const BG_PREPLY_ACCESS = { origins: ['https://preply.com/*'] };

/**
 * Marks the toolbar icon while access is missing, and clears it once granted.
 *
 * The badge is the only place a missing permission can surface unprompted: the
 * Preply page shows nothing, precisely because nothing was injected into it.
 * The title says in words what the badge says in a glyph.
 *
 * @returns {Promise<boolean>} whether access is granted.
 */
async function syncAccessBadge() {
  const granted = await bgApi.permissions.contains(BG_PREPLY_ACCESS);
  await bgApi.action.setBadgeText({ text: granted ? '' : '!' });
  if (!granted) await bgApi.action.setBadgeBackgroundColor({ color: '#c9160d' });
  await bgApi.action.setTitle({
    title: bgApi.i18n.getMessage(granted ? 'actionTitle' : 'accessBadgeTitle'),
  });
  return granted;
}

/** @returns {void} */
function onAccessChanged() {
  syncAccessBadge().catch((e) => console.error('[pca] access check failed', e));
}

bgApi.permissions.onAdded.addListener(onAccessChanged);
bgApi.permissions.onRemoved.addListener(onAccessChanged);
bgApi.runtime.onStartup.addListener(onAccessChanged);

// The onboarding step MDN recommends: on a first install without access, the
// viewer opens and its notice offers the grant — a request has to come from a
// click, which a background cannot supply. Only then: an update or a browser
// that granted at install opens nothing.
bgApi.runtime.onInstalled.addListener((details) => {
  syncAccessBadge()
    .then((granted) => {
      if (!granted && details.reason === 'install') {
        return bgApi.tabs.create({ url: bgApi.runtime.getURL('viewer.html') });
      }
      return undefined;
    })
    .catch((e) => console.error('[pca] access check failed', e));
});
