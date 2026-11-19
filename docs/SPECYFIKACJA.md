# Barman – specyfikacja techniczna i plan rozwoju

Stan na: 19 listopada 2026 (commit `6c6cd32`).
Dokument opisuje, jak gra jest zbudowana dzisiaj, co w niej warto poprawić, jak mogłaby wyglądać wersja 2.0
i jak napisać podobną grę od zera z pomocą zespołu agentów AI. Na końcu jest rozdział „ELI5”, czyli
wszystko wytłumaczone najprościej, jak się da.

---

## 1. Czym jest gra

Zręcznościowa gra przeglądarkowa w barmana. Gracz chodzi wzdłuż baru, zdejmuje butelki z trzech półek,
nalewa piwo z kranu, robi koktajle w shakerze i podaje klientom to, co zamówili, zanim skończy się im cierpliwość.

| Cecha | Wartość |
|---|---|
| Platforma | przeglądarka (komputer, telefon), GitHub Pages lub plik lokalny |
| Technologia | HTML + CSS + czysty JavaScript, Canvas 2D, WebAudio, Gamepad API |
| Zależności | brak, brak kroku budowania |
| Rozmiar kodu | `js/game.js` ok. 2260 linii, `css/style.css` ok. 230, `index.html` ok. 100 |
| Tryby | 1 gracz, 2 graczy (barman + barmanka, wspólne punkty i życia) |
| Plansze (motywy) | „Bar klasyczny” i „PSOTA” (odwzorowanie prawdziwego baru) |
| Sterowanie | klawiatura (dwa zestawy), pady, przyciski dotykowe |
| Zapis | `localStorage`: rekord (osobno dla 1 i 2 graczy), wybrany bar, liczba graczy |

---

## 2. Architektura (stan obecny)

### 2.1 Pliki

```
index.html      – canvas 1280×720, nakładka z panelami (menu, pauza, koniec gry), przyciski dotykowe
css/style.css   – wygląd strony i paneli, skalowanie planszy do okna
js/game.js      – całość gry: dane, logika, rysowanie, dźwięk, wejście
.nojekyll       – GitHub Pages serwuje pliki bez przetwarzania
```

Cały `game.js` to jedna funkcja wywoływana od razu (IIFE) z `'use strict'`. Nic nie wycieka do
globalnego zakresu. Kod jest podzielony komentarzami-nagłówkami na sekcje:

| Sekcja | Co zawiera |
|---|---|
| Układ planszy | stałe geometrii: `W×H = 1280×720`, kolumny (`COLUMNS`, `COL_X`), wysokości blatu, czasy animacji |
| Asortyment | tablica `ITEMS`: każda pozycja ma `id`, półkę, kolumnę, rodzaj szkła, kolor płynu, wagę losowania i opis wyglądu butelki (`b`) |
| Narzędzia | `rr` (zaokrąglony prostokąt), `mulberry32` (deterministyczny generator liczb losowych), `layer()` (płótno poza ekranem), `fitFont` |
| Pamięć | rekordy w `localStorage` (każdy dostęp w `try/catch`) |
| Dźwięk | syntezator na WebAudio: oscylatory i szum, bez plików audio |
| Stan gry | jeden obiekt `S` (tryb, czas, punkty, życia, poziom, klienci, barmani `S.bts`) |
| Klienci | losowy wygląd, losowanie zamówienia według wag, pojawianie się przy wolnych miejscach `SEATS` |
| Akcje gracza | `input` → `doUse` / `doShake` / `doDrop` → `serve` |
| Pętla stanu | `startGame`, `endGame`, `update(dt)`, `levelUp`, `loseLife` |
| Rysowanie | funkcje `drawX(g, …)` dla butelek, szkła, rąk, shakera, kranu, postaci, klientów, dymków, HUD |
| Warstwy statyczne | `buildBg…` i `buildBar…`: tło i blat rysowane raz do płócien poza ekranem |
| Motywy | `THEMES` (`classic`, `psota`): półki, skala butelek, rodzaj kranu, funkcje budujące tło |
| Render | `render()` składa klatkę z warstw, `frame()` to pętla `requestAnimationFrame` |
| UI / wejście | panele HTML, klawiatura, dotyk, pady (z powtarzaniem przy przytrzymaniu) |

