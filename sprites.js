const ATLAS_COLS = 24;
const ATLAS_ROWS = 16;
const atlas = new Image();
atlas.src = 'textures.png';

let cellW = 0;
let cellH = 0;
atlas.onload = () => {
  cellW = atlas.width / ATLAS_COLS;
  cellH = atlas.height / ATLAS_ROWS;
};

// Sprite definitions are loaded from an external JSON file so more
// textures can be mapped without editing code.
const SPRITES = {};

function loadSpriteMap(url = 'assets/sprites.json') {
  fetch(url)
    .then(r => r.json())
    .then(map => Object.assign(SPRITES, map))
    .catch(err => console.warn('Failed to load sprite map', err));
}
loadSpriteMap();

function drawSprite(ctx, name, x, y, w, h) {
  const def = SPRITES[name];
  if (!def || !cellW || !cellH) return false; // unknown sprite or atlas not loaded
  const [col, row] = def;
  ctx.drawImage(
    atlas,
    col * cellW, row * cellH,
    cellW, cellH,
    x, y,
    w ?? cellW, h ?? cellH
  );
  return true;
}
