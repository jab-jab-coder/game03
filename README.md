# Barman – edycja 1

Zręcznościowa gra przeglądarkowa: stoisz za barem, klienci zamawiają drinki, a Ty musisz
jak najszybciej podać im właściwą butelkę albo piwo z kranu.

Czysty HTML + CSS + JavaScript (Canvas), **bez zależności i bez budowania**, więc działa
bezpośrednio na GitHub Pages, a nawet po dwukrotnym kliknięciu `index.html`.

## Sterowanie

| Klawisz | Akcja |
|---|---|
| `←` `→` (lub `A` `D`) | ruch za barem |
| `↑` `↓` (lub `W` `S`) | wybór półki: górna / środkowa / dolna |
| `Spacja` / `Enter` | weź butelkę · nalej piwo (przy kranie) · podaj klientowi |
| `X` / `Backspace` | odłóż to, co trzymasz |
| `P` / `Esc` | pauza |
| `M` | dźwięk wł./wył. |

Na telefonie pod planszą pojawiają się przyciski dotykowe.

## Zasady

- Klient zamawia jedną pozycję (np. „1× Wódka”, „1× Piwo”); pasek pod zamówieniem to jego cierpliwość.
- Podejdź do butelki, weź ją, podejdź do klienta i podaj. Piwo nalewasz z kranu na prawym końcu baru.
- Poprawne podanie: 50 pkt + do 100 pkt za szybkość, a do tego mnożnik combo za serię poprawnych podań.
- Pomyłka: −25 pkt i −1 życie. Klient, który się nie doczeka, też zabiera 1 życie.
- Co 6 obsłużonych klientów jest nowy poziom: klienci są mniej cierpliwi, przychodzą częściej i jest ich więcej naraz.
  Co 3. poziom oddaje jedno życie.
- Rekord zapisuje się w przeglądarce (localStorage).

## Półki

- **Górna:** whisky, wódka, rum, gin, tequila, koniak
- **Środkowa:** wino czerwone, wino białe, prosecco, wermut, likier ziołowy, amaretto
- **Dolna:** cola, tonik, sok pomarańczowy, sok jabłkowy, syrop grenadyna, woda gazowana
- **Bar:** kran z piwem

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
