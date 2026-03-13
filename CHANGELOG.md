# Changelog

All notable changes to this project will be documented in this file.

---

## [v1.2.2.2] - 2026-03-14

### Added
- **PoloShirt model (GLB)** — New polo shirt 3D model with 3 customizable parts: body, buttons, sleeves.
- **Texture pattern swapping** — Body part supports swappable design patterns (PNG images). Patterns shown as thumbnails in the color picker when body is selected. First option restores plain color, remaining options apply the pattern texture.
- **Color swatches auto-hide** — When a pattern/design is active on a part, color swatches are automatically hidden (color + texture together doesn't make sense for design-mapped parts).
- **Thumbnail support for patterns** — Each pattern entry in `patterns.js` now has `{ src, thumb }` format. `src` is the full UV texture applied on the model. `thumb` is an optional small preview image shown in the panel. If `thumb` is not provided, `src` is used as fallback.
- **Pattern config** — `src/config/patterns.js` — full step-by-step guide written as comments inside the file.
- **Per-model initial camera position** — `cameraPosition` field in model config. When switching to a model, camera resets to its defined position for best initial view.
- **Toggleable back strap for Sneaker** — Options section in the Parts Panel with a toggle switch to show/hide the back strap (and its stitches) on the Sneaker model.

### Fixed
- **Sneaker material independence** — Cloned all GLB materials so Strap and Top (which shared `materials.Top`) can now be colored independently.
- **Sneaker material names** — Lowercased material names on cloned materials so clicking parts on the 3D model correctly maps to state keys.
- **Per-model zoom** — `minDistance` is now per-model in config (default 1.5). Sneaker uses 0.5, all others keep 1.5.
- **PoloShirt multi-primitive mesh crash** — Three.js does not create separate named nodes for GLTF multi-primitive meshes. Fixed by using direct node names from GLB.
- **PoloShirt position and scale** — Adjusted outer group scale and position so shirt appears correctly in scene with shadow aligned.
- **Pattern UV flip** — Set `flipY = false` on loaded pattern textures to match GLTF UV convention so designs align correctly (front/back/sleeves in correct position).

### How to add patterns for a new model
> Full guide is in `src/config/patterns.js` as comments. Summary:
>
> 1. Create folder: `public/[ModelName]/patterns/`
> 2. Add UV texture image: `design1.png` (full UV layout exported from Blender)
> 3. Add thumbnail image (optional): `thumb1.png` — small preview shown in the panel
>    - Recommended: a rendered mockup or cropped front view of the shirt with that design
>    - If not provided, the UV texture itself is used as thumbnail (fallback)
>    - Thumbnail path goes in `patterns.js` as `thumb` field next to `src`
> 4. Register in `src/config/patterns.js`:
>    ```js
>    ModelName: {
>      partName: [
>        { src: "/ModelName/patterns/design1.png", thumb: "/ModelName/patterns/thumb1.png" },
>      ]
>    }
>    ```
> 5. In the model component, add `useTexture` + `useEffect` (follow `PoloShirt.js` as reference)
> 6. Done — ColorPicker UI shows thumbnails automatically when that part is selected

---

## [v1.2.2.1] - 2026-03-12

### Added
- **Sneaker model (GLB)** — New leather sneaker 3D model with 9 customizable parts: laces, front, middle, top, flaps, sole, strap, inside, stitches.
- Full color swatches, camera angles, and model picker entry configured.
- Demonstrates how easy it is to add new models with the config-driven architecture.

### Fixed
- **Sneaker textures** — Use original GLB materials with `material-color` override instead of flat `meshStandardMaterial`, preserving leather textures and normal maps.
- **Zoom on Sneaker** — Reduced `minDistance` from 1.5 to 0.5 so zoom works properly with the larger Sneaker model.

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
| `v1.2.2.1` | Sneaker GLB model added with full config |
| `v1.2.2.2` | PoloShirt model, texture patterns, back strap toggle, per-model camera/zoom |
