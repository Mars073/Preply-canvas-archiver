/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Screenshot aid — fills the viewer with plausible demo content.
 *
 * Paste it into the console of the archive viewer, take the screenshot, then
 * reload the tab to undo it.
 *
 * It writes NOTHING to storage. The in-memory model is replaced and the columns
 * are re-rendered, so a real archive is never touched, never overwritten and
 * never has to be cleaned up afterwards. That is the whole reason it works this
 * way rather than seeding storage.local with fake entries.
 *
 * Not part of the extension: tools/ is excluded from both packages.
 */
(() => {
  const HOUR = 3600_000;
  const DAY = 24 * HOUR;
  const now = Date.now();

  /**
   * Circular avatar as an inline SVG data URI, so the demo needs no files.
   *
   * @param {string} a - background colour.
   * @param {string} b - mark colour.
   * @param {string} initial
   * @returns {string}
   */
  const avatar = (a, b, initial) => 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
       <rect width="96" height="96" fill="${a}"/>
       <circle cx="48" cy="38" r="17" fill="${b}" opacity=".9"/>
       <path d="M14 96c4-20 17-30 34-30s30 10 34 30z" fill="${b}" opacity=".9"/>
       <text x="48" y="60" font-family="sans-serif" font-size="34" font-weight="700"
             fill="${a}" text-anchor="middle">${initial}</text>
     </svg>`);

  const ROOMS = [
    { id: 'c1', tutor: 'Elrond', pages: 7, av: avatar('#1f6f5c', '#d9f2e9', 'E') },
    { id: 'c2', tutor: 'Paula', pages: 12, av: avatar('#d13d76', '#ffe5f0', 'P') },
    { id: 'c3', tutor: 'Shuang', pages: 9, av: avatar('#b3541e', '#ffe8d6', 'S') },
    { id: 'c4', tutor: 'Mikko', pages: 4, av: avatar('#2a4d8f', '#dde8ff', 'M') },
  ];

  const PAGES = [
    ['Lesson 7 — Greetings and farewells', 5, 2 * HOUR],
    ['Lesson 6 — The definite article', 3, DAY + 3 * HOUR],
    ['Lesson 5 — Plurals and i-affection', 8, 3 * DAY],
    ['Lesson 4 — Numbers one to twenty', 2, 6 * DAY],
    ['Lesson 3 — Stress and long vowels', 6, 9 * DAY],
    ['Lesson 2 — The alphabet, part two', 4, 13 * DAY],
    ['Lesson 1 — The alphabet, part one', 3, 17 * DAY],
  ];

  const GREEN = 'rgb(6, 117, 96)';
  const RED = 'rgb(144, 20, 67)';
  const INK = 'rgb(18, 17, 23)';

  const star = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"
       width="104" height="104" role="img" aria-label="Six-pointed elvish star">
      <g fill="none" stroke="${GREEN}" stroke-width="2.5" stroke-linejoin="round">
        <path d="M60 8 87 54 60 100 33 54Z"/>
        <path d="M14 31 106 31 106 89 14 89Z" opacity=".35"/>
        <circle cx="60" cy="60" r="46" opacity=".45"/>
      </g>
      <circle cx="60" cy="60" r="5" fill="${GREEN}"/>
    </svg>`;

  const stress = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 74"
       width="320" height="74" role="img"
       aria-label="Stress falls on the second syllable of omentielvo">
      <text x="4" y="30" font-family="serif" font-size="24" fill="${INK}">o</text>
      <text x="30" y="30" font-family="serif" font-size="24" fill="${RED}" font-weight="700">men</text>
      <text x="88" y="30" font-family="serif" font-size="24" fill="${INK}">ti</text>
      <text x="118" y="30" font-family="serif" font-size="24" fill="${INK}">el</text>
      <text x="150" y="30" font-family="serif" font-size="24" fill="${INK}">vo</text>
      <path d="M30 42 L84 42" stroke="${RED}" stroke-width="2.5"/>
      <text x="30" y="64" font-family="sans-serif" font-size="13" fill="${RED}">stressed</text>
    </svg>`;

  const DOC = `
    <p dir="auto"><strong>Sindarin — greetings</strong></p>
    <p dir="auto">mae govannen <span style="color:${INK}">→ well met</span>
      <span style="color:${GREEN}"> (my go-VAN-nen)</span></p>
    <p dir="auto">mellon <span style="color:${INK}">→ friend</span>
      <span style="color:${GREEN}"> (MEL-lon)</span></p>
    <p dir="auto">hannon le <span style="color:${INK}">→ thank you</span>
      <span style="color:${GREEN}"> (HAN-non leh)</span></p>
    <p dir="auto">novaer <span style="color:${INK}">→ farewell</span>
      <span style="color:${GREEN}"> (NO-vire)</span></p>
    <p><br class="ProseMirror-trailingBreak"></p>
    <p dir="auto"><strong>Quenya — the greeting of Gildor</strong></p>
    <p dir="auto"><span style="color:${INK}">elen síla lúmenn’ omentielvo</span>
      <span style="color:${GREEN}"> → a star shines on the hour of our meeting</span></p>
    <p dir="auto">${stress}</p>
    <p dir="auto"><span style="color:${RED}">careful:</span> the acute mark is length,
      not stress. <em>síla</em> keeps a long i and still takes the stress on the first
      syllable.</p>
    <hr dir="auto">
    <p dir="auto"><strong>Pronouns</strong></p>
    <table><tbody>
      <tr><td><p>im</p></td><td><p>I</p></td><td><p><span style="color:${GREEN}">eem</span></p></td></tr>
      <tr><td><p>le</p></td><td><p>you (formal)</p></td><td><p><span style="color:${GREEN}">leh</span></p></td></tr>
      <tr><td><p>ce</p></td><td><p>you (familiar)</p></td><td><p><span style="color:${GREEN}">keh</span></p></td></tr>
      <tr><td><p>men</p></td><td><p>us</p></td><td><p><span style="color:${GREEN}">men</span></p></td></tr>
    </tbody></table>
    <p><br class="ProseMirror-trailingBreak"></p>
    <p dir="auto"><strong>Homework</strong></p>
    <ul dir="auto">
      <li><p dir="auto">Write four greetings, one for each time of day.</p></li>
      <li><p dir="auto">Read <em>Namárië</em> aloud and mark every long vowel.</p></li>
      <li><p dir="auto"><span style="color:${RED}">Correction from last week:</span>
        <em>mellyn</em> is the plural of <em>mellon</em>, not <em>mellons</em>.</p></li>
    </ul>
    <p dir="auto">${star}</p>
    <p dir="auto"><span style="color:${GREEN}">See you on Thursday. — Elrond</span></p>`;

  // --- build the in-memory model -----------------------------------------

  rooms = new Map();
  avatars = {};
  order = {};
  labels = {};

  for (const r of ROOMS) {
    avatars[r.id] = r.av;
    order[r.id] = {};
    const pages = new Map();

    const list = r.id === 'c1' ? PAGES : PAGES.slice(0, r.pages > 7 ? 7 : r.pages);
    list.forEach(([name, versions, ago], i) => {
      const id = `${r.id}p${i}`;
      const entries = [];
      for (let v = 0; v < versions; v++) {
        entries.push({
          key: `demo:${id}:${v}`,
          canvasId: id,
          classroomId: r.id,
          page: String(i + 1),
          title: `Classroom with ${r.tutor}`,
          ts: new Date(now - ago - v * 40 * 60000).toISOString(),
          chars: 9000 + v * 260,
        });
      }
      labels[id] = name;
      order[r.id][id] = { index: i, num: String(i + 1) };
      pages.set(id, { id, number: String(i + 1), entries, label: name, lines: [name], folded: [] });
    });

    rooms.set(r.id, { id: r.id, tutor: r.tutor, title: `Classroom with ${r.tutor}`, pages });
  }

  curRoom = rooms.get('c1');
  curPage = [...curRoom.pages.values()][0];
  curSnap = { ...curPage.entries[0], html: DOC };

  // --- paint --------------------------------------------------------------

  renderRooms();
  renderPages();

  elDoc.innerHTML = DOC;
  elDoc.lang = 'sjn';
  elSheet.hidden = false;
  elPlaceholder.hidden = true;
  elTopbar.hidden = false;
  elTitle.textContent = curPage.label;
  elMeta.textContent = `${curPage.entries.length} snapshots · ${curRoom.tutor} · Today 18:40`;
  elUsage.textContent = '96 snapshots · ≈ 3.4 MB';
  document.getElementById('scroll').scrollTop = 0;

  console.log('[pca] demo content in place. Reload the tab to undo.');
})();
