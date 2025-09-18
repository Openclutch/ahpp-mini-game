(() => {
  // ---------- CONFIG ----------
  const RETRO = {
    teal: '#2BAF90',
    deepTeal: '#176B5A',
    mint: '#A1D4B1',
    softMint: '#CBE8D2',
    gold: '#F1A512',
    paleGold: '#FCE2B6',
    orange: '#DD4111',
    sunburst: '#F77A3B',
    berry: '#8C0027',
    deepBerry: '#4E0B1D',
    midnight: '#2B0F1A',
    plum: '#471020',
    shadow: '#360C1B',
    sand: '#F9E4C1',
    cream: '#FFF4D6',
  };

  const MODS = {
    nitro:        { name: 'Cold Air Intake',          installMs: 60000,  payout: 900,   cost: 350,  icon: '🌬️', palette: [RETRO.teal, RETRO.softMint, RETRO.deepTeal] },
    neon:         { name: 'Performance Exhaust',      installMs: 75000,  payout: 1200,  cost: 520,  icon: '💨', palette: [RETRO.gold, RETRO.paleGold, RETRO.berry] },
    driftTires:   { name: 'Tuned Headers',            installMs: 90000,  payout: 1900,  cost: 900,  icon: '🔧', palette: [RETRO.sunburst, RETRO.gold, RETRO.shadow] },
    suspension:   { name: 'High-Flow Fuel System',    installMs: 120000, payout: 2800,  cost: 1500, icon: '⛽', palette: [RETRO.mint, RETRO.teal, RETRO.deepBerry] },
    sound:        { name: 'ECU Tune',                 installMs: 150000, payout: 3600,  cost: 2100, icon: '💾', palette: [RETRO.berry, RETRO.orange, RETRO.midnight] },
    wrap:         { name: 'Coilover Suspension',      installMs: 180000, payout: 4700,  cost: 2600, icon: '🛞', palette: [RETRO.orange, RETRO.sunburst, RETRO.shadow] },
    turbo:        { name: 'Big Brake Kit',            installMs: 240000, payout: 6800,  cost: 4000, icon: '🛑', palette: [RETRO.gold, RETRO.teal, RETRO.deepBerry] },
    aero:         { name: 'Carbon Fiber Body Kit',    installMs: 300000, payout: 9400,  cost: 6200, icon: '🪶', palette: [RETRO.mint, RETRO.paleGold, RETRO.shadow] },
    ecu:          { name: 'Stage 2 Turbocharger',     installMs: 360000, payout: 12600, cost: 8300, icon: '🌀', palette: [RETRO.teal, RETRO.gold, RETRO.midnight] },
    supercharger: { name: 'Front-Mount Intercooler',  installMs: 420000, payout: 17100, cost: 12000,icon: '❄️', palette: [RETRO.mint, RETRO.softMint, RETRO.deepTeal] },
    driftAI:      { name: 'Wet Nitrous Kit',          installMs: 480000, payout: 22800, cost: 18000,icon: '🧨', palette: [RETRO.orange, RETRO.sunburst, RETRO.berry] },
    rocketFuel:   { name: 'Race-Spec Engine Swap',    installMs: 540000, payout: 29600, cost: 25000,icon: '⚙️', palette: [RETRO.gold, RETRO.orange, RETRO.midnight] },
  };

  const CREDIT_SYMBOL = '$';
  function formatCredits(value) {
    const amount = Number(value ?? 0);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    try {
      return `${CREDIT_SYMBOL}${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } catch (err) {
      if (!formatCredits._warned) {
        console.warn('Falling back to simple credit formatting', err);
        formatCredits._warned = true;
      }
      const rounded = Math.round(safeAmount);
      const withGrouping = Math.abs(rounded)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const prefix = rounded < 0 ? '-' : '';
      return `${CREDIT_SYMBOL}${prefix}${withGrouping}`;
    }
  }

  const REPAIR_COST = 250;
  const DEFAULT_MOD = 'nitro';

  const CREW = [
    { id: 'mechanic', name: 'Ace Mechanic', emoji: '🛠️', payoutMult: 1.15, perk: 'Race payouts +15%' },
    { id: 'driver',   name: 'Ghost Driver', emoji: '👻', speed: 0.6,        perk: 'Movement speed boost' },
    { id: 'tuner',    name: 'Chip Tuner',   emoji: '💾', installSpeed: 1.15, perk: 'Install time -15%' },
    { id: 'spotter',  name: 'Street Spotter', emoji: '👀', randomBonus: true, perk: 'Chance for bonus builds' },
  ];

  function describeCrew(member) {
    if (!member) return '—';
    return member.perk ? `${member.name} (${member.perk})` : member.name;
  }

  const MOD_CATALOG = Object.entries(MODS).map(([id, mod]) => ({
    id,
    name: mod.name,
    cost: mod.cost,
    payout: mod.payout,
    icon: mod.icon,
  })).sort((a, b) => a.cost - b.cost);

  const costValues = MOD_CATALOG.map(mod => mod.cost);
  const minCost = costValues.length ? Math.min(...costValues) : 0;
  const maxCost = costValues.length ? Math.max(...costValues) : 0;
  const baseInstall = MODS[DEFAULT_MOD].installMs;
  const maxInstall = Math.max(...Object.values(MODS).map(mod => mod.installMs || baseInstall));
  const targetMaxInstall = Math.max(baseInstall, Math.round(maxInstall * 0.75));
  const costLogSpan = (minCost > 0 && maxCost > minCost) ? Math.log(maxCost / minCost) : 0;

  for (const entry of MOD_CATALOG) {
    const mod = MODS[entry.id];
    let ratio = 0;
    if (costLogSpan && entry.cost > minCost) {
      ratio = Math.log(entry.cost / minCost) / costLogSpan;
    }
    const smooth = baseInstall + (targetMaxInstall - baseInstall) * Math.min(1, Math.max(0, ratio));
    const installMs = Math.round(smooth / 1000) * 1000;
    mod.installMs = Math.min(targetMaxInstall, Math.max(baseInstall, installMs));
    mod.name = mod.name || entry.name;
    if (mod.payout == null) mod.payout = entry.cost * 2;
  }

  const modStock = new Set();

  const SAVE_KEY = 'neon-drift-main';
  const LEGACY_KEYS = ['garden-duo-main', 'garden-duo-v3'];

  const TUNINGS = [
    { id: 'precision', label: 'Precision Tune', effect: build => build.installMs *= 0.75 },
    { id: 'bigOrder',  label: 'Big Order',      effect: build => build.payoutMult = 1.8 },
    { id: 'flashsale', label: 'Flash Sale',     effect: build => build.rotChance = 0.25 },
    { id: 'double',    label: 'Twin Setup',     effect: build => build.yield = 2 },
  ];

  const STREET_EVENTS = [
    { id: 'midnightRush', label: 'Midnight Rush! Install speed +40% for 30s', dur: 30000, apply: s => { s.installMult *= 1.4; } },
    { id: 'rainstorm',    label: 'Rainstorm! Install speed -25% for 30s',     dur: 30000, apply: s => { s.installMult *= 0.75; } },
    { id: 'jackpot',      label: 'High Roller! Race payouts +50% for 30s',   dur: 30000, apply: s => { s.payoutMult *= 1.5; } },
    { id: 'crackdown',    label: 'Police Crackdown! Payouts -30% for 30s',   dur: 30000, apply: s => { s.payoutMult *= 0.7; } },
  ];

  const GUIDE_STORAGE_KEY = 'garage-guide-intro-v1';
  const GUIDE_STEPS = [
    {
      title: 'Meet Liora',
      text: "Hey there! I'm Liora, the plaza host. This underground garage is buzzing tonight, so I'll walk you through it.",
    },
    {
      title: 'Getting Around',
      text: 'Use WASD (or the touch controls) to move. Visit the Parts Vendor to stock up, then head into your bays to install mods.',
    },
    {
      title: 'Cash Out & Events',
      text: 'Finish builds to stash race-ready cars. Hit the Race Terminal to cash in and watch for plaza events—come find me if you need a refresher! Press Space or tap to get rolling.',
    },
  ];
  // ---------- STATE ----------
  const state = {
    payoutMult: 1,
    installMult: 1,
    bays: [],
    p1: { x: 220, y: 450, w: 42, h: 42, speedBase: 3.2, credits: 1000, inventory: {}, stash: {}, selected: DEFAULT_MOD, crewMember: null, crew: [] },
    shopOpen: null,
    raceOpen: false,
    activeEvent: null,
    eventUntil: 0,
    challenge: null,
    hints: { parts: true, race: true },
    guide: { active: false, step: 0 },
  };

  function normalizeHints(hints) {
    return {
      parts: hints?.parts !== false,
      race: hints?.race !== false,
    };
  }

  state.hints = normalizeHints(state.hints);

  try {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem(GUIDE_STORAGE_KEY)) {
      state.guide.active = true;
      state.guide.step = 0;
    }
  } catch (err) {
    console.warn('Unable to read guide storage flag', err);
  }

  function hydrateBuild(build) {
    if (!build || typeof build !== 'object') return null;
    if (!MODS[build.kind]) return null;
    const installMs = Math.max(1, Math.round(build.installMs || MODS[build.kind].installMs || baseInstall));
    let progressMs = Number(build.progressMs);
    if (!Number.isFinite(progressMs) || progressMs < 0) progressMs = 0;
    if (progressMs > installMs) progressMs = installMs;
    return { ...build, installMs, progressMs };
  }

  function migrateLegacy() {
    if (localStorage.getItem(SAVE_KEY)) return;
    for (const key of LEGACY_KEYS) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') {
            const converted = {
              payoutMult: parsed.priceMult ?? 1,
              installMult: parsed.growthMult ?? 1,
              bays: Array.isArray(parsed.plots) ? parsed.plots.map(pl => ({
                x: pl.x,
                y: pl.y,
                w: pl.w,
                h: pl.h,
                owner: pl.owner,
                build: pl.crop ? {
                  kind: pl.crop.kind,
                  plantedAt: pl.crop.plantedAt,
                  installMs: pl.crop.growMs,
                  progressMs: Math.max(0, Math.min(Number(pl.crop.progressMs) || 0, pl.crop.growMs || 0)),
                  yield: pl.crop.yield,
                  payoutMult: pl.crop.sellMult,
                  rotChance: pl.crop.rotChance,
                  tuning: pl.crop.mutation,
                  dead: pl.crop.dead,
                } : null,
              })) : [],
              p1: parsed.p1 ? {
                credits: parsed.p1.money ?? 0,
                inventory: parsed.p1.invSeeds ?? {},
                stash: parsed.p1.bag ?? {},
                selected: parsed.p1.selected ?? DEFAULT_MOD,
              } : undefined,
              p2: parsed.p2 ? {
                credits: parsed.p2.money ?? 0,
                inventory: parsed.p2.invSeeds ?? {},
                stash: parsed.p2.bag ?? {},
                selected: parsed.p2.selected ?? DEFAULT_MOD,
              } : undefined,
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(converted));
            console.info('Migrated legacy save from', key);
            break;
          }
        } catch (err) {
          console.warn('Failed to migrate legacy save', err);
        }
      }
    }
  }
  migrateLegacy();

  function applySavedState(saved) {
    if (!saved) return false;
    state.payoutMult = saved.payoutMult ?? state.payoutMult;
    state.installMult = saved.installMult ?? state.installMult;
    const savedBays = Array.isArray(saved.bays) ? saved.bays : state.bays;
    state.bays = savedBays
      .filter(bay => bay && bay.owner !== 'P2')
      .map(bay => ({
        ...bay,
        owner: bay.owner || 'P1',
        build: hydrateBuild(bay.build),
      }));
    Object.assign(state.p1, saved.p1 || {});
    state.p1.crewMember = null;
    state.p1.crew = state.p1.crew || [];
    state.shopOpen = null;
    state.raceOpen = false;
    state.hints = normalizeHints(saved.hints);

    if (state.p1.credits == null) state.p1.credits = 1000;

    if (!state.p1.inventory) state.p1.inventory = {};
    if (!state.p1.stash) state.p1.stash = {};
    if (state.p1.selected == null) state.p1.selected = DEFAULT_MOD;

    if (saved.p2) {
      const addToMap = (target, source) => {
        if (!source || typeof source !== 'object') return;
        for (const [key, value] of Object.entries(source)) {
          if (!MODS[key]) continue;
          const amount = Number(value) || 0;
          if (!Number.isFinite(amount) || amount <= 0) continue;
          target[key] = (target[key] || 0) + amount;
        }
      };
      const extraCredits = Number(saved.p2.credits);
      if (Number.isFinite(extraCredits) && extraCredits > 0) {
        state.p1.credits += extraCredits;
      }
      addToMap(state.p1.inventory, saved.p2.inventory);
      addToMap(state.p1.stash, saved.p2.stash);
    }
    return true;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (applySavedState(saved)) save();
  } catch (err) {
    console.warn('Failed to load save', err);
  }

  for (const mod of MOD_CATALOG) {
    if (state.p1.inventory[mod.id] == null) state.p1.inventory[mod.id] = 0;
    if (state.p1.stash[mod.id] == null) state.p1.stash[mod.id] = 0;
  }

  for (const player of [state.p1]) {
    for (const key of Object.keys(player.inventory)) {
      if (!MODS[key]) delete player.inventory[key];
    }
    for (const key of Object.keys(player.stash)) {
      if (!MODS[key]) delete player.stash[key];
    }
    if (!MODS[player.selected]) player.selected = DEFAULT_MOD;
  }

  function save() {
    const minimal = JSON.parse(JSON.stringify({
      payoutMult: state.payoutMult,
      installMult: state.installMult,
      bays: state.bays,
      hints: state.hints,
      p1: { credits: state.p1.credits, inventory: state.p1.inventory, stash: state.p1.stash, selected: state.p1.selected },
    }));
    console.log('Saving game state', minimal);
    localStorage.setItem(SAVE_KEY, JSON.stringify(minimal));
  }
  setInterval(save, 10000);
  window.addEventListener('beforeunload', save);
  // ---------- DOM ----------
  const p1moneyEl = document.getElementById('p1money');
  const p1hud = document.getElementById('p1hud');
  const feed = document.getElementById('feed');
  const tooltip = document.getElementById('tooltip');
  const eventsPanel = document.getElementById('events');
  const toggleBtn = document.getElementById('toggleEvents');
  const btnSave = document.getElementById('btnSave');
  const btnLoad = document.getElementById('btnLoad');
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const fileImport = document.getElementById('fileImport');
  const shopPanel = document.getElementById('shopPanel');
  const sellPanel = document.getElementById('sellPanel');
  const partsHelp = document.getElementById('partsHelp');
  const raceHelp = document.getElementById('sellInfo');
  const modListEl = document.getElementById('modList');
  const p1Controls = document.getElementById('p1Controls');

  console.log('DOM elements loaded', {
    p1moneyEl,
    p1hud,
    shopPanel,
    sellPanel,
    partsHelp,
    raceHelp,
    modListEl,
  });

  function updateHelpVisibility() {
    if (partsHelp) partsHelp.hidden = !state.hints?.parts;
    if (raceHelp) raceHelp.hidden = !state.hints?.race;
  }

  function dismissHint(kind) {
    if (!state.hints) state.hints = normalizeHints();
    if (state.hints[kind] === false) return;
    state.hints[kind] = false;
    updateHelpVisibility();
    save();
  }

  updateHelpVisibility();
  syncVendorUi();

  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  function bindTouchControls(container) {
    if (!container) return;
    container.querySelectorAll('button[data-key]').forEach(btn => {
      const code = btn.dataset.key;
      const start = e => { e.preventDefault(); keys.add(code); };
      const end = () => { keys.delete(code); };
      btn.addEventListener('touchstart', start);
      btn.addEventListener('touchend', end);
      btn.addEventListener('touchcancel', end);
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
      btn.addEventListener('click', e => {
        e.preventDefault();
        keys.add(code);
        setTimeout(() => keys.delete(code), 100);
      });
    });
  }

  function setupJoystick(container) {
    if (!container) return;
    const mapping = {
      up: container.dataset.up,
      down: container.dataset.down,
      left: container.dataset.left,
      right: container.dataset.right,
    };
    const combos = [
      [mapping.right],
      [mapping.right, mapping.down],
      [mapping.down],
      [mapping.down, mapping.left],
      [mapping.left],
      [mapping.left, mapping.up],
      [mapping.up],
      [mapping.up, mapping.right],
    ].map(arr => arr.filter(Boolean));
    const thumb = container.querySelector('.stick');
    const active = new Set();
    let pointerId = null;

    function setActiveCodes(codes) {
      for (const code of Array.from(active)) {
        if (!codes.includes(code)) {
          active.delete(code);
          keys.delete(code);
        }
      }
      for (const code of codes) {
        if (!active.has(code)) {
          active.add(code);
          keys.add(code);
        }
      }
    }

    function updateFromEvent(e) {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const radius = rect.width / 2;
      const thumbRadius = thumb ? thumb.offsetWidth / 2 : 0;
      const maxDistance = Math.max(0, radius - thumbRadius - 4);
      const distance = Math.hypot(dx, dy);
      const ratio = distance > 0 ? Math.min(1, maxDistance / distance) : 0;
      if (thumb) {
        thumb.style.transform = `translate(${dx * ratio}px, ${dy * ratio}px)`;
      }
      const threshold = Math.max(8, maxDistance * 0.45);
      if (distance < threshold) {
        setActiveCodes([]);
        container.classList.remove('active');
        return;
      }
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;
      const segment = Math.round(angle / (Math.PI / 4)) % 8;
      const codes = combos[segment] || [];
      setActiveCodes(codes);
      if (codes.length) {
        container.classList.add('active');
      } else {
        container.classList.remove('active');
      }
    }

    function reset() {
      setActiveCodes([]);
      container.classList.remove('active');
      if (thumb) {
        thumb.style.transform = 'translate(0px, 0px)';
      }
    }

    container.addEventListener('pointerdown', e => {
      if (pointerId != null) { e.preventDefault(); return; }
      pointerId = e.pointerId;
      if (typeof container.setPointerCapture === 'function') {
        container.setPointerCapture(pointerId);
      }
      updateFromEvent(e);
      e.preventDefault();
    });

    container.addEventListener('pointermove', e => {
      if (pointerId !== e.pointerId) return;
      updateFromEvent(e);
      e.preventDefault();
    });

    function endInteraction(e) {
      if (pointerId !== e.pointerId) return;
      const id = pointerId;
      pointerId = null;
      if (typeof container.releasePointerCapture === 'function') {
        if (typeof container.hasPointerCapture !== 'function' || container.hasPointerCapture(id)) {
          container.releasePointerCapture(id);
        }
      }
      reset();
      e.preventDefault();
    }

    container.addEventListener('pointerup', endInteraction);
    container.addEventListener('pointercancel', endInteraction);
    container.addEventListener('lostpointercapture', () => {
      pointerId = null;
      reset();
    });
    container.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('blur', () => {
      if (pointerId != null && typeof container.releasePointerCapture === 'function') {
        if (typeof container.hasPointerCapture !== 'function' || container.hasPointerCapture(pointerId)) {
          container.releasePointerCapture(pointerId);
        }
      }
      pointerId = null;
      reset();
    });
  }

  bindTouchControls(p1Controls);
  if (p1Controls) {
    setupJoystick(p1Controls.querySelector('.dpad'));
  }

  window.addEventListener('keydown', () => {
    if (p1Controls) p1Controls.style.display = 'none';
  }, { once: true });
  function log(msg) {
    const d = document.createElement('div');
    d.className = 'evt';
    d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    feed.prepend(d);
    while (feed.childElementCount > 60) feed.lastChild.remove();
  }

  btnSave.onclick = () => { save(); log('Garage data saved to browser.'); };
  btnLoad.onclick = () => {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!applySavedState(saved)) { log('No garage save found.'); return; }
    updateHelpVisibility();
    syncVendorUi();
    save();
    log('Garage save loaded.');
  };
  btnExport.onclick = () => {
    save();
    const blob = new Blob([localStorage.getItem(SAVE_KEY) || '{}'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'neon_drift_save.json';
    a.click();
    URL.revokeObjectURL(a.href);
    log('Exported garage data.');
  };
  btnImport.onclick = () => fileImport.click();
  fileImport.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const data = JSON.parse(txt);
      applySavedState(data);
      updateHelpVisibility();
      syncVendorUi();
      save();
      log('Imported garage data.');
    } catch {
      log('Failed to import data.');
    }
  };
  // ---------- WORLD LAYOUT ----------
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const WORLD = { w: cv.width, h: cv.height };

  const STATION_W = 220;
  const STATION_H = 140;
  const STATION_GAP = 48;
  const PLAZA_TOP = 40;
  const plazaCenterX = WORLD.w / 2;

  const STATIONS = {
    parts: {
      x: Math.round(plazaCenterX - STATION_W - STATION_GAP / 2),
      y: PLAZA_TOP,
      w: STATION_W,
      h: STATION_H,
    },
    race: {
      x: Math.round(plazaCenterX + STATION_GAP / 2),
      y: PLAZA_TOP,
      w: STATION_W,
      h: STATION_H,
    },
  };

  const GARAGE_W = 480;
  const GARAGE_H = 360;
  const GARAGE_TOP = 260;

  const GARAGES = [
    { x: Math.round((WORLD.w - GARAGE_W) / 2), y: GARAGE_TOP, w: GARAGE_W, h: GARAGE_H, cols: 5, rows: 4, owner: 'P1' },
  ];

  const SPOTLIGHT_POSITION = {
    x: Math.round(plazaCenterX),
    y: STATIONS.parts.y + STATIONS.parts.h + 90,
    r: 60,
  };

  function buildGarageLayout(owner) {
    const g = GARAGES.find(g => g.owner === owner);
    if (!g) return [];
    const cellW = Math.floor(g.w / g.cols);
    const cellH = Math.floor(g.h / g.rows);
    const layout = [];
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        layout.push({
          x: g.x + c * cellW + 6,
          y: g.y + r * cellH + 6,
          w: cellW - 12,
          h: cellH - 12,
          owner,
          build: null,
        });
      }
    }
    return layout;
  }

  const otherBays = Array.isArray(state.bays) ? state.bays.filter(bay => bay.owner && bay.owner !== 'P1') : [];
  const existingP1Bays = Array.isArray(state.bays) ? state.bays.filter(bay => (bay.owner || 'P1') === 'P1') : [];
  existingP1Bays.sort((a, b) => (a.y - b.y) || (a.x - b.x));

  const p1Layout = buildGarageLayout('P1');
  for (let i = 0; i < p1Layout.length; i++) {
    p1Layout[i].build = existingP1Bays[i]?.build || null;
  }

  state.bays = [...p1Layout, ...otherBays];

  const defaultGarage = GARAGES.find(g => g.owner === 'P1');
  if (defaultGarage) {
    state.p1.x = defaultGarage.x + defaultGarage.w / 2 - state.p1.w / 2;
    state.p1.y = defaultGarage.y + defaultGarage.h - state.p1.h - 24;
  }

  function activeBays() {
    return state.bays;
  }

  for (const bay of state.bays) {
    if (!bay.owner) bay.owner = 'P1';
  }
  // ---------- INPUT ----------
  const keys = new Set();
  window.addEventListener('keydown', e => {
    keys.add(e.code);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', e => {
    keys.delete(e.code);
  });

  console.log('Touch support detected:', isTouch);
  if (isTouch) {
    console.log('Touch mode enabled – pointer interactions will trigger actions');
    cv.addEventListener('pointerdown', e => {
      if (state.guide?.active) {
        advanceGuide();
        return;
      }
      const rect = cv.getBoundingClientRect();
      const x = (e.clientX - rect.left) * cv.width / rect.width;
      const y = (e.clientY - rect.top) * cv.height / rect.height;
      const bay = activeBays().find(pl => inside(x, y, 0, 0, pl.x, pl.y, pl.w, pl.h));
      if (!bay) return;
      const p = playerByName(bay.owner);
      const oldX = p.x, oldY = p.y;
      p.x = bay.x; p.y = bay.y;
      playerAction(p, bay.owner);
      p.x = oldX; p.y = oldY;
    });
  } else {
    console.log('Keyboard mode enabled – use WASD/Arrows to move');
    cv.addEventListener('click', () => {
      if (state.guide?.active) advanceGuide();
    });
  }

  function movePlayer(p, up, left, down, right) {
    const crew = p.crewMember ? CREW.find(x => x.id === p.crewMember.id) : null;
    const speed = p.speedBase + (crew?.speed || 0);
    if (keys.has(up)) p.y -= speed;
    if (keys.has(down)) p.y += speed;
    if (keys.has(left)) p.x -= speed;
    if (keys.has(right)) p.x += speed;
    p.x = Math.max(0, Math.min(WORLD.w - p.w, p.x));
    p.y = Math.max(0, Math.min(WORLD.h - p.h, p.y));
  }

  function moveCrew(p) {
    if (!p.crewMember) return;
    const targetX = p.x - p.w * 0.8;
    const targetY = p.y - p.h * 0.8;
    if (p.crewMember.x == null) p.crewMember.x = targetX;
    if (p.crewMember.y == null) p.crewMember.y = targetY;
    p.crewMember.x += (targetX - p.crewMember.x) * 0.05;
    p.crewMember.y += (targetY - p.crewMember.y) * 0.05;
  }

  const pressed = new Set();
  function justPressed(code) {
    const has = keys.has(code);
    const once = has && !pressed.has(code);
    if (once) pressed.add(code);
    if (!has) pressed.delete(code);
    return once;
  }

  // ---------- GAMEPLAY ----------
  function inside(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function isAtStation(p, station) {
    if (!p || !station) return false;
    return inside(p.x, p.y, p.w, p.h, station.x, station.y, station.w, station.h);
  }
  function dist(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.hypot(dx, dy); }

  function playerByName(name) {
    if (name && name !== 'P1') {
      console.warn('Unknown player requested, defaulting to P1:', name);
    }
    return state.p1;
  }

  function cycleMod(p) {
    const available = Object.keys(p.inventory).filter(id => p.inventory[id] > 0);
    if (available.length === 0) return;
    let idx = available.indexOf(p.selected);
    idx = (idx + 1) % available.length;
    p.selected = available[idx];
  }

  function selectModByIndex(p, idx) {
    const available = Object.keys(p.inventory).filter(id => p.inventory[id] > 0);
    if (idx >= 0 && idx < available.length) {
      p.selected = available[idx];
    }
  }

  const MOD_GLYPHS = Object.fromEntries(MOD_CATALOG.map(mod => [mod.id, MODS[mod.id].icon || '⚙️']));
  function modGlyph(id) { return MOD_GLYPHS[id] || '⚙️'; }
  function playerAction(p, who) {
    console.log('playerAction triggered', {
      who,
      position: { x: p.x, y: p.y },
      stash: { ...p.stash },
      inventory: { ...p.inventory },
    });

    if (isAtStation(p, STATIONS.parts)) {
      state.shopOpen = state.shopOpen === who ? null : who;
      state.raceOpen = false;
      log('You toggled the Parts Vendor.');
      dismissHint('parts');
      if (state.shopOpen) { generateModStock(); }
      syncVendorUi();
      return;
    }
    if (isAtStation(p, STATIONS.race)) {
      const sold = sellAll(p);
      if (sold > 0) { log(`You banked ${formatCredits(sold)} in race winnings.`); state.raceOpen = true; state.shopOpen = null; }
      else { log('You have no completed builds to race.'); state.raceOpen = true; state.shopOpen = null; }
      syncVendorUi();
      dismissHint('race');
      return;
    }

    if (state.challenge && Date.now() < state.challenge.endsAt && dist(p.x + p.w / 2, p.y + p.h / 2, state.challenge.x, state.challenge.y) < state.challenge.r) {
      state.challenge.progress += 1;
      log(`You rev the crowd (${state.challenge.progress}/${state.challenge.goal}).`);
      if (state.challenge.progress >= state.challenge.goal) {
        awardCrew(p, who);
        state.challenge.endsAt = 0;
        log('Neon Spotlight challenge cleared!');
      }
      return;
    }

    const bay = activeBays().find(pl => inside(p.x, p.y, p.w, p.h, pl.x, pl.y, pl.w, pl.h));
    if (!bay) return;

    if (bay.owner !== who) { log(`You can't use that bay — it belongs to ${bay.owner}.`); return; }

    if (!bay.build) {
      const kind = p.selected;
      const mod = MODS[kind];
      if (mod && p.inventory[kind] > 0) {
        p.inventory[kind]--;
        bay.build = createBuild(kind, p);
        log(`You started installing ${mod.name}${bay.build.tuning ? ` (${bay.build.tuning.label})` : ''}.`);
        save();
      } else {
        log(`You have no ${mod ? mod.name + ' ' : ''}kits. Grab them at the Parts Vendor.`);
      }
      return;
    }

    if (bay.build.dead) {
      if (p.credits >= REPAIR_COST) {
        p.credits -= REPAIR_COST;
        bay.build = null;
        log(`You cleared the bay for ${formatCredits(REPAIR_COST)}.`);
        save();
      } else {
        log(`You need ${formatCredits(REPAIR_COST)} to clear this bay.`);
      }
      return;
    }

    const progress = buildProgress(bay.build);
    if (progress >= 1) {
      const yieldCount = bay.build.yield || 1;
      const mod = MODS[bay.build.kind];
      const modName = mod?.name || bay.build.kind || 'Unknown Part';
      p.stash[bay.build.kind] = (p.stash[bay.build.kind] || 0) + yieldCount;
      log(`You finished ${yieldCount} × ${modName}.`);
      if (bay.build.extraLoot) {
        const bonus = bay.build.extraLoot;
        const bonusMod = MODS[bonus.kind];
        const bonusName = bonusMod?.name || bonus.kind || 'Mystery Part';
        p.stash[bonus.kind] = (p.stash[bonus.kind] || 0) + bonus.qty;
        log(`Bonus drop! You scored ${bonus.qty} × ${bonusName}.`);
      }
      bay.build = null;
      save();
    } else {
      showTooltip(p, bay);
    }
  }

  function showTooltip(p, bay) {
    let txt = 'Install in progress…';
    if (bay.build && bay.build.dead) {
      txt = `Overheated. Press Action to clear for ${formatCredits(REPAIR_COST)}.`;
    } else if (bay.build) {
      const build = bay.build;
      const mod = MODS[build.kind];
      const label = mod?.name || build.kind || 'Unknown Part';
      const installMs = Number.isFinite(build.installMs) && build.installMs > 0
        ? build.installMs
        : (mod?.installMs || baseInstall);
      const progress = Math.min(1, buildProgress(build));
      const secs = state.installMult > 0
        ? Math.max(0, Math.ceil((1 - progress) * installMs / (state.installMult * 1000)))
        : Infinity;
      const etaText = Number.isFinite(secs) ? `~${secs}s left` : 'Paused';
      txt = `${label}: ${(progress * 100).toFixed(0)}% | ${etaText}` + (build.tuning ? ` | ${build.tuning.label}` : '');
    } else {
      txt = 'Empty bay';
    }
    tooltip.style.left = (p.x + p.w / 2) + 'px';
    tooltip.style.top = (p.y) + 'px';
    tooltip.textContent = txt;
    tooltip.style.opacity = 1;
    clearTimeout(showTooltip._t);
    showTooltip._t = setTimeout(() => tooltip.style.opacity = 0, 1600);
  }

  function createBuild(kind, installer) {
    const mod = MODS[kind];
    const base = {
      kind,
      plantedAt: Date.now(),
      installMs: mod?.installMs || baseInstall,
      progressMs: 0,
      yield: 1,
      payoutMult: 1,
      rotChance: 0,
      tuning: null,
      dead: false,
      extraLoot: null,
    };
    if (installer && installer.crewMember) {
      const crew = CREW.find(x => x.id === installer.crewMember.id);
      if (crew) {
        if (crew.installSpeed) base.installMs /= crew.installSpeed;
        if (crew.randomBonus) {
          const tune = TUNINGS[Math.floor(Math.random() * TUNINGS.length)];
          base.tuning = { id: tune.id, label: tune.label };
          tune.effect(base);
          if (tune.id === 'flashsale') base.rotChance = 0.25;
          if (Math.random() < 0.35) {
            const bonusPool = MOD_CATALOG.slice(0, 5);
            const bonus = bonusPool[Math.floor(Math.random() * bonusPool.length)] || MOD_CATALOG[0];
            base.extraLoot = { kind: bonus.id, qty: 1 };
          }
        }
      }
    }
    return base;
  }

  const ROT_OVERHEAT_RATE_PER_SEC = 0.048;

  function advanceBuilds(deltaMs) {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    const bays = activeBays();
    if (!Array.isArray(bays) || bays.length === 0) return;
    const installSpeed = state.installMult || 0;
    for (const bay of bays) {
      const build = bay?.build;
      if (!build || build.dead) continue;
      const total = Math.max(1, Number(build.installMs) || 0);
      if (!Number.isFinite(build.progressMs) || build.progressMs < 0) build.progressMs = 0;
      if (installSpeed > 0) {
        build.progressMs = Math.min(total, build.progressMs + deltaMs * installSpeed);
      }
      if (!build.dead && build.rotChance && build.progressMs >= total * 0.5) {
        const dtSec = deltaMs / 1000;
        const chance = 1 - Math.exp(-ROT_OVERHEAT_RATE_PER_SEC * dtSec);
        if (chance > 0 && Math.random() < chance) {
          build.dead = true;
          log('A build overheated and stalled.');
        }
      }
    }
  }

  function buildProgress(build) {
    if (!build) return 0;
    if (!Number.isFinite(build.progressMs)) build.progressMs = 0;
    const total = Math.max(1, build.installMs || 1);
    return Math.min(1, Math.max(0, build.progressMs) / total);
  }

  function payoutOf(kind, builder) {
    const mod = MODS[kind];
    const base = Math.round((mod?.payout || 0) * state.payoutMult);
    const crew = builder && builder.crewMember ? CREW.find(x => x.id === builder.crewMember.id) : null;
    const crewBoost = crew?.payoutMult || 1;
    return Math.round(base * crewBoost * (builder && builder.bonusPayoutMult || 1));
  }

  function sellAll(p) {
    let total = 0;
    for (const id of Object.keys(MODS)) {
      const qty = p.stash[id] || 0;
      if (!qty) continue;
      const value = qty * payoutOf(id, p);
      total += value;
      p.stash[id] = 0;
    }
    p.credits += total;
    save();
    return total;
  }

  function generateModStock() {
    modStock.clear();
    MOD_CATALOG.forEach((mod, i) => {
      const prob = 1 - (i / MOD_CATALOG.length) * 0.85;
      if (Math.random() < prob) modStock.add(mod.id);
    });
  }

  function renderPartsShop() {
    if (!modListEl) return;
    modListEl.innerHTML = '';
    for (const mod of MOD_CATALOG) {
      const row = document.createElement('div');
      row.className = 'row';
      const name = document.createElement('span');
      name.textContent = `${modGlyph(mod.id)} ${mod.name}`;
      const price = document.createElement('span');
      price.textContent = formatCredits(mod.cost);
      row.append(name, price);
      modListEl.appendChild(row);
      const actions = document.createElement('div');
      actions.className = 'row';
      if (modStock.has(mod.id)) {
        const buyBtn = document.createElement('button');
        buyBtn.textContent = 'Buy';
        buyBtn.onclick = () => buyMod(mod.id);
        actions.appendChild(buyBtn);
      } else {
        const sold = document.createElement('span');
        sold.textContent = 'Sold out';
        actions.appendChild(sold);
      }
      modListEl.appendChild(actions);
    }
  }

  function syncVendorUi() {
    const open = state.shopOpen === 'P1';
    if (shopPanel) {
      shopPanel.classList.toggle('panel-hidden', !open);
      shopPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (modListEl) {
      if (open) {
        renderPartsShop();
      } else {
        modListEl.innerHTML = '';
      }
    }
  }

  function buyMod(id) {
    const modData = MOD_CATALOG.find(m => m.id === id);
    if (!modData || !modStock.has(id)) { log('Part not available.'); return; }
    const target = state.p1;
    if (state.shopOpen !== 'P1' || !isAtStation(target, STATIONS.parts)) {
      log('You must be at the Parts Vendor to buy kits.');
      return;
    }
    if (target.credits < modData.cost) {
      log(`You can’t afford ${modData.name} (${formatCredits(modData.cost)}).`);
      return;
    }
    target.credits -= modData.cost;
    target.inventory[id] = (target.inventory[id] || 0) + 1;
    log(`You bought ${modData.name}.`);
    save();
  }
  function maybeStartStreetEvent() {
    const now = Date.now();
    if (state.activeEvent && now < state.eventUntil) return;
    if (state.activeEvent) {
      state.activeEvent = null;
      state.payoutMult = 1;
      state.installMult = 1;
    }
    if (!maybeStartStreetEvent.nextAt) maybeStartStreetEvent.nextAt = now + (45000 + Math.random() * 30000);
    if (now < maybeStartStreetEvent.nextAt) return;
    const evt = STREET_EVENTS[Math.floor(Math.random() * STREET_EVENTS.length)];
    state.activeEvent = evt.id;
    state.eventUntil = now + evt.dur;
    evt.apply(state);
    maybeStartStreetEvent.nextAt = now + evt.dur + (40000 + Math.random() * 25000);
    log(evt.label);
  }

  function maybeSpawnChallenge() {
    const now = Date.now();
    if (state.challenge && now < state.challenge.endsAt) return;
    if (!maybeSpawnChallenge.nextAt) maybeSpawnChallenge.nextAt = now + (50000 + Math.random() * 40000);
    if (now < maybeSpawnChallenge.nextAt) return;
    state.challenge = { ...SPOTLIGHT_POSITION, goal: 12, progress: 0, endsAt: now + 28000 };
    maybeSpawnChallenge.nextAt = now + 80000 + Math.random() * 45000;
    log('Neon Spotlight ignites in the plaza! Park inside and hit Action repeatedly to hype the crowd.');
  }

  function awardCrew(p, who) {
    const ownedIds = new Set((p.crew || []).map(x => x.id));
    const pool = CREW.filter(member => !ownedIds.has(member.id));
    if (pool.length) {
      const crew = pool[Math.floor(Math.random() * pool.length)];
      p.crew.push({ id: crew.id });
      p.crewMember = { id: crew.id, x: p.x - 16, y: p.y - 16 };
      log(`You recruited ${describeCrew(crew)}.`);
    } else {
      p.credits += 800;
      log(`You already have the full crew. Awarded ${formatCredits(800)} instead.`);
    }
    save();
  }
  // ---------- TEXTURES ----------
  const patterns = {};
  function makeAsphaltPattern() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = RETRO.midnight;
    g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 180; i++) {
      const alpha = 0.1 + Math.random() * 0.2;
      g.fillStyle = `rgba(249, 226, 182, ${alpha})`;
      g.fillRect(Math.random() * 64, Math.random() * 64, 1, 1);
    }
    for (let i = 0; i < 160; i++) {
      g.fillStyle = 'rgba(140, 0, 39, 0.45)';
      g.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
    }
    return g.createPattern(c, 'repeat');
  }

  function makeMetalPattern() {
    const c = document.createElement('canvas');
    c.width = 48; c.height = 48;
    const g = c.getContext('2d');
    g.fillStyle = RETRO.plum;
    g.fillRect(0, 0, 48, 48);
    g.fillStyle = RETRO.berry;
    for (let i = 0; i < 6; i++) {
      g.fillRect(0, i * 8, 48, 2);
    }
    g.globalAlpha = 0.25;
    g.fillStyle = 'rgba(241, 165, 18, 0.6)';
    g.fillRect(0, 0, 48, 3);
    g.fillRect(0, 45, 48, 3);
    g.globalAlpha = 1;
    return g.createPattern(c, 'repeat');
  }

  function makeNeonGridPattern() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(241, 165, 18, 0.08)';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(43, 175, 144, 0.16)';
    g.lineWidth = 2;
    for (let i = 0; i <= 128; i += 16) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke();
    }
    return g.createPattern(c, 'repeat');
  }

  patterns.asphalt = makeAsphaltPattern();
  patterns.metal = makeMetalPattern();
  patterns.neon = makeNeonGridPattern();
  toggleBtn.onclick = () => {
    eventsPanel.classList.toggle('open');
  };
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyH') {
      eventsPanel.classList.toggle('open');
      e.preventDefault();
    }
  });
  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = patterns.asphalt;
    ctx.fillRect(0, 0, cv.width, cv.height);

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = patterns.neon;
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.restore();

    // road divider
    ctx.fillStyle = 'rgba(249, 228, 193, 0.16)';
    for (let i = 0; i < cv.width; i += 40) {
      ctx.fillRect(i, WORLD.h / 2 - 4, 24, 8);
    }

    drawStation(STATIONS.parts, 'Parts Vendor', RETRO.gold, '🔧');
    drawStation(STATIONS.race, 'Race Terminal', RETRO.teal, '🏁');

    for (const garage of GARAGES) {
      const isP1 = garage.owner === 'P1';
      ctx.save();
      const glow = isP1 ? RETRO.teal : RETRO.orange;
      ctx.shadowColor = `${glow}88`;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = glow;
      ctx.lineWidth = 4;
      ctx.strokeRect(garage.x, garage.y, garage.w, garage.h);
      ctx.restore();
      ctx.fillStyle = 'rgba(71, 16, 32, 0.78)';
      ctx.fillRect(garage.x, garage.y, garage.w, garage.h);
      ctx.fillStyle = 'rgba(249,228,193,0.16)';
      ctx.font = 'bold 18px "Courier New", monospace';
      const label = isP1 ? 'Garage' : `${garage.owner} Garage`;
      ctx.fillText(label, garage.x + 12, garage.y + 28);
    }

    for (const bay of activeBays()) drawBay(bay);

    if (state.challenge && Date.now() < state.challenge.endsAt) {
      const ch = state.challenge;
      const rem = Math.max(0, Math.ceil((ch.endsAt - Date.now()) / 1000));
      ctx.save();
      ctx.globalAlpha = 0.55;
      const gradient = ctx.createRadialGradient(ch.x, ch.y, 10, ch.x, ch.y, ch.r);
      gradient.addColorStop(0, 'rgba(241,165,18,0.6)');
      gradient.addColorStop(1, 'rgba(43,175,144,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(ch.x, ch.y, ch.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = RETRO.teal;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ch.x, ch.y, ch.r, 0, Math.PI * 2); ctx.stroke();
      const p = Math.min(1, ch.progress / ch.goal);
      ctx.beginPath();
      ctx.moveTo(ch.x, ch.y);
      ctx.fillStyle = 'rgba(221, 65, 17, 0.6)';
      ctx.arc(ch.x, ch.y, ch.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = RETRO.sand;
      ctx.font = '16px "Courier New", monospace';
      ctx.fillText(`Spotlight: ${ch.progress}/${ch.goal} (${rem}s)`, ch.x - 100, ch.y - ch.r - 12);
    }

    drawPlayer(state.p1, RETRO.teal);
    drawCrewMember(state.p1);

    drawGuideOverlay();

    p1moneyEl.textContent = `Credits: ${formatCredits(state.p1.credits)}`;
    const crew1 = state.p1.crewMember ? CREW.find(c => c.id === state.p1.crewMember.id) : null;
    const inv1 = Object.entries(state.p1.inventory).filter(([, v]) => v > 0).map(([k, v], i) => `${i + 1}:${k}(${v})`).join(', ') || '—';
    const stash1 = Object.entries(state.p1.stash).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(', ') || '—';
    const sel1 = MODS[state.p1.selected]?.name || state.p1.selected;
    p1hud.textContent = `Parts: ${inv1} | Builds Ready: ${stash1} | Crew: ${describeCrew(crew1)} | Selected: ${sel1}`;

    if (!draw._lastLog || Date.now() - draw._lastLog > 1000) {
      const logData = {
        p1: { credits: state.p1.credits, stash: { ...state.p1.stash }, inventory: { ...state.p1.inventory } },
      };
      console.log('HUD state', logData);
      draw._lastLog = Date.now();
    }
  }

  function drawStation(st, label, color, icon) {
    ctx.save();
    ctx.shadowColor = color + '55';
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(53, 13, 25, 0.85)';
    ctx.fillRect(st.x, st.y, st.w, st.h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(st.x, st.y, st.w, st.h);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = color;
    ctx.fillText(icon, st.x + 12, st.y + 28);
    ctx.fillStyle = RETRO.cream;
    ctx.fillText(label, st.x + 44, st.y + 28);
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = 'rgba(252, 226, 182, 0.7)';
    ctx.fillText('Action to interact', st.x + 12, st.y + st.h - 16);
    ctx.restore();
  }

  function drawBay(bay) {
    ctx.save();
    ctx.translate(bay.x, bay.y);
    ctx.fillStyle = patterns.metal;
    ctx.fillRect(0, 0, bay.w, bay.h);
    ctx.strokeStyle = bay.owner === 'P1' ? 'rgba(43,175,144,0.7)' : 'rgba(221,65,17,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, bay.w, bay.h);

    if (!bay.build) {
      ctx.strokeStyle = 'rgba(249,228,193,0.18)';
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(6, 6, bay.w - 12, bay.h - 12);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(161,212,177,0.12)';
      ctx.fillRect(8, bay.h - 28, bay.w - 16, 18);
    } else {
      drawBuild(bay, bay.build);
    }
    ctx.restore();
  }

  function drawBuild(bay, build) {
    const progress = Math.min(1, buildProgress(build));
    const def = MODS[build.kind] || { palette: [RETRO.orange, RETRO.gold, RETRO.shadow], name: build.kind };
    const palette = def.palette || [RETRO.orange, RETRO.gold, RETRO.shadow];
    const [body, accent, shadow] = [palette[0], palette[1] || RETRO.gold, palette[2] || RETRO.shadow];
    const x = 8;
    const y = 10;
    const w = bay.w - 16;
    const h = bay.h - 32;
    const liftY = bay.h - 28;

    ctx.fillStyle = 'rgba(35, 8, 18, 0.55)';
    ctx.fillRect(x - 4, liftY + 18, w + 8, 6);

    ctx.fillStyle = 'rgba(71, 16, 32, 0.88)';
    ctx.fillRect(x, liftY, w, 18);
    ctx.fillStyle = RETRO.plum;
    ctx.fillRect(x + 6, liftY + 4, w - 12, 6);
    ctx.fillStyle = RETRO.shadow;
    ctx.fillRect(x + 6, liftY + 10, w - 12, 6);

    const carHeight = h * 0.6;
    const carY = liftY - carHeight - 6 - (1 - progress) * 20;
    ctx.fillStyle = shadow;
    ctx.fillRect(x + 4, carY + carHeight - 4, w - 8, 6);
    ctx.fillStyle = body;
    ctx.fillRect(x, carY, w, carHeight);
    ctx.fillStyle = accent;
    ctx.fillRect(x + 6, carY + 6, w - 12, carHeight / 2);
    ctx.fillStyle = RETRO.midnight;
    ctx.fillRect(x + 10, carY + carHeight / 2 - 6, w - 20, carHeight / 3);
    ctx.fillStyle = RETRO.mint;
    ctx.fillRect(x + 12, carY + carHeight / 2 - 2, w - 24, carHeight / 5);

    ctx.fillStyle = RETRO.shadow;
    ctx.fillRect(x + 4, carY + carHeight - 8, w - 8, 6);
    ctx.fillStyle = '#C78F7D';
    ctx.fillRect(x + 8, carY + carHeight - 6, w - 16, 4);

    const headlightColor = progress >= 1 ? RETRO.cream : RETRO.teal;
    ctx.fillStyle = headlightColor;
    ctx.fillRect(x + 10, carY + 4, 10, 6);
    ctx.fillRect(x + w - 20, carY + 4, 10, 6);

    ctx.fillStyle = 'rgba(249,228,193,0.16)';
    ctx.fillRect(x, carY - 8, w * progress, 4);

    if (build.tuning) {
      drawSparkles(bay.x + bay.w / 2, bay.y + carY + carHeight / 2, 24, 6);
    }

    if (build.dead) {
      ctx.fillStyle = 'rgba(221,65,17,0.35)';
      ctx.fillRect(0, 0, bay.w, bay.h);
      ctx.strokeStyle = RETRO.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, 6); ctx.lineTo(bay.w - 6, bay.h - 6);
      ctx.moveTo(bay.w - 6, 6); ctx.lineTo(6, bay.h - 6);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(53, 13, 25, 0.9)';
    ctx.fillRect(x, bay.h - 24, w, 14);
    ctx.fillStyle = RETRO.teal;
    ctx.fillRect(x + 2, bay.h - 22, (w - 4) * progress, 6);
    ctx.fillStyle = RETRO.shadow;
    ctx.fillRect(x + 2, bay.h - 14, w - 4, 2);
  }

  function drawSparkles(cx, cy, radius, count = 6) {
    const t = Date.now() / 350;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + t;
      const r = radius * (0.5 + Math.random() * 0.3);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      ctx.fillStyle = 'rgba(43, 175, 144, 0.7)';
      ctx.fillRect(x - 1, y - 1, 2, 2);
      ctx.fillStyle = 'rgba(241, 165, 18, 0.65)';
      ctx.fillRect(x, y, 1, 1);
    }
  }

  function drawPlayer(p, neon) {
    const x = p.x;
    const y = p.y;
    const w = p.w;
    const h = p.h;

    ctx.fillStyle = 'rgba(35, 8, 18, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 4, w / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const centerX = x + w / 2;
    const baseY = y + h;

    const coverall = RETRO.teal;
    const coverallHighlight = RETRO.mint;
    const trim = RETRO.shadow;
    const glove = RETRO.deepBerry;
    const skin = '#f6c6a5';
    const hat = RETRO.berry;
    const steel = RETRO.gold;

    const legWidth = 10;
    const legHeight = 16;
    const legY = baseY - legHeight;
    ctx.fillStyle = coverallHighlight;
    ctx.fillRect(centerX - legWidth - 2, legY, legWidth, legHeight);
    ctx.fillRect(centerX + 2, legY, legWidth, legHeight);
    ctx.fillStyle = coverall;
    ctx.fillRect(centerX - legWidth - 2, legY + 4, legWidth, legHeight - 6);
    ctx.fillRect(centerX + 2, legY + 4, legWidth, legHeight - 6);
    ctx.fillStyle = trim;
    ctx.fillRect(centerX - legWidth - 2, baseY - 4, legWidth, 4);
    ctx.fillRect(centerX + 2, baseY - 4, legWidth, 4);

    const torsoW = w - 18;
    const torsoH = 20;
    const torsoX = centerX - torsoW / 2;
    const torsoY = y + 14;
    ctx.fillStyle = coverallHighlight;
    ctx.fillRect(torsoX, torsoY, torsoW, torsoH);
    ctx.fillStyle = coverall;
    ctx.fillRect(torsoX, torsoY + 4, torsoW, torsoH - 6);

    ctx.fillStyle = neon;
    ctx.fillRect(centerX - 1, torsoY + 2, 2, torsoH - 4);
    ctx.fillStyle = trim;
    ctx.fillRect(torsoX, torsoY + torsoH - 6, torsoW, 6);
    ctx.fillStyle = RETRO.gold;
    ctx.fillRect(centerX - 4, torsoY + torsoH - 5, 8, 4);

    ctx.fillStyle = coverall;
    ctx.fillRect(torsoX + 4, torsoY + 6, 8, 8);
    ctx.fillStyle = neon;
    ctx.fillRect(torsoX + 6, torsoY + 8, 4, 2);

    const armWidth = 6;
    const armHeight = 16;
    const armY = torsoY + 2;
    ctx.fillStyle = coverallHighlight;
    ctx.fillRect(torsoX - armWidth + 1, armY, armWidth, armHeight);
    ctx.fillRect(torsoX + torsoW - 1, armY, armWidth, armHeight);
    ctx.fillStyle = coverall;
    ctx.fillRect(torsoX - armWidth + 1, armY + 3, armWidth, armHeight - 6);
    ctx.fillRect(torsoX + torsoW - 1, armY + 3, armWidth, armHeight - 6);
    ctx.fillStyle = glove;
    ctx.fillRect(torsoX - armWidth + 1, armY + armHeight - 4, armWidth, 4);
    ctx.fillRect(torsoX + torsoW - 1, armY + armHeight - 4, armWidth, 4);

    const headRadius = 8;
    const headCenterY = torsoY - headRadius + 2;
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(centerX, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hat;
    ctx.fillRect(centerX - headRadius - 4, headCenterY - headRadius - 2, headRadius * 2 + 8, 4);
    ctx.fillRect(centerX - headRadius + 1, headCenterY - headRadius - 8, headRadius * 2 - 2, 6);
    ctx.fillStyle = neon;
    ctx.fillRect(centerX - 4, headCenterY - headRadius - 6, 8, 2);

    ctx.fillStyle = RETRO.shadow;
    ctx.fillRect(centerX - 5, headCenterY - 2, 3, 2);
    ctx.fillRect(centerX + 2, headCenterY - 2, 3, 2);
    ctx.fillRect(centerX - 4, headCenterY + 3, 8, 2);

    const wrenchX = torsoX + torsoW + 4;
    const wrenchY = armY + 2;
    ctx.fillStyle = steel;
    ctx.fillRect(wrenchX, wrenchY, 3, 18);
    ctx.fillRect(wrenchX - 3, wrenchY - 2, 9, 4);
    ctx.fillRect(wrenchX - 3, wrenchY + 16, 9, 4);
    ctx.fillStyle = RETRO.shadow;
    ctx.fillRect(wrenchX - 1, wrenchY - 1, 2, 2);
    ctx.fillRect(wrenchX - 1, wrenchY + 17, 2, 2);

    ctx.fillStyle = neon;
    ctx.fillRect(torsoX + 2, armY + 4, 2, 8);
    ctx.fillRect(torsoX + torsoW - 4, armY + 4, 2, 8);

    // selected mod bubble
    const bubbleX = x + w / 2;
    const bubbleY = y - 18;
    ctx.fillStyle = 'rgba(53, 13, 25, 0.85)';
    const bubbleW = 32;
    const bubbleH = 18;
    ctx.fillRect(bubbleX - bubbleW / 2, bubbleY - bubbleH / 2, bubbleW, bubbleH);
    ctx.strokeStyle = neon;
    ctx.lineWidth = 2;
    ctx.strokeRect(bubbleX - bubbleW / 2, bubbleY - bubbleH / 2, bubbleW, bubbleH);
    ctx.fillStyle = RETRO.sand;
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(modGlyph(p.selected), bubbleX, bubbleY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function drawCrewMember(p) {
    if (!p.crewMember) return;
    const crew = CREW.find(x => x.id === p.crewMember.id);
    if (!crew) return;
    const x = p.crewMember.x;
    const y = p.crewMember.y;
    ctx.fillStyle = 'rgba(35, 8, 18, 0.5)';
    ctx.fillRect(x, y, 24, 10);
    ctx.fillStyle = 'rgba(71, 16, 32, 0.92)';
    ctx.fillRect(x, y - 20, 24, 24);
    ctx.strokeStyle = 'rgba(241, 165, 18, 0.6)';
    ctx.strokeRect(x, y - 20, 24, 24);
    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = RETRO.cream;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(crew.emoji, x + 12, y - 8);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function advanceGuide() {
    if (!state.guide) state.guide = { active: false, step: 0 };
    if (!state.guide.active) return;
    state.guide.step += 1;
    if (state.guide.step >= GUIDE_STEPS.length) {
      state.guide.active = false;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(GUIDE_STORAGE_KEY, '1');
        }
      } catch (err) {
        console.warn('Unable to persist guide completion flag', err);
      }
    }
  }

  function drawGuideOverlay() {
    if (!state.guide?.active) return;
    const step = GUIDE_STEPS[state.guide.step] || GUIDE_STEPS[GUIDE_STEPS.length - 1];
    ctx.save();
    ctx.fillStyle = 'rgba(4, 8, 18, 0.82)';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.restore();

    const characterScale = 4;
    const charX = Math.round(cv.width * 0.58);
    const charY = Math.round(cv.height * 0.4 - 36 * characterScale);
    drawGuideCharacter(charX, charY, characterScale);

    const boxWidth = Math.min(460, cv.width - 80);
    const boxHeight = 200;
    const boxX = Math.round(cv.width * 0.14);
    const boxY = Math.round(cv.height * 0.54 - boxHeight / 2);

    ctx.save();
    ctx.fillStyle = 'rgba(6, 14, 32, 0.92)';
    ctx.strokeStyle = '#4ecbff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d1f7ff';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText(step.title, boxX + 24, boxY + 42);

    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#9fdcff';
    drawWrappedText(step.text, boxX + 24, boxY + 72, boxWidth - 48, 22);

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#63e7ff';
    ctx.fillText(`(${state.guide.step + 1}/${GUIDE_STEPS.length}) Press Space to continue`, boxX + 24, boxY + boxHeight - 24);
    ctx.restore();
  }

  function drawWrappedText(text, x, y, maxWidth, lineHeight) {
    const words = String(text || '').split(/\s+/);
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, y);
    }
  }

  function drawGuideCharacter(x, y, scale = 4) {
    const palette = {
      hairDark: '#586172',
      hairMid: '#6e7a8d',
      hairLight: '#8b95a7',
      skin: '#f2c9b0',
      blush: '#f5b6a6',
      eyeLight: '#f8fbff',
      iris: '#4fb5ff',
      top: '#1b1d29',
      shorts: '#3e5f88',
      shortsLight: '#5f84ad',
      shoes: '#1a1a21',
      lace: '#2c2c38',
      tattoo: '#caa87d',
      outline: '#0d111f',
    };

    const px = (gx, gy, gw = 1, gh = 1, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x + gx * scale), Math.round(y + gy * scale), Math.round(gw * scale), Math.round(gh * scale));
    };

    // shadow
    px(4, 48, 12, 2, 'rgba(0, 0, 0, 0.25)');

    // hair back layer
    px(5, 2, 10, 3, palette.hairDark);
    px(4, 5, 12, 4, palette.hairDark);
    px(3, 9, 14, 4, palette.hairMid);
    px(2, 13, 5, 16, palette.hairMid);
    px(13, 13, 4, 14, palette.hairLight);

    // face
    px(6, 8, 8, 7, palette.skin);
    px(6, 15, 8, 2, palette.blush);

    // bangs
    px(5, 6, 10, 3, palette.hairLight);
    px(4, 9, 2, 4, palette.hairLight);
    px(13, 8, 3, 4, palette.hairMid);

    // eyes
    px(7, 10, 2, 1, palette.eyeLight);
    px(11, 10, 2, 1, palette.eyeLight);
    px(7, 11, 2, 1, palette.iris);
    px(11, 11, 2, 1, palette.iris);
    px(8, 11, 1, 1, palette.outline);
    px(12, 11, 1, 1, palette.outline);
    px(8, 12, 2, 1, palette.outline);
    px(11, 12, 2, 1, palette.outline);

    // mouth
    px(9, 14, 3, 1, palette.outline);

    // neck
    px(8, 16, 4, 2, palette.skin);

    // top
    px(5, 18, 10, 4, palette.top);
    px(4, 18, 1, 5, palette.skin);
    px(15, 18, 1, 5, palette.skin);

    // tattoo on arm
    px(4, 20, 1, 3, palette.tattoo);
    px(4, 23, 1, 2, palette.tattoo);
    px(4, 25, 1, 2, palette.tattoo);
    px(4, 27, 1, 2, palette.tattoo);

    // shorts
    px(5, 22, 10, 6, palette.shorts);
    px(5, 22, 3, 2, palette.shortsLight);
    px(12, 22, 3, 2, palette.shortsLight);
    px(8, 28, 4, 1, palette.outline);

    // legs
    px(7, 28, 3, 6, palette.skin);
    px(10, 28, 3, 6, palette.skin);

    // shoes
    px(6, 34, 4, 3, palette.shoes);
    px(10, 34, 4, 3, palette.shoes);
    px(7, 34, 2, 1, palette.lace);
    px(11, 34, 2, 1, palette.lace);

    // outline hints
    px(5, 18, 10, 1, palette.outline);
    px(5, 22, 10, 1, palette.outline);
    px(6, 33, 8, 1, palette.outline);
  }

  const NUMBER_KEYS = ['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0'];

  function update() {
    if (state.guide?.active) {
      if (justPressed('Space') || justPressed('Enter') || justPressed('NumpadEnter') || justPressed('Escape')) {
        advanceGuide();
      }
      return;
    }
    movePlayer(state.p1, 'KeyW', 'KeyA', 'KeyS', 'KeyD');
    moveCrew(state.p1);

    if (state.shopOpen === 'P1' && !isAtStation(state.p1, STATIONS.parts)) {
      state.shopOpen = null;
      syncVendorUi();
    }

    maybeStartStreetEvent();
    maybeSpawnChallenge();

    if (justPressed('KeyE')) playerAction(state.p1, 'P1');
    if (justPressed('KeyQ')) cycleMod(state.p1);
    NUMBER_KEYS.forEach((code, idx) => { if (justPressed(code)) selectModByIndex(state.p1, idx); });

  }

  const nowMs = () => (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
  let lastFrameTime = nowMs();

  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        lastFrameTime = nowMs();
      }
    });
  }

  function loop() {
    const now = nowMs();
    const delta = Math.max(0, Math.min(now - lastFrameTime, 250));
    lastFrameTime = now;
    if (!(typeof document !== 'undefined' && document.hidden) && !state.guide?.active) {
      advanceBuilds(delta);
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  log('Welcome to Neon Drift Garage! Buy kits at the Parts Vendor in the plaza.');
  log('Install mods in your bays, then cash out at the Race Terminal in the plaza.');
})();
