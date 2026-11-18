/* Barman – edycja 1
 * Czysty JavaScript + Canvas, bez zależności. Działa z GitHub Pages i z pliku lokalnego.
 */
(() => {
  'use strict';

  // ===================== Układ planszy =====================
  const W = 1280, H = 720;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const SHELF_COLS = 6;          // kolumny z butelkami
  const TAP_COL = 6;             // kolumna przy kranie z piwem
  const COLS = 7;
  const COL_X = [105, 265, 425, 585, 745, 905, 1110];
  const TAP_X = 1192;
  const SHELF_Y = [140, 250, 360]; // górna, środkowa, dolna (y deski)
  const SHELF_LEFT = 18, SHELF_RIGHT = 992;
  const BAR_TOP = 482, BAR_LIP = 500, BAR_FRONT = 512, BAR_BOTTOM = 625;
  const GLASS_BASE = 496;
  const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';

  const MOVE_SPEED = 1700;   // px/s
  const POUR_TIME = 0.8;     // s – nalewanie piwa
  const PICK_TIME = 0.22;    // s – animacja zdejmowania butelki
  const MAX_LIVES = 3;
  const SERVES_PER_LEVEL = 6;

  // ===================== Asortyment =====================
  // b – geometria butelki: w/h korpus, sh ramię, nw/nh szyjka
  const ITEMS = [
    // Górna półka – mocne alkohole
    { id: 'whisky', name: 'Whisky', shelf: 0, col: 0, glass: 'tumbler', liquid: '#c47a22', weight: 2,
      b: { w: 46, h: 46, sh: 8, nw: 13, nh: 16, color: '#a35a17', alpha: .92, cap: '#2b1a0e', label: '#efe1bf', lt: 'WHISKY', ltc: '#5a2e0a' } },
    { id: 'wodka', name: 'Wódka', shelf: 0, col: 1, glass: 'shot', liquid: '#eef7ff', weight: 3,
      b: { w: 32, h: 52, sh: 12, nw: 11, nh: 18, color: '#dceefc', alpha: .6, cap: '#c62828', label: '#c62828', lt: 'WÓDKA', ltc: '#ffffff' } },
    { id: 'rum', name: 'Rum', shelf: 0, col: 2, glass: 'tumbler', liquid: '#8a4514', weight: 1.5,
      b: { w: 38, h: 48, sh: 10, nw: 12, nh: 16, color: '#5c2a0b', alpha: .95, cap: '#d4a017', label: '#f3d27a', lt: 'RUM', ltc: '#5c2a0b' } },
    { id: 'gin', name: 'Gin', shelf: 0, col: 3, glass: 'highball', liquid: '#eaf7f0', weight: 1.5,
      b: { w: 36, h: 50, sh: 9, nw: 13, nh: 15, color: '#7fc8b0', alpha: .6, cap: '#1d3b5a', label: '#1d3b5a', lt: 'GIN', ltc: '#e8f6ff' } },
    { id: 'tequila', name: 'Tequila', shelf: 0, col: 4, glass: 'shot', liquid: '#f2d27a', weight: 1,
      b: { w: 30, h: 56, sh: 8, nw: 12, nh: 14, color: '#f0c85a', alpha: .75, cap: '#8b5a2b', label: '#2e7d32', lt: 'TEQUILA', ltc: '#ffffff' } },
    { id: 'koniak', name: 'Koniak', shelf: 0, col: 5, glass: 'tumbler', liquid: '#a5521a', weight: 1,
      b: { w: 50, h: 40, sh: 14, nw: 12, nh: 16, color: '#86400f', alpha: .95, cap: '#c9a227', label: '#1b1b1b', lt: 'KONIAK', ltc: '#e8c460' } },

    // Środkowa półka – inne alkohole
    { id: 'wino_czerwone', name: 'Wino czerwone', shelf: 1, col: 0, glass: 'wine', liquid: '#8b1428', weight: 1.5,
      b: { w: 30, h: 46, sh: 12, nw: 10, nh: 24, color: '#3b0a12', alpha: .97, cap: '#7b1022', label: '#f5efe0', lt: 'ROSSO', ltc: '#7b1022' } },
    { id: 'wino_biale', name: 'Wino białe', shelf: 1, col: 1, glass: 'wine', liquid: '#f3e7a1', weight: 1.5,
      b: { w: 30, h: 46, sh: 12, nw: 10, nh: 24, color: '#b9c76a', alpha: .75, cap: '#d9c36a', label: '#fffbe8', lt: 'BIANCO', ltc: '#6b7a1a' } },
    { id: 'prosecco', name: 'Prosecco', shelf: 1, col: 2, glass: 'flute', liquid: '#f6eaa8', weight: 1,
      b: { w: 34, h: 48, sh: 12, nw: 12, nh: 20, color: '#2f5d2a', alpha: .95, cap: '#d4af37', label: '#f6f0d8', lt: 'PROSECCO', ltc: '#2f5d2a' } },
    { id: 'wermut', name: 'Wermut', shelf: 1, col: 3, glass: 'wine', liquid: '#c0392b', weight: 1,
      b: { w: 34, h: 52, sh: 10, nw: 12, nh: 16, color: '#7a1a14', alpha: .9, cap: '#222222', label: '#f2e6c9', lt: 'WERMUT', ltc: '#7a1a14' } },
    { id: 'likier', name: 'Likier ziołowy', shelf: 1, col: 4, glass: 'shot', liquid: '#4a3418', weight: 1,
      b: { w: 40, h: 46, sh: 8, nw: 13, nh: 14, color: '#1f3d1f', alpha: .97, cap: '#c8a03a', label: '#d9b14a', lt: 'ZIOŁOWY', ltc: '#1f3d1f' } },
    { id: 'amaretto', name: 'Amaretto', shelf: 1, col: 5, glass: 'tumbler', liquid: '#b8621e', weight: 1,
      b: { w: 40, h: 44, sh: 10, nw: 13, nh: 14, color: '#a8561a', alpha: .85, cap: '#e6e6e6', label: '#f3e3c3', lt: 'AMARETTO', ltc: '#7a3b10' } },

    // Dolna półka – softy, soki, syropy
    { id: 'cola', name: 'Cola', shelf: 2, col: 0, glass: 'highball', liquid: '#3a1d0e', weight: 1.5,
      b: { w: 28, h: 50, sh: 14, nw: 11, nh: 14, color: '#3a1d0e', alpha: .9, cap: '#d32f2f', label: '#d32f2f', lt: 'COLA', ltc: '#ffffff' } },
    { id: 'tonik', name: 'Tonik', shelf: 2, col: 1, glass: 'highball', liquid: '#eef8fb', weight: 1,
      b: { w: 28, h: 50, sh: 14, nw: 11, nh: 14, color: '#cfe8ef', alpha: .55, cap: '#f9a825', label: '#f9a825', lt: 'TONIK', ltc: '#ffffff' } },
    { id: 'sok_pom', name: 'Sok pomarańczowy', shelf: 2, col: 2, glass: 'highball', liquid: '#ff9800', weight: 1.5,
      b: { type: 'carton', w: 42, h: 64, color: '#ff9800', label: '#ffffff', lt: 'POMARAŃCZA', ltc: '#e65100' } },
    { id: 'sok_jab', name: 'Sok jabłkowy', shelf: 2, col: 3, glass: 'highball', liquid: '#e8c547', weight: 1,
      b: { type: 'carton', w: 42, h: 64, color: '#7cb342', label: '#ffffff', lt: 'JABŁKO', ltc: '#33691e' } },
    { id: 'grenadyna', name: 'Syrop grenadyna', shelf: 2, col: 4, glass: 'shot', liquid: '#c2185b', weight: 0.8,
      b: { w: 30, h: 52, sh: 8, nw: 11, nh: 16, color: '#b0103f', alpha: .85, cap: '#333333', label: '#ffffff', lt: 'SYROP', ltc: '#b0103f' } },
    { id: 'woda', name: 'Woda gazowana', shelf: 2, col: 5, glass: 'highball', liquid: '#e3f2fd', weight: 1,
      b: { w: 32, h: 52, sh: 12, nw: 12, nh: 12, color: '#64b5f6', alpha: .45, cap: '#1565c0', label: '#1565c0', lt: 'WODA', ltc: '#ffffff' } },

    // Kran
    { id: 'piwo', name: 'Piwo', shelf: -1, col: TAP_COL, glass: 'pint', liquid: '#f2b01e', weight: 4 },
  ];
  const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
  const GRID = [[], [], []];
  ITEMS.forEach(i => { if (i.shelf >= 0) GRID[i.shelf][i.col] = i; });
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
    return { col: 3, x: COL_X[3], sel: 2, holding: null, busy: 0, busyKind: null, pick: null, queued: null };
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
    for (const it of ITEMS) { r -= it.weight; if (r <= 0) return it; }
    return ITEM.piwo;
  }
  function activeCustomers() { return S.customers.filter(c => c.state === 'enter' || c.state === 'wait'); }
  function customerAt(col) { return S.customers.find(c => c.col === col && (c.state === 'enter' || c.state === 'wait')); }

  function spawnCustomer() {
    const used = new Set(S.customers.filter(c => c.state !== 'leave').map(c => c.col));
    const free = [];
    for (let i = 0; i < COLS; i++) if (!used.has(i)) free.push(i);
    if (!free.length) return false;
    const p = params();
    S.customers.push({
      col: pick(free), item: pickOrder(), patience: p.patience, max: p.patience,
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

  function doUse() {
    const b = S.bt;
    if (b.holding) {
      const c = customerAt(b.col);
      if (c) serve(c);
      else { toast('Podejdź do klienta, żeby podać (X – odłóż)'); sfx.deny(); }
      return;
    }
    if (b.col === TAP_COL) {
      b.busy = POUR_TIME; b.busyKind = 'pour'; sfx.pour();
      return;
    }
    const it = GRID[b.sel][b.col];
    b.holding = it;
    b.pick = { it, t: 0 };
    sfx.pick();
  }

  function doDrop() {
    const b = S.bt;
    if (!b.holding) return;
    b.holding = null; b.pick = null;
    sfx.drop();
  }

  function serve(c) {
    const b = S.bt;
    const given = b.holding;
    b.holding = null; b.pick = null;
    c.glass = given;
    c.t = 0;
    const x = COL_X[c.col];
    if (given.id === c.item.id) {
      S.streak++;
      S.bestStreak = Math.max(S.bestStreak, S.streak);
      const frac = c.patience / c.max;
      const mult = 1 + Math.min(S.streak - 1, 5) * 0.1;
      const pts = Math.round((50 + 100 * frac) * mult);
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

  function drawBartender(g) {
    const b = S.bt, x = b.x;
    const headY = 410 + Math.sin(S.time * 3) * 1.2;
    const shY = 446;
    const skin = '#f0c49a';

    let L = { x: x - 34, y: 482 }, R = { x: x + 34, y: 482 };
    const pouring = b.busyKind === 'pour' && b.busy > 0;
    if (pouring) R = { x: TAP_X - 4, y: 352 + (1 - b.busy / POUR_TIME) * 10 };
    else if (b.pick) R = { x: x + 32, y: lerp(392, 468, easeOut(b.pick.t / PICK_TIME)) };
    else if (b.holding) R = { x: x + 32, y: 468 };

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
      drawHeldItem(g, it, px, py, lerp(1, 0.62, k));
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

    // wieża
    const gr = g.createLinearGradient(x - 14, 0, x + 14, 0);
    gr.addColorStop(0, '#6d757c'); gr.addColorStop(0.45, '#eef3f6'); gr.addColorStop(1, '#7a8288');
    g.fillStyle = gr;
    rr(g, x - 13, 404, 26, 84, 4); g.fill();
    rr(g, x - 20, 396, 40, 12, 4); g.fill();
    rr(g, x - 4, 416, 8, 24, 3); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1;
    rr(g, x - 13, 404, 26, 84, 4); g.stroke();

    // rączka
    g.save();
    g.translate(x, 398);
    g.rotate(pouring ? -0.42 : 0);
    g.fillStyle = '#1a1a1a'; rr(g, -8, -62, 16, 60, 6); g.fill();
    g.fillStyle = '#f2b01e'; rr(g, -6, -56, 12, 34, 3); g.fill();
    g.fillStyle = '#3a2208'; g.font = `800 8px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['P', 'I', 'W', 'O'].forEach((ch, i) => g.fillText(ch, 0, -51 + i * 8));
    g.restore();

    if (pouring) {
      const k = 1 - b.busy / POUR_TIME, s = 0.8;
      const lvl = GLASS_BASE + glassLiquidY('pint', k) * s;
      g.fillStyle = 'rgba(242,176,30,.95)';
      g.fillRect(x - 2, 440, 4, Math.max(0, lvl - 440));
      drawGlass(g, x, GLASS_BASE, 'pint', ITEM.piwo.liquid, k, s);
    }
  }

  function drawSelection(g, tapOnly) {
    const b = S.bt;
    if (S.mode === 'over' || b.holding || b.busy > 0) return;
    const atTap = b.col === TAP_COL;
    if (tapOnly !== atTap) return;
    const pulse = 0.5 + 0.5 * Math.sin(S.time * 6);
    g.save();
    g.strokeStyle = `rgba(255,214,90,${0.55 + 0.45 * pulse})`;
    g.lineWidth = 3;
    g.shadowColor = 'rgba(255,190,60,.95)';
    g.shadowBlur = 16;
    if (atTap) rr(g, TAP_X - 28, 326, 56, 176, 10);
    else rr(g, COL_X[b.col] - 44, SHELF_Y[b.sel] - 102, 88, 104, 10);
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
    const x = COL_X[c.col];
    const off = c.state === 'enter' ? (1 - easeOut(c.t / 0.45)) * 170 : 0;
    const cy = 552 + off;
    let text, color = '#2a1608', bg = '#fffaf0';
    if (c.state === 'happy') { text = c.msg; bg = '#d8ffd9'; color = '#145a1d'; }
    else if (c.state === 'angry') { text = c.msg; bg = '#ffd6d6'; color = '#7a0f0f'; }
    else text = `1× ${c.item.name}`;

    const size = fitFont(g, text, 150, 17);
    const tw = g.measureText(text).width;
    const w = Math.max(112, tw + 26), h = 50;
    g.save();
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 8; g.shadowOffsetY = 2;
    g.fillStyle = bg;
    rr(g, x - w / 2, cy - h / 2, w, h, 12); g.fill();
    g.shadowColor = 'transparent';
    g.beginPath(); g.moveTo(x - 9, cy + h / 2 - 1); g.lineTo(x, cy + h / 2 + 10); g.lineTo(x + 9, cy + h / 2 - 1); g.closePath(); g.fill();
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
    const held = S.bt.holding ? S.bt.holding.name : (S.bt.busyKind === 'pour' ? 'nalewam…' : '—');
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
  function buildBackground() {
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
      g.font = `700 10px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#ffeacb';
      for (let c = 0; c < SHELF_COLS; c++) g.fillText(GRID[s][c].name.toUpperCase(), COL_X[c], y + 8);
    }

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

  function buildBar() {
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

  const BG = buildBackground();
  const BAR = buildBar();

  // ===================== Render =====================
  function render() {
    const g = ctx;
    g.drawImage(BG, 0, 0);

    // butelki na półkach
    const b = S.bt;
    const away = b.pick ? b.pick.it : b.holding;
    for (const it of ITEMS) {
      if (it.shelf < 0 || it === away) continue;
      drawBottle(g, COL_X[it.col], SHELF_Y[it.shelf], it);
    }
    drawSelection(g, false);
    drawBartender(g);
    g.drawImage(BAR, 0, 0);
    drawTap(g);
    drawSelection(g, true);

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

  document.querySelectorAll('#touch [data-act]').forEach(btn => {
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      const a = btn.dataset.act;
      if (S.mode === 'menu' || S.mode === 'over') { if (a === 'use') startGame(); return; }
      if (S.mode === 'paused') { if (a === 'use') togglePause(); return; }
      input(a);
    });
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden && S.mode === 'playing') togglePause(); });
  window.addEventListener('blur', () => { if (S.mode === 'playing') togglePause(); });

  showPanel('panel-menu');
  requestAnimationFrame(frame);
})();