### 2.2 Przepływ jednej klatki

```
requestAnimationFrame
  └─ frame(now)
       ├─ dt = min(0.05 s, czas od poprzedniej klatki)   ← ochrona przed „skokiem” po zmianie karty
       ├─ pollGamepad(dt)                                 ← pady czytane co klatkę
       ├─ update(dt)  (tylko w trybie 'playing')
       │    ├─ barmani: ruch do kolumny, animacje, kolejka akcji
       │    ├─ klienci: cierpliwość maleje, stany enter → wait → happy/angry → leave
       │    ├─ napisy, toast, warunek końca gry
       │    └─ licznik pojawiania się nowych klientów (params())
       └─ render()
            BG (statyczne tło) → butelki na półkach → ramki wyboru → barmani
            → BAR (statyczny blat) → kran, shakery, lód → klienci i dymki → napisy → HUD → toast
```

### 2.3 Kluczowe decyzje projektowe

1. **Stała rozdzielczość logiczna 1280×720.** Wszystkie współrzędne są w tym układzie, a CSS skaluje płótno
   do okna. Upraszcza to rysowanie, ale na ekranach o innych proporcjach zostają pasy.
2. **Grafika w 100% proceduralna.** Nie ma żadnych plików graficznych. Wszystko (butelki, postacie, liście,
   złote litery, kafle) rysują funkcje Canvas 2D z prostych kształtów. Statyczne części planszy są rysowane raz
   do płócien poza ekranem (`BG`, `BAR`) i w każdej klatce tylko kopiowane, więc gra jest lekka.
3. **Deterministyczna „losowość” dekoracji.** Tło PSOTA używa `mulberry32` z ustalonym ziarnem, więc liście
   i butelki dekoracyjne wyglądają za każdym razem tak samo.
4. **Dane w tablicach, logika w funkcjach.** Asortyment (`ITEMS`) i tempo (`params()`) są w jednym miejscu,
   więc łatwo dodać butelkę albo zmienić trudność.
5. **Dźwięk syntetyzowany.** Krótkie tony i szum zamiast nagrań: zero plików, zero ładowania.
6. **Kolumny zamiast swobodnego ruchu.** Bar to 11 kolumn; postać skacze płynnie między nimi. Dzięki temu
   sterowanie jest precyzyjne na klawiaturze, padzie i dotyku.
7. **Motyw = zestaw funkcji.** Nowy bar to nowy wpis w `THEMES` z własnym `buildBg`/`buildBar` i parametrami
   półek. Postacie na planszy PSOTA mają osobny wygląd (`drawPsotaPerson`).

### 2.4 Model rozgrywki (liczby)

| Parametr | Wzór / wartość |
|---|---|
| Cierpliwość klienta | `max(7, 20 − 1,6·(poziom−1))` s; koktajl ×2,2 |
| Odstęp między klientami | `max(1,4, 4,6 − 0,4·(poziom−1))` s (we dwoje ×0,7, min. 1,0), z losowym rozrzutem ±30% |
| Maks. klientów naraz | `min(5, 1 + ⌈poziom/2⌉)`; we dwoje +1, maks. 6 |
| Nowy poziom | co 6 obsłużonych (we dwoje co 9); co 3. poziom +1 życie |
| Punkty | zwykły: 50 + do 100 za szybkość; koktajl: 120 + do 180; mnożnik combo do ×1,5 |
| Kara | pomyłka: −25 pkt i −1 życie; klient, który odszedł: −1 życie |
| Życia | 3 |

---

## 3. Co można poprawić technicznie

Uporządkowane od największego zysku.

