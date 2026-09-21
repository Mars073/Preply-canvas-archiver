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
  description: 'Zapisz notatki z lekcji w Preply Canvas, póki masz do nich dostęp. Czytaj je offline, pobierz jako PDF lub HTML. Darmowe rozszerzenie przeglądarki.',
  ogTitle: 'Zapisz i pobierz notatki z Preply Canvas',
  ogDescription: 'Zachowaj lokalną kopię Preply Canvas, póki masz do niego dostęp: czytaj ją offline, drukuj do PDF, eksportuj.',
  ogImageAlt: 'Czytnik archiwum: strony jednej klasy i zarchiwizowana strona Preply Canvas.',
  ldDescription: 'Rozszerzenie przeglądarki, które zapisuje lokalnie strony Canvas z lekcji w Preply, żeby można je było czytać offline, drukować do PDF lub eksportować do HTML, z zachowaniem każdej wersji.',

  skip: 'Przejdź do treści',
  navLabel: 'Język',

  h1: 'Zapisz i pobierz notatki z <em>Preply Canvas</em>',
  sub: 'Twój Canvas może wciąż istnieć w Preply. Gorzej z tym, żeby go potem odnaleźć. Zapisz lokalną kopię, póki masz do niego dostęp — i czytaj ją offline, drukuj do PDF albo eksportuj.',
  addChrome: 'Dodaj do Chrome',
  addFirefox: 'Dodaj do Firefoksa',
  addEdge: 'Dodaj do MS Edge',
  shotAlt: 'Czytnik archiwum: strony klasy po lewej, zarchiwizowany dokument po prawej, a nad nim powiększenie, historia i drukowanie.',
  shotCap: 'Jedna klasa na nauczyciela. Każda strona na liście tylko raz, a za nią wszystkie jej wersje.',

  how: {
    h2: 'Zapisz Canvas z Preply, póki masz do niego dostęp.',
    p: 'W trakcie lekcji Preply Canvas Archiver dodaje do paska narzędzi Canvas przycisk archiwizacji. Jedno kliknięcie i strona jest zapisana w przeglądarce. A jeśli zapomnisz, każda otwarta lub edytowana strona zapisze się sama po minucie bez zmian. Obok jest przycisk drukowania — żeby mieć PDF, zanim wyjdziesz z lekcji.',
    shotAlt: 'Pasek narzędzi Canvas w Preply z dwoma dodatkowymi przyciskami po prawej, drukowania i archiwizacji, w różowej ramce z podpisem Extra buttons.',
    cap: 'Wszystko, co rozszerzenie dodaje do Preply, w stylu przycisków, które już tam są.',
  },

  read: {
    h2: 'Notatki z lekcji offline, w PDF albo HTML.',
    p1: 'Archiwum otworzysz ikoną rozszerzenia, kiedy tylko chcesz, nawet bez internetu: dane są czytane z przeglądarki, a czytnik nigdy nie łączy się z Preply. Każda wersja strony zostaje zachowana, a historia pokazuje, co nauczyciel dodał lub poprawił od poprzedniej.',
    p2: 'Każdą stronę wydrukujesz do czystego PDF albo wyeksportujesz jako jeden plik HTML, który możesz przechowywać, skopiować lub wysłać. Wyszukiwanie obejmuje całą klasę i nie zwraca uwagi na polskie znaki ani wielkość liter.',
  },

  privacy: {
    h2: 'Nic nie opuszcza twojej przeglądarki.',
    p1: '<strong>Bez serwera, bez konta, bez analityki</strong> — nie ma dokąd niczego wysyłać. Wszystko trafia do lokalnej pamięci na twoim komputerze, a odinstalowanie usuwa to wszystko.',
    p2: 'Jedyne zapytania sieciowe wykonuje na otwartej już stronie lekcji w Preply, żeby skopiować obrazy z twojego Canvas.',
  },

  faq: {
    h2: 'Najczęstsze pytania',
    items: [
      {
        q: 'Jak wyeksportować Canvas z Preply?',
        a: 'Zainstaluj rozszerzenie i otwórz Canvas lekcji w Preply. Kliknij przycisk archiwizacji po prawej stronie paska narzędzi Canvas albo poczekaj, aż strona zapisze się sama. Potem otwórz archiwum ikoną rozszerzenia i wybierz <strong>Drukuj / PDF</strong> albo <strong>Eksportuj do HTML</strong> z menu ⋯.',
      },
      {
        q: 'Czy mogę pobrać notatki z Preply Canvas?',
        a: 'Tak. Każdą zarchiwizowaną stronę można wyeksportować jako samodzielny plik HTML, razem z obrazami, albo zapisać jako PDF z okna drukowania.',
      },
      {
        q: 'Jak wrócić do Canvas z Preply po lekcji?',
        a: 'Każda strona zapisana, gdy rozszerzenie było zainstalowane, zostaje w archiwum: otworzysz je w każdej chwili, klikając ikonę rozszerzenia. Nie da się odzyskać stron, których nie otwarto przy zainstalowanym rozszerzeniu.',
      },
      {
        q: 'Czy mogę zapisać Canvas z Preply jako PDF?',
        a: 'Tak, na dwa sposoby: przyciskiem drukowania, który rozszerzenie dodaje do paska Canvas w trakcie lekcji, albo opcją <strong>Drukuj / PDF</strong> w archiwum. W oknie drukowania przeglądarki wybierz „Zapisz jako PDF”.',
      },
      {
        q: 'Czy mogę czytać notatki z Preply offline?',
        a: 'Tak. Archiwum jest przechowywane w przeglądarce, a czytnik nigdy nie łączy się z siecią, więc notatki otworzysz bez internetu.',
      },
      {
        q: 'Gdzie są przechowywane moje notatki?',
        a: 'Tylko w lokalnej pamięci przeglądarki, na twoim komputerze. Nic nie jest nigdzie wysyłane. Odinstalowanie rozszerzenia usuwa archiwum, więc najpierw wyeksportuj strony, które chcesz zachować.',
      },
    ],
  },

  hard: {
    h2: 'To, co naprawdę było trudne.',
    items: [
      {
        h3: 'Wersje w całości',
        p: 'Każdy zapis jest przechowywany w całości i niezależnie, nigdy jako łańcuch różnic. Uszkodzony plik to strata jednej wersji, a nie całej historii.',
      },
      {
        h3: 'Wyszukiwanie, które zna polski',
        p: 'Pomija polskie znaki i wielkość liter w całej klasie — a <code>ł</code> to litera, której żadna normalizacja nie rozkłada. Wpisz <code>slonce</code>, znajdź <code>słońce</code>.',
      },
      {
        h3: 'Wiersze łamią się tam, gdzie się łamały',
        p: 'Czytnik odtwarza szerokość, rozmiar i krój pisma edytora Preply, więc zarchiwizowana strona łamie się dokładnie tak jak na lekcji.',
      },
      {
        h3: 'Obrazy, które przetrwają',
        p: 'Preply udostępnia je przez linki, które wygasają. Są kopiowane w chwili zapisu — inaczej archiwum po cichu by niszczało.',
      },
    ],
  },

  source: {
    h2: 'Uruchamianie ze źródeł.',
    intro: 'Trzy sklepy z rozszerzeniami to główna droga. To jest ta druga — żeby czytać kod, zmieniać go albo uruchomić to, co jest na <code>master</code>, zanim trafi do sklepu. Weryfikacja trwa dni, gałąź — ani chwili.',
    firefox: '<code>about:debugging</code> → Ten Firefox → Wczytaj tymczasowy dodatek… → wybierz <code>src/manifest.json</code>. Znika po ponownym uruchomieniu Firefoksa: trwała instalacja wymaga podpisu.',
    chromeTitle: 'Chrome i Edge',
    chrome: 'uruchom <code>bash tools/package.sh</code>, potem <code>chrome://extensions</code> (albo <code>edge://extensions</code>) → Tryb dewelopera → Załaduj rozpakowane → wybierz <code>dist/chrome/</code>',
    noBuild: 'Bez kroku budowania, bundlera i minifikacji: <code>src/</code> to dokładnie to, co trafia do użytkownika. Co czytasz, to się uruchamia.',
    past: 'Zapisać można tylko strony otwarte przy zainstalowanym rozszerzeniu. Minione lekcje są poza zasięgiem.',
  },

  thanks: {
    h2: 'Podziękowania.',
    p: 'Dla Pauli — za lekcje polskiego i niezrównaną wiedzę o sękaczu — oraz dla Shuang laoshi, za lekcje chińskiego. To narzędzie powstało, żeby zachować to, czego się od nich uczę.',
  },

  footer: {
    source: 'Kod źródłowy',
    privacy: 'Prywatność',
    icons: 'ikony: <a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: 'Narzędzie nieoficjalne, niepowiązane z Preply. Preply jest znakiem towarowym swojego właściciela.',
  },
};
