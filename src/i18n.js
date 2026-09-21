/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Localisation — message lookup and markup substitution.
 *
 * The WebExtension i18n API has no plural support: `getMessage` returns one
 * fixed string. That is fine for English, German, French and Spanish, which need two
 * forms, but wrong for Russian and Polish, which need three, and wasteful for
 * Chinese, which needs one. `Intl.PluralRules` picks the right category and we
 * look up a suffixed key, so each locale declares exactly the forms it uses.
 */

const i18nApi = globalThis.browser ?? globalThis.chrome;

/** Locale actually chosen by the browser, e.g. "fr", "pl", "zh-CN". */
const UI_LOCALE = i18nApi.i18n.getUILanguage();

const PLURAL_RULES = new Intl.PluralRules(UI_LOCALE);

/**
 * Percentage formatter.
 *
 * The space before the sign is a French and German convention, absent in
 * English and placed differently again in other locales. Intl knows the rule;
 * hardcoding one spelling would be wrong in most of the languages shipped.
 */
const PERCENT_FORMAT = new Intl.NumberFormat(UI_LOCALE, { style: 'percent' });

/**
 * Translates a key.
 *
 * @param {string} key - entry in messages.json.
 * @param {(string|number)[]} [subs] - values for the $1, $2… placeholders.
 * @returns {string} the message, or the key itself when it is missing — a
 *   visible key is easier to spot and fix than a silently empty label.
 */
function t(key, subs) {
  const values = subs ? subs.map(String) : undefined;
  return i18nApi.i18n.getMessage(key, values) || key;
}

/**
 * Translates a key that varies with a count.
 *
 * Looks up `<key>_<category>` where the category comes from Intl.PluralRules
 * (`one`, `few`, `many`, `other`…), falling back to `<key>_other`, which every
 * locale must define.
 *
 * @param {string} key - base key, without the category suffix.
 * @param {number} count - value driving the agreement, also passed as $1.
 * @param {(string|number)[]} [extra] - further placeholders, starting at $2.
 * @returns {string}
 */
function tn(key, count, extra) {
  const subs = [String(count), ...(extra ? extra.map(String) : [])];
  const category = PLURAL_RULES.select(count);
  return i18nApi.i18n.getMessage(`${key}_${category}`, subs)
    || i18nApi.i18n.getMessage(`${key}_other`, subs)
    || key;
}

/**
 * Connectors Preply puts between the lesson label and the tutor's name,
 * across the interface languages it ships.
 *
 * "Salle de classe avec Paula", "Classroom with Paula", "Aula con Paula",
 * "Klasa z Paulą"… The tutor's name is never exposed as data, only inside this
 * localised sentence — so the connector has to be guessed, and it depends on
 * the language *Preply* is displayed in, not the one this extension runs in.
 */
const TUTOR_CONNECTORS = ['avec', 'with', 'con', 'com', 'mit', 'met', 'z', 'ze', 'с', 'со'];

const TUTOR_RE = new RegExp(`(?:^|\\s)(?:${TUTOR_CONNECTORS.join('|')})\\s+(.+?)\\s*$`, 'i');

/**
 * Extracts a tutor's name from a Preply lesson title.
 *
 * @param {string} title - e.g. "Salle de classe avec Paula".
 * @returns {string} the name, or the whole title when no connector matches —
 *   which is what happens for languages with no spaced connector, Chinese
 *   among them. A full title is a poor label but a truthful one.
 */
function tutorFromTitle(title) {
  const m = TUTOR_RE.exec(title || '');
  return m ? m[1] : (title || '');
}

/**
 * Fills every element carrying a translation attribute.
 *
 * Markup declares the key, this fills the value: no string lives in both
 * viewer.html and messages.json. Four attributes are handled, because a label
 * can be visible text, an accessible name, a tooltip or a placeholder — and the
 * same key rarely fits all four.
 *
 * @param {ParentNode} [root=document]
 * @returns {void}
 */
function applyI18n(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of root.querySelectorAll('[data-i18n-label]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  }
  for (const el of root.querySelectorAll('[data-i18n-title]')) {
    el.setAttribute('title', t(el.dataset.i18nTitle));
  }
  for (const el of root.querySelectorAll('[data-i18n-placeholder]')) {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
  }

  // The document language drives hyphenation, quotation marks and, above all,
  // how a screen reader pronounces the interface.
  document.documentElement.lang = UI_LOCALE;
  document.title = t('viewerTitle');
}
