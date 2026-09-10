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
 */
const api = globalThis.browser ?? globalThis.chrome;

const INDEX_KEY = 'pca:index';
const ORDER_KEY = 'pca:order';

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

  const stored = await api.storage.local.get(ORDER_KEY);
  const all = stored[ORDER_KEY] || {};
  const room = all[classroomId] || {};

  for (const e of entries) {
    if (!e || !e.id || !Number.isFinite(e.index)) continue;
    room[e.id] = { index: e.index, num: e.num };
  }

  all[classroomId] = room;
  await api.storage.local.set({ [ORDER_KEY]: all });
}

const IMAGE_PREFIX = 'pca:img:';

/** Matches the hash a captured image was rewritten to. */
const IMAGE_REF = /data-pca-img="([0-9a-f]{64})"/g;

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
  const hashes = Object.keys(blobs || {});
  if (hashes.length === 0) return 0;

  const keys = hashes.map((h) => IMAGE_PREFIX + h);
  const known = await api.storage.local.get(keys);

  /** @type {Record<string, string>} */
  const fresh = {};
  for (const h of hashes) {
    if (known[IMAGE_PREFIX + h] === undefined) fresh[IMAGE_PREFIX + h] = blobs[h];
  }

  const count = Object.keys(fresh).length;
  if (count > 0) await api.storage.local.set(fresh);
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

  const stored = await api.storage.local.get(INDEX_KEY);
  const index = stored[INDEX_KEY] || [];

  for (let i = 0; i < index.length && candidates.size > 0; i += SCAN_BATCH) {
    const keys = index.slice(i, i + SCAN_BATCH).map((e) => e.key);
    const snapshots = await api.storage.local.get(keys);

    for (const snap of Object.values(snapshots)) {
      if (!snap || typeof snap.html !== 'string') continue;
      for (const m of snap.html.matchAll(IMAGE_REF)) candidates.delete(m[1]);
      if (candidates.size === 0) break;
    }
  }

  if (candidates.size === 0) return 0;
  await api.storage.local.remove([...candidates].map((h) => IMAGE_PREFIX + h));
  return candidates.size;
}

const AVATARS_KEY = 'pca:avatars';

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

  const stored = await api.storage.local.get(AVATARS_KEY);
  const all = stored[AVATARS_KEY] || {};
  if (all[classroomId] === dataUri) return;

  all[classroomId] = dataUri;
  await api.storage.local.set({ [AVATARS_KEY]: all });
}

/**
 * Stores a snapshot and updates the index.
 *
 * @param {{canvasId: string, classroomId: string, page: string, title: string, url: string, ts: string, html: string, order?: object[], avatar?: string}} snap
 * @returns {Promise<{key: string, count: number}>}
 * @throws {TypeError} when the snapshot has no `html` field.
 */
async function saveSnapshot(snap) {
  if (!snap || typeof snap.html !== 'string') throw new TypeError('snapshot.html is required');

  const key = `pca:snap:${snap.canvasId}:${snap.ts}`;
  const stored = await api.storage.local.get(INDEX_KEY);
  const index = stored[INDEX_KEY] || [];

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

  await api.storage.local.set({ [key]: snap, [INDEX_KEY]: index });
  await mergeOrder(snap.classroomId, snap.order);
  await saveAvatar(snap.classroomId, avatar);
  await saveImages(images);
  return { key, count: index.length };
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
  const going = await api.storage.local.get([...doomed]);
  /** @type {Set<string>} */
  const candidates = new Set();
  for (const snap of Object.values(going)) {
    if (!snap || typeof snap.html !== 'string') continue;
    for (const m of snap.html.matchAll(IMAGE_REF)) candidates.add(m[1]);
  }

  const stored = await api.storage.local.get(INDEX_KEY);
  const index = (stored[INDEX_KEY] || []).filter((e) => !doomed.has(e.key));

  await api.storage.local.remove(keys);
  await api.storage.local.set({ [INDEX_KEY]: index });

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
api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  /** @type {Promise<unknown>|null} */
  let work = null;

  if (msg?.type === 'pca:save') work = serialise(() => saveSnapshot(msg.snapshot));
  // `key` is still accepted, for calls from an older viewer build.
  else if (msg?.type === 'pca:delete') work = serialise(() => deleteSnapshots(msg.keys || [msg.key]));

  if (!work) return undefined;

  work.then(sendResponse, (e) => {
    console.error('[pca] request failed', msg?.type, e);
    sendResponse({ error: String((e && e.message) || e) });
  });
  return true;
});

api.action.onClicked.addListener(() => {
  api.tabs.create({ url: api.runtime.getURL('viewer.html') });
});
