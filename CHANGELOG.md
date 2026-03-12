# Changelog

All notable changes to this project will be documented in this file.

---

## [v1.2.2] - 2026-03-12

### Added
- **Screenshot Button** — Captures the 3D canvas and downloads it as a PNG image named after the current model (e.g. `Shoe-screenshot.png`).
- **Auto-Rotate 360** — Toggle button to start/stop continuous 360-degree rotation of the model. Click to start, click again to stop.
- **Reset View** — Resets camera to default position and stops rotation.
- **Zoom In/Out Buttons** — Quick zoom controls without using scroll wheel.
- **Fullscreen Toggle** — Enter/exit fullscreen mode for immersive viewing.
- **Toolbar UI** — All action buttons grouped in a glassmorphism toolbar at the bottom center of the screen.

### Refactored
- **Config-driven architecture** — All model data (components, colors, camera angles) now lives in `src/config/models.js`. No more repetitive switch statements.
- **Color swatches config** — Predefined colors moved to `src/config/swatches.js`.
- **App.js reduced from ~380 lines to ~120 lines** — Clean, maintainable, easy to modify.
- To add a new model: just add entry in `config/models.js` and `config/swatches.js` — everything else adapts automatically.

---

## [v1.2.1] - 2026-03-12

### Added
- **Predefined color swatches** — Each product part now has its own set of 8 curated colors (e.g. Shoe laces get red, blue, black, white etc.).
- Color swatches show as circular buttons with hover/active effects.
- Selected color is highlighted with a border.

### Changed
- **Camera rotation only from panel** — Clicking on the 3D model no longer triggers camera rotation, only the Parts Panel does.
- Color picker UI redesigned with glassmorphism style (blur background, rounded corners, shadow).

### Configuration
- `ENABLE_FREE_COLOR_PICKER` flag in `ColorPicker.jsx` — set to `true` to show the HexColorPicker alongside swatches, `false` (default) for swatches only.
- `productColors` object in `ColorPicker.jsx` — customize predefined colors per product per part.

---

## [v1.2] - 2026-03-12

### Added
- **Camera rotation on part click** — When a part is selected (from Parts Panel or clicking on the 3D model), the camera smoothly rotates to show that part in front view.
- **Product name in Parts Panel heading** — Panel heading now shows which product's parts are listed (e.g. "Shoe Parts", "Rocket Parts").

### Fixed
- Used `useSnapshot` for reactive state tracking so camera rotation triggers correctly on part selection.

---

## [v1.1] - 2026-03-12

### Added
- **Parts Picker Panel** — A panel on the right side showing all parts of the selected model (e.g. laces, mesh, sole for Shoe).
- Each part displays a color dot showing its current color.
- Clicking a part selects it and opens the color picker.
- Active/selected part is highlighted.
- Panel updates automatically when switching between models.

### Fixed
- Fixed React import (`import { React }` → `import React`) in all component files (App.js, Shoe.js, Rocket.js, Axe.js, Insect.js, Teapot.js).
- Fixed `useEffect` missing dependency (`snap`) warnings in all model components.
- Fixed Vercel build failure by setting `CI=false` in build command to prevent eslint warnings from being treated as errors.
- Added `setupProxy.js` to fix `.bin` file MIME type issue on local dev server.

---

## [v1.0] - 2026-03-12

### Initial Release
- 3D Product Configurator built with React Three Fiber.
- 5 models available: Shoe, Rocket, Axe, Insect, Teapot.
- Model picker on the right side to switch between models.
- Color picker to customize individual parts of each model.
- Hover effect with custom SVG cursor showing part name and color.
- Click on 3D model parts to select and change their color.
- Floating animation with shadow support.
- Orbit controls for rotating/zooming the 3D view.

---

## Branches

| Branch | Description |
|--------|-------------|
| `master` | Latest stable code (deployed on Vercel) |
| `v1.0` | Initial release — original starting code |
| `v1.1` / `release/v1.1` | Parts picker panel + bug fixes |
| `v1.2` | Camera rotation + product name in panel |
| `v1.2.1` | Predefined color swatches + toggleable free color picker |
| `v1.2.2` | Toolbar: screenshot, auto-rotate, reset, zoom, fullscreen |
