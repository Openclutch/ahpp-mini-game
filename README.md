# Garden Harvster

A simple 2‑player cooperative browser game. The game is contained in a single `index.html` file.

## GitHub Pages

The repository includes a GitHub Actions workflow that publishes the contents of the repository to GitHub Pages whenever changes are pushed to `main`. After enabling GitHub Pages in the repository settings, the game will be available at `https://<username>.github.io/GardenHarvster/`.

## Procedural Graphics

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
