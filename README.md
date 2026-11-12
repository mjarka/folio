# FOLIO / graphics terminal

Statyczne portfolio bez procesu budowania. Otwórz `dist/index.html` w przeglądarce lub serwuj katalog `dist` dowolnym serwerem HTTP.

## Podmiana zawartości

- Opis i nazwa: `dist/index.html`.
- Galeria: tablica `works` w `dist/app.js`. Dodaj `src: 'assets/nazwa.webp'`, rzeczywiste `width` i `height`, tytuł oraz kategorię. Zmień też demonstracyjne teksty alternatywne i usuń `.demo-note` po dodaniu własnych prac.
- Grafiki demonstracyjne powstają jako lokalne SVG. Nie są pracami autora portfolio.
- Fonty pobierane są z Google Fonts; przy braku sieci działają fonty systemowe.

## Obudowa

Obecna obudowa jest wykonana w CSS. Po dostarczeniu sześciu elementów graficznych należy dopasować warstwy narożników i krawędzi do ich faktycznego podziału, wymiarów i sposobu łączenia. Zmienne `--frame-*` w `dist/style.css` rezerwują punkty konfiguracji; nie stanowią jeszcze kompletnego szablonu dla nieznanych plików.

## Obsługa

Kliknięcie grafiki otwiera modal. Strzałki i gest poziomy zmieniają pracę, Escape zamyka podgląd. Przyciski nad galerią zmieniają liczbę kolumn na większych ekranach. Animacje respektują `prefers-reduced-motion`.