1. **Podział `game.js` na moduły ES** (`<script type="module">` działa na GitHub Pages bez budowania):
   `config.js`, `items.js`, `state.js`, `logic.js`, `render/*.js`, `themes/classic.js`, `themes/psota.js`,
   `audio.js`, `input.js`. Dziś jeden plik 2260 linii utrudnia pracę zarówno ludziom, jak i agentom AI.
   Uwaga: moduły nie działają z `file://` w niektórych przeglądarkach, więc lokalnie trzeba by uruchamiać
   prosty serwer (`python -m http.server`).
2. **Oddzielenie logiki od rysowania.** Dziś `update()` i `render()` są rozdzielone, ale logika woła `sfx`,
   `toast` i DOM (`endGame` pisze do elementów HTML). Lepiej: logika emituje zdarzenia (`served`, `lifeLost`,
   `levelUp`), a dźwięk, napisy i UI je subskrybują. To umożliwia testy bez przeglądarki.
3. **Testy automatyczne.** Brak jakichkolwiek testów. Proponowane:
   - testy jednostkowe logiki (kolejność składników koktajlu, punktacja, `params()`, blokada butelki we dwoje);
   - test „bota”: symulacja 5 minut gry z prostą strategią i sprawdzenie, że gra się nie zawiesza;
   - testy wizualne: zrzuty ekranu z przeglądarki bez okna (headless) dla każdego motywu i porównanie z wzorcem.
4. **Stały krok symulacji.** `update(dt)` dostaje zmienny `dt` (przycięty do 50 ms). Stały krok (np. 1/120 s
   z akumulatorem) da identyczne zachowanie na 60 Hz i 144 Hz oraz umożliwi powtórki.
5. **Ziarno losowania dla rozgrywki.** Klienci używają `Math.random`. Ziarno (`mulberry32`) pozwoliłoby na
   „wyzwanie dnia” (wszyscy grają ten sam układ) i odtwarzanie błędów.
6. **Pamięć podręczna dla postaci i nadruków.** Twarze i koszulki PSOTA są rysowane od zera w każdej klatce.
   Działa płynnie, ale można je wyrenderować raz do małych płócien (osobno głowa, tułów, ręce) i tylko kopiować.
7. **Ostrość na ekranach o dużej gęstości pikseli.** Płótno ma stałe 1280×720 i jest rozciągane przez CSS.
   Na telefonach i ekranach Retina obraz jest lekko rozmyty. Rozwiązanie: rozmiar płótna × `devicePixelRatio`
   i `ctx.scale(dpr, dpr)`.
8. **Dostępność.** Tryb dla daltonistów (butelki mają dziś też napisy, ale paski cierpliwości to tylko kolor),
   regulacja tempa, większe napisy, opcja wyłączenia mrugania i trzęsienia.
9. **Internacjonalizacja.** Teksty są wpisane w kod po polsku. Słownik `pl`/`en` w jednym pliku ułatwi tłumaczenie.
10. **PWA.** `manifest.json` + service worker: instalacja na telefonie i gra bez internetu.
11. **Jakość kodu.** ESLint + Prettier, JSDoc z typami (sprawdzane przez TypeScript w trybie `checkJs`),
    bez wprowadzania kroku budowania.

---

## 4. Grywalność: na czym polega i co poprawić

### 4.1 Na czym polega (moja ocena)

Gra działa, bo łączy trzy rzeczy:

1. **Presja czasu z jasną informacją zwrotną.** Każdy klient ma widoczny pasek cierpliwości. Gracz zawsze wie,
   kto jest najpilniejszy, i sam decyduje, kogo obsłużyć pierwszego. To jest rdzeń gry: **ustalanie priorytetów
   pod presją**.
2. **Mapa w głowie.** Butelki stoją zawsze w tych samych miejscach. Po kilku rundach gracz przestaje szukać i
   zaczyna „grać palcami”. Poczucie rosnącej biegłości to główna nagroda.
