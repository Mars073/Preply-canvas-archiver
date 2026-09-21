/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = {
  path: 'pl/',
  hreflang: 'pl',
  ogLocale: 'pl_PL',
  label: 'Polski',

  title: 'Zapisz i pobierz notatki z Preply Canvas — Preply Canvas Archiver',
  description: 'Zapisz notatki z lekcji w Preply Canvas, póki jeszcze masz do nich dostęp. Czytaj offline, zapisuj jako PDF lub HTML. Darmowe rozszerzenie.',
  ogTitle: 'Zapisz i pobierz notatki z Preply Canvas',
  ogDescription: 'Zrób kopię swojego Preply Canvas, póki masz do niego dostęp — i czytaj ją offline, drukuj do PDF albo eksportuj.',
  ogImageAlt: 'Archiwum klasy w Preply i zapisana strona Canvas.',
  ldDescription: 'Rozszerzenie przeglądarki, które zapisuje na twoim komputerze strony Canvas z lekcji w Preply, żeby można je było czytać offline, drukować do PDF albo eksportować do HTML — razem ze wszystkimi wersjami.',

  skip: 'Przejdź do treści',
  navLabel: 'Język',

  h1: 'Zapisz i pobierz notatki z <em>Preply Canvas</em>',
  sub: 'Twój Canvas może wciąż gdzieś w Preply być. Tylko spróbuj go potem znaleźć. Zrób kopię, póki masz do niego dostęp — a potem przeczytasz ją offline, wydrukujesz do PDF albo wyeksportujesz.',
  addChrome: 'Dodaj do Chrome',
  addFirefox: 'Dodaj do Firefoksa',
  addEdge: 'Dodaj do MS Edge',
  shotAlt: 'Archiwum: po lewej strony jednej klasy, po prawej zapisana strona, a nad nią powiększenie, historia i drukowanie.',
  shotCap: 'Jedna klasa na nauczyciela, każda strona tylko raz, a wszystkie jej wersje na wyciągnięcie ręki.',

  how: {
    h2: 'Zapisz Preply Canvas, póki masz do niego dostęp',
    p: 'W trakcie lekcji Preply Canvas Archiver dodaje do paska narzędzi Canvas przycisk archiwizacji. Wystarczy jedno kliknięcie, żeby zapisać stronę w przeglądarce. A jeśli zapomnisz — nic się nie stanie: każda strona, którą otworzysz lub edytujesz, zapisze się sama, gdy przez minutę nic się na niej nie zmieni. Tuż obok jest przycisk drukowania, żeby jeszcze przed końcem lekcji mieć PDF.',
    shotAlt: 'Pasek narzędzi Canvas w Preply z dwoma nowymi przyciskami po prawej (drukowanie i archiwizacja), obwiedzionymi na różowo z podpisem „Extra buttons”.',
    cap: 'To wszystko, co rozszerzenie dodaje do Preply — w tym samym stylu co istniejące przyciski.',
  },

  read: {
    h2: 'Notatki z lekcji offline, w PDF albo HTML',
    p1: 'Archiwum otworzysz w każdej chwili ikoną rozszerzenia, nawet bez internetu: wszystko jest zapisane w przeglądarce, a z Preply nic się przy tym nie łączy. Każda wersja strony zostaje zachowana, a w historii widać, co nauczyciel dopisał albo poprawił od ostatniego razu.',
    p2: 'Każdą stronę wydrukujesz do schludnego PDF albo wyeksportujesz jako jeden plik HTML, który łatwo przechować, skopiować czy komuś wysłać. A wyszukiwarka przeszukuje całą klasę i nie przejmuje się polskimi znakami ani wielkością liter.',
  },

  privacy: {
    h2: 'Nic nie wychodzi poza twoją przeglądarkę',
    p1: '<strong>Bez serwera, bez konta, bez statystyk</strong> — po prostu nie ma dokąd wysyłać twoich danych. Wszystko zostaje na twoim komputerze, a odinstalowanie rozszerzenia wszystko usuwa.',
    p2: 'Rozszerzenie łączy się z siecią tylko na otwartej już stronie lekcji w Preply, żeby skopiować obrazy z twojego Canvas.',
  },

  faq: {
    h2: 'Najczęstsze pytania',
    items: [
      {
        q: 'Jak wyeksportować Canvas z Preply?',
        a: 'Zainstaluj rozszerzenie i otwórz Canvas swojej lekcji w Preply. Kliknij przycisk archiwizacji po prawej stronie paska narzędzi Canvas albo zdaj się na automatyczny zapis. Potem otwórz archiwum ikoną rozszerzenia i wybierz <strong>Drukuj / PDF</strong> albo, w menu ⋯, <strong>Eksportuj do HTML</strong>.',
      },
      {
        q: 'Czy da się pobrać notatki z Preply Canvas?',
        a: 'Tak. Każdą zarchiwizowaną stronę możesz wyeksportować jako samodzielny plik HTML, razem z obrazami, albo zapisać jako PDF w oknie drukowania.',
      },
      {
        q: 'Jak dostać się do Canvas z Preply po lekcji?',
        a: 'Wszystkie strony zapisane, gdy rozszerzenie było zainstalowane, zostają w archiwum — wystarczy kliknąć ikonę rozszerzenia. Strony, której nigdy nie otwarto przy zainstalowanym rozszerzeniu, nie da się jednak odzyskać.',
      },
      {
        q: 'Czy mogę zapisać Canvas z Preply jako PDF?',
        a: 'Tak, na dwa sposoby: przyciskiem drukowania, który w trakcie lekcji pojawia się na pasku Canvas, albo opcją <strong>Drukuj / PDF</strong> w archiwum. W oknie drukowania przeglądarki wybierz „Zapisz jako PDF”.',
      },
      {
        q: 'Czy mogę czytać notatki z Preply offline?',
        a: 'Tak. Archiwum jest przechowywane w przeglądarce i nigdy nie łączy się z internetem, więc notatki otworzysz także bez połączenia.',
      },
      {
        q: 'Gdzie są przechowywane moje notatki?',
        a: 'Wyłącznie w lokalnej pamięci przeglądarki, na twoim komputerze. Nic nie trafia do sieci. Uwaga: odinstalowanie rozszerzenia usuwa archiwum, więc najpierw wyeksportuj strony, które chcesz zachować.',
      },
    ],
  },

  hard: {
    h2: 'Co naprawdę było trudne',
    items: [
      {
        h3: 'Każda wersja w całości',
        p: 'Każdy zapis jest przechowywany w całości i niezależnie od innych, a nie jako ciąg zmian. Jeśli jakiś plik się uszkodzi, tracisz jedną wersję, a nie całą historię.',
      },
      {
        h3: 'Wyszukiwarka, która zna polski',
        p: 'Wyszukiwanie w całej klasie pomija polskie znaki i wielkość liter — łącznie z <code>ł</code>, którego żadna normalizacja Unicode nie rozkłada. Wpisz <code>slonce</code>, a znajdziesz <code>słońce</code>.',
      },
      {
        h3: 'Wierny układ strony',
        p: 'Archiwum odtwarza szerokość, rozmiar i krój pisma edytora Preply, więc wiersze łamią się dokładnie tak jak na lekcji.',
      },
      {
        h3: 'Obrazy, które nie znikają',
        p: 'Preply udostępnia obrazy przez linki, które wygasają. Rozszerzenie kopiuje je przy zapisie — inaczej z archiwum po cichu znikałyby kolejne ilustracje.',
      },
    ],
  },

  source: {
    h2: 'Instalacja z kodu źródłowego',
    intro: 'Najprościej zainstalować rozszerzenie ze sklepu twojej przeglądarki. Ale jeśli chcesz przejrzeć kod, coś w nim zmienić albo wypróbować wersję z <code>master</code> przed publikacją, możesz wczytać je samodzielnie — bez czekania kilku dni na weryfikację w sklepach.',
    firefox: 'Otwórz <code>about:debugging</code>, przejdź do „Ten Firefox” → „Wczytaj tymczasowy dodatek…” i wybierz <code>src/manifest.json</code>. Po ponownym uruchomieniu Firefoksa rozszerzenie zniknie: na stałe można instalować tylko podpisane dodatki.',
    chromeTitle: 'Chrome i Edge',
    chrome: 'Uruchom <code>bash tools/package.sh</code>, otwórz <code>chrome://extensions</code> (albo <code>edge://extensions</code>), włącz „Tryb dewelopera”, kliknij „Załaduj rozpakowane” i wskaż folder <code>dist/chrome/</code>.',
    noBuild: 'Żadnej kompilacji ani minifikacji: folder <code>src/</code> to dokładnie to, co trafia do sklepów. Kod, który czytasz, to kod, który działa.',
    past: 'Rozszerzenie zapisuje tylko strony otwarte po jego instalacji — wcześniejszych lekcji nie da się odzyskać.',
  },

  thanks: {
    h2: 'Podziękowania',
    p: 'Dla Pauli — za lekcje polskiego i niezrównaną wiedzę o sękaczu — oraz dla Shuang laoshi za lekcje chińskiego. To narzędzie powstało, żeby zachować to, czego uczę się na tych lekcjach.',
  },

  footer: {
    source: 'Kod źródłowy',
    privacy: 'Prywatność',
    icons: 'ikony: <a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: 'Nieoficjalne narzędzie, niezwiązane z Preply. Preply jest znakiem towarowym swojego właściciela.',
  },
};
