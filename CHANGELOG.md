# Changelog

All notable changes to this project will be documented in this file.

For full developer instructions (how to add models, patterns, options), see **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)**.

---

## [v1.2.3.1] - 2026-03-15

### Added
- **HighNeck T-Shirt model** — New high-neck t-shirt GLB model with 4 body panels (front, back, left sleeve, right sleeve).
- **Design presets** — 4 design presets for HighNeckTshirt: Basic, Double Lines, Tribal Lines, Lines. Each preset applies transparent line-art overlays on specific body panels. Designs are selected via thumbnail cards in the Parts panel.
- **Design color picker** — When a non-Basic design is selected, a color picker (8 preset swatches + custom color input) appears in the Parts panel to change the overlay line color in real-time.
- **Seamless patterns** — 5 seamless body patterns for HighNeckTshirt: Brazilian, Coffee Break, Fiesta, Mexican Skull, Sugar Skulls. Applied with 4×4 RepeatWrapping for proper tiling.
- **Multi-logo/text support** — Users can now place multiple logos and text overlays on the model simultaneously:
  - "Place on Model" button saves the current logo/text to a persistent items list
  - Placed items shown as a clickable list with type badge, text preview, placement label
  - Click any placed item to edit it (live preview while editing)
  - Delete button (×) to remove individual items
  - Cancel button to discard edits and return to new-item mode
  - Items are saved/restored per model when switching products
  - Each item renders as an independent `<Decal>` via `DecalItem` sub-component

### Fixed
- **HighNeckTshirt blank page crash** — Handled multi-material arrays (`Array.isArray(child.material)`) in scene cloning. Replaced `useTexture` hook with imperative `THREE.TextureLoader` to prevent crash on failed loads.
- **HighNeckTshirt model too small** — GLB bounding box was only 0.5×0.7 units. Scale increased from 0.35 to 3.0 with position adjusted to center model.
- **HighNeckTshirt dark/black appearance** — GLB has no `pbrMetallicRoughness`, so Three.js defaulted metalness to 1.0 (fully metallic = black). Fixed by setting metalness=0, roughness=0.8 on cloned materials.
- **Design overlays invisible** — Overlay textures are white lines on transparent background; needed `color: 0x000000` on the MeshBasicMaterial to tint them visible. Added `depthWrite: false`, `polygonOffset`, and `renderOrder: 1` to prevent z-fighting.
- **Design overlays fading on body color change** — Body color effect was traversing all meshes including overlay children, overriding their material color. Added `userData.isDesignOverlay` check to skip overlays.
- **Design selection not reactive** — `design` prop was passed as a static number from App.js proxy without `useSnapshot`. Added `useSnapshot(state)` in App.js so design changes trigger re-renders.
- **Default body color too white** — Changed from #ffffff → #999999 (visible grey that doesn't blend with #ececed page background).
- **Text/logo too small on HighNeckTshirt** — Model scale of 3.0 made default decal size (0.12) tiny. Increased default size to 0.8, slider max from 0.6 to 4.0.
- **Logo/text not appearing on sleeves** — Raycast fallback for left/right placements was missing Y-coordinate (`worldHit.y = rayY`). Also increased sleeve `rayHeight` from 0.5 to 0.72 (shoulder level). Filtered out `isDesignOverlay` meshes from raycast to prevent interception.
- **Text/logo rendering behind design overlays** — Decals had no `renderOrder`, so design overlays (renderOrder=1) rendered on top. Fixed with `renderOrder=10` + `depthTest=false` on decals, and `depthWrite=true` + `renderOrder=0` on design overlays.
- **Text clipping on curved surfaces** — Decal projection depth was too thin (×0.15) for curved shirt mesh, causing severe text clipping. Increased to ×0.8 for proper surface coverage.
- **Text canvas too small** — Canvas 512→1024px, removed 96px font cap, auto-sizes font based on text length (70% of inner area for 1-2 chars). Padding increased 15%→20%.
- **Decal transparent area visible** — `alphaTest` increased from 0.01 to 0.5 so only actual text/logo pixels render, transparent padding discarded.
- **Bold/Curved toggles disappearing** — `resetEditor()` was resetting `activeTab` to "logo" after placing text, hiding text controls. Now preserves current tab.

