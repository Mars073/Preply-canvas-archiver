/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = {
  path: '',
  hreflang: 'en',
  ogLocale: 'en_US',
  label: 'English',

  title: 'Export &amp; Save Preply Canvas Notes — Preply Canvas Archiver',
  description: 'Save your Preply Canvas lesson notes while you still have access. Read them offline, print them to PDF or export them as HTML. Free browser extension.',
  ogTitle: 'Export and save your Preply Canvas lesson notes',
  ogDescription: 'Keep a local copy of your Preply Canvas while you still have access: read it offline, print it to PDF, export it.',
  ogImageAlt: 'The archive reader: a classroom’s pages and an archived Preply Canvas page.',
  ldDescription: 'Browser extension that saves the Canvas pages of Preply lessons locally, to read them offline, print them to PDF or export them as HTML, keeping every version.',

  skip: 'Skip to content',
  navLabel: 'Language',

  h1: 'Export and save your <em>Preply Canvas</em> lesson notes',
  sub: 'Your Canvas may still exist on Preply. Finding it again is another matter. Save a local copy while you still have access — then read it offline, print it to PDF or export it.',
  addChrome: 'Add to Chrome',
  addFirefox: 'Add to Firefox',
  addEdge: 'Add to MS Edge',
  shotAlt: 'The archive reader: a classroom’s pages on the left, the archived document on the right, with zoom, history and print above it.',
  shotCap: 'One classroom per tutor. Each page listed once, with every version behind it.',

  how: {
    h2: 'Save a Preply Canvas while you still have access.',
    p: 'Preply Canvas Archiver adds an archive button to the Canvas toolbar during a lesson. Click it and the page is stored in your browser. Forget, and every page you open or edit is saved on its own once it has been still for a minute. A print button sits beside it, for a PDF before you leave the lesson.',
    shotAlt: 'The Preply Canvas toolbar with two extra buttons at its right end, print and archive, framed in pink and labelled Extra buttons.',
    cap: 'The whole footprint inside Preply, styled from the buttons already there.',
  },

  read: {
    h2: 'Your lesson notes, offline, as PDF or HTML.',
    p1: 'Open the archive from the extension’s icon whenever you like, even without a connection: it reads from your browser and never contacts Preply. Every version of a page is kept, and the history shows what your tutor added or corrected since the previous one.',
    p2: 'Any page prints to a clean PDF, or exports as a single HTML file you can keep, back up or send. Search runs across a whole classroom, ignoring accents and case.',
  },

  privacy: {
    h2: 'Nothing leaves your browser.',
    p1: '<strong>No server, no account, no analytics</strong> — there is nothing to send anything to. Everything lands in local storage on your own machine, and uninstalling deletes it all.',
    p2: 'Its only network requests happen on the Preply lesson page you already have open, to copy the images shown in your Canvas.',
  },

  faq: {
    h2: 'Frequently asked questions',
    items: [
      {
        q: 'How do I export a Preply Canvas?',
        a: 'Install the extension, then open the lesson’s Canvas on Preply. Click the archive button at the right end of the Canvas toolbar, or let it save on its own. Open the archive from the extension’s icon and choose <strong>Print / PDF</strong>, or <strong>Export as HTML</strong> in the ⋯ menu.',
      },
      {
        q: 'Can I download my Preply Canvas notes?',
        a: 'Yes. Each archived page exports as a self-contained HTML file, images included, or saves as a PDF from the print dialog.',
      },
      {
        q: 'How can I access my Preply Canvas after a lesson?',
        a: 'Every page captured while the extension was installed stays in your archive: click the extension’s icon to open it, at any time. It cannot recover pages that were never opened with the extension installed.',
      },
      {
        q: 'Can I save a Preply Canvas as a PDF?',
        a: 'Yes, from two places: the print button it adds to the Canvas toolbar during the lesson, and <strong>Print / PDF</strong> in the archive. Choose “Save as PDF” in your browser’s print dialog.',
      },
      {
        q: 'Can I read my archived Preply notes offline?',
        a: 'Yes. The archive lives in your browser’s storage and the reader never goes online, so your notes open without a connection.',
      },
      {
        q: 'Where are my notes stored?',
        a: 'Only in your browser’s local storage, on your machine. Nothing is uploaded. Uninstalling the extension deletes the archive, so export the pages you want to keep first.',
      },
    ],
  },

  hard: {
    h2: 'The parts that were actually hard.',
    items: [
      {
        h3: 'Versions stay whole',
        p: 'Every save is stored complete and independent, never as a chain of differences. A damaged file costs one version, not the history behind it.',
      },
      {
        h3: 'Search that knows Polish',
        p: 'Accents and case folded across a classroom — and <code>ł</code> is a letter no normalisation decomposes. Type <code>slonce</code>, find <code>słońce</code>.',
      },
      {
        h3: 'Lines break where they broke',
        p: 'The reader reproduces the width, size and typeface of Preply’s editor, so an archived page wraps exactly as it did in class.',
      },
      {
        h3: 'Images that survive',
        p: 'Preply serves them from links that expire. They are copied in at capture, or the archive would quietly rot.',
      },
    ],
  },

  source: {
    h2: 'Running it from source.',
    intro: 'The three store listings are the way in. This is the other one — for reading the code, changing it, or running what is on <code>master</code> before a store has it. Review takes days; a branch takes none.',
    firefox: '<code>about:debugging</code> → This Firefox → Load Temporary Add-on… → pick <code>src/manifest.json</code>. It goes when Firefox restarts: a permanent install has to be signed.',
    chromeTitle: 'Chrome and Edge',
    chrome: 'run <code>bash tools/package.sh</code>, then <code>chrome://extensions</code> (or <code>edge://extensions</code>) → Developer mode → Load unpacked → pick <code>dist/chrome/</code>',
    noBuild: 'No build step, no bundler, no minifier: <code>src/</code> is what ships. What you read is what runs.',
    past: 'Only pages you open while it is installed can be captured. Lessons already past are out of reach.',
  },

  thanks: {
    h2: 'Thanks.',
    p: 'To Paula, my Polish tutor and a formidable authority on sękacz, and to Shuang laoshi, my Chinese tutor. This exists to keep what the two of them teach me.',
  },

  footer: {
    source: 'Source',
    privacy: 'Privacy',
    icons: 'icons by <a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: 'Unofficial tool, not affiliated with Preply. Preply is a trademark of its owner.',
  },
};
