# FOLIO — lokalne portfolio React

React + Vite. Fonty i grafiki serwowane lokalnie. Bez konfiguracji Sites.

## Uruchomienie

```powershell
cd E:\Folio26\portfolio
npm.cmd install
npm.cmd run dev
```

Domyślny adres: http://127.0.0.1:5173. Serwer nasłuchuje wyłącznie lokalnie.
`npm.cmd run build` tworzy pliki produkcyjne w `dist`.

## Edycja

- `src/App.jsx`: układ, opis, galeria, podgląd.
- `src/assets/prace/<kategoria>/`: każdy niepusty folder jest kategorią. Plik `main` to okładka i pierwszy slajd; pozostałe materiały tworzą karuzelę w kolejności nazw plików. JPG, JPEG, PNG, WebP, AVIF oraz MP4 i WebM są obsługiwane. Bez pliku main pierwszy materiał w kolejności nazw służy jako tymczasowa okładka. Filmy są kompresowane do MP4 i odtwarzane z kontrolkami, bez automatycznego uruchamiania. Oryginały pozostają bez zmian.
- `npm.cmd run assets:works`: przygotowuje WebP i katalog kategorii po dodaniu plików do działającej sesji. Wykonuje się też automatycznie przed `dev` i `build`. Oryginały pozostają bez zmian. `src/works.js` łączy katalog z adresami grafik Vite.
- `npm.cmd run assets:works -- --force`: ponownie generuje wszystkie podglądy po zmianie wymiarów materiałów, niezależnie od cache. W folderze `animacja` każdy plik jest osobnym kafelkiem, otwierającym swój odtwarzacz bez zbędnych strzałek i miniatur.
- `src/style.css`: terminal i efekt kineskopu.
- `src/MonitorFrame.jsx` i `src/monitor-frame.css`: obudowa z ośmiu oryginalnych PNG w `src/assets`. Cztery narożniki zachowują wspólną skalę, krawędzie rozciągają się tylko wzdłuż swojej osi; przezroczysty środek pokazuje ekran pod spodem. Grubość ramki ustala `--frame-unit`.
- `src/ScreenReflections.jsx`: dziewięć plików `screen_01`–`screen_09` jako refleksy nad ekranem, pod obudową. Wspólna siatka z ramką zapewnia dopasowanie przy zmianie rozmiaru. `mix-blend-mode: screen`, przezroczystość `--reflection-opacity: 0.22` w `src/monitor-frame.css`. Warstwa nie przechwytuje interakcji i nie przewija się z galerią.

Podgląd kategorii obsługuje miniatury, strzałki, Escape i gest poziomy. Animacje respektują ustawienie ograniczonego ruchu. Okładki obrazów mają do 900 × 1200 px, slajdy do 2400 × 2400 px bez zmiany proporcji i bez powiększania małych oryginałów. WebP slajdów ma jakość 88, okładek 85. Kategoria `logotypes` wykorzystuje kanał alfa grafik jako maskę CSS: logotypy mają dokładnie kolor `--green` (`#b3d18b`), również w miniaturach i karuzeli. Oryginalne kolory plików pozostają zachowane.

## Rotacja okładek

`src/RotatingArtwork.jsx` zmienia okładki losowo co 3,5–6 sekund. Pierwsza zmiana następuje po około 2–4 sekundach. Plik main jest pierwszym widokiem; kolejne materiały są wybierane bez bezpośrednich powtórzeń. Obraz dekodowany jest przed przejściem (650 ms), a proporcje kafelka pozostają stałe. Kliknięcie otwiera karuzelę od aktualnie prezentowanej pracy.

Rotacja zatrzymuje się przy fokusie, otwarciu karuzeli, ukryciu karty, wyjściu kafelka poza widoczny obszar oraz po użyciu przycisku AUTO. Najechanie jej nie zatrzymuje. `prefers-reduced-motion` wyłącza przenikanie, ale zdjęcia nadal się zmieniają. Filmy mają nieruchome podglądy, bez automatycznego odtwarzania.

## Kompresja plików

`scripts/optimize-video.mjs` przygotowuje filmy automatycznie w ramach `assets:works`: H.264, CRF 26, preset slow, maksymalny wymiar 1280 px, zachowane proporcje, bez powiększania, do 30 kl./s (oryginalne 24 kl./s pozostają), dźwięk AAC 96 kb/s i `faststart`. FFmpeg i FFprobe są lokalnymi zależnościami deweloperskimi. Istniejące mniejsze MP4 zachowujemy, jeśli ponowne kodowanie zwiększyłoby plik. Gotowe kopie są cache’owane; oryginały nie są zmieniane.

Strona importuje zoptymalizowane WebP z `src/assets/optimized`; oryginalne PNG w `src/assets` zostają do dalszej edycji i nie trafiają do kompilacji. Ponowne wygenerowanie: `npm.cmd run assets:optimize` (sharp). Ramka: jakość 85, refleksy: 72, kanał alfa: 100. Narożniki mają połowę wymiarów oryginału, poziome krawędzie do 2400 px, pionowe do 1800 px, środek refleksów 1600 × 1400 px. Cały zestaw: 158 620 bajtów zamiast 9,34 MiB PNG.

## Zakrzywienie CRT

Branch `feature/crt-curvature`. `CrtScreen.jsx` nakłada rzeczywiste przemieszczenie pikseli SVG na stały obszar ekranu; przewijany dokument pozostaje HTML-em. Mapa sterująca ma 256 × 256 próbek i powstaje lokalnie wyłącznie przy zmianie wymiarów. Nie jest obrazem strony: SourceGraphic, tekst i prace nadal renderuje przeglądarka w natywnym DPR. Interpolacja mapy z wyrównaniem środków pikseli zachowuje tę samą projekcję; test sprawdza zgodność z korektą kliknięć do 0,5 piksela CSS w widokach do 2560 px. Nie ma pętli animacji ani zrzutów DOM do tekstury. Hover jest sprawdzany najwyżej raz na klatkę, z cache wymiarów. Obszar renderowania, refleksy i przejścia okładek mają ograniczone obszary przerysowania oraz wskazówki kompozycji dla przeglądarki.

Przycisk CRT ON/OFF w obudowie przełącza efekt. Powiększenie grafiki otwiera się poza filtrem. Parametr `curvature` w `CrtScreen.jsx` kontroluje siłę (desktop 0.075, mały ekran 0.055). `crtMath.js` opisuje projekcję używaną także do korekty kliknięć. Testy matematyki: `npm.cmd test`.

Przekształcenie obrazu wymaga interpolacji, więc idealnie bezstratna ostrość jest niemożliwa. Nie stosujemy dodatkowego rozmycia, aberracji ani obniżania rozdzielczości zawartości. Wygląd, płynność przewijania oraz filtrowanie HTML wymagają sprawdzenia w docelowej przeglądarce, szczególnie Safari/Firefox. Klawiatura działa na oryginalnych elementach DOM. Korekta kliknięć obejmuje zwykły klik/tap; zaznaczanie tekstu i menu kontekstowe pozostają w układzie DOM.
