/* Barman – edycja 1
 * Czysty JavaScript + Canvas, bez zależności. Działa z GitHub Pages i z pliku lokalnego.
 */
(() => {
  'use strict';

  // ===================== Układ planszy =====================
  const W = 1280, H = 720;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Kolumny, w których może stanąć barman:
  // 0 – shaker (na barze), 1 – wiaderko z lodem (na barze), 2..9 – półki, 10 – kran z piwem
  const SHAKER_COL = 0, ICE_COL = 1, TAP_COL = 10;
  const COLUMNS = [
    { x: 70, kind: 'shaker' },
    { x: 168, kind: 'ice' },
    ...Array.from({ length: 8 }, (_, i) => ({ x: 280 + i * 96, kind: 'shelf' })),
    { x: 1110, kind: 'tap' },
  ];
  const COLS = COLUMNS.length;
  const COL_X = COLUMNS.map(c => c.x);
  const SEATS = [0, 2, 4, 6, 8, 10];   // kolumny, przy których stają klienci
  const TAP_X = 1192;
  // Zależne od wybranego baru (motywu) – ustawiane w applyTheme()
  let SHELF_Y = [140, 250, 360]; // górna, środkowa, dolna (y deski)
  let BOTTLE_S = 1;              // skala butelek na półkach
  const SHELF_LEFT = 228, SHELF_RIGHT = 994;
  const BAR_TOP = 482, BAR_LIP = 500, BAR_FRONT = 512, BAR_BOTTOM = 625;
  const GLASS_BASE = 496;
  const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';

  const MOVE_SPEED = 1700;   // px/s
  const POUR_TIME = 0.8;     // s – nalewanie piwa
  const PICK_TIME = 0.22;    // s – animacja zdejmowania butelki
  const ADD_TIME = 0.32;     // s – dodanie składnika do shakera
  const SHAKE_TIME = 0.35;   // s – animacja jednego „shake”
  const SHAKES_NEEDED = 3;
  const MAX_LIVES = 3;
  const SERVES_PER_LEVEL = 6;

  // ===================== Asortyment =====================
  // b – geometria butelki: w/h korpus, sh ramię, nw/nh szyjka
  const ITEMS = [
    // Górna półka – mocne alkohole
    { id: 'whisky', name: 'Whisky', shelf: 0, col: 4, glass: 'tumbler', liquid: '#c47a22', weight: 2,
      b: { w: 46, h: 46, sh: 8, nw: 13, nh: 16, color: '#a35a17', alpha: .92, cap: '#2b1a0e', label: '#efe1bf', lt: 'WHISKY', ltc: '#5a2e0a' } },
    { id: 'wodka', name: 'Wódka', shelf: 0, col: 5, glass: 'shot', liquid: '#eef7ff', weight: 3,
      b: { w: 32, h: 52, sh: 12, nw: 11, nh: 18, color: '#dceefc', alpha: .6, cap: '#c62828', label: '#c62828', lt: 'WÓDKA', ltc: '#ffffff' } },
    { id: 'rum', name: 'Rum', shelf: 0, col: 6, glass: 'tumbler', liquid: '#8a4514', weight: 1.5,
      b: { w: 38, h: 48, sh: 10, nw: 12, nh: 16, color: '#5c2a0b', alpha: .95, cap: '#d4a017', label: '#f3d27a', lt: 'RUM', ltc: '#5c2a0b' } },
    { id: 'gin', name: 'Gin', shelf: 0, col: 7, glass: 'highball', liquid: '#eaf7f0', weight: 1.5,
      b: { w: 36, h: 50, sh: 9, nw: 13, nh: 15, color: '#7fc8b0', alpha: .6, cap: '#1d3b5a', label: '#1d3b5a', lt: 'GIN', ltc: '#e8f6ff' } },
    { id: 'tequila', name: 'Tequila', shelf: 0, col: 8, glass: 'shot', liquid: '#f2d27a', weight: 1,
      b: { w: 30, h: 56, sh: 8, nw: 12, nh: 14, color: '#f0c85a', alpha: .75, cap: '#8b5a2b', label: '#2e7d32', lt: 'TEQUILA', ltc: '#ffffff' } },
    { id: 'koniak', name: 'Koniak', shelf: 0, col: 9, glass: 'tumbler', liquid: '#a5521a', weight: 1,
      b: { w: 50, h: 40, sh: 14, nw: 12, nh: 16, color: '#86400f', alpha: .95, cap: '#c9a227', label: '#1b1b1b', lt: 'KONIAK', ltc: '#e8c460' } },

    // Środkowa półka – inne alkohole
    { id: 'wino_czerwone', name: 'Wino czerwone', shelf: 1, col: 4, glass: 'wine', liquid: '#8b1428', weight: 1.5,
      b: { w: 30, h: 46, sh: 12, nw: 10, nh: 24, color: '#3b0a12', alpha: .97, cap: '#7b1022', label: '#f5efe0', lt: 'ROSSO', ltc: '#7b1022' } },
    { id: 'wino_biale', name: 'Wino białe', shelf: 1, col: 5, glass: 'wine', liquid: '#f3e7a1', weight: 1.5,
      b: { w: 30, h: 46, sh: 12, nw: 10, nh: 24, color: '#b9c76a', alpha: .75, cap: '#d9c36a', label: '#fffbe8', lt: 'BIANCO', ltc: '#6b7a1a' } },
    { id: 'prosecco', name: 'Prosecco', shelf: 1, col: 6, glass: 'flute', liquid: '#f6eaa8', weight: 1,
      b: { w: 34, h: 48, sh: 12, nw: 12, nh: 20, color: '#2f5d2a', alpha: .95, cap: '#d4af37', label: '#f6f0d8', lt: 'PROSECCO', ltc: '#2f5d2a' } },
    { id: 'wermut', name: 'Wermut', shelf: 1, col: 7, glass: 'wine', liquid: '#c0392b', weight: 1,
      b: { w: 34, h: 52, sh: 10, nw: 12, nh: 16, color: '#7a1a14', alpha: .9, cap: '#222222', label: '#f2e6c9', lt: 'WERMUT', ltc: '#7a1a14' } },
    { id: 'likier', name: 'Likier ziołowy', shelf: 1, col: 8, glass: 'shot', liquid: '#4a3418', weight: 1,
      b: { w: 40, h: 46, sh: 8, nw: 13, nh: 14, color: '#1f3d1f', alpha: .97, cap: '#c8a03a', label: '#d9b14a', lt: 'ZIOŁOWY', ltc: '#1f3d1f' } },
    { id: 'amaretto', name: 'Amaretto', shelf: 1, col: 9, glass: 'tumbler', liquid: '#b8621e', weight: 1,
      b: { w: 40, h: 44, sh: 10, nw: 13, nh: 14, color: '#a8561a', alpha: .85, cap: '#e6e6e6', label: '#f3e3c3', lt: 'AMARETTO', ltc: '#7a3b10' } },

    // Dolna półka – składniki koktajli (butelki w kształcie klasycznej butelki po rumie)
    // weight: 0 – nikt nie zamawia ich osobno
    { id: 'sweet', name: 'Sweet', shelf: 2, col: 2, glass: 'shot', liquid: '#f5edc8', weight: 0,
      b: { w: 40, h: 52, sh: 7, nw: 13, nh: 20, color: '#efe6c0', alpha: .7, cap: '#1b1b1b', label: '#ffffff', lt: 'SWEET', ltc: '#b07a10' } },
    { id: 'sour', name: 'Sour', shelf: 2, col: 3, glass: 'shot', liquid: '#dfe86a', weight: 0,
      b: { w: 40, h: 52, sh: 7, nw: 13, nh: 20, color: '#cfe05a', alpha: .75, cap: '#1b1b1b', label: '#ffffff', lt: 'SOUR', ltc: '#4f7a10' } },

    // Dolna półka – softy, soki, syropy
    { id: 'cola', name: 'Cola', shelf: 2, col: 4, glass: 'highball', liquid: '#3a1d0e', weight: 1.5,
      b: { w: 28, h: 50, sh: 14, nw: 11, nh: 14, color: '#3a1d0e', alpha: .9, cap: '#d32f2f', label: '#d32f2f', lt: 'COLA', ltc: '#ffffff' } },
    { id: 'tonik', name: 'Tonik', shelf: 2, col: 5, glass: 'highball', liquid: '#eef8fb', weight: 1,
      b: { w: 28, h: 50, sh: 14, nw: 11, nh: 14, color: '#cfe8ef', alpha: .55, cap: '#f9a825', label: '#f9a825', lt: 'TONIK', ltc: '#ffffff' } },
    { id: 'sok_pom', name: 'Sok pomarańczowy', shelf: 2, col: 6, glass: 'highball', liquid: '#ff9800', weight: 1.5,
      b: { type: 'carton', w: 42, h: 64, color: '#ff9800', label: '#ffffff', lt: 'POMARAŃCZA', ltc: '#e65100' } },
    { id: 'sok_jab', name: 'Sok jabłkowy', shelf: 2, col: 7, glass: 'highball', liquid: '#e8c547', weight: 1,
      b: { type: 'carton', w: 42, h: 64, color: '#7cb342', label: '#ffffff', lt: 'JABŁKO', ltc: '#33691e' } },
    { id: 'grenadyna', name: 'Syrop grenadyna', shelf: 2, col: 8, glass: 'shot', liquid: '#c2185b', weight: 0.8,
      b: { w: 30, h: 52, sh: 8, nw: 11, nh: 16, color: '#b0103f', alpha: .85, cap: '#333333', label: '#ffffff', lt: 'SYROP', ltc: '#b0103f' } },
    { id: 'woda', name: 'Woda gazowana', shelf: 2, col: 9, glass: 'highball', liquid: '#e3f2fd', weight: 1,
      b: { w: 32, h: 52, sh: 12, nw: 12, nh: 12, color: '#64b5f6', alpha: .45, cap: '#1565c0', label: '#1565c0', lt: 'WODA', ltc: '#ffffff' } },

    // Kran
    { id: 'piwo', name: 'Piwo', shelf: -1, col: TAP_COL, glass: 'pint', liquid: '#f2b01e', weight: 4 },

    // Koktajle – robione w shakerze
    { id: 'whiskey_sour', name: 'Whiskey Sour', shelf: -1, col: -1, glass: 'tumbler', liquid: '#e7c15a', weight: 1.3, cocktail: true },
    { id: 'rum_sour', name: 'Rum Sour', shelf: -1, col: -1, glass: 'tumbler', liquid: '#d9a548', weight: 1.3, cocktail: true },
  ];
  const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
  const GRID = [[], [], []];
  ITEMS.forEach(i => { if (i.shelf >= 0) GRID[i.shelf][i.col] = i; });

  // Shaker i przepis na „sour”: shaker → lód → whisky/rum → sweet → sour → shake ×3
  const SHAKER = { id: 'shaker', name: 'Shaker' };
  const SOUR_BASE = { whisky: 'whiskey_sour', rum: 'rum_sour' };
  const STEP_HINT = ['lód z wiaderka', 'whisky lub rum', 'sweet', 'sour'];
  const STEP_NAME = { lod: 'lód', whisky: 'whisky', rum: 'rum', sweet: 'sweet', sour: 'sour' };
  function stepOK(steps, id) {
    switch (steps.length) {
      case 0: return id === 'lod';
      case 1: return id in SOUR_BASE;
      case 2: return id === 'sweet';
      case 3: return id === 'sour';
      default: return false;
    }
  }
  const TOTAL_WEIGHT = ITEMS.reduce((s, i) => s + i.weight, 0);

  // ===================== Narzędzia =====================
  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function mulberry32(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  const randInt = n => Math.floor(Math.random() * n);
  const pick = arr => arr[randInt(arr.length)];
  function layer() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
  function fitFont(g, text, maxW, size, weight = 700) {
    let s = size;
    do { g.font = `${weight} ${s}px ${FONT}`; } while (g.measureText(text).width > maxW && --s > 6);
    return s;
  }

  // ===================== Pamięć (rekord) =====================
  function loadBest() { try { return parseInt(localStorage.getItem('barman.best') || '0', 10) || 0; } catch (e) { return 0; } }
  function saveBest(v) { try { localStorage.setItem('barman.best', String(v)); } catch (e) { /* brak dostępu */ } }

  // ===================== Dźwięk (WebAudio) =====================
  const sfx = (() => {
    let ac = null, muted = false;
    function ensure() {
      if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
      if (ac && ac.state === 'suspended') ac.resume();
      return ac;
    }
    function tone(f, d, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
      const a = ensure(); if (!a || muted) return;
      const t = a.currentTime + delay;
      const o = a.createOscillator(), g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), t + d);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + d);
      o.connect(g).connect(a.destination);
      o.start(t); o.stop(t + d + 0.03);
    }
    function noise(d, vol = 0.08, freq = 900) {
      const a = ensure(); if (!a || muted) return;
      const len = Math.floor(a.sampleRate * d);
      const buf = a.createBuffer(1, len, a.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource(); src.buffer = buf;
      const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
      const g = a.createGain(); const t = a.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.08);
      g.gain.linearRampToValueAtTime(0.0001, t + d);
      src.connect(f).connect(g).connect(a.destination);
      src.start(t);
    }
    return {
      unlock: ensure,
      toggle() { muted = !muted; return muted; },
      step: () => tone(240, 0.04, 'triangle', 0.04),
      tick: () => tone(700, 0.035, 'square', 0.025),
      pick: () => tone(520, 0.08, 'triangle', 0.09, 260),
      drop: () => tone(300, 0.08, 'triangle', 0.07, -120),
      pour: () => noise(POUR_TIME, 0.09, 1100),
      good: () => { tone(1200, 0.08, 'sine', 0.12); tone(1600, 0.18, 'sine', 0.1, 0, 0.07); },
      bad: () => tone(170, 0.32, 'sawtooth', 0.09, -70),
      arrive: () => tone(1046, 0.1, 'sine', 0.05),
      level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, 0, i * 0.1)),
      over: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, 0, i * 0.18)),
      deny: () => tone(200, 0.08, 'square', 0.04),
      ice: () => { tone(2300, 0.05, 'triangle', 0.06); tone(2900, 0.05, 'triangle', 0.05, 0, 0.06); tone(2500, 0.05, 'triangle', 0.04, 0, 0.11); },
      shake: () => noise(0.2, 0.09, 3200),
      splash: () => noise(0.25, 0.06, 1400),
    };
  })();

  // ===================== Stan gry =====================
  const S = {
    mode: 'menu',          // menu | playing | paused | over
    time: 0,
    score: 0, lives: MAX_LIVES, level: 1, served: 0, streak: 0, bestStreak: 0,
    best: loadBest(),
    spawnT: 0, overDelay: 0, overTime: 0,
    customers: [], floats: [], toast: null,
    bt: null,
  };
  function newBartender() {
    return {
      col: 5, x: COL_X[5], sel: 2, holding: null, busy: 0, busyKind: null, pick: null, queued: null,
      shaker: null,   // { steps: [], shakes: 0, drink: null } gdy barman trzyma shaker
      shakeAnim: 0,
      addFrom: null,  // skąd sięga ręka przy dodawaniu składnika
    };
  }
  S.bt = newBartender();

  function params() {
    const L = S.level;
    return {
      patience: Math.max(7, 20 - (L - 1) * 1.6),
      spawnEvery: Math.max(1.4, 4.6 - (L - 1) * 0.4),
      maxCustomers: Math.min(5, 1 + Math.ceil(L / 2)),
    };
  }

  // ===================== Klienci =====================
  const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#f5cfa0'];
  const HAIRS = ['#2b1b0e', '#5a3825', '#d6b370', '#111111', '#a0522d', '#8a8a8a', '#c0392b'];

  function randomLook() {
    return {
      skin: pick(SKINS),
      hair: pick(HAIRS),
      shirt: `hsl(${randInt(360)}, ${45 + randInt(25)}%, ${32 + randInt(18)}%)`,
      style: randInt(4), // 0 krótkie, 1 długie, 2 łysina, 3 kucyk
      wide: 0.9 + Math.random() * 0.25,
    };
  }
  function pickOrder() {
    let r = Math.random() * TOTAL_WEIGHT;
    for (const it of ITEMS) { if (!it.weight) continue; r -= it.weight; if (r <= 0) return it; }
    return ITEM.piwo;
  }
  function activeCustomers() { return S.customers.filter(c => c.state === 'enter' || c.state === 'wait'); }
  function customerAt(col) { return S.customers.find(c => c.col === col && (c.state === 'enter' || c.state === 'wait')); }

  function spawnCustomer() {
    const used = new Set(S.customers.filter(c => c.state !== 'leave').map(c => c.col));
    const free = [];
    for (const i of SEATS) if (!used.has(i)) free.push(i);
    if (!free.length) return false;
    const p = params();
    const item = pickOrder();
    const patience = item.cocktail ? p.patience * 2.2 : p.patience; // koktajl wymaga wielu kroków
    S.customers.push({
      col: pick(free), item, patience, max: patience,
      state: 'enter', t: 0, look: randomLook(), msg: '', glass: null,
    });
    sfx.arrive();
    return true;
  }

  // ===================== Akcje gracza =====================
  function input(a) {
    const b = S.bt;
    if (a === 'left' || a === 'right') {
      if (b.busy > 0) return;
      const nc = b.col + (a === 'left' ? -1 : 1);
      if (nc < 0 || nc >= COLS) return;
      b.col = nc; b.queued = null; sfx.step();
    } else if (a === 'up') {
      if (b.sel > 0) { b.sel--; sfx.tick(); }
    } else if (a === 'down') {
      if (b.sel < 2) { b.sel++; sfx.tick(); }
    } else if (a === 'use' || a === 'drop') {
      if (b.busy > 0) return;
      b.queued = a; // wykona się, gdy barman dojdzie na miejsce
    }
  }

  function deny(msg) { toast(msg); sfx.deny(); }

  function doUse() {
    const b = S.bt;
    const kind = COLUMNS[b.col].kind;

    // --- z shakerem w ręce ---
    if (b.holding === SHAKER) {
      const sh = b.shaker;
      if (sh.drink) { // gotowy koktajl
        const c = customerAt(b.col);
        if (c) serve(c); else deny(`Podejdź do klienta i podaj ${sh.drink.name}`);
        return;
      }
      if (sh.steps.length === STEP_HINT.length) { doShake(); return; }

      let id = null;
      if (kind === 'ice') id = 'lod';
      else if (kind === 'shelf') {
        const it = GRID[b.sel][b.col];
        if (!it) { deny('Tu nie ma butelki'); return; }
        id = it.id;
      } else if (kind === 'shaker') { deny('Shaker już masz w ręce'); return; }
      else { deny('Z shakerem nie nalejesz piwa – odłóż go (X)'); return; }

      if (!stepOK(sh.steps, id)) { deny(`Zła kolejność! Teraz: ${STEP_HINT[sh.steps.length]}`); return; }
      sh.steps.push(id);
      b.busy = ADD_TIME; b.busyKind = 'add';
      b.addFrom = kind === 'ice' ? { x: COL_X[ICE_COL], y: 474 } : { x: b.x + 32, y: 392 };
      floatText(b.x, 380, `+ ${STEP_NAME[id]}`, '#ffe6b8');
      if (id === 'lod') sfx.ice(); else sfx.splash();
      if (sh.steps.length === STEP_HINT.length) toast('Teraz shake, shake, shake! (Spacja ×3)');
      return;
    }

    // --- z butelką / piwem w ręce ---
    if (b.holding) {
      const c = customerAt(b.col);
      if (c) serve(c);
      else if (kind === 'shaker' || kind === 'ice') deny('Najpierw odłóż to, co trzymasz (X)');
      else deny('Podejdź do klienta, żeby podać (X – odłóż)');
      return;
    }

    // --- puste ręce ---
    if (kind === 'tap') { b.busy = POUR_TIME; b.busyKind = 'pour'; sfx.pour(); return; }
    if (kind === 'shaker') {
      b.holding = SHAKER;
      b.shaker = { steps: [], shakes: 0, drink: null };
      sfx.pick();
      return;
    }
    if (kind === 'ice') { deny('Najpierw weź shaker'); return; }
    const it = GRID[b.sel][b.col];
    if (!it) { deny('Tu nie ma butelki'); return; }
    b.holding = it;
    b.pick = { it, t: 0 };
    sfx.pick();
  }

  function doShake() {
    const b = S.bt, sh = b.shaker;
    sh.shakes++;
    b.shakeAnim = SHAKE_TIME; // sama animacja – nie blokuje kolejnych wciśnięć
    floatText(b.x + (sh.shakes - 2) * 40, 370, 'SHAKE!', '#9be7ff');
    sfx.shake();
    if (sh.shakes >= SHAKES_NEEDED) {
      sh.drink = ITEM[SOUR_BASE[sh.steps[1]]];
      toast(`${sh.drink.name} gotowy – podaj klientowi!`);
    }
  }

  function doDrop() {
    const b = S.bt;
    if (!b.holding) return;
    if (b.holding === SHAKER) toast(b.shaker.steps.length ? 'Shaker wylany i odstawiony' : 'Shaker odstawiony');
    b.holding = null; b.pick = null; b.shaker = null;
    sfx.drop();
  }

  function serve(c) {
    const b = S.bt;
    const given = b.holding === SHAKER ? b.shaker.drink : b.holding;
    b.holding = null; b.pick = null; b.shaker = null;
    c.glass = given;
    c.t = 0;
    const x = COL_X[c.col];
    if (given.id === c.item.id) {
      S.streak++;
      S.bestStreak = Math.max(S.bestStreak, S.streak);
      const frac = c.patience / c.max;
      const mult = 1 + Math.min(S.streak - 1, 5) * 0.1;
      const base = given.cocktail ? 120 : 50, speed = given.cocktail ? 180 : 100;
      const pts = Math.round((base + speed * frac) * mult);
      S.score += pts; S.served++;
      c.state = 'happy'; c.msg = frac > 0.66 ? 'Ekspres!' : 'Dzięki!';
      floatText(x, 470, `+${pts}`, '#7dff9a');
      if (S.streak > 1) floatText(x, 440, `Combo ×${S.streak}`, '#ffd25a');
      sfx.good();
      if (S.served % SERVES_PER_LEVEL === 0) levelUp();
    } else {
      S.streak = 0;
      S.score = Math.max(0, S.score - 25);
      c.state = 'angry'; c.msg = 'To nie to!';
      floatText(x, 470, `Pomyłka! −25`, '#ff6b6b');
      sfx.bad();
      loseLife();
    }
  }

  function levelUp() {
    S.level++;
    let extra = '';
    if (S.level % 3 === 0 && S.lives < MAX_LIVES) { S.lives++; extra = ' +1 życie'; }
    toast(`Poziom ${S.level}!${extra} Klienci są coraz bardziej niecierpliwi.`);
    sfx.level();
  }

  function loseLife() {
    S.lives = Math.max(0, S.lives - 1);
    if (S.lives === 0) S.overDelay = 1.3;
  }

  function floatText(x, y, text, color) { S.floats.push({ x, y, text, color, t: 0 }); }
  function toast(text) { S.toast = { text, t: 0 }; }

  // ===================== Pętla stanu =====================
  function startGame() {
    if (S.mode === 'playing') return;
    sfx.unlock();
    Object.assign(S, {
      mode: 'playing', score: 0, lives: MAX_LIVES, level: 1, served: 0, streak: 0, bestStreak: 0,
      spawnT: 0.8, overDelay: 0, customers: [], floats: [], toast: null, bt: newBartender(),
    });
    showPanel(null);
    toast('Zmiana rozpoczęta – obsługuj klientów!');
  }

  function endGame() {
    S.mode = 'over';
    S.overTime = S.time;
    const newBest = S.score > S.best;
    if (newBest) { S.best = S.score; saveBest(S.best); }
    document.getElementById('over-score').textContent = S.score;
    document.getElementById('over-served').textContent = S.served;
    document.getElementById('over-level').textContent = S.level;
    document.getElementById('over-newbest').textContent = newBest && S.score > 0 ? 'Nowy rekord!' : '';
    showPanel('panel-over');
    sfx.over();
  }

  function togglePause() {
    if (S.mode === 'playing') { S.mode = 'paused'; showPanel('panel-pause'); }
    else if (S.mode === 'paused') { S.mode = 'playing'; showPanel(null); }
  }

  function update(dt) {
    const b = S.bt;

    // ruch barmana
    const tx = COL_X[b.col], d = tx - b.x, step = MOVE_SPEED * dt;
    b.x = Math.abs(d) <= step ? tx : b.x + Math.sign(d) * step;

    if (b.pick) { b.pick.t += dt; if (b.pick.t >= PICK_TIME) b.pick = null; }
    if (b.shakeAnim > 0) b.shakeAnim = Math.max(0, b.shakeAnim - dt);
    if (b.busy > 0) {
      b.busy -= dt;
      if (b.busy <= 0) {
        b.busy = 0;
        if (b.busyKind === 'pour') b.holding = ITEM.piwo;
        b.busyKind = null;
      }
    }
    if (b.queued && b.x === tx && b.busy <= 0) {
      const a = b.queued; b.queued = null;
      if (a === 'use') doUse(); else doDrop();
    }

    // klienci
    for (const c of S.customers) {
      c.t += dt;
      if (c.state === 'enter' || c.state === 'wait') {
        if (c.state === 'enter' && c.t >= 0.45) c.state = 'wait';
        c.patience -= dt;
        if (c.patience <= 0) {
          c.patience = 0; c.state = 'angry'; c.t = 0; c.msg = 'Za długo!';
          S.streak = 0;
          floatText(COL_X[c.col], 470, 'Klient wyszedł!', '#ff6b6b');
          sfx.bad();
          loseLife();
        }
      } else if (c.state === 'happy' || c.state === 'angry') {
        if (c.t >= 0.9) { c.state = 'leave'; c.t = 0; }
      } else if (c.state === 'leave') {
        if (c.t >= 0.5) c.dead = true;
      }
    }
    S.customers = S.customers.filter(c => !c.dead);

    // napisy
    S.floats.forEach(f => f.t += dt);
    S.floats = S.floats.filter(f => f.t < 1.3);
    if (S.toast) { S.toast.t += dt; if (S.toast.t > 2.6) S.toast = null; }

    // koniec gry
    if (S.lives <= 0) {
      S.overDelay -= dt;
      if (S.overDelay <= 0) endGame();
      return;
    }

    // nowi klienci
    const p = params();
    const active = activeCustomers().length;
    if (active === 0) S.spawnT = Math.min(S.spawnT, 0.8);
    S.spawnT -= dt;
    if (S.spawnT <= 0) {
      if (active < p.maxCustomers && spawnCustomer()) S.spawnT = p.spawnEvery * (0.7 + Math.random() * 0.6);
      else S.spawnT = 0.5;
    }
  }

  // ===================== Rysowanie: elementy =====================
  function drawBottle(g, x, by, it, s = 1) {
    const b = it.b;
    g.save();
    g.translate(x, by);
    g.scale(s, s);
    g.lineWidth = 1.5;
    g.strokeStyle = 'rgba(0,0,0,.55)';

    if (b.type === 'carton') {
      const w = b.w, h = b.h;
      g.fillStyle = b.color; g.fillRect(-w / 2, -h, w, h);
      g.fillStyle = '#f2f2f2';
      g.beginPath(); g.moveTo(-w / 2, -h); g.lineTo(0, -h - 11); g.lineTo(w / 2, -h); g.closePath(); g.fill(); g.stroke();
      g.fillRect(-w / 2 + 3, -h - 15, w - 6, 4);
      g.fillStyle = '#e0e0e0'; g.beginPath(); g.arc(w / 4, -h - 5, 3.5, 0, Math.PI * 2); g.fill();
      g.strokeRect(-w / 2, -h, w, h);
      g.fillStyle = b.label; g.fillRect(-w / 2 + 4, -h * 0.72, w - 8, h * 0.46);
      g.fillStyle = b.color; g.beginPath(); g.arc(0, -h * 0.58, 7, 0, Math.PI * 2); g.fill();
      g.fillStyle = b.ltc; fitFont(g, b.lt, w - 10, 9); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(b.lt, 0, -h * 0.36);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-w / 2 + 2, -h + 2, 5, h - 4);
      g.restore();
      return;
    }

    const { w, h, sh, nw, nh } = b;
    const top = -h - sh - nh;
    g.beginPath();
    g.moveTo(-w / 2 + 4, 0);
    g.lineTo(w / 2 - 4, 0);
    g.quadraticCurveTo(w / 2, 0, w / 2, -4);
    g.lineTo(w / 2, -h);
    g.quadraticCurveTo(w / 2, -h - sh, nw / 2, -h - sh);
    g.lineTo(nw / 2, top);
    g.lineTo(-nw / 2, top);
    g.lineTo(-nw / 2, -h - sh);
    g.quadraticCurveTo(-w / 2, -h - sh, -w / 2, -h);
    g.lineTo(-w / 2, -4);
    g.quadraticCurveTo(-w / 2, 0, -w / 2 + 4, 0);
    g.closePath();
    g.globalAlpha = b.alpha;
    g.fillStyle = b.color; g.fill();
    g.globalAlpha = 1;
    g.stroke();

    // kapsel
    g.fillStyle = b.cap;
    g.fillRect(-nw / 2 - 1, top - 6, nw + 2, 7);
    g.strokeRect(-nw / 2 - 1, top - 6, nw + 2, 7);

    // etykieta
    g.fillStyle = b.label;
    g.fillRect(-w / 2 + 3, -h * 0.78, w - 6, h * 0.44);
    g.fillStyle = b.ltc;
    fitFont(g, b.lt, w - 9, 10);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(b.lt, 0, -h * 0.56);

    // połysk
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.fillRect(-w / 2 + 4, -h + 2, 4, h - 8);
    g.fillRect(-nw / 2 + 2, top + 2, 2, nh - 2);
    g.restore();
  }

  const GLASSES = {
    shot: { top: -26, bot: -3, path(g) { g.moveTo(-11, -26); g.lineTo(11, -26); g.lineTo(9, 0); g.lineTo(-9, 0); g.closePath(); } },
    tumbler: { top: -32, bot: -3, path(g) { g.moveTo(-18, -32); g.lineTo(18, -32); g.lineTo(16, 0); g.lineTo(-16, 0); g.closePath(); } },
    highball: { top: -56, bot: -3, path(g) { g.moveTo(-14, -56); g.lineTo(14, -56); g.lineTo(13, 0); g.lineTo(-13, 0); g.closePath(); } },
    pint: { top: -60, bot: -3, path(g) { g.moveTo(-19, -60); g.lineTo(19, -60); g.lineTo(15, 0); g.lineTo(-15, 0); g.closePath(); } },
    wine: { top: -54, bot: -22, stem: 22, path(g) { g.moveTo(-17, -54); g.lineTo(17, -54); g.quadraticCurveTo(17, -22, 0, -22); g.quadraticCurveTo(-17, -22, -17, -54); g.closePath(); } },
    flute: { top: -62, bot: -18, stem: 18, path(g) { g.moveTo(-9, -62); g.lineTo(9, -62); g.quadraticCurveTo(9, -18, 0, -18); g.quadraticCurveTo(-9, -18, -9, -62); g.closePath(); } },
  };

  function glassLiquidY(type, fill) {
    const G = GLASSES[type];
    return G.bot - (G.bot - G.top) * 0.85 * fill;
  }

  function drawGlass(g, x, by, type, liquid, fill = 1, s = 1) {
    const G = GLASSES[type];
    g.save();
    g.translate(x, by);
    g.scale(s, s);
    if (G.stem) {
      g.strokeStyle = 'rgba(230,240,255,.8)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, -1); g.lineTo(0, -G.stem); g.stroke();
      g.fillStyle = 'rgba(230,240,255,.7)';
      g.beginPath(); g.ellipse(0, -1, 12, 3, 0, 0, Math.PI * 2); g.fill();
    }
    g.beginPath(); G.path(g);
    g.fillStyle = 'rgba(220,235,255,.16)'; g.fill();
    if (fill > 0) {
      g.save();
      g.beginPath(); G.path(g); g.clip();
      const lvl = glassLiquidY(type, fill);
      g.globalAlpha = 0.92;
      g.fillStyle = liquid;
      g.fillRect(-30, lvl, 60, G.bot - lvl);
      if (type === 'pint' && fill > 0.25) { g.fillStyle = '#fffaf0'; g.fillRect(-30, lvl - 1, 60, 8); }
      if (type === 'tumbler' || type === 'highball') { // kostki lodu
        g.fillStyle = 'rgba(255,255,255,.45)';
        g.fillRect(-9, lvl + 2, 9, 9); g.fillRect(2, lvl + 5, 8, 8);
      }
      g.restore();
    }
    g.beginPath(); G.path(g);
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)';
    g.fillRect(-8, G.top + 4, 2.5, (G.bot - G.top) * 0.6);
    g.restore();
  }

  function drawHeldItem(g, it, x, y, s) {
    if (it.id === 'piwo') drawGlass(g, x, y, 'pint', it.liquid, 1, s * 1.1);
    else drawBottle(g, x, y, it, s);
  }

  function drawArm(g, x1, y1, x2, y2) {
    g.lineCap = 'round';
    g.strokeStyle = '#bdb6aa'; g.lineWidth = 15;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = '#f4f1ea'; g.lineWidth = 12;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }

  // Shaker (typu cobbler): korpus, sitko, kapturek
  function drawShaker(g, x, by, s = 1, state = null) {
    g.save();
    g.translate(x, by);
    g.scale(s, s);
    const metal = g.createLinearGradient(-20, 0, 20, 0);
    metal.addColorStop(0, '#7b848c'); metal.addColorStop(0.4, '#f4f8fa');
    metal.addColorStop(0.6, '#c9d1d7'); metal.addColorStop(1, '#6d757c');
    g.fillStyle = metal;
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.5;
    // korpus
    g.beginPath(); g.moveTo(-15, 0); g.lineTo(15, 0); g.lineTo(19, -46); g.lineTo(-19, -46); g.closePath(); g.fill(); g.stroke();
    // sitko
    g.beginPath(); g.moveTo(-19, -46); g.lineTo(19, -46); g.lineTo(11, -64); g.lineTo(-11, -64); g.closePath(); g.fill(); g.stroke();
    // kapturek
    rr(g, -8, -76, 16, 13, 4); g.fill(); g.stroke();
    // obręcze
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-19, -48, 38, 3); g.fillRect(-11, -66, 22, 2);
    // połysk
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-9, -42, 3, 36);
    // wskaźnik napełnienia (kropki = dodane składniki, ✓ = gotowe)
    if (state) {
      const n = STEP_HINT.length;
      for (let i = 0; i < n; i++) {
        g.fillStyle = i < state.steps.length ? '#7dff9a' : 'rgba(0,0,0,.35)';
        g.beginPath(); g.arc(-10.5 + i * 7, -20, 2.6, 0, Math.PI * 2); g.fill();
      }
    }
    g.restore();
  }

  // Wiaderko z lodem
  function drawIceBucket(g, x, by) {
    g.save();
    g.translate(x, by);
    // kostki lodu wystające ponad krawędź
    const cubes = [[-20, -46], [-6, -50], [8, -47], [20, -44], [-13, -42], [2, -43], [14, -40]];
    for (const [cx, cy] of cubes) {
      g.fillStyle = 'rgba(225,245,255,.92)'; rr(g, cx - 7, cy - 7, 14, 14, 3); g.fill();
      g.strokeStyle = 'rgba(120,170,200,.8)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(cx - 4, cy - 4, 4, 3);
    }
    const metal = g.createLinearGradient(-32, 0, 32, 0);
    metal.addColorStop(0, '#6d757c'); metal.addColorStop(0.35, '#eef3f6'); metal.addColorStop(1, '#7a8288');
    g.fillStyle = metal; g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-25, 0); g.lineTo(25, 0); g.lineTo(31, -38); g.lineTo(-31, -38); g.closePath(); g.fill(); g.stroke();
    rr(g, -33, -41, 66, 6, 3); g.fill(); g.stroke();
    // uchwyty
    g.strokeStyle = '#8a9198'; g.lineWidth = 3;
    g.beginPath(); g.arc(-31, -26, 6, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
    g.beginPath(); g.arc(31, -26, 6, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(-27, -20, 54, 2);
    g.fillStyle = '#2c3e50'; g.font = `800 10px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('LÓD', 0, -11);
    g.restore();
  }

  function drawStations(g) {
    if (S.bt.holding !== SHAKER) drawShaker(g, COL_X[SHAKER_COL], GLASS_BASE, 1);
    drawIceBucket(g, COL_X[ICE_COL], GLASS_BASE);
  }

  function drawBartender(g) {
    const b = S.bt, x = b.x;
    const headY = 410 + Math.sin(S.time * 3) * 1.2;
    const shY = 446;
    const skin = '#f0c49a';

    let L = { x: x - 34, y: 482 }, R = { x: x + 34, y: 482 };
    const busy = b.busy > 0 ? b.busyKind : null;
    const hasShaker = b.holding === SHAKER;
    let shakerPos = null;
    if (hasShaker) { L = { x: x - 30, y: 466 }; shakerPos = { x: L.x, y: L.y + 16 }; }

    if (busy === 'pour') R = { x: TAP_X - 4, y: 352 + (1 - b.busy / POUR_TIME) * 10 };
    else if (b.shakeAnim > 0 && hasShaker) {
      const a = S.time * 48;
      const sx = x + 34 + Math.sin(a) * 10, sy = 398 + Math.cos(a) * 8;
      L = { x: sx - 2, y: sy + 34 }; R = { x: sx + 2, y: sy - 4 };
      shakerPos = { x: sx, y: sy + 40 };
    } else if (busy === 'add' && b.addFrom) {
      const k = 1 - b.busy / ADD_TIME, ph = easeOut(k < 0.5 ? k * 2 : (1 - k) * 2);
      R = { x: lerp(x + 34, b.addFrom.x, ph), y: lerp(468, b.addFrom.y, ph) };
    }
    else if (b.pick) R = { x: x + 32, y: lerp(392, 468, easeOut(b.pick.t / PICK_TIME)) };
    else if (b.holding && !hasShaker) R = { x: x + 32, y: 468 };

    // szyja + tułów
    g.fillStyle = skin; g.fillRect(x - 7, headY + 16, 14, 18);
    g.fillStyle = '#f4f1ea'; rr(g, x - 28, shY - 12, 56, 72, 14); g.fill();
    g.fillStyle = '#1d1d22';
    g.beginPath(); g.moveTo(x - 28, shY - 4); g.lineTo(x - 5, shY + 34); g.lineTo(x - 5, shY + 60); g.lineTo(x - 28, shY + 60); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x + 28, shY - 4); g.lineTo(x + 5, shY + 34); g.lineTo(x + 5, shY + 60); g.lineTo(x + 28, shY + 60); g.closePath(); g.fill();
    // mucha
    g.fillStyle = '#b3122a';
    g.beginPath(); g.moveTo(x, shY - 8); g.lineTo(x - 11, shY - 14); g.lineTo(x - 11, shY - 2); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x, shY - 8); g.lineTo(x + 11, shY - 14); g.lineTo(x + 11, shY - 2); g.closePath(); g.fill();
    g.beginPath(); g.arc(x, shY - 8, 3, 0, Math.PI * 2); g.fill();

    // głowa
    g.fillStyle = skin; g.beginPath(); g.arc(x, headY, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a2416';
    g.beginPath(); g.arc(x, headY - 3, 23, Math.PI, 0); g.closePath(); g.fill();
    g.fillRect(x - 23, headY - 4, 5, 12); g.fillRect(x + 18, headY - 4, 5, 12);
    // oczy (mrugnięcie)
    const blink = (S.time % 4.2) < 0.12;
    g.fillStyle = '#1b1b1b';
    if (blink) { g.fillRect(x - 11, headY + 2, 6, 2); g.fillRect(x + 5, headY + 2, 6, 2); }
    else { g.beginPath(); g.arc(x - 8, headY + 3, 2.6, 0, Math.PI * 2); g.arc(x + 8, headY + 3, 2.6, 0, Math.PI * 2); g.fill(); }
    // wąs i uśmiech
    g.fillStyle = '#3a2416';
    g.beginPath(); g.ellipse(x - 5, headY + 11, 6, 2.6, 0.2, 0, Math.PI * 2); g.ellipse(x + 5, headY + 11, 6, 2.6, -0.2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#8a3b2a'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(x, headY + 12, 6, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();

    // ręce
    drawArm(g, x - 24, shY - 2, L.x, L.y);
    drawArm(g, x + 24, shY - 2, R.x, R.y);

    // trzymany przedmiot
    if (b.pick) {
      const it = b.pick.it, k = easeOut(b.pick.t / PICK_TIME);
      const px = lerp(COL_X[it.col], R.x, k), py = lerp(SHELF_Y[it.shelf], R.y + 14, k);
      drawHeldItem(g, it, px, py, lerp(BOTTLE_S, 0.62, k));
    } else if (hasShaker) {
      drawShaker(g, shakerPos.x, shakerPos.y, 0.72, b.shaker);
    } else if (b.holding) {
      drawHeldItem(g, b.holding, R.x, R.y + 14, 0.62);
    }

    g.fillStyle = skin;
    g.beginPath(); g.arc(L.x, L.y, 6.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(R.x, R.y, 6.5, 0, Math.PI * 2); g.fill();
  }

  function drawTap(g) {
    const x = TAP_X, b = S.bt;
    const pouring = b.busyKind === 'pour' && b.busy > 0;

    // tacka ociekowa
    g.fillStyle = '#2b2b2e'; rr(g, x - 34, 486, 68, 11, 3); g.fill();
    g.strokeStyle = '#55565b'; g.lineWidth = 1;
    for (let i = -28; i <= 28; i += 7) { g.beginPath(); g.moveTo(x + i, 488); g.lineTo(x + i, 495); g.stroke(); }

    if (THEME.tap === 'copper') {
      // miedziana wieża (bar PSOTA)
      const gr = g.createLinearGradient(x - 22, 0, x + 22, 0);
      gr.addColorStop(0, '#5e301a'); gr.addColorStop(0.4, '#eeb08a'); gr.addColorStop(0.6, '#c98058'); gr.addColorStop(1, '#6b3820');
      g.fillStyle = gr;
      rr(g, x - 21, 380, 42, 108, 16); g.fill();
      g.beginPath(); g.ellipse(x, 384, 21, 7, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; rr(g, x - 21, 380, 42, 108, 16); g.stroke();
      // naklejki
      const hg = g.createLinearGradient(x - 14, 440, x + 2, 456);
      hg.addColorStop(0, '#9be7ff'); hg.addColorStop(0.5, '#e3b5ff'); hg.addColorStop(1, '#b7ffcf');
      g.fillStyle = hg; g.beginPath(); g.arc(x - 7, 458, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c0182b'; g.beginPath(); g.arc(x + 9, 470, 6, 0, Math.PI * 2); g.fill();
      // wylewka
      g.fillStyle = '#c98058'; rr(g, x - 4, 416, 8, 24, 3); g.fill();
      // rączka z czarną okrągłą plakietką „IPA”
      g.save();
      g.translate(x, 410);
      g.rotate(pouring ? -0.42 : 0);
      g.fillStyle = '#1a1a1a'; rr(g, -4, -46, 8, 46, 3); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.arc(0, -56, 17, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#c9a227'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, -56, 14, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#f3e3c3'; g.font = `800 10px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('IPA', 0, -55);
      g.restore();
    } else {
      // chromowana wieża (bar klasyczny)
      const gr = g.createLinearGradient(x - 14, 0, x + 14, 0);
      gr.addColorStop(0, '#6d757c'); gr.addColorStop(0.45, '#eef3f6'); gr.addColorStop(1, '#7a8288');
      g.fillStyle = gr;
      rr(g, x - 13, 404, 26, 84, 4); g.fill();
      rr(g, x - 20, 396, 40, 12, 4); g.fill();
      rr(g, x - 4, 416, 8, 24, 3); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1;
      rr(g, x - 13, 404, 26, 84, 4); g.stroke();

      g.save();
      g.translate(x, 398);
      g.rotate(pouring ? -0.42 : 0);
      g.fillStyle = '#1a1a1a'; rr(g, -8, -62, 16, 60, 6); g.fill();
      g.fillStyle = '#f2b01e'; rr(g, -6, -56, 12, 34, 3); g.fill();
      g.fillStyle = '#3a2208'; g.font = `800 8px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      ['P', 'I', 'W', 'O'].forEach((ch, i) => g.fillText(ch, 0, -51 + i * 8));
      g.restore();
    }

    if (pouring) {
      const k = 1 - b.busy / POUR_TIME, s = 0.8;
      const lvl = GLASS_BASE + glassLiquidY('pint', k) * s;
      g.fillStyle = 'rgba(242,176,30,.95)';
      g.fillRect(x - 2, 440, 4, Math.max(0, lvl - 440));
      drawGlass(g, x, GLASS_BASE, 'pint', ITEM.piwo.liquid, k, s);
    }
  }

  // Podświetlenie tego, co barman może teraz wziąć / użyć.
  // layer: 'shelf' (rysowane przed barmanem) albo 'bar' (po blacie – kran, shaker, lód)
  function drawSelection(g, layer) {
    const b = S.bt;
    if (S.mode === 'over' || b.busy > 0) return;
    const withShaker = b.holding === SHAKER;
    if (b.holding && !(withShaker && b.shaker.steps.length < STEP_HINT.length)) return;
    const kind = COLUMNS[b.col].kind;
    const x = COL_X[b.col];
    let box = null;
    if (layer === 'shelf' && kind === 'shelf') {
      const bw = BOTTLE_S < 1 ? 76 : 88, bh = 104 * BOTTLE_S;
      box = [x - bw / 2, SHELF_Y[b.sel] - bh + 2, bw, bh];
    }
    if (layer === 'bar') {
      if (kind === 'tap' && !withShaker) box = [TAP_X - 28, 326, 56, 176];
      if (kind === 'shaker' && !withShaker) box = [x - 28, 410, 56, 92];
      if (kind === 'ice' && withShaker) box = [x - 40, 434, 80, 68];
    }
    if (!box) return;
    const pulse = 0.5 + 0.5 * Math.sin(S.time * 6);
    g.save();
    g.strokeStyle = `rgba(255,214,90,${0.55 + 0.45 * pulse})`;
    g.lineWidth = 3;
    g.shadowColor = 'rgba(255,190,60,.95)';
    g.shadowBlur = 16;
    rr(g, box[0], box[1], box[2], box[3], 10);
    g.stroke();
    g.restore();
  }

  function drawCustomer(g, c) {
    const x = COL_X[c.col];
    let off = 0;
    if (c.state === 'enter') off = (1 - easeOut(c.t / 0.45)) * 170;
    if (c.state === 'leave') off = easeOut(c.t / 0.5) * 180;
    const y = 652 + off, L = c.look;

    // ramiona
    g.fillStyle = L.shirt;
    rr(g, x - 62 * L.wide, y + 26, 124 * L.wide, 100, 32); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.fillRect(x - 2, y + 40, 4, 80);
    // szyja
    g.fillStyle = L.skin; g.fillRect(x - 12, y + 10, 24, 24);
    // uszy
    g.beginPath(); g.arc(x - 31, y + 2, 7, 0, Math.PI * 2); g.arc(x + 31, y + 2, 7, 0, Math.PI * 2); g.fill();
    // głowa (od tyłu)
    g.beginPath(); g.arc(x, y, 31, 0, Math.PI * 2); g.fill();
    g.fillStyle = L.hair;
    if (L.style === 2) {
      g.beginPath(); g.arc(x, y + 2, 31, 0.15 * Math.PI, 0.85 * Math.PI, true); g.fill();
      g.fillStyle = L.skin; g.beginPath(); g.ellipse(x, y - 10, 22, 18, 0, 0, Math.PI * 2); g.fill();
    } else {
      g.beginPath(); g.arc(x, y - 1, 32.5, 0.9 * Math.PI, 2.1 * Math.PI); g.closePath(); g.fill();
      g.beginPath(); g.arc(x, y + 4, 30, 0, Math.PI); g.fill();
      if (L.style === 1) { rr(g, x - 30, y, 60, 52, 14); g.fill(); }
      if (L.style === 3) { g.beginPath(); g.ellipse(x, y + 30, 8, 18, 0, 0, Math.PI * 2); g.fill(); }
    }
    // podany napój na barze
    if (c.glass && (c.state === 'happy' || c.state === 'angry')) {
      drawGlass(g, x, GLASS_BASE, c.glass.glass, c.glass.liquid, 1, 1);
    }
  }

  function drawBubble(g, c) {
    if (c.state === 'leave') return;
    const tailX = COL_X[c.col];
    let x = tailX;
    const off = c.state === 'enter' ? (1 - easeOut(c.t / 0.45)) * 170 : 0;
    const cy = 552 + off;
    let text, color = '#2a1608', bg = '#fffaf0';
    if (c.state === 'happy') { text = c.msg; bg = '#d8ffd9'; color = '#145a1d'; }
    else if (c.state === 'angry') { text = c.msg; bg = '#ffd6d6'; color = '#7a0f0f'; }
    else text = `1× ${c.item.name}`;

    const size = fitFont(g, text, 150, 17);
    const tw = g.measureText(text).width;
    const w = Math.max(112, tw + 26), h = 50;
    x = Math.min(W - w / 2 - 6, Math.max(w / 2 + 6, x)); // nie wychodź poza ekran
    g.save();
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 8; g.shadowOffsetY = 2;
    g.fillStyle = bg;
    rr(g, x - w / 2, cy - h / 2, w, h, 12); g.fill();
    g.shadowColor = 'transparent';
    g.beginPath(); g.moveTo(tailX - 9, cy + h / 2 - 1); g.lineTo(tailX, cy + h / 2 + 10); g.lineTo(tailX + 9, cy + h / 2 - 1); g.closePath(); g.fill();
    g.fillStyle = color;
    g.font = `700 ${size}px ${FONT}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, x, cy - 7);
    if (c.state === 'enter' || c.state === 'wait') {
      const frac = Math.max(0, c.patience / c.max);
      const bw = w - 22;
      g.fillStyle = 'rgba(0,0,0,.15)'; rr(g, x - bw / 2, cy + 10, bw, 7, 3.5); g.fill();
      g.fillStyle = frac > 0.5 ? '#43a047' : frac > 0.25 ? '#ffb300' : '#e53935';
      if (frac > 0.01) { rr(g, x - bw / 2, cy + 10, bw * frac, 7, 3.5); g.fill(); }
    }
    g.restore();
  }

  function drawHUD(g) {
    g.fillStyle = 'rgba(12,7,4,.82)';
    g.fillRect(0, 0, W, 38);
    g.fillStyle = 'rgba(255,190,90,.25)';
    g.fillRect(0, 38, W, 1);
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.font = `700 19px ${FONT}`;
    g.fillStyle = '#ffd27a';
    g.fillText(`Punkty: ${S.score}`, 16, 20);
    g.fillStyle = '#f3e6d0';
    g.fillText(`Poziom: ${S.level}`, 196, 20);
    if (S.streak > 1) { g.fillStyle = '#7dff9a'; g.fillText(`Combo ×${S.streak}`, 330, 20); }

    g.textAlign = 'center';
    g.font = `26px ${FONT}`;
    for (let i = 0; i < MAX_LIVES; i++) {
      g.fillStyle = i < S.lives ? '#ff4d6d' : 'rgba(255,255,255,.18)';
      g.fillText('♥', 610 + i * 30, 21);
    }

    g.textAlign = 'left';
    g.font = `600 17px ${FONT}`;
    g.fillStyle = '#c9a77a';
    const b = S.bt;
    let held = b.holding ? b.holding.name : (b.busyKind === 'pour' ? 'nalewam…' : '—');
    if (b.holding === SHAKER) {
      const sh = b.shaker;
      if (sh.drink) held = `Shaker – ${sh.drink.name} ✓`;
      else if (sh.steps.length === STEP_HINT.length) held = `Shaker – shake ${sh.shakes}/${SHAKES_NEEDED}`;
      else held = `Shaker: ${sh.steps.map(s => STEP_NAME[s]).join(' + ') || 'pusty'}`;
    }
    g.fillText(`W ręce: ${held}`, 730, 20);

    g.textAlign = 'right';
    g.fillStyle = '#c9a77a';
    g.fillText(`Rekord: ${Math.max(S.best, S.score)}`, W - 16, 20);
  }

  function drawFloats(g) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 24px ${FONT}`;
    g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.7)';
    for (const f of S.floats) {
      g.globalAlpha = Math.max(0, 1 - f.t / 1.3);
      const y = f.y - f.t * 55;
      g.strokeText(f.text, f.x, y);
      g.fillStyle = f.color; g.fillText(f.text, f.x, y);
    }
    g.globalAlpha = 1;
  }

  function drawToast(g) {
    if (!S.toast) return;
    const a = Math.min(1, (2.6 - S.toast.t) / 0.4, S.toast.t / 0.15);
    g.save();
    g.globalAlpha = Math.max(0, a);
    g.font = `600 18px ${FONT}`;
    const w = g.measureText(S.toast.text).width + 40;
    g.fillStyle = 'rgba(20,10,5,.88)';
    rr(g, W / 2 - w / 2, 50, w, 34, 17); g.fill();
    g.strokeStyle = 'rgba(255,200,110,.5)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#ffe6b8'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(S.toast.text, W / 2, 67);
    g.restore();
  }

  // ===================== Warstwy statyczne =====================
  function drawGlassStack(g, x, by) {
    // piramida odwróconych szklanek
    const pos = [[-22, 0], [0, 0], [22, 0], [-11, -30], [11, -30], [0, -60]];
    for (const [dx, dy] of pos) {
      g.save();
      g.translate(x + dx, by + dy - 30);
      g.scale(0.62, -0.95);
      g.beginPath(); GLASSES.tumbler.path(g);
      g.fillStyle = 'rgba(220,235,255,.18)'; g.fill();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.stroke();
      g.restore();
    }
  }

  function drawFruitBowl(g, x, by, color, dark) {
    const fruits = [[-18, -14], [0, -18], [18, -14], [-9, -26], [9, -26]];
    for (const [dx, dy] of fruits) {
      g.fillStyle = color;
      g.beginPath(); g.ellipse(x + dx, by + dy, 11, 9, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = dark; g.lineWidth = 1; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.4)';
      g.beginPath(); g.arc(x + dx - 4, by + dy - 3, 2.5, 0, Math.PI * 2); g.fill();
    }
    // misa
    const gr = g.createLinearGradient(0, by - 20, 0, by);
    gr.addColorStop(0, '#d8d2c4'); gr.addColorStop(1, '#8c8473');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x - 36, by - 18); g.quadraticCurveTo(x, by + 14, x + 36, by - 18); g.closePath(); g.fill();
    g.fillRect(x - 12, by - 4, 24, 4);
  }

  function buildBgClassic() {
    const L = layer(), g = L.getContext('2d');
    const rnd = mulberry32(42);
    const wallBottom = BAR_TOP + 30;

    // cegły
    g.fillStyle = '#24130b'; g.fillRect(0, 0, W, wallBottom);
    for (let row = 0, y = 0; y < wallBottom; row++, y += 26) {
      const off = row % 2 ? 36 : 0;
      for (let x = -off; x < W; x += 72) {
        const v = rnd();
        g.fillStyle = `rgb(${Math.round(98 + v * 30)},${Math.round(50 + v * 16)},${Math.round(34 + v * 10)})`;
        g.fillRect(x + 2, y + 2, 68, 22);
      }
    }
    let gr = g.createLinearGradient(0, 0, 0, wallBottom);
    gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(0.55, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = gr; g.fillRect(0, 0, W, wallBottom);

    // szafa z lustrem
    const cx = SHELF_LEFT - 8, cy = 42, cw = SHELF_RIGHT - SHELF_LEFT + 16, ch = SHELF_Y[2] + 16 - cy;
    g.fillStyle = '#3b200f'; rr(g, cx - 10, cy - 10, cw + 20, ch + 20, 8); g.fill();
    g.strokeStyle = 'rgba(255,200,140,.18)'; g.lineWidth = 2; g.stroke();
    gr = g.createLinearGradient(0, cy, 0, cy + ch);
    gr.addColorStop(0, '#1f252c'); gr.addColorStop(1, '#10131a');
    g.fillStyle = gr; g.fillRect(cx, cy, cw, ch);
    g.save();
    g.beginPath(); g.rect(cx, cy, cw, ch); g.clip();
    g.fillStyle = 'rgba(255,255,255,.035)';
    for (let i = 0; i < 7; i++) {
      const sx = cx + 60 + i * 180;
      g.beginPath(); g.moveTo(sx, cy); g.lineTo(sx + 60, cy); g.lineTo(sx - 160, cy + ch); g.lineTo(sx - 220, cy + ch); g.closePath(); g.fill();
    }
    for (let s = 0; s < 3; s++) {
      const y = SHELF_Y[s];
      gr = g.createLinearGradient(0, y - 100, 0, y);
      gr.addColorStop(0, 'rgba(255,170,70,0)'); gr.addColorStop(1, 'rgba(255,170,70,.24)');
      g.fillStyle = gr; g.fillRect(cx, y - 100, cw, 100);
    }
    g.restore();

    // półki
    for (let s = 0; s < 3; s++) {
      const y = SHELF_Y[s];
      gr = g.createLinearGradient(0, y, 0, y + 14);
      gr.addColorStop(0, '#b97a43'); gr.addColorStop(1, '#6e3f1d');
      g.fillStyle = gr; g.fillRect(cx, y, cw, 14);
      g.fillStyle = 'rgba(255,235,200,.55)'; g.fillRect(cx, y, cw, 2);
      if (s < 2) {
        gr = g.createLinearGradient(0, y + 14, 0, y + 26);
        gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(cx, y + 14, cw, 12);
      }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#ffeacb';
      for (let c = 0; c < COLS; c++) {
        const it = GRID[s][c];
        if (!it) continue;
        const name = it.name.toUpperCase();
        fitFont(g, name, 90, 10);
        g.fillText(name, COL_X[c], y + 8);
      }
    }

    // dekoracje nad sweet/sour: szklanki i owoce
    drawGlassStack(g, COL_X[2], SHELF_Y[0]);
    drawGlassStack(g, COL_X[3], SHELF_Y[0]);
    drawFruitBowl(g, COL_X[2], SHELF_Y[1], '#f7d933', '#c9a800');   // cytryny
    drawFruitBowl(g, COL_X[3], SHELF_Y[1], '#8bc34a', '#5a8a1f');   // limonki

    // ściana za barmanem
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, cy + ch + 12, W, wallBottom - (cy + ch + 12));

    // szyld PSOTA – złote litery
    g.save();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    fitFont(g, 'PSOTA', 236, 66, 900);
    const gold = g.createLinearGradient(0, 70, 0, 130);
    gold.addColorStop(0, '#fff4b8'); gold.addColorStop(0.45, '#f5c542');
    gold.addColorStop(0.55, '#b8860b'); gold.addColorStop(1, '#ffe08a');
    g.shadowColor = 'rgba(255,190,60,.75)'; g.shadowBlur = 24;
    g.fillStyle = gold; g.fillText('PSOTA', 1140, 100);
    g.shadowBlur = 0;
    g.lineWidth = 1.5; g.strokeStyle = '#6b4a08'; g.strokeText('PSOTA', 1140, 100);
    g.restore();

    // tablica z przepisem (lewa strona, nad shakerem i lodem)
    g.fillStyle = '#5a3418'; rr(g, 8, 52, 192, 300, 8); g.fill();
    g.fillStyle = '#1f2a24'; rr(g, 17, 61, 174, 282, 4); g.fill();
    g.fillStyle = '#ffe08a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 17px ${FONT}`; g.fillText('WHISKEY SOUR', 104, 84);
    g.font = `800 14px ${FONT}`; g.fillText('lub RUM SOUR', 104, 104);
    g.fillStyle = '#e8efe9'; g.textAlign = 'left'; g.font = `500 14px ${FONT}`;
    ['1. weź shaker', '2. lód z wiaderka', '3. whisky albo rum', '4. sweet', '5. sour', '6. shake ×3 (Spacja)', '7. podaj klientowi']
      .forEach((t, i) => g.fillText(t, 28, 136 + i * 28));
    g.strokeStyle = 'rgba(232,239,233,.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(30, 118); g.lineTo(178, 118); g.stroke();

    // tablica kredowa
    g.fillStyle = '#5a3418'; rr(g, 1014, 158, 252, 174, 8); g.fill();
    g.fillStyle = '#1f2a24'; rr(g, 1024, 168, 232, 154, 4); g.fill();
    g.fillStyle = '#e8efe9'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 17px ${FONT}`; g.fillText('STEROWANIE', 1140, 186);
    g.textAlign = 'left'; g.font = `500 14px ${FONT}`;
    ['← →   ruch', '↑ ↓   wybór półki', 'Spacja   weź / podaj', 'X   odłóż', 'P   pauza    M   dźwięk']
      .forEach((t, i) => g.fillText(t, 1036, 212 + i * 22));

    return L;
  }

  function buildBarClassic() {
    const L = layer(), g = L.getContext('2d');
    // podłoga
    let gr = g.createLinearGradient(0, BAR_BOTTOM, 0, H);
    gr.addColorStop(0, '#1c110a'); gr.addColorStop(1, '#0b0604');
    g.fillStyle = gr; g.fillRect(0, BAR_BOTTOM, W, H - BAR_BOTTOM);

    // front baru
    gr = g.createLinearGradient(0, BAR_FRONT, 0, BAR_BOTTOM);
    gr.addColorStop(0, '#6b3818'); gr.addColorStop(1, '#3d1e0b');
    g.fillStyle = gr; g.fillRect(0, BAR_FRONT, W, BAR_BOTTOM - BAR_FRONT);
    const rnd = mulberry32(9);
    g.strokeStyle = 'rgba(0,0,0,.13)'; g.lineWidth = 1;
    for (let i = 0; i < 36; i++) {
      const y = BAR_FRONT + 4 + rnd() * (BAR_BOTTOM - BAR_FRONT - 8);
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= W; x += 64) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 3);
      g.stroke();
    }
    for (let x = 12; x < W; x += 158) {
      g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 3;
      rr(g, x, BAR_FRONT + 14, 140, BAR_BOTTOM - BAR_FRONT - 44, 6); g.stroke();
      g.strokeStyle = 'rgba(255,210,160,.12)'; g.lineWidth = 1;
      rr(g, x + 3, BAR_FRONT + 17, 134, BAR_BOTTOM - BAR_FRONT - 50, 5); g.stroke();
    }
    // mosiężna listwa
    gr = g.createLinearGradient(0, BAR_BOTTOM - 24, 0, BAR_BOTTOM - 12);
    gr.addColorStop(0, '#fff0b0'); gr.addColorStop(0.5, '#c9962c'); gr.addColorStop(1, '#6e4a10');
    g.fillStyle = gr; g.fillRect(0, BAR_BOTTOM - 24, W, 10);
    g.fillStyle = '#8a6418';
    for (let x = 60; x < W; x += 200) g.fillRect(x, BAR_BOTTOM - 16, 8, 16);

    // blat
    gr = g.createLinearGradient(0, BAR_TOP, 0, BAR_LIP);
    gr.addColorStop(0, '#7c4520'); gr.addColorStop(1, '#a8652f');
    g.fillStyle = gr; g.fillRect(0, BAR_TOP, W, BAR_LIP - BAR_TOP);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, BAR_TOP, W, 2);
    gr = g.createLinearGradient(0, BAR_LIP, 0, BAR_FRONT);
    gr.addColorStop(0, '#c98444'); gr.addColorStop(1, '#5a2e12');
    g.fillStyle = gr; g.fillRect(0, BAR_LIP, W, BAR_FRONT - BAR_LIP);
    g.fillStyle = 'rgba(255,230,190,.4)'; g.fillRect(0, BAR_LIP, W, 1.5);
    gr = g.createLinearGradient(0, BAR_FRONT, 0, BAR_FRONT + 14);
    gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, BAR_FRONT, W, 14);
    return L;
  }

  // =====================================================================
  // ===================== Bar „PSOTA” (wg zdjęcia) =======================
  // =====================================================================
  const PS = {
    shelfY: [230, 310, 388],
    cab: { x0: 214, y0: 156, x1: 1008, y1: 322 },
    ceilingH: 76,
    counterY: 468,
  };
  const LEAF_COLORS = ['#5fa98a', '#8fd1b4', '#3d7f63', '#a9dcc3', '#2f6b52', '#6fbf9b', '#c4e8d4', '#447a3a'];

  function psLeaf(g, x, y, len, ang, col) {
    g.save();
    g.translate(x, y); g.rotate(ang);
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(len * 0.5, -len * 0.3, len, 0);
    g.quadraticCurveTo(len * 0.5, len * 0.3, 0, 0);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(len * 0.05, 0); g.lineTo(len * 0.9, 0); g.stroke();
    g.restore();
  }
  function psMaple(g, x, y, r, ang, col) {
    g.save();
    g.translate(x, y); g.rotate(ang);
    g.fillStyle = col;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, rr2 = i % 2 ? r * 0.45 : r;
      g.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
    }
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); g.stroke();
    }
    g.restore();
  }
  function psFoliage(g, rnd, cx, cy, rx, ry, n, scale = 1) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      const col = LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)];
      if (rnd() < 0.35) psMaple(g, x, y, (9 + rnd() * 9) * scale, rnd() * 6, col);
      else psLeaf(g, x, y, (18 + rnd() * 26) * scale, rnd() * Math.PI * 2, col);
    }
  }
  function psPompom(g, rnd, x, y, r, c1, c2) {
    for (let i = 0; i < 40; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * r;
      g.fillStyle = rnd() < 0.5 ? c1 : c2;
      g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.85, 3 + rnd() * 4, 0, Math.PI * 2); g.fill();
    }
  }

  function psCeiling(g, rnd) {
    const H0 = PS.ceilingH;
    g.fillStyle = '#2a2519'; g.fillRect(0, 0, W, H0);
    for (let i = 0; i < 3000; i++) {
      const x = rnd() * W, y = rnd() * H0;
      g.fillStyle = rnd() < 0.5 ? `rgba(0,0,0,${0.25 + rnd() * 0.3})` : `rgba(200,180,120,${0.1 + rnd() * 0.25})`;
      g.fillRect(x, y, 2, 2);
    }
    // belki z jasnego drewna
    const beam = pts => {
      const gr = g.createLinearGradient(0, 0, 0, H0);
      gr.addColorStop(0, '#9c7637'); gr.addColorStop(1, '#d6a85a');
      g.fillStyle = gr;
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(60,40,10,.6)'; g.lineWidth = 1.5; g.stroke();
    };
    beam([[330, 0], [372, 0], [474, H0], [432, H0]]);
    beam([[1068, 0], [1106, 0], [1012, H0], [974, H0]]);
    beam([[0, 22], [0, 44], [52, H0], [84, H0]]);
    beam([[0, H0 - 12], [W, H0 - 12], [W, H0 - 3], [0, H0 - 3]]);
    // rura
    g.fillStyle = '#77736a'; g.fillRect(0, 50, W, 6);
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, 50, W, 1.5);
    // siatka
    g.strokeStyle = 'rgba(235,235,220,.13)'; g.lineWidth = 0.7;
    for (let x = -40; x < W + 40; x += 13) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 18, H0); g.stroke(); }
    for (let y = 4; y < H0; y += 9) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + 2); g.stroke(); }
    // cień przy ścianie
    let gr = g.createLinearGradient(0, H0 - 6, 0, H0 + 14);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.8)');
    g.fillStyle = gr; g.fillRect(0, H0 - 6, W, 20);
    // lampki choinkowe (prawa strona)
    for (let i = 0; i < 46; i++) {
      const x = 840 + i * 9.5 + rnd() * 6, y = 50 + Math.sin(i * 0.8) * 9 + rnd() * 8;
      gr = g.createRadialGradient(x, y, 0, x, y, 7);
      gr.addColorStop(0, 'rgba(255,245,215,.9)'); gr.addColorStop(1, 'rgba(255,230,170,0)');
      g.fillStyle = gr; g.fillRect(x - 7, y - 7, 14, 14);
      g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(x, y, 1.4, 0, Math.PI * 2); g.fill();
    }
  }

  function psDecoBottle(rnd) {
    const shapes = [
      { w: 30, h: 50, sh: 10, nw: 11, nh: 18 }, { w: 36, h: 44, sh: 8, nw: 12, nh: 16 },
      { w: 28, h: 56, sh: 12, nw: 10, nh: 22 }, { w: 40, h: 40, sh: 12, nw: 12, nh: 14 },
      { w: 26, h: 52, sh: 14, nw: 10, nh: 26 }, { w: 34, h: 58, sh: 6, nw: 12, nh: 14 },
    ];
    const glass = [['#c47a22', .85], ['#e9f2f5', .45], ['#2f5d2a', .9], ['#7a3b10', .92], ['#d9b25a', .75],
      ['#4a6fa5', .6], ['#9c1f2a', .85], ['#efe3c0', .6], ['#bfe3c8', .55], ['#f0c85a', .7]];
    const labels = ['#f3e6c8', '#1b1b1b', '#ffffff', '#c62828', '#203a5a', '#e6c35c', '#2e7d32'];
    const s = shapes[Math.floor(rnd() * shapes.length)];
    const [color, alpha] = glass[Math.floor(rnd() * glass.length)];
    return {
      b: { ...s, color, alpha, cap: rnd() < 0.5 ? '#222' : '#c9a227', label: labels[Math.floor(rnd() * labels.length)], lt: '', ltc: '#000' },
      spout: rnd() < 0.6,
    };
  }

  function psSkullBox(g, x, by, s) {
    g.save(); g.translate(x, by); g.scale(s, s);
    g.fillStyle = '#2f7fd0'; g.fillRect(-18, -58, 36, 58);
    g.fillStyle = '#5aa6ef'; g.fillRect(-18, -58, 36, 8);
    g.fillStyle = '#f4f4f4';
    g.beginPath(); g.arc(0, -28, 11, 0, Math.PI * 2); g.fill(); g.fillRect(-6, -20, 12, 8);
    g.fillStyle = '#1d3b6a';
    g.beginPath(); g.arc(-4, -29, 3, 0, Math.PI * 2); g.arc(4, -29, 3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.strokeRect(-18, -58, 36, 58);
    g.restore();
  }

  function psCabinet(g, rnd) {
    const { x0, y0, x1, y1 } = PS.cab;
    g.fillStyle = '#1b130d'; g.fillRect(x0 - 4, y0, x1 - x0 + 8, y1 - y0);
    const ix0 = x0 + 8, iy0 = y0 + 8, ix1 = x1 - 8, iy1 = y1 - 4;
    let gr = g.createLinearGradient(ix0, 0, ix1, 0);
    gr.addColorStop(0, '#6b4318'); gr.addColorStop(0.2, '#c98d3e'); gr.addColorStop(0.5, '#e0a24e');
    gr.addColorStop(0.8, '#c98d3e'); gr.addColorStop(1, '#6b4318');
    g.fillStyle = gr; g.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0);
    g.strokeStyle = 'rgba(90,45,10,.22)'; g.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const x = ix0 + rnd() * (ix1 - ix0);
      g.beginPath(); g.moveTo(x, iy0); g.lineTo(x + (rnd() - 0.5) * 6, iy1); g.stroke();
    }
    // przyciemnienie u góry każdej półki
    const tops = [iy0, PS.shelfY[0] + 10];
    for (let s = 0; s < 2; s++) {
      gr = g.createLinearGradient(0, tops[s], 0, PS.shelfY[s]);
      gr.addColorStop(0, 'rgba(20,10,0,.55)'); gr.addColorStop(1, 'rgba(255,220,150,.1)');
      g.fillStyle = gr; g.fillRect(ix0, tops[s], ix1 - ix0, PS.shelfY[s] - tops[s]);
    }
    // gęsto ustawione butelki dekoracyjne (te do gry rysowane są osobno, przed nimi)
    const itemXs = ITEMS.filter(i => i.shelf >= 0 && i.shelf < 2).map(i => COL_X[i.col]);
    for (let s = 0; s < 2; s++) {
      const y = PS.shelfY[s];
      for (let x = ix0 + 12; x < ix1 - 10; x += 22 + rnd() * 9) {
        if (itemXs.some(ix => Math.abs(ix - x) < 26)) continue;
        if (s === 0 && x > COL_X[2] - 30 && x < COL_X[3] + 30) continue; // miejsce na pudełka z czaszkami
        const d = psDecoBottle(rnd);
        const sc = 0.56 + rnd() * 0.1;
        drawBottle(g, x, y, d, sc);
        if (d.spout) {
          const top = y - (d.b.h + d.b.sh + d.b.nh + 6) * sc;
          g.strokeStyle = '#151515'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(x, top); g.lineTo(x + 3, top - 9); g.stroke();
        }
      }
    }
    psSkullBox(g, COL_X[2] - 4, PS.shelfY[0], 0.95);
    psSkullBox(g, COL_X[3] - 8, PS.shelfY[0], 0.95);
    psSkullBox(g, COL_X[3] + 26, PS.shelfY[0], 0.8);
    // deski z jasnym LED-em na krawędzi
    for (let s = 0; s < 2; s++) {
      const y = PS.shelfY[s];
      g.fillStyle = '#0f0c0a'; g.fillRect(x0, y, x1 - x0, 10);
      g.save(); g.shadowColor = 'rgba(255,250,230,1)'; g.shadowBlur = 10;
      g.fillStyle = 'rgba(255,252,240,.95)'; g.fillRect(ix0, y - 1, ix1 - ix0, 2);
      g.restore();
    }
    g.fillStyle = '#1b130d'; g.fillRect(x0 - 4, y1 - 2, x1 - x0 + 8, 6);
  }

  function psSign(g, rnd) {
    // liście za literami
    psFoliage(g, rnd, 262, 118, 58, 42, 55);
    psFoliage(g, rnd, 948, 112, 66, 46, 60);
    psFoliage(g, rnd, 640, 128, 300, 26, 70, 0.9);

    // tęczowa flaga
    g.strokeStyle = '#b9b2a2'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(330, 156); g.lineTo(318, 80); g.stroke();
    g.save(); g.translate(318, 82); g.rotate(-0.12);
    ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'].forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath();
      g.moveTo(0, i * 7);
      g.quadraticCurveTo(26, i * 7 - 5, 52, i * 7 + 2);
      g.lineTo(52, i * 7 + 9);
      g.quadraticCurveTo(26, i * 7 + 2, 0, i * 7 + 7);
      g.closePath(); g.fill();
    });
    g.restore();

    // złote litery z pogniecionej folii
    const lc = layer(), lg = lc.getContext('2d');
    lg.font = `900 118px "Arial Black", "Segoe UI Black", ${FONT}`;
    lg.textAlign = 'center'; lg.textBaseline = 'alphabetic';
    const letters = [['P', 420, -0.03, 0.95], ['S', 530, 0.02, 0.92], ['O', 642, -0.015, 0.95], ['T', 752, 0.025, 0.95], ['A', 866, -0.02, 1.0]];
    for (const [ch, x, rot, sx] of letters) {
      lg.save(); lg.translate(x, 160); lg.rotate(rot); lg.scale(sx, 1);
      lg.fillStyle = '#c9a043'; lg.fillText(ch, 0, 0);
      lg.restore();
    }
    lg.globalCompositeOperation = 'source-atop';
    const tones = ['rgba(255,240,170,.6)', 'rgba(150,110,30,.5)', 'rgba(230,190,90,.55)', 'rgba(110,80,20,.4)', 'rgba(255,255,225,.45)'];
    for (let i = 0; i < 1800; i++) {
      const x = 345 + rnd() * 590, y = 66 + rnd() * 100, s = 5 + rnd() * 14;
      lg.fillStyle = tones[Math.floor(rnd() * tones.length)];
      lg.beginPath(); lg.moveTo(x, y); lg.lineTo(x + s, y + (rnd() - 0.5) * s); lg.lineTo(x + (rnd() - 0.5) * s, y + s); lg.closePath(); lg.fill();
    }
    const gr = lg.createLinearGradient(0, 70, 0, 162);
    gr.addColorStop(0, 'rgba(255,240,180,.25)'); gr.addColorStop(1, 'rgba(90,60,10,.3)');
    lg.fillStyle = gr; lg.fillRect(0, 60, W, 110);
    lg.globalCompositeOperation = 'source-over';
    g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 10; g.shadowOffsetY = 3;
    g.drawImage(lc, 0, 0);
    g.restore();

    // liście przed literami, kwiaty
    psFoliage(g, rnd, 640, 152, 290, 8, 26, 0.75);
    psFoliage(g, rnd, 236, 140, 26, 16, 14, 0.9);
    psPompom(g, rnd, 296, 146, 15, '#f7e65a', '#fff3a0');
    g.strokeStyle = '#d8c79a'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(960, 156); g.lineTo(972, 72); g.stroke();
    g.beginPath(); g.moveTo(988, 156); g.lineTo(980, 84); g.stroke();
    g.fillStyle = '#ff6fa8';
    g.beginPath(); g.ellipse(944, 128, 12, 10, -0.4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ffe14d'; g.lineWidth = 3; g.beginPath(); g.moveTo(944, 128); g.lineTo(952, 116); g.stroke();
    psPompom(g, rnd, 992, 140, 17, '#9b59d0', '#c38be8');
  }

  function psBackCounter(g, rnd) {
    const y = PS.counterY;
    // kafle
    g.fillStyle = '#141414'; g.fillRect(0, PS.cab.y1, W, BAR_TOP + 30 - PS.cab.y1);
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
    for (let ty = PS.cab.y1; ty < BAR_TOP + 30; ty += 40) for (let tx = 0; tx < W; tx += 40) g.strokeRect(tx + 0.5, ty + 0.5, 40, 40);
    // dolna półka (softy) z LED-em
    const sy = PS.shelfY[2];
    let gr = g.createLinearGradient(0, sy - 70, 0, sy);
    gr.addColorStop(0, 'rgba(255,240,210,0)'); gr.addColorStop(1, 'rgba(255,240,210,.12)');
    g.fillStyle = gr; g.fillRect(PS.cab.x0, sy - 70, PS.cab.x1 - PS.cab.x0, 70);
    g.fillStyle = '#24170f'; g.fillRect(PS.cab.x0, sy, PS.cab.x1 - PS.cab.x0, 10);
    g.save(); g.shadowColor = 'rgba(255,250,230,1)'; g.shadowBlur = 8;
    g.fillStyle = 'rgba(255,252,240,.85)'; g.fillRect(PS.cab.x0 + 6, sy - 1, PS.cab.x1 - PS.cab.x0 - 12, 2);
    g.restore();

    // blat roboczy z tyłu
    g.fillStyle = '#2b2018'; g.fillRect(0, y, W, 8);
    // szklanki
    for (let row = 0; row < 2; row++) {
      for (let x = 228 + row * 9; x < 440; x += 19) {
        const types = ['tumbler', 'highball', 'shot'];
        drawGlass(g, x, y - row * 16, types[Math.floor(rnd() * 3)], '#000', 0, 0.55 + rnd() * 0.15);
      }
    }
    // automat do shotów z pomarańczową poświatą
    g.fillStyle = '#1e1e20'; rr(g, 588, y - 62, 86, 62, 6); g.fill();
    g.fillStyle = '#2c2c30'; rr(g, 600, y - 76, 62, 16, 4); g.fill();
    gr = g.createRadialGradient(631, y - 30, 2, 631, y - 30, 30);
    gr.addColorStop(0, 'rgba(255,140,40,.95)'); gr.addColorStop(0.6, 'rgba(255,90,20,.6)'); gr.addColorStop(1, 'rgba(255,80,20,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(631, y - 30, 30, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ffd08a'; g.lineWidth = 2; g.beginPath(); g.arc(631, y - 30, 16, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#c0c4c8'; g.fillRect(628, y - 60, 6, 12);
    // pudełko z serwetkami
    g.fillStyle = '#e9e4da'; g.fillRect(700, y - 22, 44, 22);
    g.fillStyle = '#c9b38a'; g.fillRect(704, y - 30, 36, 9);
    // druciane kosze z cytrusami
    for (const [bx, fr] of [[842, ['#f39c12', '#f7c948', '#e67e22']], [902, ['#f39c12', '#f5b041', '#f7dc6f']]]) {
      for (let i = 0; i < 9; i++) {
        g.fillStyle = fr[i % fr.length];
        g.beginPath(); g.arc(bx - 16 + (i % 4) * 11 + rnd() * 3, y - 34 - Math.floor(i / 4) * 9 + rnd() * 3, 7, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = 'rgba(200,200,200,.75)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(bx - 26, y - 44); g.lineTo(bx - 20, y); g.lineTo(bx + 20, y); g.lineTo(bx + 26, y - 44); g.stroke();
      for (let k = 1; k < 4; k++) { const yy = y - k * 11; g.beginPath(); g.moveTo(bx - 20 - k * 1.5, yy); g.lineTo(bx + 20 + k * 1.5, yy); g.stroke(); }
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(bx + k * 9, y); g.lineTo(bx + k * 11, y - 44); g.stroke(); }
      g.beginPath(); g.arc(bx, y - 44, 18, Math.PI, 0); g.stroke();
    }
    // kartonowa tabliczka „CZEREŚNIE!”
    psCardboard(g, 968, 418, 108, 40, -0.14, ['CZEREŚNIE!'], 17);
    g.strokeStyle = '#222'; g.lineWidth = 2; g.beginPath(); g.moveTo(968, 438); g.lineTo(966, y); g.stroke();
  }

  function psCardboard(g, cx, cy, w, h, rot, lines, size, title) {
    g.save();
    g.translate(cx, cy); g.rotate(rot);
    const gr = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    gr.addColorStop(0, '#b97a4a'); gr.addColorStop(1, '#9c5f34');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(-w / 2 + 3, -h / 2); g.lineTo(w / 2 - 2, -h / 2 + 2); g.lineTo(w / 2, h / 2 - 3); g.lineTo(-w / 2 + 1, h / 2); g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(60,30,10,.5)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#1d140e';
    g.textBaseline = 'middle';
    let yy = -h / 2 + 4;
    if (title) {
      g.textAlign = 'center';
      let ts = size + 3;
      do { g.font = `800 ${ts}px "Segoe Print", "Comic Sans MS", ${FONT}`; } while (g.measureText(title).width > w - 14 && --ts > 8);
      g.fillText(title, 0, yy + size * 0.8); yy += size * 1.8;
      g.textAlign = 'left';
    } else g.textAlign = 'center';
    g.font = `700 ${size}px "Segoe Print", "Comic Sans MS", ${FONT}`;
    const step = title ? size * 1.45 : 0;
    lines.forEach((t, i) => {
      if (title) g.fillText(t, -w / 2 + 12, yy + i * step + size * 0.5);
      else g.fillText(t, 0, 0);
    });
    g.restore();
  }

  function psGreenSign(g, x, y, w, h, lines, size) {
    g.fillStyle = '#3c9a6a'; rr(g, x, y, w, h, 3); g.fill();
    g.strokeStyle = '#256b47'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${size}px ${FONT}`;
    const lh = size * 1.25, top = y + h / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((t, i) => g.fillText(t, x + w / 2, top + i * lh));
  }

  function buildBgPsota() {
    const L = layer(), g = L.getContext('2d');
    const rnd = mulberry32(2023);
    g.fillStyle = '#0c0a09'; g.fillRect(0, 0, W, BAR_TOP + 30);
    psCeiling(g, rnd);
    psBackCounter(g, rnd);
    psCabinet(g, rnd);
    psSign(g, rnd);

    // nazwy na krawędziach półek
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f3e3c3';
    for (let s = 0; s < 3; s++) {
      for (let c = 0; c < COLS; c++) {
        const it = GRID[s][c];
        if (!it) continue;
        const name = it.name.toUpperCase();
        fitFont(g, name, 86, 9);
        g.fillText(name, COL_X[c], PS.shelfY[s] + 6);
      }
    }

    // zielone tabliczki (prawa strona)
    psGreenSign(g, 1024, 150, 116, 96, ['OSOBOM', 'NIETRZEŹWYM ORAZ', 'MŁODZIEŻY DO LAT 18', 'ALKOHOLU', 'NIE SPRZEDAJEMY'], 10);
    psGreenSign(g, 1150, 150, 116, 96, ['ALKOHOL', 'SZKODZI', 'ZDROWIU'], 14);
    // sterowanie na kartonie
    psCardboard(g, 1142, 300, 232, 96, 0.03,
      ['← →  ruch   ↑ ↓  półka', 'Spacja  weź / podaj', 'X  odłóż    P  pauza'], 13, 'STEROWANIE');
    // przepis na kartonie (lewa strona)
    psCardboard(g, 108, 300, 192, 236, -0.03,
      ['1. weź shaker', '2. lód z wiaderka', '3. whisky albo rum', '4. sweet', '5. sour', '6. shake ×3', '7. podaj!'], 13, 'WHISKEY / RUM SOUR');
    return L;
  }

  function buildBarPsota() {
    const L = layer(), g = L.getContext('2d');
    // podłoga
    g.fillStyle = '#0a0807'; g.fillRect(0, BAR_BOTTOM, W, H - BAR_BOTTOM);
    // front z ciemnych drewnianych listew
    g.fillStyle = '#0e0805'; g.fillRect(0, BAR_FRONT, W, H - BAR_FRONT);
    const rnd = mulberry32(77);
    for (let x = 0; x < W; x += 46) {
      const gr = g.createLinearGradient(0, BAR_FRONT, 0, H);
      const v = rnd() * 14;
      gr.addColorStop(0, `rgb(${62 + v},${38 + v * 0.6},${24 + v * 0.4})`);
      gr.addColorStop(1, `rgb(${30 + v},${18 + v * 0.5},${11})`);
      g.fillStyle = gr; g.fillRect(x + 3, BAR_FRONT, 40, H - BAR_FRONT);
      g.fillStyle = 'rgba(255,200,150,.07)'; g.fillRect(x + 3, BAR_FRONT, 2, H - BAR_FRONT);
    }
    let gr = g.createLinearGradient(0, BAR_FRONT, 0, BAR_FRONT + 30);
    gr.addColorStop(0, 'rgba(0,0,0,.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, BAR_FRONT, W, 30);
    // czarny, błyszczący blat
    gr = g.createLinearGradient(0, BAR_TOP, 0, BAR_LIP);
    gr.addColorStop(0, '#1e1c1a'); gr.addColorStop(1, '#070707');
    g.fillStyle = gr; g.fillRect(0, BAR_TOP, W, BAR_LIP - BAR_TOP);
    for (let i = 0; i < 18; i++) {
      const x = 40 + rnd() * (W - 80);
      g.fillStyle = `rgba(255,${200 + Math.floor(rnd() * 50)},150,.06)`;
      g.beginPath(); g.ellipse(x, BAR_LIP - 6, 18 + rnd() * 30, 3, 0, 0, Math.PI * 2); g.fill();
    }
    // gumowe maty barowe
    for (const [mx, mw] of [[24, 520], [596, 500]]) {
      g.fillStyle = '#121513'; rr(g, mx, BAR_TOP + 2, mw, 12, 3); g.fill();
      g.strokeStyle = 'rgba(80,140,100,.4)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = 'rgba(240,230,200,.55)'; g.font = `italic 700 9px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let k = 0; k < 3; k++) g.fillText('✦ PSOTA ✦', mx + mw * (k + 0.5) / 3, BAR_TOP + 8);
    }
    // krawędź blatu
    gr = g.createLinearGradient(0, BAR_LIP, 0, BAR_FRONT);
    gr.addColorStop(0, '#4a2c18'); gr.addColorStop(1, '#170d07');
    g.fillStyle = gr; g.fillRect(0, BAR_LIP, W, BAR_FRONT - BAR_LIP);
    g.fillStyle = 'rgba(255,170,90,.45)'; g.fillRect(0, BAR_LIP, W, 1.5);
    return L;
  }

  // ===================== Motywy (bary) =====================
  const THEMES = {
    classic: { name: 'Bar klasyczny', shelfY: [140, 250, 360], bottleScale: 1, tap: 'chrome', buildBg: buildBgClassic, buildBar: buildBarClassic },
    psota: { name: 'PSOTA', shelfY: PS.shelfY, bottleScale: 0.72, tap: 'copper', buildBg: buildBgPsota, buildBar: buildBarPsota },
  };
  const THEME_IDS = Object.keys(THEMES);
  let THEME_ID = 'classic', THEME = THEMES.classic, BG = null, BAR = null;

  function applyTheme(id) {
    if (!THEMES[id]) id = 'classic';
    THEME_ID = id; THEME = THEMES[id];
    SHELF_Y = THEME.shelfY; BOTTLE_S = THEME.bottleScale;
    if (!THEME.bg) { THEME.bg = THEME.buildBg(); THEME.bar = THEME.buildBar(); }
    BG = THEME.bg; BAR = THEME.bar;
  }
  function loadTheme() { try { return localStorage.getItem('barman.theme') || 'classic'; } catch (e) { return 'classic'; } }
  function saveTheme(id) { try { localStorage.setItem('barman.theme', id); } catch (e) { /* brak dostępu */ } }

  // ===================== Render =====================
  function render(thumb = false) {
    const g = ctx;
    g.drawImage(BG, 0, 0);

    // butelki na półkach
    const b = S.bt;
    const away = b.pick ? b.pick.it : b.holding;
    for (const it of ITEMS) {
      if (it.shelf < 0 || it === away) continue;
      drawBottle(g, COL_X[it.col], SHELF_Y[it.shelf], it, BOTTLE_S);
    }
    if (thumb) { drawBartender(g); g.drawImage(BAR, 0, 0); drawTap(g); drawStations(g); return; }
    drawSelection(g, 'shelf');
    drawBartender(g);
    g.drawImage(BAR, 0, 0);
    drawTap(g);
    drawStations(g);
    drawSelection(g, 'bar');

    for (const c of S.customers) drawCustomer(g, c);
    for (const c of S.customers) drawBubble(g, c);

    drawFloats(g);
    drawHUD(g);
    drawToast(g);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    S.time += dt;
    pollGamepad(dt);
    if (S.mode === 'playing') update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // ===================== UI / wejście =====================
  const overlay = document.getElementById('overlay');
  function showPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === id));
    overlay.classList.toggle('hidden', !id);
    document.querySelectorAll('.best-val').forEach(e => { e.textContent = S.best; });
  }

  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    Space: 'use', Enter: 'use', KeyX: 'drop', Backspace: 'drop',
    KeyP: 'pause', Escape: 'pause', KeyM: 'mute',
  };

  // Wspólna obsługa akcji z klawiatury i gamepada
  function action(a, repeat) {
    if (a === 'mute') { if (!repeat) { const m = sfx.toggle(); toast(m ? 'Dźwięk wyłączony' : 'Dźwięk włączony'); } return; }
    if (S.mode === 'menu' && (a === 'left' || a === 'right')) {
      if (!repeat) {
        const i = THEME_IDS.indexOf(THEME_ID) + (a === 'left' ? -1 : 1);
        selectTheme(THEME_IDS[(i + THEME_IDS.length) % THEME_IDS.length]);
        sfx.tick();
      }
      return;
    }
    if (S.mode === 'menu' || S.mode === 'over') {
      // po końcu gry chwila przerwy, żeby nie zrestartować przypadkiem
      if (S.mode === 'over' && S.time - S.overTime < 1) return;
      if ((a === 'use' || a === 'pause') && !repeat) startGame();
      return;
    }
    if (a === 'pause') { if (!repeat) togglePause(); return; }
    if (S.mode === 'paused') { if (a === 'use' && !repeat) togglePause(); return; }
    if (repeat && (a === 'use' || a === 'drop')) return;
    input(a);
  }

  window.addEventListener('keydown', e => {
    const a = KEYMAP[e.code];
    if (!a) return;
    e.preventDefault();
    action(a, e.repeat);
  });

  // ===================== Gamepad =====================
  // Standardowe mapowanie: 0=A, 1=B, 2=X, 8=Select/Back, 9=Start, 12-15=krzyżak.
  const pad = { prev: {}, holdDir: null, holdT: 0 };
  const PAD_REPEAT_DELAY = 0.3, PAD_REPEAT_RATE = 0.11, STICK = 0.5;

  function pollGamepad(dt) {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of list) if (p && p.connected) { gp = p; break; }
    if (!gp) { pad.prev = {}; pad.holdDir = null; return; }

    const btn = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const cur = {
      left: btn(14) || ax < -STICK,
      right: btn(15) || ax > STICK,
      up: btn(12) || ay < -STICK,
      down: btn(13) || ay > STICK,
      use: btn(0),
      drop: btn(1) || btn(2),
      pause: btn(9),
      mute: btn(8),
    };
    for (const a in cur) if (cur[a] && !pad.prev[a]) action(a, false);

    // przytrzymanie w lewo/prawo – automatyczne powtarzanie ruchu
    const dir = cur.left ? 'left' : cur.right ? 'right' : null;
    if (dir && dir === pad.holdDir) {
      pad.holdT -= dt;
      if (pad.holdT <= 0) { action(dir, true); pad.holdT = PAD_REPEAT_RATE; }
    } else {
      pad.holdDir = dir;
      pad.holdT = PAD_REPEAT_DELAY;
    }
    pad.prev = cur;
  }

  window.addEventListener('gamepadconnected', e => toast(`Gamepad podłączony: ${e.gamepad.id.split('(')[0].trim() || 'kontroler'}`));
  window.addEventListener('gamepaddisconnected', () => toast('Gamepad odłączony'));

  document.querySelectorAll('[data-start]').forEach(btn => btn.addEventListener('click', e => { e.currentTarget.blur(); startGame(); }));
  document.getElementById('btn-resume').addEventListener('click', e => { e.currentTarget.blur(); togglePause(); });
  document.querySelectorAll('[data-menu]').forEach(btn => btn.addEventListener('click', e => { e.currentTarget.blur(); goMenu(); }));

  document.querySelectorAll('#touch [data-act]').forEach(btn => {
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      action(btn.dataset.act, false);
    });
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden && S.mode === 'playing') togglePause(); });
  window.addEventListener('blur', () => { if (S.mode === 'playing') togglePause(); });

  // ===================== Wybór baru =====================
  function selectTheme(id) {
    applyTheme(id);
    saveTheme(THEME_ID);
    document.querySelectorAll('.bar-card').forEach(c => c.setAttribute('aria-checked', String(c.dataset.theme === THEME_ID)));
  }

  function goMenu() {
    Object.assign(S, { mode: 'menu', customers: [], floats: [], toast: null, bt: newBartender() });
    showPanel('panel-menu');
  }

  // miniatury plansz w kartach wyboru
  function makeThumbs() {
    for (const id of THEME_IDS) {
      const c = document.querySelector(`.bar-card[data-theme="${id}"] canvas`);
      if (!c) continue;
      applyTheme(id);
      render(true);
      c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
    }
  }

  document.querySelectorAll('.bar-card').forEach(card => card.addEventListener('click', () => { selectTheme(card.dataset.theme); sfx.tick(); }));

  makeThumbs();
  selectTheme(loadTheme());
  showPanel('panel-menu');
  requestAnimationFrame(frame);
})();