3. **Ryzyko i nagroda.** Koktajl to 6 kroków, ale daje ok. 2,5× więcej punktów i klient czeka dłużej.
   Combo nagradza serię bez błędów. Gracz cały czas wybiera: bezpiecznie czy za więcej punktów.

W trybie dwóch graczy dochodzi czwarty element: **komunikacja** („ja biorę piwa, ty koktajle”), blokada
wspólnej butelki i jednego kranu tworzą naturalne konflikty.

### 4.2 Słabe strony i propozycje

| Problem | Propozycja |
|---|---|
| Każde zamówienie to jedna pozycja, a większość to „podaj butelkę”, więc po kilku minutach robi się monotonnie | zamówienia złożone (2–3 pozycje dla jednego klienta), drinki z dwóch składników (gin z tonikiem, whisky z colą, Aperol Spritz) |
| Pomyłka jest bardzo bolesna (życie), a brak cierpliwości tak samo | rozróżnić kary: pomyłka = utrata napiwku i combo; dopiero niezadowolony klient zabiera życie |
| Brak decyzji między rundami | sklep między poziomami za napiwki: szybsze buty, drugi kran, dłuższa cierpliwość stałych gości |
| Klienci różnią się tylko wyglądem | typy klientów: niecierpliwy biznesmen, stały gość (napiwek ×2), grupa (3 zamówienia naraz), „kontrola wieku” (trzeba odmówić) |
| Trudność rośnie tylko liczbowo | nowe mechaniki z poziomami: brudne szklanki do zmywania, kończący się lód, „happy hour” |
| Brak celu poza rekordem | gwiazdki za poziom, osiągnięcia, kampania barów |
| Słaba „soczystość” (game feel) przy dobrych podaniach | krótki przeskok kamery, iskry, dźwięk kasy rosnący z combo, klient pije i macha |
| Nie wiadomo, gdzie stoi butelka na początku | 30-sekundowy samouczek przy pierwszej grze, podświetlenie właściwej butelki na poziomie 1 |

### 4.3 Kolejne etapy i rundy (propozycja kampanii)

Każdy bar to „rozdział” z 5 nocami. Noc kończy się po określonym czasie (np. 3 minuty), a nie po utracie żyć,
i daje 1–3 gwiazdki za utarg.

| Rozdział | Nowe w tym rozdziale | Nowa mechanika |
|---|---|---|
| 1. Bar klasyczny | piwo, czyste alkohole | samouczek, podstawy |
| 2. PSOTA | Whiskey Sour, Rum Sour | shaker i kolejność składników |
| 3. Plaża | drinki z lodem kruszonym, owoce | blender (przytrzymaj przycisk do paska) |
| 4. Klub nocny | shoty dla grup | zamówienie grupowe: kilka szklanek naraz na tacy |
| 5. Hotelowy lobby bar | Martini, Negroni | mieszanie łyżką (rytm) i zmrożone szkło |
| 6. Festiwal | dwa bary obok siebie | przewijanie planszy, praca na zmianę we dwoje |
| Finał: „Konkurs barmański” | wszystko | sędziowie oceniają szybkość, dokładność i flair (triki z butelką) |

Tryby dodatkowe: **wyzwanie dnia** (to samo ziarno dla wszystkich), **nieskończony** (dzisiejszy tryb),
**zen** (bez żyć, do treningu), **wersus** (dwie osoby rywalizują o tych samych klientów).

---

## 5. Wersja 2.0: co zmienić

Proponowany zakres, w kolejności wdrażania:

1. **Fundamenty (bez widocznych zmian dla gracza):** moduły ES, zdarzenia zamiast bezpośrednich wywołań,
   stały krok symulacji, ziarno losowania, testy logiki i zrzutów ekranu, ostrość na ekranach HiDPI.