### Technical
- `src/Components/HighNeckTshirt.js` — New model component using `scene.clone(true)` + `<primitive>` rendering. `forEachMaterial` helper for array material handling. Imperative TextureLoader for patterns and design overlays. Design overlay: clone geometry → flip UV Y (`×-1`) → MeshBasicMaterial with transparent + designColor.
- `src/config/models.js` — HighNeckTshirt config with placements, designs array (4 presets with per-part texture paths), `designColor` state field.
- `src/config/patterns.js` — HighNeckTshirt body patterns (5 seamless JPGs).
- `src/config/swatches.js` — HighNeckTshirt body color swatches (11 colors).
- `src/config/logoTextState.js` — Restructured for multi-overlay: `items[]` array, `editingId`, helper functions (`placeItem`, `editItem`, `removeItem`, `cancelEditing`, `resetEditor`). Per-model save/restore includes items via deep copy.
- `src/Components/LogoTextOverlay.jsx` — Refactored to render all items from array + live preview. Split into `DecalItem` sub-component with independent texture loading per item. Decals use `renderOrder: 2` + `depthTest: false` to render above design overlays. Raycast filters out `isDesignOverlay` meshes. Fallback left/right Y-coordinate fix.
- `src/Components/LogoTextPanel.jsx` — Placed items list UI, Place/Save/Cancel/Delete buttons, editing badge indicator. Size slider range 0.02–4.0, default 0.8.
- `src/Components/PartsPicker.jsx` — Design selection grid + design color picker with swatches.
- `src/App.js` — `useSnapshot(state)` for reactive design/designColor props.

---

## [v1.2.3] - 2026-03-14

### Added
- **Logo / Text Placement** — New floating panel (toggle via "Logo / Text" button above toolbar) that lets users overlay a logo or custom text on the 3D model.
- **Logo Upload** — Drag & drop or click-to-upload any image (PNG/JPG/SVG). Preview shown in panel. Remove button to clear.
- **Text Editor** — Type any text with the following options:
  - **Font selection** — 9 fonts: Arial, Georgia, Impact, Courier New, Bebas Neue, Oswald, Pacifico, Playfair Display, Anton (Google Fonts loaded via CDN)
  - **Text color** — Color picker
  - **Bold toggle**
  - **Curved text** — Toggle to arch text along a curve; "Arch Up / Down" toggle to flip direction
- **Placement presets** — Front / Back / Left / Right buttons per model (positions defined per model in `models.js` under `decalPositions`)
- **Size slider** — Scale the logo/text overlay (0.02–0.6 world units — wider range for small detail logos or large full-chest prints)
- **Rotation slider** — Spin the logo/text -180° to +180° around the surface normal; displays live degree value
- **2D drag pad** — Replaced X/Y sliders with a click-and-drag position pad; drag anywhere inside the square to move the logo/text on the model surface
- **Reset Position, Size & Rotation** — Resets offset, size, and rotation to defaults
- **Per-model decal positions** — `decalPositions` field added to all models in `models.js`; fallback defaults used if not defined

### Fixed
- **Back-bleed eliminated** — Decal stamp depth reduced from `localScale × 6` to `localScale × 0.15` so the projection box no longer punches through the garment to create phantom decals on the interior/back surface
- **Text clipping ("ELLO" instead of "HELLO")** — 15% canvas padding per side keeps all text/arc geometry away from canvas edges; DecalGeometry stamp Z depth (`× 0.15`) still captures curved surface folds without over-projecting

### Technical
- `src/config/logoTextState.js` — Added `rotation: 0` field (degrees)
- `src/utils/createTextTexture.js` — Canvas-based text renderer (straight + curved arc) with 15% padding per side
- `src/Components/LogoTextPanel.jsx` — UI panel (bottom-left); rotation slider added; size range widened to 0.02–0.6
- `src/Components/LogoTextOverlay.jsx` — 3D overlay using `createPortal` + drei `<Decal>`; placed inside Float group; bounding box computed ONCE in mesh local space (worldToLocal strips Float offset → stable forever); rotation applied as quaternion around local surface normal on top of base orientation; thin stamp depth (× 0.15) eliminates back-bleed; uses `MeshStandardMaterial` (roughness 0.85) for realistic blending
- Google Fonts loaded in `public/index.html`

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
- **PoloShirt pattern whitening** — When a design pattern is applied to the body, `material-color` is now set to `#ffffff` (neutral white) instead of the user's chosen color. This prevents the body color from multiplying with and washing out the pattern texture. When no pattern is active, color works normally.
- **PoloShirt GLB updated** — Removed base body texture map from the GLB material in Blender so plain color renders cleanly without any base texture interference.

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
| `v1.2.3` | Logo/text overlay, rotation, position pad, per-model state, product-specific placements |
| `v1.2.3.1` | HighNeck TShirt model, design presets, design color, multi-logo/text support |
