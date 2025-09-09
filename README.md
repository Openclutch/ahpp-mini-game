# Garden Harvster

A simple 2‑player cooperative browser game. The game is contained in a single `index.html` file.

## GitHub Pages

The repository includes a GitHub Actions workflow that publishes the contents of the repository to GitHub Pages whenever changes are pushed to `main`. After enabling GitHub Pages in the repository settings, the game will be available at `https://<username>.github.io/GardenHarvster/`.

## Texture Atlas

The game loads graphics from a sprite atlas placed at `assets/atlas.png` (not included in this repository). The atlas is arranged in a 24 × 16 grid. Sprite names and their `[column, row]` positions are defined in `assets/sprites.json`. Add more entries to that file to map additional textures and use them in the game via `drawSprite(ctx, name, x, y, w, h)`.
