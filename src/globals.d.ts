/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Extension APIs, declared loosely so `checkJs` can run with no dependency.
//
// The accurate route would be @types/firefox-webext-browser, but that means an
// npm install for a project that otherwise has no toolchain at all. Typing both
// roots as `any` keeps the editor useful — it still checks our own code — while
// staying honest that browser API calls are unchecked.
//
// `var` and not `const`: only a global `var` declaration is exposed on
// `globalThis` in TypeScript's view, which is how the shim reaches them.

declare var browser: any;
declare var chrome: any;
