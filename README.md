# Neon Drift Garage

Neon Drift Garage is a fast arcade-inspired single-player browser game. Build a retro street racing garage, install neon-soaked mods, and bank cash to expand your operation. Everything runs in the browser with no external assets — all visuals are drawn procedurally on a `<canvas>` element.

## How to Play

* **Movement:** Use `WASD` to roll around the garage.
* **Actions:** Press `E` to work the current bay, `Q` to swap to the next mod kit, number keys select specific kits.
* **Objective:** Buy kits at the Parts Vendor, install them in your own bays, then cash out finished builds at the Race Terminal. Keep bays clear — overheated builds must be purged for $250.
* **Events & Crew:** Watch the Street Feed (`H`) for time-limited boosts. Charge the plaza spotlight to recruit unique crew members with powerful perks.

Touch-friendly controls are included for mobile play.

## Deployment

The project is a static site. Serve the repository locally or enable GitHub Pages on the repository to host it at `https://<username>.github.io/<repo-name>/`.

All visuals are drawn procedurally on the canvas using simple shapes, so no external texture files are required.

## Embedding the Game on AzuraCast

You can surface the game on an [AzuraCast](https://www.azuracast.com/) station page by using the platform's **Custom
JS** feature:

1. In AzuraCast, navigate to **Station Profile → Public Pages → Custom JS**.
2. Paste the contents of [`azuracast-embed.js`](./azuracast-embed.js) into the editor and click **Save Changes**.
3. Reload the public page. A new "Play Garden Harvster" card (with an embedded iframe and launch button) will appear in
   the main content area, linking to the live game at `https://openclutch.github.io/GardenHarvster/`.

The snippet dynamically injects a styled card and iframe, so it works alongside existing AzuraCast layouts without the
need to edit templates.