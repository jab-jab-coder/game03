# Barman – edycja 1

Zręcznościowa gra przeglądarkowa: stoisz za barem, klienci zamawiają drinki, a Ty musisz
jak najszybciej podać im właściwą butelkę albo piwo z kranu.

Czysty HTML + CSS + JavaScript (Canvas), **bez zależności i bez budowania**, więc działa
bezpośrednio na GitHub Pages, a nawet po dwukrotnym kliknięciu `index.html`.

## Bary do wyboru

W menu wybierasz planszę (kliknięciem, strzałkami ← → albo padem). Wybór zapamiętuje się w przeglądarce.

- **Bar klasyczny:** ceglana ściana, szafa z lustrem, złoty szyld PSOTA, chromowany kran.
- **PSOTA:** odwzorowanie prawdziwego baru: korkowy sufit z belkami, siatką i lampkami, złote litery
  z pogniecionej folii wśród liści, tęczowa flaga i kwiaty, podświetlana drewniana szafa z gęsto
  ustawionymi butelkami, kafle, automat do shotów, kosze z cytrusami, kartonowe tabliczki, zielone
  tabliczki o sprzedaży alkoholu, miedziany kran z gałką „IPA” i czarny blat z matami.

W pauzie i po końcu gry przycisk **Menu / Zmień bar** wraca do wyboru planszy.

## Sterowanie

| Klawisz | Akcja |
|---|---|
| `←` `→` (lub `A` `D`) | ruch za barem |
| `↑` `↓` (lub `W` `S`) | wybór półki: górna / środkowa / dolna |
| `Spacja` / `Enter` | weź butelkę · nalej piwo (przy kranie) · podaj klientowi |
| `X` / `Backspace` | odłóż to, co trzymasz |
| `P` / `Esc` | pauza |
| `M` | dźwięk wł./wył. |

### Gamepad

Działa każdy kontroler obsługiwany przez przeglądarkę (Gamepad API, standardowe mapowanie: Xbox, PlayStation, większość padów USB/Bluetooth).
Po podłączeniu naciśnij dowolny przycisk na padzie, żeby przeglądarka go wykryła.

| Przycisk | Akcja |
|---|---|
| krzyżak / lewa gałka | ruch (przytrzymanie = ciągły ruch) i wybór półki |
| `A` (✕ na PlayStation) | weź · nalej · podaj · start gry |
| `B` / `X` (○ / □) | odłóż |
| `Start` | pauza / start gry |
| `Select` / `Back` | dźwięk wł./wył. |

Na telefonie pod planszą pojawiają się przyciski dotykowe.

## Zasady

- Klient zamawia jedną pozycję (np. „1× Wódka”, „1× Piwo”); pasek pod zamówieniem to jego cierpliwość.
- Podejdź do butelki, weź ją, podejdź do klienta i podaj. Piwo nalewasz z kranu na prawym końcu baru.
- Poprawne podanie: 50 pkt + do 100 pkt za szybkość, a do tego mnożnik combo za serię poprawnych podań.
- Pomyłka: −25 pkt i −1 życie. Klient, który się nie doczeka, też zabiera 1 życie.
- Co 6 obsłużonych klientów jest nowy poziom: klienci są mniej cierpliwi, przychodzą częściej i jest ich więcej naraz.
  Co 3. poziom oddaje jedno życie.
- Rekord zapisuje się w przeglądarce (localStorage).

### Koktajle: Whiskey Sour i Rum Sour

1. Podejdź do shakera (lewy koniec baru) i weź go (Spacja).
2. Przy wiaderku z lodem dosyp lód.
3. Dodaj whisky (Whiskey Sour) albo rum (Rum Sour) z górnej półki.
4. Dodaj **sweet**, a potem **sour** z dolnej półki.
5. Zrób shake, shake, shake: Spacja ×3.
6. Podejdź do klienta i podaj.

Kolejność jest ścisła. Zły składnik nie trafi do shakera, a gra podpowie, co dodać teraz.
`X` wylewa zawartość i odstawia shaker. Koktajlowi klienci są cierpliwsi (×2,2),
a za koktajl dostaje się więcej punktów (120 + do 180 za szybkość).

## Półki

- **Górna:** szklanki (dekoracja), whisky, wódka, rum, gin, tequila, koniak
- **Środkowa:** cytryny i limonki (dekoracja), wino czerwone, wino białe, prosecco, wermut, likier ziołowy, amaretto
- **Dolna:** sweet, sour, cola, tonik, sok pomarańczowy, sok jabłkowy, syrop grenadyna, woda gazowana
- **Bar:** shaker i wiaderko z lodem (lewa strona), kran z piwem (prawa strona)

## Uruchomienie lokalne

Wystarczy otworzyć `index.html` w przeglądarce.

## Wdrożenie na GitHub Pages

1. Utwórz repozytorium na GitHubie i wypchnij do niego zawartość tego folderu:
   ```bash
   git init
   git add .
   git commit -m "Barman – edycja 1"
   git branch -M main
   git remote add origin https://github.com/<twoj-login>/<repo>.git
   git push -u origin main
   ```
2. W repozytorium otwórz **Settings → Pages**.
3. W **Build and deployment** wybierz *Source: Deploy from a branch*, gałąź `main` i folder `/ (root)`, a potem **Save**.
4. Po około minucie gra będzie dostępna pod adresem `https://<twoj-login>.github.io/<repo>/`.

Plik `.nojekyll` wyłącza przetwarzanie przez Jekyll, więc pliki są serwowane bez zmian.

## Struktura

```
index.html      – strona, menu i panele
css/style.css   – wygląd strony
js/game.js      – logika, rysowanie (Canvas) i dźwięki (WebAudio)
```

Asortyment i rozmieszczenie butelek są zdefiniowane w tablicy `ITEMS` w `js/game.js`.
Tempo gry ustawia funkcja `params()`.
