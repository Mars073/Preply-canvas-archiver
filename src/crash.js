/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Last resort — shows what failed and offers to report it.
 *
 * Loaded BEFORE viewer.js, which is the whole reason it is a file of its own.
 * Inside viewer.js the handlers were installed at the end, after two thousand
 * lines of top-level wiring that they therefore could not guard — and a build
 * that fails on load fails exactly there, leaving a blank page and nothing
 * else. Here they are in place before that code is parsed.
 *
 * It also has to work when nothing else does, so it depends on as little as
 * possible: the banner translates and paints itself, rather than waiting for
 * the boot sequence that may be what just died.
 */

/**
 * Extension API root.
 *
 * Named apart from viewer.js's `api` and i18n.js's `i18nApi` on purpose: a
 * top-level `const` in a classic script goes into the global lexical scope,
 * and a second file declaring the same name throws before it runs a line.
 */
const crashApi = globalThis.browser ?? globalThis.chrome;
/* ------------------------------------------------------------ error report */

const elCrash = document.getElementById('crash');
const elCrashWhat = document.getElementById('crash-what');
const linkCrash = document.getElementById('crash-report');

const REPO_URL = 'https://github.com/Mars073/Preply-canvas-archiver';

/**
 * Longest issue body handed to GitHub.
 *
 * A whole stack plus the environment lines can outgrow what a URL may carry,
 * and GitHub answers an over-long one with 414 rather than a form. Truncated
 * here, where the reader can still add what was cut.
 */
const REPORT_MAX = 1400;

/**
 * The failure as one block, without repeating its first line.
 *
 * V8 opens a stack with `Error: <message>`, SpiderMonkey opens it with the
 * first frame. Printing the message and then the stack therefore said it
 * twice on Chrome and once on Firefox, from the same code.
 *
 * @param {string} what
 * @param {string} stack
 * @returns {string}
 */
function trace(what, stack) {
  const clean = (stack || '').trim();
  if (!clean) return what;
  const first = clean.split('\n', 1)[0];
  return first.includes(what) ? clean : `${what}\n${clean}`;
}

/**
 * Builds a link that opens a GitHub issue with the details already filled in.
 *
 * `labels` is deliberately not passed: setting one needs write access to the
 * repository, and GitHub answers 404 to anyone else — the reporter would meet
 * a dead link instead of a form.
 *
 * What goes in is the version, the browser and the failure. No archived
 * content, no page name, no tutor: an add-on whose whole claim is that nothing
 * leaves the browser cannot hand a lesson to a public issue tracker. An error
 * message may still carry an identifier of its own, which is why the form is
 * opened for review rather than submitted.
 *
 * @param {string} what - the failure, already reduced to one line.
 * @param {string} stack - stack trace, or an empty string.
 * @returns {string}
 */
function reportUrl(what, stack) {
  const version = crashApi.runtime.getManifest().version;
  const body = [
    '<!-- Please read this through before sending it. -->',
    '',
    '**What I was doing:** ',
    '',
    '**Failure**',
    '```',
    trace(what, stack),
    '```',
    '',
    `Version ${version} · ${navigator.userAgent} · ${crashApi.i18n.getUILanguage()}`,
  ].join('\n');

  return `${REPO_URL}/issues/new`
    + `?title=${encodeURIComponent(`Error: ${what}`.slice(0, 120))}`
    + `&body=${encodeURIComponent(body.slice(0, REPORT_MAX))}`;
}

/**
 * Shows the failure and offers to report it.
 *
 * Only the first is shown. One broken render usually throws again on the next
 * frame, and a banner replaced three times a second says less than one that
 * stays still.
 *
 * @param {unknown} error
 * @returns {void}
 */
function crash(error) {
  console.error('[pca]', error);
  if (!elCrash.hidden) return;

  // Translated and painted here rather than at boot: the boot sequence is one
  // of the things that can have failed, and a banner reading nothing at all
  // would be the least useful outcome. Guarded, since those scripts may be
  // exactly what did not load.
  if (typeof applyI18n === 'function') applyI18n(elCrash);
  if (typeof paintIcons === 'function') paintIcons(elCrash);

  const what = String((error && error.message) || error || 'unknown error');
  elCrashWhat.textContent = what;
  linkCrash.href = reportUrl(what, (error && error.stack) || '');
  elCrash.hidden = false;
}

/**
 * Rejection handler for work whose failure the reader has to know about.
 *
 * Replaces `.catch(fail)`, which was honest about there being nothing
 * more to do and dishonest about who would read it. The action they asked for
 * did not happen; the console is not where they will find out.
 *
 * @param {unknown} error
 * @returns {void}
 */
function fail(error) {
  crash(error);
}

document.getElementById('crash-close').addEventListener('click', () => {
  elCrash.hidden = true;
});

// Nothing catches these by definition: a throw in an event handler, or a
// promise nobody attached a handler to.
window.addEventListener('error', (e) => crash(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => crash(e.reason));
