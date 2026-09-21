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
  description: 'Sichern Sie Ihre Notizen aus Preply Canvas, solange Sie noch Zugriff haben. Offline lesen, als PDF drucken oder als HTML exportieren. Kostenlos.',
  ogTitle: 'Notizen aus Preply Canvas exportieren und speichern',
  ogDescription: 'Legen Sie eine lokale Kopie Ihres Preply Canvas an, solange Sie noch Zugriff haben: offline lesen, als PDF drucken, exportieren.',
  ogImageAlt: 'Die Archivansicht: die Seiten eines Klassenzimmers und eine archivierte Preply-Canvas-Seite.',
  ldDescription: 'Browsererweiterung, die die Canvas-Seiten von Preply-Stunden lokal speichert, um sie offline zu lesen, als PDF zu drucken oder als HTML zu exportieren – jede Version bleibt erhalten.',

  skip: 'Zum Inhalt springen',
  navLabel: 'Sprache',

  h1: 'Notizen aus <em>Preply Canvas</em> exportieren und speichern',
  sub: 'Ihr Canvas existiert vielleicht noch bei Preply. Es später wiederzufinden, ist eine andere Sache. Sichern Sie eine lokale Kopie, solange Sie noch Zugriff haben – und lesen Sie sie offline, drucken Sie sie als PDF oder exportieren Sie sie.',
  addChrome: 'Zu Chrome hinzufügen',
  addFirefox: 'Zu Firefox hinzufügen',
  addEdge: 'Zu MS Edge hinzufügen',
  shotAlt: 'Die Archivansicht: links die Seiten eines Klassenzimmers, rechts das archivierte Dokument, darüber Zoom, Verlauf und Drucken.',
  shotCap: 'Ein Klassenzimmer pro Lehrkraft. Jede Seite steht nur einmal in der Liste, mit allen Versionen dahinter.',

  how: {
    h2: 'Preply Canvas sichern, solange Sie noch Zugriff haben.',
    p: 'Während der Stunde fügt Preply Canvas Archiver der Canvas-Symbolleiste eine Archiv-Schaltfläche hinzu. Ein Klick, und die Seite ist in Ihrem Browser gespeichert. Und falls Sie es vergessen: Jede Seite, die Sie öffnen oder bearbeiten, speichert sich von selbst, sobald sie eine Minute lang unverändert war. Daneben sitzt eine Druck-Schaltfläche – für ein PDF, bevor Sie die Stunde verlassen.',
    shotAlt: 'Die Canvas-Symbolleiste von Preply mit zwei zusätzlichen Schaltflächen rechts, Drucken und Archivieren, rosa umrahmt und mit Extra buttons beschriftet.',
    cap: 'Alles, was die Erweiterung in Preply hinzufügt, im Stil der vorhandenen Schaltflächen.',
  },

  read: {
    h2: 'Ihre Unterrichtsnotizen – offline, als PDF oder HTML.',
    p1: 'Öffnen Sie das Archiv jederzeit über das Symbol der Erweiterung, auch ohne Internetverbindung: Es wird aus Ihrem Browser gelesen und kontaktiert Preply nie. Jede Version einer Seite bleibt erhalten, und der Verlauf zeigt, was Ihre Lehrkraft seit der vorherigen ergänzt oder korrigiert hat.',
    p2: 'Jede Seite lässt sich als sauberes PDF drucken oder als einzelne HTML-Datei exportieren, die Sie aufbewahren, sichern oder weitergeben können. Die Suche durchsucht ein ganzes Klassenzimmer und ignoriert Akzente sowie Groß- und Kleinschreibung.',
  },

  privacy: {
    h2: 'Nichts verlässt Ihren Browser.',
    p1: '<strong>Kein Server, kein Konto, keine Analyse</strong> – es gibt schlicht nichts, wohin etwas gesendet werden könnte. Alles landet im lokalen Speicher Ihres eigenen Geräts, und eine Deinstallation löscht alles.',
    p2: 'Netzwerkanfragen stellt sie nur auf der Preply-Stundenseite, die Sie ohnehin geöffnet haben, um die Bilder aus Ihrem Canvas zu kopieren.',
  },

  faq: {
    h2: 'Häufige Fragen',
    items: [
      {
        q: 'Wie exportiere ich ein Preply Canvas?',
        a: 'Installieren Sie die Erweiterung und öffnen Sie das Canvas der Stunde auf Preply. Klicken Sie auf die Archiv-Schaltfläche rechts in der Canvas-Symbolleiste, oder lassen Sie die Seite automatisch speichern. Öffnen Sie dann das Archiv über das Symbol der Erweiterung und wählen Sie <strong>Drucken / PDF</strong> oder im Menü ⋯ <strong>Als HTML exportieren</strong>.',
      },
      {
        q: 'Kann ich meine Notizen aus Preply Canvas herunterladen?',
        a: 'Ja. Jede archivierte Seite lässt sich als eigenständige HTML-Datei samt Bildern exportieren oder über den Druckdialog als PDF speichern.',
      },
      {
        q: 'Wie komme ich nach der Stunde an mein Preply Canvas?',
        a: 'Jede Seite, die bei installierter Erweiterung erfasst wurde, bleibt in Ihrem Archiv: Ein Klick auf das Symbol der Erweiterung öffnet es jederzeit. Seiten, die nie bei installierter Erweiterung geöffnet wurden, kann sie nicht wiederherstellen.',
      },
      {
        q: 'Kann ich ein Preply Canvas als PDF speichern?',
        a: 'Ja, an zwei Stellen: über die Druck-Schaltfläche, die die Erweiterung während der Stunde in der Canvas-Symbolleiste ergänzt, und über <strong>Drucken / PDF</strong> im Archiv. Wählen Sie im Druckdialog des Browsers „Als PDF speichern“.',
      },
      {
        q: 'Kann ich meine Preply-Notizen offline lesen?',
        a: 'Ja. Das Archiv liegt im Speicher Ihres Browsers, und die Ansicht geht nie online – Ihre Notizen öffnen sich auch ohne Verbindung.',
      },
      {
        q: 'Wo werden meine Notizen gespeichert?',
        a: 'Nur im lokalen Speicher Ihres Browsers, auf Ihrem Gerät. Es wird nichts hochgeladen. Beim Deinstallieren der Erweiterung wird das Archiv gelöscht – exportieren Sie also vorher die Seiten, die Sie behalten möchten.',
      },
    ],
  },

  hard: {
    h2: 'Was wirklich schwierig war.',
    items: [
      {
        h3: 'Versionen bleiben vollständig',
        p: 'Jede Speicherung wird vollständig und unabhängig abgelegt, nie als Kette von Unterschieden. Eine beschädigte Datei kostet eine Version, nicht den Verlauf dahinter.',
      },
      {
        h3: 'Eine Suche, die Polnisch kann',
        p: 'Akzente sowie Groß- und Kleinschreibung werden im ganzen Klassenzimmer ignoriert – und <code>ł</code> ist ein Buchstabe, den keine Normalisierung zerlegt. Tippen Sie <code>slonce</code>, finden Sie <code>słońce</code>.',
      },
      {
        h3: 'Zeilen brechen, wo sie brachen',
        p: 'Die Ansicht übernimmt Breite, Schriftgröße und Schriftart des Preply-Editors, sodass eine archivierte Seite genau so umbricht wie im Unterricht.',
      },
      {
        h3: 'Bilder, die überdauern',
        p: 'Preply liefert sie über Links aus, die ablaufen. Sie werden beim Erfassen kopiert, sonst würde das Archiv unbemerkt verfallen.',
      },
    ],
  },

  source: {
    h2: 'Aus dem Quellcode ausführen.',
    intro: 'Die drei Store-Einträge sind der übliche Weg. Dies ist der andere – um den Code zu lesen, ihn zu ändern oder auszuführen, was auf <code>master</code> liegt, bevor ein Store es hat. Die Prüfung dauert Tage, ein Branch keine Minute.',
    firefox: '<code>about:debugging</code> → Dieser Firefox → Temporäres Add-on laden… → <code>src/manifest.json</code> wählen. Nach einem Neustart von Firefox ist es weg: Eine dauerhafte Installation muss signiert sein.',
    chromeTitle: 'Chrome und Edge',
    chrome: '<code>bash tools/package.sh</code> ausführen, dann <code>chrome://extensions</code> (oder <code>edge://extensions</code>) → Entwicklermodus → Entpackte Erweiterung laden → <code>dist/chrome/</code> wählen',
    noBuild: 'Kein Build-Schritt, kein Bundler, kein Minifier: <code>src/</code> ist, was ausgeliefert wird. Was Sie lesen, ist, was läuft.',
    past: 'Erfasst werden können nur Seiten, die Sie bei installierter Erweiterung öffnen. Vergangene Stunden sind außer Reichweite.',
  },

  thanks: {
    h2: 'Danke.',
    p: 'An Paula – für den Polnischunterricht und ein beeindruckendes Wissen über Sękacz – und an Shuang laoshi für den Chinesischunterricht. Dieses Werkzeug gibt es, um zu bewahren, was ich in ihrem Unterricht lerne.',
  },

  footer: {
    source: 'Quellcode',
    privacy: 'Datenschutz',
    icons: 'Icons von <a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: 'Inoffizielles Werkzeug, nicht mit Preply verbunden. Preply ist eine Marke ihres Inhabers.',
  },
};