2. **System przepisów zamiast przypadków w kodzie.** Dziś koktajle są „zaszyte” w `STEP_HINT`, `stepOK`
   i `SOUR_BASE`. W 2.0 przepis to dane:
   ```js
   { id: 'gin_tonic', name: 'Gin z tonikiem', glass: 'highball',
     steps: [{ any: ['lod'] }, { any: ['gin'] }, { any: ['tonik'] }], tool: null, points: 90 }
   ```
   Jeden ogólny mechanizm obsłuży wszystkie drinki, a dodanie nowego to jeden wpis.
3. **Zamówienia złożone i typy klientów** (rozdział 4.2).
4. **Kampania z nocami, gwiazdkami i sklepem** (rozdział 4.3); zapis postępu w `localStorage`.
5. **Edytor/konfigurator baru w JSON:** układ kolumn, półek i stanowisk opisany danymi, a nie stałymi w kodzie.
6. **Oprawa:** muzyka (np. prosta pętla syntetyzowana albo plik), lepsze animacje postaci, efekty cząsteczkowe.
7. **Społeczność:** tabela wyników (wymaga serwera, np. darmowej bazy w chmurze) i link „wyzwij znajomego”
   z ziarnem w adresie URL.

Czego **nie** zmieniać: zero kroku budowania (lub minimalny), szybkie uruchamianie z GitHub Pages, sterowanie
kolumnami, czytelne paski cierpliwości.

---

## 6. Grafika: jak powstaje, jak ją zmieniać i ulepszać

### 6.1 Jak powstaje dzisiaj

Każdy element to funkcja, która dostaje kontekst płótna `g` i pozycję, a potem rysuje proste kształty:

```js
// przykład: kostka lodu
g.fillStyle = 'rgba(225,245,255,.92)';
rr(g, cx - 7, cy - 7, 14, 14, 3);   // zaokrąglony kwadrat
g.fill();
```

- **Prymitywy:** prostokąty, łuki, elipsy, krzywe Béziera, gradienty liniowe/radialne, przezroczystość.
- **Złożenie:** większe obiekty to złożenie mniejszych funkcji, np. koszulka barmana PSOTA to
  `psMonstera` + `psHibiscus` + `psToucan` + `psMacaw`, przycięte (`clip`) do kształtu tułowia.
- **Warstwy:** tło i blat są renderowane raz (`buildBgPsota`, `buildBarPsota`) do płócien poza ekranem.
  Postacie, butelki, klienci i napisy są rysowane w każdej klatce, bo się ruszają.
- **Kolejność = głębia:** to, co narysowane później, jest „bliżej”. Dlatego barman jest rysowany przed blatem
  (blat zasłania mu nogi), a klienci po blacie.
- **Animacja** to funkcja czasu: `Math.sin(S.time * 3)` daje oddech głowy, `lerp` przesuwa rękę do butelki,
  mrugnięcie to krótkie okno czasowe co 4,2 s.

### 6.2 Jak powstała plansza i postacie PSOTA (proces na zdjęciu)

1. Zdjęcie referencyjne → lista cech do odwzorowania (kolory, kształty, układ, napisy).
2. Cechy → paleta kolorów w stałych (`PSOTA_PEOPLE`, `LEAF_COLORS`) i funkcje rysujące dla każdego motywu
   (liść, hibiskus, papuga, eukaliptus).
3. Kod → zrzut ekranu z przeglądarki bez okna (Edge `--headless --screenshot`), także w powiększeniu
   (`transform: scale(3)`), żeby obejrzeć twarze.
4. Poprawki na podstawie zrzutu (np. lżejszy zarost, bez czarnych kropek na rękawach) i ponowny zrzut.

Ta pętla **„koduj → zrób zrzut → porównaj z referencją → popraw”** jest najważniejszą techniką przy grafice
pisanej kodem.

### 6.3 Jak zmieniać grafikę

