/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = {
  path: 'de/',
  hreflang: 'de',
  ogLocale: 'de_DE',
  label: 'Deutsch',

  title: 'Preply Canvas exportieren und speichern — Preply Canvas Archiver',
  description: 'Sichern Sie Ihre Notizen aus Preply Canvas, solange Sie noch Zugriff haben. Offline lesen, als PDF oder HTML speichern. Kostenlose Erweiterung.',
  ogTitle: 'Notizen aus Preply Canvas exportieren und speichern',
  ogDescription: 'Sichern Sie Ihr Preply Canvas, solange Sie noch Zugriff haben – zum Offline-Lesen, als PDF oder als HTML-Datei.',
  ogImageAlt: 'Das Archiv eines Preply-Klassenzimmers mit einer gespeicherten Canvas-Seite.',
  ldDescription: 'Browsererweiterung, die die Canvas-Seiten Ihrer Preply-Stunden auf Ihrem Rechner speichert – zum Offline-Lesen, zum Drucken als PDF oder zum Exportieren als HTML, mit allen Versionen.',

  skip: 'Zum Inhalt springen',
  navLabel: 'Sprache',

  h1: 'Notizen aus <em>Preply Canvas</em> exportieren und speichern',
  sub: 'Ihr Canvas liegt vielleicht noch irgendwo bei Preply. Ob Sie es wiederfinden, steht auf einem anderen Blatt. Sichern Sie eine Kopie, solange Sie noch Zugriff haben – dann können Sie sie offline lesen, als PDF drucken oder exportieren.',
  addChrome: 'Zu Chrome hinzufügen',
  addFirefox: 'Zu Firefox hinzufügen',
  addEdge: 'Zu MS Edge hinzufügen',
  shotAlt: 'Das Archiv: links die Seiten eines Klassenzimmers, rechts die gespeicherte Seite, darüber Zoom, Verlauf und Drucken.',
  shotCap: 'Ein Klassenzimmer pro Lehrkraft, jede Seite nur einmal – und alle Versionen nur einen Klick entfernt.',

  how: {
    h2: 'Preply Canvas sichern, solange Sie noch Zugriff haben',
    p: 'Während der Stunde ergänzt Preply Canvas Archiver die Canvas-Symbolleiste um eine Archiv-Schaltfläche. Ein Klick genügt, und die Seite ist in Ihrem Browser gespeichert. Und falls Sie es vergessen: Jede Seite, die Sie öffnen oder bearbeiten, wird automatisch gespeichert, sobald sich eine Minute lang nichts mehr ändert. Direkt daneben liegt eine Druck-Schaltfläche, mit der Sie noch vor Stundenende ein PDF erstellen.',
    shotAlt: 'Die Canvas-Symbolleiste von Preply mit zwei zusätzlichen Schaltflächen rechts (Drucken und Archivieren), rosa umrandet und mit „Extra buttons“ beschriftet.',
    cap: 'Mehr fügt die Erweiterung Preply nicht hinzu – und das im Stil der vorhandenen Schaltflächen.',
  },

  read: {
    h2: 'Ihre Unterrichtsnotizen offline, als PDF oder HTML',
    p1: 'Öffnen Sie Ihr Archiv jederzeit über das Symbol der Erweiterung, auch ohne Internet: Alles liegt in Ihrem Browser, Preply wird dabei nie kontaktiert. Jede Version einer Seite bleibt erhalten, und im Verlauf sehen Sie, was Ihre Lehrkraft von Mal zu Mal ergänzt oder korrigiert hat.',
    p2: 'Jede Seite lässt sich sauber als PDF drucken oder als einzelne HTML-Datei exportieren – leicht aufzubewahren, zu sichern oder weiterzugeben. Die Suche durchforstet ein ganzes Klassenzimmer und ignoriert dabei Akzente sowie Groß- und Kleinschreibung.',
  },

  privacy: {
    h2: 'Nichts verlässt Ihren Browser',
    p1: '<strong>Kein Server, kein Konto, keine Statistiken</strong>: Es gibt schlicht keinen Ort, an den Ihre Daten gehen könnten. Alles bleibt auf Ihrem Rechner, und beim Deinstallieren wird alles gelöscht.',
    p2: 'Ins Netz geht die Erweiterung nur auf der ohnehin geöffneten Preply-Seite Ihrer Stunde – um die Bilder aus Ihrem Canvas zu übernehmen.',
  },

  faq: {
    h2: 'Häufige Fragen',
    items: [
      {
        q: 'Wie exportiere ich ein Preply Canvas?',
        a: 'Installieren Sie die Erweiterung und öffnen Sie das Canvas Ihrer Stunde auf Preply. Klicken Sie rechts in der Canvas-Symbolleiste auf die Archiv-Schaltfläche, oder überlassen Sie das dem automatischen Speichern. Öffnen Sie anschließend Ihr Archiv über das Symbol der Erweiterung und wählen Sie <strong>Drucken / PDF</strong> oder im Menü ⋯ <strong>Als HTML exportieren</strong>.',
      },
      {
        q: 'Kann ich meine Notizen aus Preply Canvas herunterladen?',
        a: 'Ja. Jede archivierte Seite lässt sich als eigenständige HTML-Datei samt Bildern exportieren oder über den Druckdialog als PDF speichern.',
      },
      {
        q: 'Wie komme ich nach der Stunde noch an mein Preply Canvas?',
        a: 'Alle Seiten, die bei installierter Erweiterung gespeichert wurden, bleiben in Ihrem Archiv – ein Klick auf das Symbol der Erweiterung genügt. Eine Seite, die Sie nie mit installierter Erweiterung geöffnet haben, lässt sich allerdings nicht wiederherstellen.',
      },
      {
        q: 'Kann ich ein Preply Canvas als PDF speichern?',
        a: 'Ja, auf zwei Wegen: über die Druck-Schaltfläche, die während der Stunde in der Canvas-Symbolleiste erscheint, oder über <strong>Drucken / PDF</strong> in Ihrem Archiv. Wählen Sie im Druckdialog des Browsers „Als PDF speichern“.',
      },
      {
        q: 'Kann ich meine Preply-Notizen offline lesen?',
        a: 'Ja. Ihr Archiv liegt im Browser und geht nie ins Internet – Ihre Notizen öffnen sich also auch ohne Verbindung.',
      },
      {
        q: 'Wo werden meine Notizen gespeichert?',
        a: 'Ausschließlich im lokalen Speicher Ihres Browsers, auf Ihrem Rechner. Hochgeladen wird nichts. Aber Achtung: Beim Deinstallieren der Erweiterung wird das Archiv gelöscht – exportieren Sie vorher die Seiten, die Sie behalten möchten.',
      },
    ],
  },

  hard: {
    h2: 'Die eigentlichen technischen Hürden',
    items: [
      {
        h3: 'Jede Version vollständig',
        p: 'Jede Speicherung wird vollständig und unabhängig abgelegt, nicht als Kette von Änderungen. Geht eine Datei kaputt, verlieren Sie eine Version – nicht den ganzen Verlauf.',
      },
      {
        h3: 'Eine Suche, die Polnisch versteht',
        p: 'Die Suche ignoriert Akzente sowie Groß- und Kleinschreibung im ganzen Klassenzimmer – auch beim <code>ł</code>, das keine Unicode-Normalisierung zerlegt. Wer <code>slonce</code> tippt, findet <code>słońce</code>.',
      },
      {
        h3: 'Originalgetreues Layout',
        p: 'Das Archiv übernimmt Breite, Schriftgröße und Schriftart des Preply-Editors: Die Zeilen brechen genau dort um, wo sie es im Unterricht taten.',
      },
      {
        h3: 'Bilder, die nicht verschwinden',
        p: 'Preply liefert Bilder über Links aus, die ablaufen. Die Erweiterung kopiert sie beim Speichern mit – sonst würden Ihrem Archiv nach und nach die Bilder fehlen.',
      },
    ],
  },

  source: {
    h2: 'Aus dem Quellcode installieren',
    intro: 'Am einfachsten installieren Sie die Erweiterung über den Store Ihres Browsers. Wer aber den Code lesen, ändern oder die Version auf <code>master</code> schon vor der Veröffentlichung ausprobieren möchte, kann sie auch selbst laden – ohne die mehrtägige Prüfung der Stores abzuwarten.',
    firefox: 'Öffnen Sie <code>about:debugging</code>, dann „Dieser Firefox“ → „Temporäres Add-on laden…“, und wählen Sie <code>src/manifest.json</code>. Nach einem Neustart ist die Erweiterung wieder weg: Dauerhaft installiert Firefox nur signierte Erweiterungen.',
    chromeTitle: 'Chrome und Edge',
    chrome: 'Führen Sie <code>bash tools/package.sh</code> aus, öffnen Sie <code>chrome://extensions</code> (oder <code>edge://extensions</code>), aktivieren Sie den „Entwicklermodus“, klicken Sie auf „Entpackte Erweiterung laden“ und wählen Sie den Ordner <code>dist/chrome/</code>.',
    noBuild: 'Kein Build-Schritt, keine Minifizierung: Der Ordner <code>src/</code> ist genau das, was veröffentlicht wird. Der Code, den Sie lesen, ist der Code, der läuft.',
    past: 'Die Erweiterung speichert nur Seiten, die nach ihrer Installation geöffnet werden – vergangene Stunden lassen sich nicht nachholen.',
  },

  thanks: {
    h2: 'Danke',
    p: 'An Paula für den Polnischunterricht – und für alles Wissenswerte über Sękacz – sowie an Shuang laoshi für den Chinesischunterricht. Dieses Werkzeug ist entstanden, um festzuhalten, was ich in diesen Stunden lerne.',
  },

  footer: {
    source: 'Quellcode',
    privacy: 'Datenschutz',
    icons: 'Icons: <a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: 'Inoffizielles Werkzeug, ohne Verbindung zu Preply. Preply ist eine Marke ihres Inhabers.',
  },
};
