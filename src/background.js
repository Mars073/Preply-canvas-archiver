/**
 * Background — persists snapshots in storage.local and opens the viewer.
 *
 * Storage layout:
 *   'pca:index'                  -> Array<{key, canvasId, classroomId, page, title, ts, chars}>
 *   'pca:snap:<canvasId>:<ts>'   -> one snapshot
 *   'pca:order'                  -> {classroomId: {canvasId: {index, num}}}
 *   'pca:avatars'                -> {classroomId: dataUri}
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

  await api.storage.local.set({ [key]: snap, [INDEX_KEY]: index });
  await mergeOrder(snap.classroomId, snap.order);
  await saveAvatar(snap.classroomId, avatar);
  return { key, count: index.length };
}

/**
 * Deletes one or more snapshots and their index entries in a single pass.
 *
 * @param {string[]} keys - `pca:snap:*` keys. Unknown keys are ignored.
 * @returns {Promise<{removed: number, remaining: number}>}
 * @throws {TypeError} when `keys` is not an array.
 */
async function deleteSnapshots(keys) {
  if (!Array.isArray(keys)) throw new TypeError('keys must be an array');

  const doomed = new Set(keys);
  const stored = await api.storage.local.get(INDEX_KEY);
  const index = (stored[INDEX_KEY] || []).filter((e) => !doomed.has(e.key));

  await api.storage.local.remove(keys);
  await api.storage.local.set({ [INDEX_KEY]: index });
  return { removed: doomed.size, remaining: index.length };
}

api.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'pca:save') return saveSnapshot(msg.snapshot);
  // `key` is still accepted, for calls from an older viewer build.
  if (msg?.type === 'pca:delete') return deleteSnapshots(msg.keys || [msg.key]);
  return undefined;
});

api.action.onClicked.addListener(() => {
  api.tabs.create({ url: api.runtime.getURL('viewer.html') });
});