| Co chcesz zmienić | Gdzie |
|---|---|
| Kolor/etykietę/kształt butelki | `ITEMS[…].b` (`w`, `h`, `color`, `label`, `lt`) |
| Wygląd klientów | `SKINS`, `HAIRS`, `randomLook()`, `drawCustomer()` |
| Postacie w klasycznym barze | `drawBartender()` (gałąź `else`) |
| Postacie w PSOTA | `PSOTA_PEOPLE`, `drawPsotaManHead`, `drawPsotaWomanHead`, `psPrintMan`, `psPrintWoman` |
| Tło/blat baru | `buildBgClassic`/`buildBarClassic` albo `buildBgPsota`/`buildBarPsota` |
| Nowy bar | nowy wpis w `THEMES` + dwie funkcje `build…` + karta w `index.html` |

### 6.4 Jak grafikę ulepszyć i usprawnić

1. **Paleta i tokeny kolorów.** Jedna tabela kolorów na motyw zamiast setek wartości w kodzie; łatwa zmiana
   nastroju (np. „noc”, „święta”).
2. **Cache sprite’ów.** Elementy, które się nie zmieniają w czasie (butelka, twarz bez mrugania, nadruk koszulki),
   renderować raz do małego płótna i kopiować `drawImage`. Szybciej i stabilniej na telefonach.
3. **HiDPI** (rozdział 3, punkt 7): ostre krawędzie na telefonach.
4. **Szkielet postaci.** Dziś ręce to odcinki od barku do dłoni. Prosty szkielet (bark → łokieć → dłoń, kinematyka
   odwrotna z dwóch kości) da naturalniejsze ruchy i pozwoli na flair (podrzucanie butelek).
5. **Oświetlenie i cienie.** Miękki cień pod butelkami i postaciami, poświata lampek (`globalCompositeOperation =
   'lighter'`), lekka winieta na krawędziach ekranu.
6. **Efekty cząsteczkowe:** krople przy nalewaniu, kostki lodu, konfetti przy combo. Prosta tablica cząstek
   z położeniem, prędkością i czasem życia.
7. **Grafika hybrydowa.** Tam, gdzie kod nie wystarcza (portrety, detale wnętrza), można wygenerować obraz
   (narzędzie graficzne lub generator AI), przyciąć i zapisać jako `.webp`, a kodem rysować tylko to, co się
   rusza. Trzeba wtedy pilnować licencji i spójności stylu.
8. **Testy wizualne** (rozdział 3, punkt 3): każda zmiana grafiki porównywana ze wzorcowym zrzutem, żeby
   przypadkiem nie zepsuć innego motywu.

### 6.5 Uwaga o wizerunku prawdziwych osób

Postacie PSOTA są wzorowane na zdjęciu prawdziwych osób. Przy publikowaniu gry warto mieć ich zgodę
na użycie wizerunku. To samo dotyczy nazwy i wystroju prawdziwego lokalu (szyld, wnętrze), jeśli gra miałaby
być rozpowszechniana szerzej niż prywatnie.

---

## 7. Plan: ta sama gra od zera z zespołem agentów AI

### 7.1 Założenie

Jeden „agent-orkiestrator” prowadzi projekt i rozdziela zadania wyspecjalizowanym agentom. Każdy agent ma
wąską rolę, jasno opisane wejście i wyjście oraz **automatyczny sposób sprawdzenia swojej pracy**.
Człowiek (właściciel gry) zatwierdza decyzje na końcu każdej fazy.

### 7.2 Role agentów

