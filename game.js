(() => {
  // ---------- CONFIG ----------
  const CROPS = {
    candy: { name: 'Candy Blossom', growMs: 60000, sell: 6 }, // 1 min, sells for ¢6.00
    carrot: { name: 'Carrot', growMs: 600000, sell: 3000 }    // 10 min, sells for ¢3,000.00
  };
  const CURRENCY_SYMBOL = '¢';
  function formatCurrency(value) {
    const amount = Number(value ?? 0);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return `${CURRENCY_SYMBOL}${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const REPAIR_COST = 10; // cents
  const DEFAULT_SEED = 'candy';
  // PETS (one active perk per player)
  const PETS = [
    { id:'bee',    name:'Honey Bee',  emoji:'🐝', priceMult:1.10, perk:'Sell price +10%' },
    { id:'bunny',  name:'Bunny',      emoji:'🐰', speed:+0.4,      perk:'Movement speed boost' },
    { id:'sprout', name:'Sprout',     emoji:'🌱', plantGrowth:1.10, perk:'Plants grow 10% faster' },
    { id:'robot',  name:'Robot',      emoji:'🤖', randomMutation:true, perk:'Chance for random crop mutations' },
  ];

  function describePet(petDef) {
    if (!petDef) return '—';
    return petDef.perk ? `${petDef.name} (${petDef.perk})` : petDef.name;
  }

  const SEED_CATALOG = [
    { id:'candy', name:'Candy Blossom', harvest:'Multiple', sheckles:2, robux:0 },
    { id:'carrot', name:'Carrot', harvest:'Single', sheckles:10, robux:7 },
    { id:'strawberry', name:'Strawberry', harvest:'Multiple', sheckles:50, robux:21 },
    { id:'blueberry', name:'Blueberry', harvest:'Multiple', sheckles:400, robux:49 },
    { id:'orangeTulip', name:'Orange Tulip', harvest:'Single', sheckles:600, robux:14 },
    { id:'tomato', name:'Tomato', harvest:'Multiple', sheckles:800, robux:79 },
    { id:'daffodil', name:'Daffodil', harvest:'Single', sheckles:1000, robux:19 },
    { id:'corn', name:'Corn', harvest:'Multiple', sheckles:1300, robux:135 },
    { id:'watermelon', name:'Watermelon', harvest:'Single', sheckles:2500, robux:195 },
    { id:'pumpkin', name:'Pumpkin', harvest:'Single', sheckles:3000, robux:210 },
    { id:'apple', name:'Apple', harvest:'Multiple', sheckles:3250, robux:375 },
    { id:'bamboo', name:'Bamboo', harvest:'Single', sheckles:4000, robux:99 },
    { id:'coconut', name:'Coconut', harvest:'Multiple', sheckles:6000, robux:435 },
    { id:'cactus', name:'Cactus', harvest:'Multiple', sheckles:15000, robux:497 },
    { id:'dragonFruit', name:'Dragon Fruit', harvest:'Multiple', sheckles:50000, robux:597 },
    { id:'mango', name:'Mango', harvest:'Multiple', sheckles:100000, robux:580 },
    { id:'mushroom', name:'Mushroom', harvest:'Single', sheckles:150000, robux:249 },
    { id:'grape', name:'Grape', harvest:'Multiple', sheckles:850000, robux:599 },
    { id:'pepper', name:'Pepper', harvest:'Multiple', sheckles:1000000, robux:629 },
    { id:'cacao', name:'Cacao', harvest:'Multiple', sheckles:2500000, robux:679 },
    { id:'beanstalk', name:'Beanstalk', harvest:'Multiple', sheckles:10000000, robux:715 },
    { id:'emberLily', name:'Ember Lily', harvest:'Multiple', sheckles:15000000, robux:779 },
    { id:'sugarApple', name:'Sugar Apple', harvest:'Multiple', sheckles:25000000, robux:819 },
    { id:'burningBud', name:'Burning Bud', harvest:'Multiple', sheckles:40000000, robux:915 },
    { id:'giantPinecone', name:'Giant Pinecone', harvest:'Multiple', sheckles:55000000, robux:929 },
    { id:'elderStrawberry', name:'Elder Strawberry', harvest:'Multiple', sheckles:70000000, robux:957 },
    { id:'romanesco', name:'Romanesco', harvest:'Multiple', sheckles:88000000, robux:987 },
  ].sort((a, b) => a.sheckles - b.sheckles);

  const seedCosts = SEED_CATALOG.map(seed => seed.sheckles).filter(cost => cost > 0);
  const minSeedCost = seedCosts.length ? Math.min(...seedCosts) : 0;
  const maxSeedCost = seedCosts.length ? Math.max(...seedCosts) : 0;
  const baseGrowMs = CROPS[DEFAULT_SEED].growMs;
  const existingMaxGrowMs = Math.max(...Object.values(CROPS).map(crop => crop.growMs || baseGrowMs));
  const targetMaxGrowMs = Math.max(baseGrowMs, Math.round(existingMaxGrowMs / 2));
  const costLogSpan = (minSeedCost > 0 && maxSeedCost > minSeedCost) ? Math.log(maxSeedCost / minSeedCost) : 0;

  // Provide basic crop stats for seeds missing from CROPS so they can be planted, and scale growth times.
  for (const seed of SEED_CATALOG) {
    const crop = CROPS[seed.id] || { name: seed.name, sell: seed.sheckles * 100 };
    let ratio = 0;
    if (costLogSpan && seed.sheckles > 0 && seed.sheckles !== minSeedCost) {
      ratio = Math.log(seed.sheckles / minSeedCost) / costLogSpan;
    }
    const smoothGrow = baseGrowMs + (targetMaxGrowMs - baseGrowMs) * Math.min(1, Math.max(0, ratio));
    const growMs = Math.round(smoothGrow / 1000) * 1000;
    crop.growMs = Math.min(targetMaxGrowMs, Math.max(baseGrowMs, growMs));
    crop.name = crop.name || seed.name;
    if (crop.sell == null) crop.sell = seed.sheckles * 100;
    CROPS[seed.id] = crop;
  }
  const seedStock = new Set();

  // Stable save key + migrate from legacy
  const SAVE_KEY = 'garden-duo-main';
  const LEGACY_KEYS = ['garden-duo-v1','garden-duo-v2','garden-duo-v3'];

  // Plant mutation effects
  const MUTATIONS = [
    { id:'swift',   label:'Swift Growth', effect:p=>p.growMs*=0.7 },
    { id:'giant',   label:'Giant Yield',  effect:p=>p.yield=2 },
    { id:'glitter', label:'Glitter Value',effect:p=>p.sellMult=2 },
    { id:'rot',     label:'Rot-Prone',    effect:p=>p.rotChance=0.25 },
  ];

  // World events
  const WORLD_EVENTS = [
    { id:'rain',   label:'Rain! Growth +50% for 30s',  dur:30000, apply:s=>{s.growthMult*=1.5;} },
    { id:'drought',label:'Heatwave! Growth -30% for 30s', dur:30000, apply:s=>{s.growthMult*=0.7;} },
    { id:'boom',   label:'Market Boom! Prices +50% for 30s', dur:30000, apply:s=>{s.priceMult*=1.5;} },
    { id:'slump',  label:'Market Slump! Prices -30% for 30s', dur:30000, apply:s=>{s.priceMult*=0.7;} },
  ];

  // ---------- STATE ----------
  const state = {
    priceMult: 1,
    growthMult: 1,
    plots: [],
    p1: { x: 220, y: 450, w:40, h:40, speedBase:2.4, money:10, invSeeds:{}, bag:{}, selected:DEFAULT_SEED, pet:null, pets:[] },
    p2: { x: 1060, y: 450, w:40, h:40, speedBase:2.4, money:10, invSeeds:{}, bag:{}, selected:DEFAULT_SEED, pet:null, pets:[] },
    p2Active: false,
    shopOpen:null, sellOpen:false,
    activeEvent:null, eventUntil:0,
    // Center challenge
    challenge:null,
  };

  // ---------- SAVE/LOAD ----------
  function migrateLegacy(){
    if (localStorage.getItem(SAVE_KEY)) return;
    for (const k of LEGACY_KEYS){ const v = localStorage.getItem(k); if (v){ localStorage.setItem(SAVE_KEY, v); console.info('Migrated save from', k); break; } }
  }
  migrateLegacy();

  function applySavedState(saved) {
    if (!saved) return false;
    state.priceMult = saved.priceMult ?? state.priceMult;
    state.growthMult = saved.growthMult ?? state.growthMult;
    state.plots = Array.isArray(saved.plots) ? saved.plots : state.plots;
    Object.assign(state.p1, saved.p1 || {});
    Object.assign(state.p2, saved.p2 || {});
    state.p1.pet = null;
    state.p2.pet = null;
    state.p1.pets = [];
    state.p2.pets = [];
    state.shopOpen = null;
    state.sellOpen = false;

    if (state.p1.money == null) state.p1.money = 10;
    if (state.p2.money == null) state.p2.money = 10;

    if (state.p1.selected == null) state.p1.selected = DEFAULT_SEED;
    if (state.p2.selected == null) state.p2.selected = DEFAULT_SEED;
    return true;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if (applySavedState(saved)) save();
  } catch {}

  for (const s of SEED_CATALOG) {
    if (state.p1.invSeeds[s.id] == null) state.p1.invSeeds[s.id] = 0;
    if (state.p2.invSeeds[s.id] == null) state.p2.invSeeds[s.id] = 0;
    if (state.p1.bag[s.id] == null) state.p1.bag[s.id] = 0;
    if (state.p2.bag[s.id] == null) state.p2.bag[s.id] = 0;
  }

  for (const player of [state.p1, state.p2]) {
    for (const key of Object.keys(player.invSeeds)) {
      if (!CROPS[key]) delete player.invSeeds[key];
    }
    for (const key of Object.keys(player.bag)) {
      if (!CROPS[key]) delete player.bag[key];
    }
    if (!CROPS[player.selected]) player.selected = DEFAULT_SEED;
  }

  function save() {
    const minimal = JSON.parse(JSON.stringify({
      priceMult: state.priceMult,
      growthMult: state.growthMult,
      plots: state.plots,
      p1: { money:state.p1.money, invSeeds:state.p1.invSeeds, bag:state.p1.bag, selected:state.p1.selected },
      p2: { money:state.p2.money, invSeeds:state.p2.invSeeds, bag:state.p2.bag, selected:state.p2.selected },
    }));
    console.log('Saving game state', minimal);
    localStorage.setItem(SAVE_KEY, JSON.stringify(minimal));
  }
  // Autosave + on close
  setInterval(save, 10000);
  window.addEventListener('beforeunload', save);

  // ---------- DOM ----------
  const p1moneyEl = document.getElementById('p1money');
  const p2moneyEl = document.getElementById('p2money');
  const p1hud = document.getElementById('p1hud');
  const p2hud = document.getElementById('p2hud');
  const feed = document.getElementById('feed');
  const tooltip = document.getElementById('tooltip');
  const eventsPanel = document.getElementById('events');
  const toggleBtn = document.getElementById('toggleEvents');
  const btnSave = document.getElementById('btnSave');
  const btnLoad = document.getElementById('btnLoad');
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const fileImport = document.getElementById('fileImport');
  const addP2Btn = document.getElementById('addP2');
  const shopPanel = document.getElementById('shopPanel');
  const sellPanel = document.getElementById('sellPanel');
  const seedListEl = document.getElementById('seedList');
  const p1Controls = document.getElementById('p1Controls');
  const p2Controls = document.getElementById('p2Controls');

  // Basic debug logging so we can inspect whether key elements were found
  console.log('DOM elements loaded', {
    p1moneyEl,
    p2moneyEl,
    p1hud,
    p2hud,
    shopPanel,
    sellPanel,
    seedListEl,
  });

  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  function updateTouchLayout() {
    document.body.classList.toggle('single-player', !state.p2Active);
  }

  function enableP2() {
    if (state.p2Active) return;
    state.p2Active = true;
    document.querySelectorAll('.p2').forEach(el => el.classList.remove('p2'));
    addP2Btn.style.display = 'none';
    if (!state.plots.some(pl => pl.owner === 'P2')) { addGardenPlots('P2'); save(); }
    updateTouchLayout();
  }

  function bindTouchControls(container) {
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
  bindTouchControls(p2Controls);
  setupJoystick(p1Controls.querySelector('.dpad'));
  setupJoystick(p2Controls.querySelector('.dpad'));
  updateTouchLayout();

  // Hide virtual controls if a keyboard is used
  window.addEventListener('keydown', () => {
    p1Controls.style.display = 'none';
    p2Controls.style.display = 'none';
  }, { once: true });

  addP2Btn.onclick = () => {
    if (net) net.disconnect();
    enableP2();
  };

  let net = null;
  if (window.Network) {
    net = new Network(msg => {
      if (msg.type === 'state') {
        Object.assign(state.p2, { x: msg.x, y: msg.y, selected: msg.selected });
        if (!state.p2Active) enableP2();
      } else if (msg.type === 'action') {
        playerAction(state.p2, 'P2');
      } else if (msg.type === 'cycle') {
        cycleSeed(state.p2);
      }
    });
  }

  function log(msg) {
    const d = document.createElement('div');
    d.className='evt'; d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    feed.prepend(d);
    while (feed.childElementCount>60) feed.lastChild.remove();
  }

  // Manual save/load/export/import
  btnSave.onclick = () => { save(); log('Game saved to browser.'); };
  btnLoad.onclick = () => {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if (!applySavedState(saved)) { log('No browser save found.'); return; }
    save();
    log('Save loaded from browser.');
  };
  btnExport.onclick = () => {
    save();
    const blob = new Blob([localStorage.getItem(SAVE_KEY)||'{}'], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'garden_duo_save.json'; a.click(); URL.revokeObjectURL(a.href);
    log('Exported save file.');
  };
  btnImport.onclick = () => fileImport.click();
  fileImport.onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const txt = await f.text();
      const data = JSON.parse(txt);
      applySavedState(data);
      save();
      log('Imported save file.');
    } catch {
      log('Failed to import save.');
    }
  };

  // ---------- WORLD LAYOUT ----------
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const WORLD = { w: cv.width, h: cv.height };

  const VENDORS = {
    shop: { x: 20, y: 20, w: 160, h: 120 },
    sell: { x: 200, y: 20, w: 160, h: 120 },
  };

  const GARDENS = [
    { x: 40,  y: 220, w: 320, h: 360, cols:5, rows:4, owner:'P1' },
    { x: WORLD.w-360, y: 220, w: 320, h: 360, cols:5, rows:4, owner:'P2' },
  ];

  function addGardenPlots(owner){
    const g = GARDENS.find(g=>g.owner===owner); if (!g) return;
    const cellW = Math.floor(g.w / g.cols);
    const cellH = Math.floor(g.h / g.rows);
    for (let r=0;r<g.rows;r++) for (let c=0;c<g.cols;c++) {
      state.plots.push({
        x: g.x + c*cellW + 6,
        y: g.y + r*cellH + 6,
        w: cellW - 12,
        h: cellH - 12,
        owner,
        crop:null,
      });
    }
  }

  if (!state.plots || !state.plots.length) {
    addGardenPlots('P1');
    if (state.p2Active) addGardenPlots('P2');
  }

  function activePlots(){
    return state.p2Active ? state.plots : state.plots.filter(pl=>pl.owner!=='P2');
  }

  for (const pl of state.plots) { if (!pl.owner) pl.owner = (pl.x < WORLD.w/2 ? 'P1' : 'P2'); }

  // ---------- INPUT ----------
  const keys = new Set();
  window.addEventListener('keydown', e=>{
    keys.add(e.code);
    if (net) net.handleKey(e.code, true);
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', e=>{
    keys.delete(e.code);
    if (net) net.handleKey(e.code, false);
  });

  // Touch controls
  console.log('Touch support detected:', isTouch);
  if (isTouch) {
    console.log('Touch mode enabled – pointer interactions will trigger player actions');
    cv.addEventListener('pointerdown', e => {
      const rect = cv.getBoundingClientRect();
      const x = (e.clientX - rect.left) * cv.width / rect.width;
      const y = (e.clientY - rect.top) * cv.height / rect.height;
      const plot = activePlots().find(pl => inside(x, y, 0, 0, pl.x, pl.y, pl.w, pl.h));
      if (!plot) return;
      const p = playerByName(plot.owner);
      const oldX = p.x, oldY = p.y;
      p.x = plot.x; p.y = plot.y;
      playerAction(p, plot.owner);
      p.x = oldX; p.y = oldY;
    });
  } else {
    console.log('Keyboard mode enabled – using WASD/Arrow keys for movement');
  }

  function movePlayer(p, up, left, down, right) {
    const pet = p.pet ? PETS.find(x=>x.id===p.pet.id) : null;
    const sp = p.speedBase + (pet?.speed || 0);
    if (keys.has(up)) p.y -= sp;
    if (keys.has(down)) p.y += sp;
    if (keys.has(left)) p.x -= sp;
    if (keys.has(right)) p.x += sp;
    p.x = Math.max(0, Math.min(WORLD.w-p.w, p.x));
    p.y = Math.max(0, Math.min(WORLD.h-p.h, p.y));
  }

  function movePet(p) {
    if (!p.pet) return;
    const targetX = p.x - p.w * 0.8;
    const targetY = p.y - p.h * 0.8;
    if (p.pet.x == null) p.pet.x = targetX;
    if (p.pet.y == null) p.pet.y = targetY;
    p.pet.x += (targetX - p.pet.x) * 0.05;
    p.pet.y += (targetY - p.pet.y) * 0.05;
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
  function inside(ax,ay,aw,ah, bx,by,bw,bh){
    return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
  }
  function dist(ax,ay,bx,by){ const dx=ax-bx, dy=ay-by; return Math.hypot(dx,dy); }

  function playerByName(name){ return name==='P1' ? state.p1 : state.p2; }

  function cycleSeed(p){
    const available = Object.keys(p.invSeeds).filter(id => p.invSeeds[id] > 0);
    if (available.length === 0) return;
    let idx = available.indexOf(p.selected);
    idx = (idx + 1) % available.length;
    p.selected = available[idx];
  }

  function selectSeedByIndex(p, idx) {
    const available = Object.keys(p.invSeeds).filter(id => p.invSeeds[id] > 0);
    if (idx >= 0 && idx < available.length) {
      p.selected = available[idx];
    }
  }

  const SEED_EMOJIS = {
    candy:'🍬',
    carrot:'🥕',
    strawberry:'🍓',
    blueberry:'🫐',
    orangeTulip:'🌷',
    tomato:'🍅',
    corn:'🌽',
    daffodil:'🌼',
    watermelon:'🍉',
    pumpkin:'🎃',
    apple:'🍎',
    bamboo:'🎍',
    coconut:'🥥',
    cactus:'🌵',
    dragonFruit:'🐉',
    mango:'🥭',
    grape:'🍇',
    mushroom:'🍄',
    pepper:'🌶️',
    cacao:'🍫',
    beanstalk:'🌿',
    emberLily:'🔥',
    sugarApple:'🍏',
    burningBud:'💥',
    giantPinecone:'🌲',
    elderStrawberry:'🍓',
    romanesco:'🥦'
  };
  function seedEmoji(id){ return SEED_EMOJIS[id] || '🌱'; }

  const PLANT_DRAWERS = {
    candy: drawCandyPlant,
    carrot: drawCarrotPlant,
    strawberry: drawStrawberryPlant,
    blueberry: drawBlueberryPlant,
    orangeTulip: drawOrangeTulipPlant,
    tomato: drawTomatoPlant,
    corn: drawCornPlant,
    daffodil: drawDaffodilPlant,
    watermelon: drawWatermelonPlant,
    pumpkin: drawPumpkinPlant,
    apple: drawApplePlant,
    bamboo: drawBambooPlant,
    coconut: drawCoconutPlant,
    cactus: drawCactusPlant,
    dragonFruit: drawDragonFruitPlant,
    mango: drawMangoPlant,
    grape: drawGrapePlant,
    mushroom: drawMushroomPlant,
    pepper: drawPepperPlant,
    cacao: drawCacaoPlant,
    beanstalk: drawBeanstalkPlant,
    emberLily: drawEmberLilyPlant,
    sugarApple: drawSugarApplePlant,
    burningBud: drawBurningBudPlant,
    giantPinecone: drawGiantPineconePlant,
    elderStrawberry: drawElderStrawberryPlant,
    romanesco: drawRomanescoPlant,
  };

  function playerAction(p, who) {
    console.log('playerAction triggered', {
      who,
      position: { x: p.x, y: p.y },
      bag: { ...p.bag },
      seeds: { ...p.invSeeds },
    });
    // Vendors
    if (inside(p.x,p.y,p.w,p.h, VENDORS.shop.x,VENDORS.shop.y,VENDORS.shop.w,VENDORS.shop.h)) {
      state.shopOpen = state.shopOpen===who ? null : who; state.sellOpen = false; log(`${who} toggled Seed Shop.`);
      if (state.shopOpen) { generateSeedStock(); renderSeedShop(); }
      return;
    }
    if (inside(p.x,p.y,p.w,p.h, VENDORS.sell.x,VENDORS.sell.y,VENDORS.sell.w,VENDORS.sell.h)) {
      const sold = sellAll(p);
      if (sold>0) { log(`${who} sold harvest for ${formatCurrency(sold)}.`); state.sellOpen = true; state.shopOpen=null; }
      else { log(`${who} has nothing to sell.`); state.sellOpen=true; state.shopOpen=null; }
      return;
    }

    // Challenge interaction
    if (state.challenge && Date.now() < state.challenge.endsAt && dist(p.x+p.w/2, p.y+p.h/2, state.challenge.x, state.challenge.y) < state.challenge.r) {
      // Press action to add progress
      state.challenge.progress += 1; log(`${who} pumps the challenge (${state.challenge.progress}/${state.challenge.goal}).`);
      if (state.challenge.progress >= state.challenge.goal) { awardPet(p, who); state.challenge.endsAt = 0; log('Challenge completed!'); }
      return;
    }

    // Plant / harvest / fix / inspect
    const plot = activePlots().find(pl => inside(p.x,p.y,p.w,p.h, pl.x,pl.y,pl.w,pl.h));
    if (!plot) return;

    // Enforce ownership
    if (plot.owner !== who) { log(`${who} can't use that plot — it belongs to ${plot.owner}.`); return; }

    if (!plot.crop) {
      const kind = p.selected;
      const crop = CROPS[kind];
      if (crop && p.invSeeds[kind] > 0) {
        p.invSeeds[kind]--;
        plot.crop = createPlant(kind, p); // per-player growth perk applies
        log(`${who} planted ${crop.name}${plot.crop.mutation?` (mutation: ${plot.crop.mutation.label})`:''}.`);
        save();
      } else {
        log(`${who} has no ${crop ? crop.name + ' ' : ''}seeds. Buy at the shop.`);
      }
      return;
    }

    if (plot.crop.dead) {
      if (p.money >= REPAIR_COST) { p.money -= REPAIR_COST; plot.crop = null; log(`${who} fixed the plot for ${formatCurrency(REPAIR_COST)}.`); save(); }
      else { log(`${who} needs ${formatCurrency(REPAIR_COST)} to fix this plot.`); }
      return;
    }

    const st = plantStage(plot.crop);
    if (st>=1) {
      const yld = (plot.crop.yield||1);
      p.bag[plot.crop.kind] = (p.bag[plot.crop.kind]||0) + yld;
      log(`${who} harvested ${yld} × ${CROPS[plot.crop.kind].name}.`);
      plot.crop = null; save();
    } else {
      showTooltip(p, plot);
    }
  }

  function showTooltip(p, pl) {
    let txt = 'Growing…';
    if (pl.crop && pl.crop.dead) {
      txt = `Rotten. Press Action to fix for ${formatCurrency(REPAIR_COST)}.`;
    } else if (pl.crop) {
      const c = pl.crop; const st = Math.min(1, plantStage(c));
      const secs = Math.max(0, Math.ceil((1-st) * c.growMs / (state.growthMult*1000)));
      txt = `${CROPS[c.kind].name}: ${(st*100).toFixed(0)}% | ~${secs}s left` + (c.mutation?` | ${c.mutation.label}`:'');
    } else {
      txt = 'Empty plot';
    }
    tooltip.style.left = (p.x + p.w/2) + 'px';
    tooltip.style.top = (p.y) + 'px';
    tooltip.textContent = txt; tooltip.style.opacity=1;
    clearTimeout(showTooltip._t); showTooltip._t = setTimeout(()=>tooltip.style.opacity=0, 1600);
  }

  function createPlant(kind, planter) {
    const base = { kind, plantedAt: Date.now(), growMs: CROPS[kind].growMs, yield:1, sellMult:1, rotChance:0, mutation:null, dead:false };
    if (planter && planter.pet) {
      const pet = PETS.find(x=>x.id===planter.pet.id);
      if (pet) {
        if (pet.plantGrowth) base.growMs /= pet.plantGrowth;
        if (pet.randomMutation) {
          const mut = MUTATIONS[Math.floor(Math.random()*MUTATIONS.length)];
          base.mutation = { id: mut.id, label: mut.label };
          mut.effect(base);
        }
      }
    }
    return base;
  }

  function plantStage(crop) {
    if (!crop) return 0;
    if (!crop.dead && crop.rotChance && Math.random()<0.0008) {
      const progress = (Date.now()-crop.plantedAt) / (crop.growMs/state.growthMult);
      if (progress>0.5) { crop.dead = true; log(`Oh no! A plant rotted.`); }
    }
    const elapsed = Date.now() - crop.plantedAt;
    const adjusted = crop.growMs / state.growthMult;
    return Math.min(1, elapsed/adjusted);
  }

  function priceOf(kind, seller) {
    const base = Math.round(CROPS[kind].sell * state.priceMult);
    const pet = seller && seller.pet ? PETS.find(x=>x.id===seller.pet.id) : null;
    const petBoost = pet?.priceMult || 1;
    return Math.round(base * petBoost * (seller && seller.bonusPriceMult || 1));
  }

  function sellAll(p) {
    let total=0; for (const k of Object.keys(CROPS)) {
      const n = p.bag[k]||0; if (!n) continue; const val = n * priceOf(k, p); total += val; p.bag[k]=0;
    }
    p.money += total; save(); return total;
  }

  function generateSeedStock(){
    seedStock.clear();
    SEED_CATALOG.forEach((s,i)=>{
      const prob = 1 - (i/SEED_CATALOG.length)*0.9;
      if (Math.random() < prob) seedStock.add(s.id);
    });
  }

  function renderSeedShop(){
    if (!seedListEl) return;
    seedListEl.innerHTML='';
    for (const s of SEED_CATALOG){
      const row=document.createElement('div');
      row.className='row';
      const name=document.createElement('span'); name.textContent=seedEmoji(s.id)+" "+s.name;
      const price=document.createElement('span'); price.textContent=formatCurrency(s.sheckles);
      row.append(name, price); seedListEl.appendChild(row);
      const actions=document.createElement('div'); actions.className='row';
      if (seedStock.has(s.id)){
        const b1=document.createElement('button'); b1.textContent='Buy P1'; b1.onclick=()=>buySeed('P1', s.id); actions.appendChild(b1);
        const b2=document.createElement('button'); b2.textContent='Buy P2'; b2.className='p2'; b2.onclick=()=>buySeed('P2', s.id); actions.appendChild(b2);
      } else {
        const sold=document.createElement('span'); sold.textContent='Out of stock'; actions.appendChild(sold);
      }
      seedListEl.appendChild(actions);
    }
    if (state.p2Active) document.querySelectorAll('#seedList .p2').forEach(el=>el.classList.remove('p2'));
  }

  function buySeed(who, id){
    const seed = SEED_CATALOG.find(s=>s.id===id);
    const target = playerByName(who);
    if (!seed || !seedStock.has(id)) { log('Seed not available.'); return; }
    if (state.shopOpen !== who || !inside(target.x,target.y,target.w,target.h, VENDORS.shop.x,VENDORS.shop.y,VENDORS.shop.w,VENDORS.shop.h)) {
      log(`${who} must be at the Seed Shop to buy seeds.`); return;
    }
    if (target.money < seed.sheckles) { log(`${who} can’t afford ${seed.name} (${formatCurrency(seed.sheckles)}).`); return; }
    target.money -= seed.sheckles;
    target.invSeeds[id] = (target.invSeeds[id]||0) + 1;
    log(`${who} bought 1 × ${seed.name} seed.`);
    save();
  }

  // ---------- WORLD / PET CHALLENGE ----------
  function maybeStartWorldEvent() {
    const now = Date.now();
    if (state.activeEvent && now < state.eventUntil) return;
    if (state.activeEvent) { state.activeEvent = null; state.priceMult = 1; state.growthMult = 1; }
    if (!maybeStartWorldEvent.nextAt) maybeStartWorldEvent.nextAt = now + (45000 + Math.random()*30000);
    if (now < maybeStartWorldEvent.nextAt) return;
    const evt = WORLD_EVENTS[Math.floor(Math.random()*WORLD_EVENTS.length)];
    state.activeEvent = evt.id; state.eventUntil = now + evt.dur; evt.apply(state);
    maybeStartWorldEvent.nextAt = now + evt.dur + (40000 + Math.random()*25000);
    log(evt.label);
  }

  function maybeSpawnChallenge(){
    const now = Date.now();
    if (state.challenge && now < state.challenge.endsAt) return;
    if (!maybeSpawnChallenge.nextAt) maybeSpawnChallenge.nextAt = now + (50000 + Math.random()*40000);
    if (now < maybeSpawnChallenge.nextAt) return;
    state.challenge = { x: WORLD.w/2, y: WORLD.h/2, r: 60, goal: 10, progress:0, endsAt: now + 25000 };
    maybeSpawnChallenge.nextAt = now + 75000 + Math.random()*45000;
    log('Center Challenge appeared! Stand in the circle and press Action to charge it to 10 before time runs out.');
  }

  function awardPet(p, who){
    // Give a random pet not owned, otherwise coins
    const ownedIds = new Set((p.pets||[]).map(x=>x.id));
    const pool = PETS.filter(pt=>!ownedIds.has(pt.id));
    if (pool.length){
      const pet = pool[Math.floor(Math.random()*pool.length)];
      p.pets.push({id:pet.id});
      p.pet = {id:pet.id, x:p.x-16, y:p.y-16};
      log(`${who} received a pet: ${describePet(pet)}.`);
    } else {
      p.money += 100; log(`${who} already has all pets. Awarded ${formatCurrency(100)} instead.`);
    }
    save();
  }

  // ---------- TEXTURES ----------
  const patterns = {};
  function makeGrassPattern(){
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#9fce9f'; g.fillRect(0,0,64,64);
    for (let i=0;i<120;i++){ g.strokeStyle = 'rgba(30,100,40,0.35)'; g.beginPath(); const x=Math.random()*64, y=Math.random()*64; g.moveTo(x,y); g.lineTo(x+Math.random()*2-1, y-3-Math.random()*3); g.stroke(); }
    g.fillStyle='rgba(255,255,255,.06)'; for (let i=0;i<25;i++){ g.fillRect(Math.random()*64, Math.random()*64, 1, 1); }
    return g.createPattern(c,'repeat');
  }
  function makeSoilPattern(){
    const c = document.createElement('canvas'); c.width = 48; c.height = 48; const g = c.getContext('2d');
    g.fillStyle = '#8b5a2b'; g.fillRect(0,0,48,48);
    g.fillStyle = '#6b3d16'; for (let i=0;i<90;i++){ g.fillRect(Math.random()*48, Math.random()*48, 1, 1); }
    g.fillStyle = '#a7713a'; for (let i=0;i<40;i++){ g.globalAlpha=0.25; g.beginPath(); g.arc(Math.random()*48, Math.random()*48, Math.random()*1.2, 0, Math.PI*2); g.fill(); g.globalAlpha=1; }
    return g.createPattern(c,'repeat');
  }
  patterns.grass = makeGrassPattern();
  patterns.soil = makeSoilPattern();

  // ---------- RENDER ----------
  function draw() {
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.fillStyle = patterns.grass; ctx.fillRect(0,0,cv.width,cv.height);

    // Vendors
    drawVendor(VENDORS.shop, 'Seed Shop');
    drawVendor(VENDORS.sell, 'Sell');

    // Garden rectangles
    for (const gdn of GARDENS) {
      if (gdn.owner==='P2' && !state.p2Active) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(gdn.x+2, gdn.y+2, gdn.w, gdn.h);
      ctx.fillStyle = '#7fb07f'; ctx.fillRect(gdn.x, gdn.y, gdn.w, gdn.h);
      ctx.strokeStyle = '#234'; ctx.lineWidth = 3; ctx.strokeRect(gdn.x, gdn.y, gdn.w, gdn.h);
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font='bold 22px sans-serif';
      ctx.fillText(gdn.owner, gdn.x+8, gdn.y+26);
    }

    // Plots
    for (const pl of activePlots()) drawPlot(pl);

    // Center challenge circle
    if (state.challenge && Date.now() < state.challenge.endsAt){
      const ch = state.challenge; const rem = Math.max(0, Math.ceil((ch.endsAt-Date.now())/1000));
      ctx.beginPath(); ctx.arc(ch.x, ch.y, ch.r, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
      ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 3; ctx.stroke();
      // progress wedge
      const p = ch.progress / ch.goal; ctx.beginPath(); ctx.moveTo(ch.x, ch.y); ctx.arc(ch.x, ch.y, ch.r, -Math.PI/2, -Math.PI/2 + Math.PI*2*p);
      ctx.closePath(); ctx.fillStyle = 'rgba(59,130,246,0.4)'; ctx.fill();
      ctx.fillStyle = '#111'; ctx.font='16px sans-serif'; ctx.fillText(`Challenge: ${ch.progress}/${ch.goal}  (${rem}s)`, ch.x-90, ch.y- ch.r - 10);
    }

    // Players
    drawPlayer(state.p1, '#2563eb');
    if (state.p2Active) drawPlayer(state.p2, '#e11d48');
    drawPet(state.p1);
    if (state.p2Active) drawPet(state.p2);

    // HUD
    p1moneyEl.textContent = `P1 Money: ${formatCurrency(state.p1.money)}`;
    const matchPet1 = state.p1.pet ? PETS.find(p=>p.id===state.p1.pet.id) : null;
    const petName1 = describePet(matchPet1);
    const invEntries1 = Object.entries(state.p1.invSeeds).filter(([k,v])=>v>0);
    const inv1 = invEntries1.map(([k,v],i)=>`${i+1}:${k}(${v})`).join(', ') || '—';
    const bag1 = Object.entries(state.p1.bag).filter(([k,v])=>v>0).map(([k,v])=>`${k}:${v}`).join(', ') || '—';
    const sel1 = CROPS[state.p1.selected]?.name || state.p1.selected;
    p1hud.textContent = `P1 Seeds: ${inv1} | Bag: ${bag1} | Pet: ${petName1} | Selected: ${sel1}`;
    if (state.p2Active) {
      p2moneyEl.textContent = `P2 Money: ${formatCurrency(state.p2.money)}`;
      const matchPet2 = state.p2.pet ? PETS.find(p=>p.id===state.p2.pet.id) : null;
      const petName2 = describePet(matchPet2);
      const invEntries2 = Object.entries(state.p2.invSeeds).filter(([k,v])=>v>0);
      const inv2 = invEntries2.map(([k,v],i)=>`${i+1}:${k}(${v})`).join(', ') || '—';
      const bag2 = Object.entries(state.p2.bag).filter(([k,v])=>v>0).map(([k,v])=>`${k}:${v}`).join(', ') || '—';
      const sel2 = CROPS[state.p2.selected]?.name || state.p2.selected;
      p2hud.textContent = `P2 Seeds: ${inv2} | Bag: ${bag2} | Pet: ${petName2} | Selected: ${sel2}`;
    }

    // Log HUD state roughly once per second to help debug bag/seed values
    if (!draw._lastLog || Date.now() - draw._lastLog > 1000) {
      const logData = {
        p1: { money: state.p1.money, bag: { ...state.p1.bag }, seeds: { ...state.p1.invSeeds } }
      };
      if (state.p2Active) {
        logData.p2 = { money: state.p2.money, bag: { ...state.p2.bag }, seeds: { ...state.p2.invSeeds } };
      }
      console.log('HUD state', logData);
      draw._lastLog = Date.now();
    }

    // Panels visibility
    shopPanel.style.display = state.shopOpen? 'block':'none';
    sellPanel.style.display = state.sellOpen? 'block':'none';

    // World event banner
    if (state.activeEvent) {
      ctx.fillStyle = '#0008'; ctx.fillRect(cv.width/2-170, 14, 340, 30);
      ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
      const evt = WORLD_EVENTS.find(e=>e.id===state.activeEvent);
      const label = evt ? evt.label : '—';
      ctx.fillText(label, cv.width/2-160, 34);
    }
  }

  function drawVendor(v, label) {
    ctx.fillStyle = '#f8f2d0'; ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.strokeRect(v.x, v.y, v.w, v.h);
    ctx.fillStyle = '#111'; ctx.font = '16px sans-serif'; ctx.fillText(label, v.x+10, v.y+24);
  }

  function drawPlot(pl) {
    ctx.fillStyle = patterns.soil; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
    ctx.strokeStyle = '#4b2e12'; ctx.lineWidth = 2; ctx.strokeRect(pl.x, pl.y, pl.w, pl.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    for (let i=1;i<4;i++){ const yy = pl.y + (pl.h*i/4); ctx.beginPath(); ctx.moveTo(pl.x+3, yy); ctx.lineTo(pl.x+pl.w-3, yy); ctx.stroke(); }

    // Owner badge corner
    ctx.fillStyle = pl.owner==='P1' ? 'rgba(37,99,235,.25)' : 'rgba(225,29,72,.25)';
    ctx.fillRect(pl.x, pl.y, 10, 10);

    if (!pl.crop) return;
    const c = pl.crop; const st = plantStage(c);
    if (c.dead) { ctx.fillStyle = 'rgba(40,20,10,0.65)'; ctx.fillRect(pl.x+4, pl.y+4, pl.w-8, pl.h-8); return; }

    let scale = 1; if (c.yield===2) scale *= 1.15;
    const drawer = PLANT_DRAWERS[c.kind] || drawGenericPlant;
    drawer(pl, st, scale, c);
  }

  function drawCandyPlant(pl, st, scale, crop){
    const glitter = !!(crop && crop.mutation && crop.mutation.id==='glitter');
    const cx = pl.x + pl.w/2; const cy = pl.y + pl.h - 6;
    const stemH = Math.max(6, st*(pl.h-14)) * scale;
    ctx.strokeStyle = '#2c6e3f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy-stemH); ctx.stroke();
    ctx.fillStyle = '#3f9958'; for (let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(cx-6+i*6, cy-stemH*0.6 - i*3, 8, 3, i*0.7, 0, Math.PI*2); ctx.fill(); }
    const r = 6 + st*6 * scale; const bx = cx, by = cy-stemH-2;
    ctx.fillStyle = '#b06bd3';
    for (let i=0;i<6;i++){ ctx.beginPath(); ctx.ellipse(bx+Math.cos(i)*r, by+Math.sin(i)*r, 6, 10, i, 0, Math.PI*2); ctx.fill(); }
    ctx.fillStyle = '#ffd1e6'; ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI*2); ctx.fill();
    if (glitter){ drawSparkles(bx, by, r*1.2, 6); }
  }

  function drawCarrotPlant(pl, st, scale){
    const cx = pl.x + pl.w/2; const baseY = pl.y + pl.h - 6;
    const top = Math.max(8, st*(pl.h-14)) * scale;
    ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 2;
    for (let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(cx, baseY-top); ctx.lineTo(cx-14+i*7, baseY-top-10-Math.random()*6); ctx.stroke(); }
    const vis = Math.min(1, st*1.2);
    ctx.fillStyle = '#e67e22';
    ctx.beginPath(); ctx.moveTo(cx, baseY-4 - vis*18);
    ctx.lineTo(cx-10*scale, baseY-4);
    ctx.lineTo(cx+10*scale, baseY-4);
    ctx.closePath(); ctx.fill();
  }

  function drawSparkles(cx, cy, radius, count=6) {
    const t = Date.now() / 250;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i=0; i<count; i++) {
      const angle = t + (Math.PI * 2 * i / count);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const size = 1.2 + 0.4 * Math.sin(t + i);
      ctx.fillRect(x, y, size, size);
    }
  }

  function drawGenericPlant(pl, st, scale) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(6, growth*(pl.h-18)) * scale;
    ctx.strokeStyle = '#2f8a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx, baseY - stemH);
    ctx.stroke();
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(cx - 6, baseY - stemH*0.6, 7, 3, -0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 6, baseY - stemH*0.6, 7, 3, 0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#6abe55';
    ctx.beginPath();
    ctx.arc(cx, baseY - stemH - 3, 3 + growth*3*scale, 0, Math.PI*2);
    ctx.fill();
  }

  function drawStrawberryPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(8, growth*(pl.h-18)) * scale;
    const sway = Math.sin(Date.now()/400 + cx) * 2;
    ctx.strokeStyle = '#2f8a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx + sway, baseY - stemH);
    ctx.stroke();
    ctx.fillStyle = '#3fa55b';
    for (let i=0;i<3;i++){
      const angle = -0.5 + i*0.5;
      ctx.beginPath();
      ctx.ellipse(cx + sway + Math.cos(angle)*6, baseY - stemH*0.7 + Math.sin(angle)*4, 7, 3, angle, 0, Math.PI*2);
      ctx.fill();
    }
    const fruitH = 10 + growth*10*scale;
    const fruitW = 8 + growth*8*scale;
    const fx = cx + sway;
    const fy = baseY - stemH + fruitH*0.2;
    ctx.fillStyle = '#d62839';
    ctx.beginPath();
    ctx.moveTo(fx, fy - fruitH/2);
    ctx.quadraticCurveTo(fx - fruitW, fy - fruitH/4, fx - fruitW*0.9, fy + fruitH/2);
    ctx.quadraticCurveTo(fx, fy + fruitH*0.7, fx + fruitW*0.9, fy + fruitH/2);
    ctx.quadraticCurveTo(fx + fruitW, fy - fruitH/4, fx, fy - fruitH/2);
    ctx.fill();
    ctx.fillStyle = '#ffe066';
    const seeds = 6;
    for (let i=0;i<seeds;i++){
      const angle = (i/seeds) * Math.PI * 2;
      const sx = fx + Math.cos(angle) * fruitW * 0.6;
      const sy = fy + Math.sin(angle) * fruitH * 0.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 1.2, 2, angle, 0, Math.PI*2);
      ctx.fill();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(fx, fy - fruitH*0.2, fruitW*0.9, 6);
    }
  }

  function drawBlueberryPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const bushH = Math.max(10, growth*(pl.h-20)) * scale;
    ctx.fillStyle = '#35663a';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - bushH*0.5, 12*scale, bushH*0.6, 0, 0, Math.PI*2);
    ctx.fill();
    const berryCount = 5 + Math.floor(growth*4);
    const t = Date.now()/500;
    for (let i=0;i<berryCount;i++){
      const angle = (i/berryCount) * Math.PI * 2;
      const radius = 6 + growth*6;
      const bx = cx + Math.cos(angle + t*0.2) * radius * 0.35;
      const by = baseY - bushH*0.5 + Math.sin(angle + t*0.25) * radius * 0.45;
      const size = 3 + growth*2*scale;
      ctx.fillStyle = '#3f5bc0';
      ctx.beginPath();
      ctx.arc(bx, by, size, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#8aa6ff';
      ctx.beginPath();
      ctx.arc(bx - size*0.3, by - size*0.3, size*0.3, 0, Math.PI*2);
      ctx.fill();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, baseY - bushH*0.5, 10*scale, 5);
    }
  }

  function drawOrangeTulipPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(8, growth*(pl.h-18)) * scale;
    const sway = Math.sin(Date.now()/350 + cx) * 1.5 * (0.6 + growth*0.4);
    ctx.strokeStyle = '#2f8a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx + sway, baseY - stemH);
    ctx.stroke();
    ctx.fillStyle = '#3fa55b';
    ctx.beginPath(); ctx.ellipse(cx - 8, baseY - stemH*0.5, 8, 3, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 8, baseY - stemH*0.5, 8, 3, 0.5, 0, Math.PI*2); ctx.fill();
    const bloomY = baseY - stemH - 2;
    const petal = 8 + growth*10*scale;
    ctx.fillStyle = '#ff8a3c';
    for (let i=0;i<4;i++){
      const angle = i * (Math.PI/2);
      ctx.beginPath();
      ctx.ellipse(cx + sway + Math.cos(angle)*4, bloomY + Math.sin(angle)*4, petal*0.35, petal*0.8, angle, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(cx + sway, bloomY, petal*0.3, 0, Math.PI*2); ctx.fill();
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx + sway, bloomY, petal, 6);
    }
  }

  function drawTomatoPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(12, growth*(pl.h-16)) * scale;
    const sway = Math.sin(Date.now()/420 + baseY) * 2;
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx-3, baseY);
    ctx.bezierCurveTo(cx-4, baseY - stemH*0.3, cx+sway, baseY - stemH*0.5, cx, baseY - stemH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx+3, baseY);
    ctx.bezierCurveTo(cx+4, baseY - stemH*0.3, cx+sway, baseY - stemH*0.7, cx+2, baseY - stemH*1.05);
    ctx.stroke();
    ctx.fillStyle = '#3fa55b';
    for (let i=0;i<3;i++){
      ctx.beginPath();
      ctx.ellipse(cx - 10 + i*10, baseY - stemH*0.6 - i*4, 7, 3, 0.2*i, 0, Math.PI*2);
      ctx.fill();
    }
    const fruitCount = 3;
    for (let i=0;i<fruitCount;i++){
      const fx = cx + (i-1)*8;
      const fy = baseY - stemH*0.45 + Math.sin(Date.now()/300 + i) * 3;
      const size = 5 + growth*5*scale;
      ctx.fillStyle = '#d6453d';
      ctx.beginPath();
      ctx.arc(fx, fy, size, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#8bc34a';
      ctx.beginPath();
      ctx.arc(fx, fy - size*0.7, size*0.3, 0, Math.PI*2);
      ctx.fill();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, baseY - stemH*0.4, 12*scale, 6);
    }
  }

  function drawCornPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stalkH = Math.max(14, growth*(pl.h-12)) * scale;
    ctx.strokeStyle = '#3b8e2f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx, baseY - stalkH);
    ctx.stroke();
    ctx.fillStyle = '#3fa55b';
    for (let i=0;i<3;i++){
      const leafY = baseY - stalkH*(0.3 + i*0.2);
      ctx.beginPath();
      ctx.ellipse(cx - 10, leafY, 9, 3, -0.4, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 10, leafY - 6, 9, 3, 0.4, 0, Math.PI*2);
      ctx.fill();
    }
    const earH = Math.max(10, stalkH*0.45);
    const earY = baseY - stalkH*0.55;
    ctx.fillStyle = '#f3d250';
    ctx.beginPath();
    ctx.ellipse(cx, earY, 6*scale, earH*0.4, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#d1a520';
    ctx.lineWidth = 1;
    for (let i=0;i<4;i++){
      const y = earY - earH*0.3 + i*(earH*0.2);
      ctx.beginPath();
      ctx.moveTo(cx - 5*scale, y);
      ctx.lineTo(cx + 5*scale, y);
      ctx.stroke();
    }
    const tasselY = baseY - stalkH - 6;
    ctx.strokeStyle = '#c9c141';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - stalkH);
    ctx.lineTo(cx, tasselY);
    ctx.stroke();
    for (let i=0;i<4;i++){
      ctx.beginPath();
      ctx.moveTo(cx, tasselY);
      ctx.lineTo(cx - 6 + i*4, tasselY - 8);
      ctx.stroke();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, earY, 10*scale, 6);
    }
  }

  function drawDaffodilPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(10, growth*(pl.h-14)) * scale;
    const sway = Math.sin(Date.now()/360 + cx) * 1.5;
    ctx.strokeStyle = '#3a9a45';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx + sway, baseY - stemH);
    ctx.stroke();
    ctx.fillStyle = '#54c26f';
    ctx.beginPath();
    ctx.moveTo(cx - 6, baseY);
    ctx.quadraticCurveTo(cx - 14, baseY - stemH*0.4, cx - 6, baseY - stemH*0.85);
    ctx.quadraticCurveTo(cx - 4, baseY - stemH*0.65, cx - 6, baseY);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 6, baseY);
    ctx.quadraticCurveTo(cx + 14, baseY - stemH*0.4, cx + 4, baseY - stemH*0.85);
    ctx.quadraticCurveTo(cx + 2, baseY - stemH*0.65, cx + 6, baseY);
    ctx.fill();
    const bloomY = baseY - stemH - 2;
    const petal = 6 + growth*6*scale;
    ctx.fillStyle = '#ffe066';
    for (let i=0;i<6;i++){
      const angle = i * (Math.PI/3);
      ctx.beginPath();
      ctx.ellipse(cx + sway + Math.cos(angle)*petal, bloomY + Math.sin(angle)*petal, petal*0.4, petal*0.8, angle, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffbe0b';
    ctx.beginPath();
    ctx.arc(cx + sway, bloomY, petal*0.5, 0, Math.PI*2);
    ctx.fill();
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx + sway, bloomY, petal, 6);
    }
  }

  function drawWatermelonPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    ctx.strokeStyle = '#2f7f3f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pl.x + 6, baseY - 6);
    ctx.bezierCurveTo(pl.x + 10, baseY - 12, cx, baseY - 12 - growth*4, pl.x + pl.w - 6, baseY - 6);
    ctx.stroke();
    ctx.fillStyle = '#4caf50';
    for (let i=0;i<3;i++){
      ctx.beginPath();
      ctx.ellipse(pl.x + 8 + i*10, baseY - 10, 7, 3, i*0.4, 0, Math.PI*2);
      ctx.fill();
    }
    const fruitW = 12 + growth*20*scale;
    const fruitH = 8 + growth*10*scale;
    const fy = baseY - fruitH*0.5;
    ctx.fillStyle = '#1b5e20';
    ctx.beginPath();
    ctx.ellipse(cx, fy, fruitW, fruitH, 0, Math.PI*0.1, Math.PI*1.9);
    ctx.fill();
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 2;
    for (let i=-2;i<=2;i++){
      ctx.beginPath();
      ctx.moveTo(cx + i*fruitW*0.3, fy - fruitH*0.8);
      ctx.lineTo(cx + i*fruitW*0.3, fy + fruitH*0.8);
      ctx.stroke();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, fy, fruitW, 7);
    }
  }

  function drawPumpkinPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const vineY = baseY - 10;
    ctx.strokeStyle = '#2f7f3f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pl.x + 6, vineY);
    ctx.bezierCurveTo(pl.x + 14, vineY - 8, cx - 6, vineY - 6, cx, vineY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, vineY);
    ctx.bezierCurveTo(cx + 6, vineY + 4, pl.x + pl.w - 10, vineY - 4, pl.x + pl.w - 6, vineY - 2);
    ctx.stroke();
    const pumpW = 12 + growth*22*scale;
    const pumpH = 8 + growth*16*scale;
    ctx.fillStyle = '#ff8c42';
    for (let i=-1;i<=1;i++){
      const factor = 1 - Math.abs(i)*0.25;
      ctx.beginPath();
      ctx.ellipse(cx + i*pumpW*0.35, baseY - 6, pumpW*0.35*factor, pumpH*0.5, 0, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.strokeStyle = '#d95d0e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - pumpH*0.8);
    ctx.lineTo(cx, baseY - pumpH - 2);
    ctx.stroke();
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - pumpH - 4, 4, 2, 0.2, 0, Math.PI*2);
    ctx.fill();
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, baseY - 6, pumpW, 6);
    }
  }

  function drawApplePlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const trunkH = Math.max(12, growth*(pl.h-18)) * scale;
    ctx.fillStyle = '#8d5a2b';
    ctx.fillRect(cx - 3, baseY - trunkH, 6, trunkH);
    const canopyR = 12 + growth*12*scale;
    const canopyY = baseY - trunkH - canopyR*0.3;
    ctx.fillStyle = '#3fa55b';
    ctx.beginPath();
    ctx.ellipse(cx, canopyY, canopyR, canopyR*0.7, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#2d7c3f';
    ctx.beginPath();
    ctx.ellipse(cx - canopyR*0.6, canopyY + 3, canopyR*0.6, canopyR*0.5, 0.2, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + canopyR*0.6, canopyY + 1, canopyR*0.6, canopyR*0.5, -0.2, 0, Math.PI*2);
    ctx.fill();
    const appleSize = 2.5 + growth*2.5*scale;
    for (let i=0;i<3;i++){
      const ax = cx - canopyR*0.4 + i*(canopyR*0.4);
      const ay = canopyY + Math.sin(Date.now()/500 + i) * 3;
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.arc(ax, ay, appleSize, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#6ab04c';
      ctx.beginPath();
      ctx.arc(ax, ay - appleSize, appleSize*0.3, 0, Math.PI*2);
      ctx.fill();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, canopyY, canopyR, 7);
    }
  }

  function drawBambooPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stalkH = Math.max(12, growth*(pl.h-10)) * scale;
    const segments = 4;
    const segH = stalkH / segments;
    ctx.fillStyle = '#a5d152';
    for (let i=0;i<segments;i++){
      const top = baseY - segH*(i+1);
      ctx.fillRect(cx - 4, top, 8, segH - 1);
      ctx.fillStyle = '#97c246';
      ctx.fillRect(cx - 4, top + segH - 2, 8, 2);
      ctx.fillStyle = '#a5d152';
    }
    ctx.fillStyle = '#7cb342';
    ctx.fillRect(cx - 5, baseY - stalkH, 10, 3);
    ctx.strokeStyle = '#3fa55b';
    ctx.lineWidth = 2;
    for (let i=0;i<segments;i++){
      const y = baseY - segH*(i+0.5);
      const dir = i % 2 === 0 ? 1 : -1;
      const offset = dir * (8 + growth*4);
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + offset, y - 6);
      ctx.stroke();
      ctx.fillStyle = '#6dc070';
      ctx.beginPath();
      ctx.ellipse(cx + offset, y - 8, 8, 3, dir>0?0.4:-0.4, 0, Math.PI*2);
      ctx.fill();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, baseY - stalkH*0.6, 12*scale, 6);
    }
  }

  function drawCoconutPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const trunkH = Math.max(14, growth*(pl.h-10)) * scale;
    ctx.fillStyle = '#9c6644';
    ctx.beginPath();
    ctx.moveTo(cx - 4, baseY);
    ctx.lineTo(cx + 4, baseY);
    ctx.lineTo(cx + 2, baseY - trunkH);
    ctx.lineTo(cx - 2, baseY - trunkH);
    ctx.closePath();
    ctx.fill();
    const topY = baseY - trunkH;
    const leafLen = (18 + growth*10) * scale;
    ctx.strokeStyle = '#2e8b57';
    ctx.lineWidth = 2;
    for (let i=0;i<5;i++){
      const angle = -Math.PI/2 + i*(Math.PI/6) - Math.PI/6;
      ctx.beginPath();
      ctx.moveTo(cx, topY);
      ctx.quadraticCurveTo(cx + Math.cos(angle)*leafLen*0.6, topY + Math.sin(angle)*leafLen*0.4, cx + Math.cos(angle)*leafLen, topY + Math.sin(angle)*leafLen);
      ctx.stroke();
    }
    ctx.fillStyle = '#654321';
    const nut = 3 + growth*3*scale;
    ctx.beginPath(); ctx.arc(cx - 4, topY + 6, nut, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, topY + 4, nut*0.9, 0, Math.PI*2); ctx.fill();
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, topY + 4, leafLen*0.4, 5);
    }
  }

  function drawCactusPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const height = Math.max(14, growth*(pl.h-10)) * scale;
    const bodyW = 10 * scale;
    ctx.fillStyle = '#2f9e44';
    ctx.beginPath();
    ctx.moveTo(cx - bodyW, baseY);
    ctx.lineTo(cx - bodyW, baseY - height*0.6);
    ctx.quadraticCurveTo(cx - bodyW, baseY - height, cx, baseY - height);
    ctx.quadraticCurveTo(cx + bodyW, baseY - height, cx + bodyW, baseY - height*0.6);
    ctx.lineTo(cx + bodyW, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - bodyW*0.9, baseY - height*0.45);
    ctx.quadraticCurveTo(cx - bodyW*1.6, baseY - height*0.7, cx - bodyW*1.3, baseY - height*0.2);
    ctx.quadraticCurveTo(cx - bodyW*1.1, baseY - height*0.05, cx - bodyW*0.6, baseY - height*0.2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + bodyW*0.9, baseY - height*0.55);
    ctx.quadraticCurveTo(cx + bodyW*1.5, baseY - height*0.8, cx + bodyW*1.2, baseY - height*0.3);
    ctx.quadraticCurveTo(cx + bodyW, baseY - height*0.1, cx + bodyW*0.6, baseY - height*0.25);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i=0;i<5;i++){
      ctx.beginPath();
      ctx.moveTo(cx - bodyW + i*bodyW*0.4, baseY - height + 4);
      ctx.lineTo(cx - bodyW + i*bodyW*0.4, baseY);
      ctx.stroke();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, baseY - height*0.4, bodyW*1.2, 5);
    }
  }

  function drawDragonFruitPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(10, growth*(pl.h-18)) * scale;
    ctx.fillStyle = '#2c7a3b';
    ctx.beginPath();
    ctx.moveTo(cx - 3, baseY);
    ctx.lineTo(cx - 3, baseY - stemH);
    ctx.lineTo(cx + 3, baseY - stemH);
    ctx.lineTo(cx + 3, baseY);
    ctx.closePath();
    ctx.fill();
    const fruitH = 12 + growth*12*scale;
    const fruitW = 8 + growth*8*scale;
    const fy = baseY - stemH - fruitH*0.4;
    ctx.fillStyle = '#d81b60';
    ctx.beginPath();
    ctx.ellipse(cx, fy, fruitW, fruitH, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#8bc34a';
    ctx.lineWidth = 2;
    for (let i=0;i<6;i++){
      const angle = i * (Math.PI/3);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle)*fruitW*0.7, fy + Math.sin(angle)*fruitH*0.7);
      ctx.lineTo(cx + Math.cos(angle)*fruitW*1.1, fy + Math.sin(angle)*fruitH*1.1);
      ctx.stroke();
    }
    ctx.fillStyle = '#6ab04c';
    for (let i=0;i<4;i++){
      const angle = i*(Math.PI/2) + Math.PI/4;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(angle)*fruitW*0.35, fy - fruitH*0.4 + Math.sin(angle)*fruitH*0.6, 3, 6, angle, 0, Math.PI*2);
      ctx.fill();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, fy, fruitW*1.1, 7);
    }
  }

  function drawMangoPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const trunkH = Math.max(10, growth*(pl.h-16)) * scale;
    ctx.fillStyle = '#8d5a2b';
    ctx.fillRect(cx - 2, baseY - trunkH, 4, trunkH);
    const canopyR = 10 + growth*14*scale;
    const canopyY = baseY - trunkH - canopyR*0.2;
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(cx, canopyY, canopyR, canopyR*0.7, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#3fa55b';
    ctx.beginPath();
    ctx.ellipse(cx - canopyR*0.5, canopyY + 2, canopyR*0.6, canopyR*0.5, -0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + canopyR*0.5, canopyY + 2, canopyR*0.6, canopyR*0.5, 0.3, 0, Math.PI*2);
    ctx.fill();
    const fruitCount = 2 + Math.round(growth);
    ctx.fillStyle = '#ffb347';
    for (let i=0;i<fruitCount;i++){
      const angle = (i/(fruitCount)) * Math.PI - Math.PI/2;
      const fx = cx + Math.cos(angle) * canopyR * 0.5;
      const fy = canopyY + Math.sin(angle) * canopyR * 0.6 + 4;
      const size = 3 + growth*3*scale;
      ctx.beginPath();
      ctx.ellipse(fx, fy, size*0.7, size, 0.2, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#f0932b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, fy - size);
      ctx.lineTo(fx, fy - size - 3);
      ctx.stroke();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, canopyY, canopyR, 6);
    }
  }

  function drawGrapePlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const trellis = Math.max(10, growth*(pl.h-18)) * scale;
    ctx.strokeStyle = '#8d5a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 12, baseY);
    ctx.lineTo(cx + 12, baseY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 12, baseY - trellis*0.6);
    ctx.lineTo(cx + 12, baseY - trellis*0.6);
    ctx.stroke();
    ctx.strokeStyle = '#3f8f46';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.bezierCurveTo(cx - 6, baseY - trellis*0.3, cx + 4, baseY - trellis*0.6, cx - 2, baseY - trellis);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 6, baseY - trellis*0.4);
    ctx.bezierCurveTo(cx - 12, baseY - trellis*0.7, cx + 6, baseY - trellis*0.6, cx + 2, baseY - trellis*1.05);
    ctx.stroke();
    const clusterR = 4 + growth*6*scale;
    const clusterX = cx;
    const clusterY = baseY - trellis*0.5;
    ctx.fillStyle = '#7b2cbf';
    const berries = 8;
    for (let i=0;i<berries;i++){
      const angle = (i/berries) * Math.PI * 2;
      const bx = clusterX + Math.cos(angle) * clusterR * 0.6;
      const by = clusterY + Math.sin(angle) * clusterR * 0.8;
      const size = 2 + growth*2*scale * (0.8 + 0.2*Math.sin(i));
      ctx.beginPath();
      ctx.arc(bx, by, size, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = '#b794f4';
    ctx.beginPath();
    ctx.arc(clusterX, clusterY - clusterR*0.4, clusterR*0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#3fa55b';
    ctx.beginPath();
    ctx.ellipse(clusterX - clusterR, clusterY - clusterR, 6, 3, -0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(clusterX + clusterR, clusterY - clusterR*0.6, 6, 3, 0.4, 0, Math.PI*2);
    ctx.fill();
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(clusterX, clusterY, clusterR*1.4, 6);
    }
  }

  function drawMushroomPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stalkH = Math.max(6, growth*(pl.h-22)) * scale;
    ctx.fillStyle = '#f3e5ab';
    ctx.beginPath();
    ctx.moveTo(cx - 4, baseY);
    ctx.lineTo(cx + 4, baseY);
    ctx.lineTo(cx + 3, baseY - stalkH);
    ctx.lineTo(cx - 3, baseY - stalkH);
    ctx.closePath();
    ctx.fill();
    const capW = 14 + growth*14*scale;
    const capH = 8 + growth*6*scale;
    const capY = baseY - stalkH;
    ctx.fillStyle = '#d95d5d';
    ctx.beginPath();
    ctx.ellipse(cx, capY, capW, capH, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#f5d6a0';
    ctx.beginPath();
    ctx.ellipse(cx, capY - capH*0.2, capW*0.6, capH*0.5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff8dc';
    for (let i=0;i<5;i++){
      ctx.beginPath();
      ctx.arc(cx - capW*0.6 + i*capW*0.3, capY - capH*0.4, 2, 0, Math.PI*2);
      ctx.fill();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, capY - capH*0.3, capW, 5);
    }
  }

  function drawPepperPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(10, growth*(pl.h-18)) * scale;
    const sway = Math.sin(Date.now()/320 + cx) * 2;
    ctx.strokeStyle = '#2f8a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx + sway, baseY - stemH);
    ctx.stroke();
    ctx.fillStyle = '#3fa55b';
    ctx.beginPath(); ctx.ellipse(cx - 6, baseY - stemH*0.6, 7, 3, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 6, baseY - stemH*0.4, 7, 3, 0.5, 0, Math.PI*2); ctx.fill();
    const pepperH = 10 + growth*10*scale;
    const pepperW = 5 + growth*4*scale;
    const fx = cx + sway;
    const fy = baseY - stemH + pepperH*0.1;
    ctx.fillStyle = '#e5383b';
    ctx.beginPath();
    ctx.moveTo(fx, fy - pepperH/2);
    ctx.bezierCurveTo(fx - pepperW, fy - pepperH/2, fx - pepperW, fy + pepperH/2, fx, fy + pepperH/2);
    ctx.bezierCurveTo(fx + pepperW, fy + pepperH/2, fx + pepperW, fy - pepperH/2, fx, fy - pepperH/2);
    ctx.fill();
    ctx.fillStyle = '#3fa55b';
    ctx.beginPath();
    ctx.arc(fx, fy - pepperH/2, 3, 0, Math.PI*2);
    ctx.fill();
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(fx, fy, pepperH, 5);
    }
  }

  function drawCacaoPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const trunkH = Math.max(14, growth*(pl.h-16)) * scale;
    ctx.fillStyle = '#7b4b2a';
    ctx.fillRect(cx - 3, baseY - trunkH, 6, trunkH);
    const canopyY = baseY - trunkH + 6;
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(cx, canopyY - 8, 16*scale, 10*scale, 0, 0, Math.PI*2);
    ctx.fill();
    const podCount = 3;
    ctx.fillStyle = '#c27c59';
    for (let i=0;i<podCount;i++){
      const angle = -Math.PI/4 + i*(Math.PI/4);
      const px = cx + Math.cos(angle)*8;
      const py = canopyY - 2 + Math.sin(angle)*6;
      const podL = 6 + growth*4*scale;
      ctx.beginPath();
      ctx.ellipse(px, py, podL*0.4, podL*0.9, angle, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#8e4d2c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(angle)*podL*0.4, py - Math.sin(angle)*podL*0.4);
      ctx.lineTo(px + Math.cos(angle)*podL*0.4, py + Math.sin(angle)*podL*0.4);
      ctx.stroke();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, canopyY - 4, 14*scale, 6);
    }
  }

  function drawBeanstalkPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const height = Math.max(16, growth*(pl.h-8)) * scale;
    const segments = 6;
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    for (let i=1;i<=segments;i++){
      const y = baseY - height * (i/segments);
      const offset = Math.sin(i/segments * Math.PI * 1.5 + Date.now()/600) * 8;
      ctx.lineTo(cx + offset, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#6fcf6f';
    for (let i=0;i<segments;i++){
      const y = baseY - height*(i/segments);
      const offset = Math.sin(i*0.6 + Date.now()/600) * 8;
      ctx.beginPath();
      ctx.ellipse(cx + offset, y - height/(segments*2), 9, 4, 0, 0, Math.PI*2);
      ctx.fill();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, baseY - height*0.5, height*0.4, 7);
    }
  }

  function drawEmberLilyPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(10, growth*(pl.h-18)) * scale;
    ctx.strokeStyle = '#2f8a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx, baseY - stemH);
    ctx.stroke();
    const bloomY = baseY - stemH - 2;
    const petalL = 8 + growth*10*scale;
    const flicker = 0.6 + 0.4*Math.abs(Math.sin(Date.now()/300));
    ctx.fillStyle = `rgba(255,99,71,${0.75 + 0.2*Math.sin(Date.now()/400)})`;
    for (let i=0;i<5;i++){
      const angle = -Math.PI/2 + i*(Math.PI*2/5);
      ctx.beginPath();
      ctx.moveTo(cx, bloomY);
      ctx.quadraticCurveTo(cx + Math.cos(angle)*petalL*0.3, bloomY + Math.sin(angle)*petalL*0.3, cx + Math.cos(angle)*petalL*flicker, bloomY + Math.sin(angle)*petalL*flicker);
      ctx.lineTo(cx, bloomY);
      ctx.fill();
    }
    ctx.fillStyle = '#ffde7d';
    ctx.beginPath();
    ctx.arc(cx, bloomY + 1, 3 + growth*2*scale, 0, Math.PI*2);
    ctx.fill();
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, bloomY, petalL, 7);
    }
  }

  function drawSugarApplePlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(12, growth*(pl.h-18)) * scale;
    ctx.fillStyle = '#8d5a2b';
    ctx.fillRect(cx - 2, baseY - stemH, 4, stemH);
    const leafY = baseY - stemH + 4;
    ctx.fillStyle = '#3fa55b';
    for (let i=0;i<4;i++){
      const angle = -Math.PI/4 + i*(Math.PI/6);
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(angle)*8, leafY + Math.sin(angle)*6, 7, 3, angle, 0, Math.PI*2);
      ctx.fill();
    }
    const fruitR = 6 + growth*8*scale;
    const fy = baseY - stemH + fruitR;
    ctx.fillStyle = '#74c69d';
    ctx.beginPath();
    ctx.ellipse(cx, fy, fruitR, fruitR*0.9, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#52b788';
    ctx.lineWidth = 1;
    for (let i=0;i<5;i++){
      const angle = i * (Math.PI*2/5);
      ctx.beginPath();
      ctx.moveTo(cx, fy);
      ctx.lineTo(cx + Math.cos(angle)*fruitR*0.9, fy + Math.sin(angle)*fruitR*0.9);
      ctx.stroke();
    }
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, fy, fruitR*1.1, 6);
    }
  }

  function drawBurningBudPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(8, growth*(pl.h-18)) * scale;
    ctx.strokeStyle = '#914616';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx, baseY - stemH);
    ctx.stroke();
    const flameH = 12 + growth*14*scale;
    const fx = cx;
    const fy = baseY - stemH;
    const flicker = 0.6 + 0.4*Math.sin(Date.now()/200);
    ctx.fillStyle = 'rgba(255,87,34,0.85)';
    ctx.beginPath();
    ctx.moveTo(fx, fy - flameH*flicker);
    ctx.quadraticCurveTo(fx - 8*scale, fy - flameH*0.2, fx, fy + flameH*0.1);
    ctx.quadraticCurveTo(fx + 8*scale, fy - flameH*0.2, fx, fy - flameH*flicker);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,195,0,0.9)';
    ctx.beginPath();
    ctx.moveTo(fx, fy - flameH*flicker*0.7);
    ctx.quadraticCurveTo(fx - 4*scale, fy - flameH*0.1, fx, fy + flameH*0.05);
    ctx.quadraticCurveTo(fx + 4*scale, fy - flameH*0.1, fx, fy - flameH*flicker*0.7);
    ctx.fill();
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(fx, fy - flameH*0.4, flameH*0.6, 6);
    }
  }

  function drawGiantPineconePlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const trunkH = Math.max(10, growth*(pl.h-16)) * scale;
    ctx.fillStyle = '#7b4b2a';
    ctx.fillRect(cx - 2, baseY - trunkH, 4, trunkH);
    const coneH = 16 + growth*16*scale;
    const coneW = 10 + growth*12*scale;
    const topY = baseY - trunkH - coneH*0.3;
    ctx.fillStyle = '#9c6644';
    const layers = 6;
    for (let i=0;i<layers;i++){
      const level = topY + i*(coneH/layers);
      const w = coneW * (1 - i/(layers+1));
      ctx.beginPath();
      ctx.ellipse(cx, level, w, coneH/9, 0, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.strokeStyle = '#5e3c2e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, topY - coneH*0.2);
    ctx.lineTo(cx, baseY - trunkH + coneH*0.8);
    ctx.stroke();
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, topY + coneH*0.3, coneW, 6);
    }
  }

  function drawElderStrawberryPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const stemH = Math.max(10, growth*(pl.h-20)) * scale;
    const sway = Math.sin(Date.now()/420 + cx) * 2.5;
    ctx.strokeStyle = '#2f8a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx + sway, baseY - stemH);
    ctx.stroke();
    ctx.fillStyle = '#4caf50';
    for (let i=0;i<4;i++){
      const angle = -0.8 + i*0.5;
      ctx.beginPath();
      ctx.ellipse(cx + sway + Math.cos(angle)*8, baseY - stemH*0.7 + Math.sin(angle)*4, 8, 3, angle, 0, Math.PI*2);
      ctx.fill();
    }
    const fruitH = 16 + growth*16*scale;
    const fruitW = 12 + growth*12*scale;
    const fx = cx + sway;
    const fy = baseY - stemH + fruitH*0.1;
    ctx.fillStyle = '#c1121f';
    ctx.beginPath();
    ctx.moveTo(fx, fy - fruitH/2);
    ctx.quadraticCurveTo(fx - fruitW, fy - fruitH/3, fx - fruitW*0.9, fy + fruitH/2);
    ctx.quadraticCurveTo(fx, fy + fruitH*0.7, fx + fruitW*0.9, fy + fruitH/2);
    ctx.quadraticCurveTo(fx + fruitW, fy - fruitH/3, fx, fy - fruitH/2);
    ctx.fill();
    ctx.fillStyle = '#ffe066';
    const seeds = 10;
    for (let i=0;i<seeds;i++){
      const angle = i*(Math.PI*2/seeds);
      const sx = fx + Math.cos(angle)*fruitW*0.6;
      const sy = fy + Math.sin(angle)*fruitH*0.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 1.3, 2.6, angle, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(fx, fy, fruitW*0.9, fruitH*0.8, 0, 0, Math.PI*2);
    ctx.fill();
    drawSparkles(fx, fy - fruitH*0.3, fruitW*0.9, 7);
  }

  function drawRomanescoPlant(pl, st, scale, crop) {
    const growth = Math.min(1, st);
    const cx = pl.x + pl.w/2;
    const baseY = pl.y + pl.h - 6;
    const baseW = 14 + growth*12*scale;
    ctx.fillStyle = '#3d9a4f';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - 4, baseW, baseW*0.4, 0, 0, Math.PI*2);
    ctx.fill();
    const levels = 5;
    for (let i=0;i<levels;i++){
      const radius = baseW * (1 - i*0.18);
      const y = baseY - 6 - i*radius*0.35;
      const points = Math.max(3, 5 - Math.floor(i/1.2));
      for (let j=0;j<points;j++){
        const angle = (j/points) * Math.PI*2 + i*0.2;
        const baseX = cx + Math.cos(angle) * radius * 0.4;
        const peakY = y - radius*0.45;
        ctx.fillStyle = `rgba(133,187,101,${0.7 + 0.05*i})`;
        ctx.beginPath();
        ctx.moveTo(baseX, y);
        ctx.lineTo(baseX + Math.cos(angle+0.3)*radius*0.2, peakY);
        ctx.lineTo(baseX + Math.cos(angle-0.3)*radius*0.2, peakY);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.fillStyle = '#c5f277';
    ctx.beginPath();
    ctx.moveTo(cx, baseY - 6 - baseW*0.6);
    ctx.lineTo(cx - baseW*0.1, baseY - 6 - baseW*0.4);
    ctx.lineTo(cx + baseW*0.1, baseY - 6 - baseW*0.4);
    ctx.closePath();
    ctx.fill();
    if (crop?.mutation?.id === 'glitter') {
      drawSparkles(cx, baseY - 6 - baseW*0.4, baseW*0.8, 6);
    }
  }

  function drawPlayer(p, color) {
    // Body
    const cx = p.x + p.w / 2;
    ctx.fillStyle = color;
    ctx.fillRect(p.x + 4, p.y + 8, p.w - 8, p.h - 8);

    // Head
    ctx.fillStyle = '#ffdfba';
    const r = p.w * 0.25;
    ctx.beginPath();
    ctx.arc(cx, p.y + r + 1, r, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(p.x + 2, p.y, p.w - 4, 3);
    ctx.beginPath();
    ctx.moveTo(cx - r, p.y);
    ctx.lineTo(cx + r, p.y);
    ctx.lineTo(cx, p.y - r * 1.5);
    ctx.closePath();
    ctx.fill();

    // Tool emoji for flair
    ctx.font = '12px serif';
    ctx.fillText('🌾', p.x + p.w - 6, p.y + p.h + 2);

    // Selected seed bubble
    const bubbleWidth = p.w + 8;
    const bubbleHeight = Math.round(p.h * 0.6);
    const bubbleX = p.x - 4;
    const bubbleY = p.y - bubbleHeight - 12;
    ctx.fillStyle = '#0007';
    ctx.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);

    const prevFont = ctx.font;
    const prevAlign = ctx.textAlign;
    const prevBaseline = ctx.textBaseline;
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.round(r * 2)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(seedEmoji(p.selected), bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2);
    ctx.font = prevFont;
    ctx.textAlign = prevAlign;
    ctx.textBaseline = prevBaseline;
  }

  function drawPet(p) {
    if (!p.pet) return;
    const pet = PETS.find(pt=>pt.id===p.pet.id);
    if (!pet) return;
    ctx.font='16px sans-serif';
    ctx.fillText(pet.emoji, p.pet.x, p.pet.y);
  }

  // ---------- MAIN LOOP ----------
  let firstTick = true;
  function tick() {
    if (firstTick) {
      console.log('Game loop started');
      firstTick = false;
    }
    movePlayer(state.p1, 'KeyW','KeyA','KeyS','KeyD');
    movePet(state.p1);
    if (state.p2Active) { movePlayer(state.p2, 'ArrowUp','ArrowLeft','ArrowDown','ArrowRight'); movePet(state.p2); }

    if (net && net.isOpen) {
      net.sendState({ x: state.p1.x, y: state.p1.y, selected: state.p1.selected });
    }

    if (justPressed('KeyE')) playerAction(state.p1, 'P1');
    if (state.p2Active && justPressed('Slash')) playerAction(state.p2, 'P2');

    for (let i = 1; i <= 10; i++) {
      if (justPressed('Digit' + (i % 10))) selectSeedByIndex(state.p1, i - 1);
      if (state.p2Active && justPressed('Numpad' + (i % 10))) selectSeedByIndex(state.p2, i - 1);
    }

    if (justPressed('KeyQ')) cycleSeed(state.p1);
    if (state.p2Active && justPressed('Period')) cycleSeed(state.p2);

    if (justPressed('KeyH')) eventsPanel.classList.toggle('open');

    if (state.shopOpen === 'P1' && !inside(state.p1.x,state.p1.y,state.p1.w,state.p1.h, VENDORS.shop.x,VENDORS.shop.y,VENDORS.shop.w,VENDORS.shop.h)) {
      state.shopOpen = null;
    }
    if (state.p2Active && state.shopOpen === 'P2' && !inside(state.p2.x,state.p2.y,state.p2.w,state.p2.h, VENDORS.shop.x,VENDORS.shop.y,VENDORS.shop.w,VENDORS.shop.h)) {
      state.shopOpen = null;
    }
    if (!inside(state.p1.x,state.p1.y,state.p1.w,state.p1.h, VENDORS.sell.x,VENDORS.sell.y,VENDORS.sell.w,VENDORS.sell.h) &&
        (!state.p2Active || !inside(state.p2.x,state.p2.y,state.p2.w,state.p2.h, VENDORS.sell.x,VENDORS.sell.y,VENDORS.sell.w,VENDORS.sell.h))) {
      state.sellOpen = false;
    }

    maybeStartWorldEvent();
    maybeSpawnChallenge();
    draw();
    requestAnimationFrame(tick);
  }

  // Init
  toggleBtn.onclick = () => eventsPanel.classList.toggle('open');

  if (!localStorage.getItem(SAVE_KEY)) {
    log('Welcome! Buy seeds at the Seed Shop (top-left).');
    log(`Plant on your OWN plots. If a plant rots, fix the plot for ${formatCurrency(REPAIR_COST)}.`);
    log('Growth persists from timestamps. Use Save/Load or Export/Import to back up progress.');
  } else {
    log('Save loaded from previous session.');
  }
  console.log('Initialization complete', {
    startingP1: state.p1,
    startingP2: state.p2,
    p2Active: state.p2Active,
  });
  tick();
})();
