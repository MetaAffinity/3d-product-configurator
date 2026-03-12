# Changelog

All notable changes to this project will be documented in this file.

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