| Agent | Odpowiada za | Wyjście | Jak jest sprawdzany |
|---|---|---|---|
| Orkiestrator (producent) | plan, kolejność, przydział zadań, scalanie | plan zadań, decyzje | przegląd przez człowieka po każdej fazie |
| Projektant gry | zasady, liczby, poziomy, kampania | `docs/design.md`, tabele balansu (JSON) | symulacje bota (czy da się wygrać, czy nie za łatwo) |
| Architekt | struktura modułów, kontrakty danych, zdarzenia | szkielet repo, `docs/architektura.md` | lint, testy kontraktów |
| Programista logiki | stan gry, przepisy, klienci, punktacja | `src/logic/*` + testy | testy jednostkowe, bot 5 minut bez błędu |
| Programista renderu | pętla, warstwy, kamera, HiDPI | `src/render/*` | zrzuty ekranu, licznik FPS |
| Grafik proceduralny | funkcje rysujące, palety, motywy | `src/themes/*`, `src/art/*` | pętla zrzut → porównanie z referencją |
| Dźwiękowiec | efekty i muzyka (WebAudio) | `src/audio/*` | lista zdarzeń z dźwiękiem, odsłuch przez człowieka |
| Wejście i dostępność | klawiatura, pady, dotyk, ustawienia | `src/input/*` | testy symulowanych klawiszy, przegląd dostępności |
| Tester (QA) | gra w przeglądarce bez okna, raporty błędów | raporty, nagrania, zrzuty | odtwarzalne kroki błędu |
| Recenzent kodu | czytelność, błędy, wydajność | uwagi do zmian | zmiana nie przechodzi bez akceptacji |
| Dokumentalista | README, specyfikacja, instrukcje | `README.md`, `docs/*` | zgodność z kodem (przykłady uruchamiają się) |

### 7.3 Fazy

**Faza 0. Wizja (1 dzień).** Człowiek opisuje grę jednym akapitem i daje referencje (zdjęcia baru, gry
z gatunku). Projektant pisze jednostronicową wizję: gatunek, gracz docelowy, rdzeń rozgrywki, czego **nie**
robimy. Akceptacja człowieka.

**Faza 1. Prototyp „szare pudełka” (1–2 dni).** Architekt zakłada repo i moduły. Programista logiki robi
najprostszą wersję: prostokąty jako butelki, kółka jako klienci, paski cierpliwości. Cel: sprawdzić, czy
rdzeń jest zabawny, **zanim** powstanie jakakolwiek ładna grafika. Bot gra 100 rund, projektant stroi liczby.

**Faza 2. Pionowy wycinek (3–5 dni).** Jeden bar w pełnej jakości: grafika, dźwięk, menu, pad, dotyk.
Grafik pracuje w pętli ze zrzutami. Tester gra codziennie i zgłasza błędy. To jest wersja „do pokazania”.

**Faza 3. Treść (równolegle).** Nowe bary, przepisy, typy klientów, kampania. Ponieważ wszystko jest danymi,
agenci mogą pracować równolegle w osobnych gałęziach (każdy agent w swojej kopii repo, tzw. worktree),
a orkiestrator scala zmiany.

**Faza 4. Szlif i wydanie.** Balans na podstawie symulacji, dostępność, wydajność na telefonie, PWA,
dokumentacja, publikacja na GitHub Pages.

### 7.4 Zasady pracy, które sprawiają, że agenci się nie gubią

1. **Małe pliki, jasne granice.** Agent pracuje na 1–3 plikach naraz. Plik 2000+ linii to proszenie się o błędy.
2. **Kontrakty na piśmie.** Kształt stanu, lista zdarzeń, format przepisu: zapisane w `docs/` zanim powstanie kod.
3. **Każde zadanie kończy się dowodem:** zielone testy, zrzut ekranu albo nagranie. „Zrobione” bez dowodu się
   nie liczy.
4. **Jedna zmiana = jeden commit z opisem**, łatwo cofnąć.
5. **Referencje wizualne obok kodu** (`docs/referencje/`), żeby grafik i recenzent porównywali z tym samym.
6. **Człowiek decyduje o smaku.** Agenci proponują 2–3 warianty (np. wyglądu postaci), człowiek wybiera.
7. **Pamięć projektu:** plik z ustaleniami (styl, nazewnictwo, decyzje), który każdy agent czyta na starcie.

### 7.5 Przykładowe zadanie dla agenta-grafika

> Narysuj funkcję `drawLimeWedge(g, x, y, s)` w `src/art/fruit.js`: ćwiartka limonki, skórka `#4caf50`,
> miąższ `#cddc39` z białymi promieniami, rozmiar 24 px przy `s = 1`. Dodaj ją na brzegu szklanki gin z tonikiem.
> Dowód: zrzut ekranu w powiększeniu ×3 obok zdjęcia `docs/referencje/gin-tonic.jpg`. Nie zmieniaj innych plików.

Dobre zadanie ma: **co**, **gdzie**, **jak ma wyglądać** (liczby, kolory), **jak udowodnić** i **czego nie ruszać**.

---

## 8. ELI5: wszystko najprościej

**Czym jest gra?** Jesteś barmanem. Ludzie podchodzą i mówią, czego chcą. Biegniesz do półki, bierzesz butelkę
i dajesz im, zanim się znudzą i pójdą.

**Jak jest zbudowana?** Gra to jedna duża kartka z przepisami dla komputera (`game.js`). Komputer 60 razy na sekundę
robi dwie rzeczy: najpierw *myśli* („klient czeka już o sekundę dłużej, barman zrobił krok”), a potem *rysuje*
nowy obrazek. Szybko zmieniające się obrazki wyglądają jak film.

**Skąd są obrazki?** Nie ma żadnych zdjęć ani rysunków w plikach. Komputer dostaje instrukcję w stylu
„narysuj różowe kółko tutaj, a obok zielony owal”, jak dziecko z kredkami i szablonem. Z tysięcy takich kółek
i kresek powstaje bar, butelki i ludzie. Tło, które się nie rusza, rysujemy raz i potem tylko przyklejamy,
jak naklejkę, żeby komputer się nie męczył.

**Jak zrobiliśmy postacie ze zdjęcia?** Patrzyliśmy na zdjęcie i zapisywaliśmy: „łysa głowa, krótka broda,
biała koszulka z papugami”, „ciemne włosy do tyłu, różowa koszulka w listki”. Potem rysowaliśmy to kreskami,
robiliśmy zdjęcie ekranu, porównywaliśmy i poprawialiśmy, aż było podobnie.

**Co można poprawić w środku?** Ta jedna duża kartka jest za długa. Lepiej pociąć ją na mniejsze kartki:
osobno dźwięki, osobno rysunki, osobno zasady. Dodać też „automatycznego sprawdzacza”, który sam gra
i krzyczy, jeśli coś się zepsuje.

**Dlaczego gra jest fajna?** Bo zawsze musisz szybko wybrać, kogo obsłużyć pierwszego, i z każdą rundą
coraz lepiej pamiętasz, gdzie co stoi. Koktajl jest trudniejszy, ale daje więcej punktów, więc ciągle
zastanawiasz się, czy zaryzykować.

**Co by było fajniejsze?** Gdyby klienci zamawiali kilka rzeczy naraz, gdyby byli różni (niecierpliwy pan,
miła stała klientka, grupa na shoty), gdyby co noc był nowy bar z nową sztuczką (blender, mieszanie łyżką),
i gdyby za zarobione napiwki można było kupić coś, co pomaga.

**Wersja 2.0?** Najpierw sprzątamy w środku (żeby łatwo było dokładać), potem zamieniamy drinki w „przepisy
w zeszycie”, żeby nowy drink to był jeden wpis, a nie nowy kawałek programu. Potem kampania z barami i gwiazdkami.

**Jak by to zrobić z agentami AI?** Jak w prawdziwym studiu: jest szef, który rozdziela zadania, i pomocnicy,
z których każdy robi jedną rzecz: jeden wymyśla zasady, jeden pisze program, jeden rysuje, jeden robi dźwięki,
jeden testuje. Każdy musi pokazać dowód, że jego praca działa (test albo zdjęcie ekranu). Najpierw robimy
brzydką wersję z kwadracików, żeby sprawdzić, czy w ogóle jest fajnie, a dopiero potem upiększamy.
Właściciel gry na końcu każdego etapu mówi „tak, idziemy dalej” albo „poprawcie to”.
