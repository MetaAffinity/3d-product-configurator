# Developer Guide — 3D Product Configurator

Complete reference for adding new models, patterns, options, and customizing the configurator.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [How to Add a New 3D Model](#how-to-add-a-new-3d-model)
3. [How to Add Texture Patterns to a Model Part](#how-to-add-texture-patterns-to-a-model-part)
4. [How to Add Design Presets (Line Overlays)](#how-to-add-design-presets-line-overlays)
5. [How to Add Toggle Options (Show/Hide Parts)](#how-to-add-toggle-options-showhide-parts)
6. [Per-Model Camera Settings](#per-model-camera-settings)
7. [Logo / Text Overlay (Multi-Overlay)](#logo--text-overlay)
8. [File Reference](#file-reference)

---

## Project Structure

```
src/
  App.js                        — Canvas, OrbitControls, model switching
  Components/
    Shoe.js                     — Shoe model component
    Sneaker.js                  — Sneaker model component (has toggle options)
    PoloShirt.js                — PoloShirt model component (has texture patterns)
    HighNeckTshirt.js           — HighNeck T-Shirt component (designs + patterns)
    LogoTextPanel.jsx           — Logo/text editor panel (multi-overlay)
    LogoTextOverlay.jsx         — 3D decal renderer (multiple items)
    ModelPicker.jsx             — Top bar model selector thumbnails
    ColorPicker.jsx             — Right panel: color swatches + pattern thumbnails
    PartsPicker.jsx             — Left panel: clickable parts + option toggles
  config/
    models.js                   — MAIN CONFIG: all model settings, colors, designs, options
    patterns.js                 — Texture patterns per model per part
    swatches.js                 — Predefined color swatches per model per part
    logoTextState.js            — Multi-overlay logo/text state (items array, per-model)
  img/                          — Thumbnail images for model picker

public/
  [modelname]/
    [modelname].glb             — GLB model file (non-Draco compressed)
    patterns/
      design1.png               — UV texture (full size, transparent background)
      design1thumb.jpg          — Thumbnail shown in panel (optional, small file)
```

---

## How to Add a New 3D Model

Follow these steps in order. Use **PoloShirt** as the reference example.

---

### Step 1 — Prepare the GLB file

- Export model as **GLB** (not GLTF+BIN, not Draco compressed)
- Draco compression is NOT supported — `useGLTF.setDecoderPath` does not exist in the drei version used (v9.34.3) and will crash the app
- Place the file in: `public/[ModelName]/[modelname].glb`
  - Example: `public/jacket/jacket01.glb`

To inspect node and material names in the GLB, run:
```bash
npx gltfjsx public/[ModelName]/[modelname].glb
```
This prints the exact node names and material names — you will need these in your component.

---

### Step 2 — Create the model component

Create `src/Components/[ModelName].js`.

**Minimal template (no patterns, no options):**

```jsx
import React, { useState, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useSnapshot } from "valtio";

export default function MyModel({ colors, options, textures, updateCurrent }) {
  const { nodes, materials } = useGLTF("/mymodel/mymodel.glb");
  const snap = useSnapshot(colors);
  const [hovered, setHovered] = useState(null);

  // Clone materials so each part colors independently
  // (required when two parts share the same GLB material)
  const mats = useMemo(() => {
    const clone = (mat, name) => { const c = mat.clone(); c.name = name; return c; };
    return {
      body:    clone(materials["Body Material Name"],    "body"),
      buttons: clone(materials["Button Material Name"],  "buttons"),
    };
  }, [materials]);

  return (
    <group
      dispose={null}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(e.object.material.name); }}
      onPointerOut={(e)  => { if (e.intersections.length === 0) setHovered(null); }}
      onPointerDown={(e) => { e.stopPropagation(); updateCurrent(e.object.material.name); }}
      onPointerMissed={() => updateCurrent(null)}
    >
      {/* Use exact node names from gltfjsx output */}
      <mesh castShadow geometry={nodes.body_node.geometry} material={mats.body}    material-color={snap.body} />
      <mesh castShadow geometry={nodes.btn_node.geometry}  material={mats.buttons} material-color={snap.buttons} />
    </group>
  );
}

useGLTF.preload("/mymodel/mymodel.glb");
```

**Important notes:**
- Material names in GLB may have spaces (e.g. `"Main Design"`) — use bracket notation: `materials["Main Design"]`
- Clone all materials with `useMemo` — if two mesh parts share the same GLB material and you don't clone, changing one changes both
- Set lowercase `name` on each cloned material — this is how click events map to state keys
- `material-color` prop multiplies with the texture in PBR — keep it `"#ffffff"` (white) when a texture/pattern is active (see PoloShirt.js for reference)
- For models with a non-standard scale/position, add to the outer group:
  ```jsx
  <group scale={[0.35, 0.35, 0.35]} position={[0, -1.0, 0]}>
  ```
- If the GLB has an inner group with its own transform (from Blender), keep it as-is:
  ```jsx
  <group position={[0.084, -4.801, -0.214]} scale={0.006}>
  ```

**Reference:** `src/Components/PoloShirt.js` (patterns), `src/Components/Sneaker.js` (toggle options)

---

### Step 3 — Register in models.js

File: `src/config/models.js`

Import your component at the top:
```js
import MyModel from "../Components/MyModel";
```

Add an entry to `modelConfig`:
```js
MyModel: {
  component: MyModel,

  // Default colors per part — keys must match cloned material names in your component
  colors: {
    body:    "#ffffff",
    buttons: "#cccccc",
  },

  // Camera angle per part when clicked in the parts panel [azimuthal, polar] in radians
  cameraAngles: {
    body:    [0, 1.2],
    buttons: [0, 1.0],
  },

  // Optional: set initial camera position when switching to this model
  // cameraPosition: [0, 0.2, 2],

  // Optional: minimum zoom distance (default 1.5, use smaller for small models)
  // minDistance: 0.5,

  // Optional: toggle options — see Step 5
  // options: { strap: { label: "Back Strap", default: true } },
},
```

**Rules:**
- Key name (e.g. `MyModel`) must be **unique** and **exactly match** what you use elsewhere (case-sensitive)
- Color keys must match the `name` set on cloned materials in your component
- `cameraAngles` is optional per part — parts without an angle won't animate camera

---

### Step 4 — Add color swatches

File: `src/config/swatches.js`

Add an entry inside the `productColors` object:
```js
MyModel: {
  body:    ["#ffffff", "#000000", "#c0392b", "#2980b9", "#27ae60", "#f39c12"],
  buttons: ["#cccccc", "#ffffff", "#000000", "#d4a373"],
},
```

- Part names must match the color keys in `models.js`
- If a model has no entry here, a default color palette is used automatically

---

### Step 5 — Add model picker thumbnail

File: `src/Components/ModelPicker.jsx`

1. Add a thumbnail image to `src/img/mymodel.png`
2. Import it:
   ```jsx
   import mymodel from "../img/mymodel.png";
   ```
3. Add to the JSX:
   ```jsx
   <div onClick={() => updateSelectedModel("MyModel")}>
     <img src={mymodel} alt="mymodel" />
     <h4>My Model</h4>
   </div>
   ```

The key passed to `updateSelectedModel` must exactly match the key in `models.js`.

---

### Step 6 — Update CHANGELOG.md

Always update `CHANGELOG.md` with what was added. See existing entries for format.

---

## How to Add Texture Patterns to a Model Part

Patterns are UV textures that replace the solid color on a specific part.

**Reference implementation:** `src/Components/PoloShirt.js`

---

### Step 1 — Prepare pattern images

- Format: **PNG** with **transparent background** (white background shows as white on model)
- Size: 1024×1024 or 2048×2048, square format recommended
- The image is used as a UV texture — its layout must match the model's UV map
- Create a small thumbnail (JPG, ~200×200px) separately for the panel — optional but recommended
- Place files in: `public/[modelname]/patterns/`

---

### Step 2 — Register patterns in patterns.js

File: `src/config/patterns.js`

```js
export const modelPatterns = {
  MyModel: {
    body: [
      { src: "/mymodel/patterns/design1.png", thumb: "/mymodel/patterns/design1thumb.jpg" },
      { src: "/mymodel/patterns/design2.png" }, // thumb is optional — falls back to src
    ],
  },
};
```

- Model name must exactly match `models.js` key
- Part name must exactly match the color key for that part
- `src` — full resolution UV texture applied on the 3D model
- `thumb` — small preview shown in the color picker panel (optional, falls back to `src`)

The UI (ColorPicker) picks up patterns automatically — no changes needed in ColorPicker.

---

### Step 3 — Add pattern support to the component

In your component file, add pattern loading and application. Follow this pattern from `PoloShirt.js`:

```jsx
import React, { useState, useEffect, useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useSnapshot } from "valtio";
import { sRGBEncoding } from "three";
import { modelPatterns } from "../config/patterns";

// Extract pattern paths at module level (outside component)
const bodyPatternConfig = modelPatterns.MyModel?.body || [];
const bodyPatterns = bodyPatternConfig.map((p) => p.src);

export default function MyModel({ colors, options, textures, updateCurrent }) {
  const { nodes, materials } = useGLTF("/mymodel/mymodel.glb");
  const snap = useSnapshot(colors);
  const texturesSnap = useSnapshot(textures);   // <-- watch texture state

  const mats = useMemo(() => {
    const clone = (mat, name) => { const c = mat.clone(); c.name = name; return c; };
    return { body: clone(materials["Body Mat"], "body") };
  }, [materials]);

  // Remember original texture map to restore when pattern is removed
  const originalBodyMap = useMemo(() => mats.body.map, [mats]);

  // Preload all pattern textures
  // Fallback to first pattern if array is empty (useTexture requires at least one path)
  const patternTextures = useTexture(bodyPatterns.length > 0 ? bodyPatterns : [bodyPatterns[0] || "/placeholder.png"]);
  const patternArray = Array.isArray(patternTextures) ? patternTextures : [patternTextures];

  // Fix texture settings — must match GLTF UV convention
  useMemo(() => {
    patternArray.forEach((tex) => {
      tex.flipY = false;           // GLTF uses flipY=false — required for correct UV alignment
      tex.encoding = sRGBEncoding; // Required for correct color display — prevents washed-out look
      tex.needsUpdate = true;
    });
  }, [patternArray]);

  // Apply or remove pattern texture on body material
  useEffect(() => {
    const selected = texturesSnap.body;
    if (selected) {
      const idx = bodyPatterns.indexOf(selected);
      if (idx !== -1 && patternArray[idx]) {
        mats.body.map = patternArray[idx];
        mats.body.color.set("#ffffff"); // Neutral color — prevents tinting the texture
        mats.body.map.needsUpdate = true;
        mats.body.needsUpdate = true;
      }
    } else {
      mats.body.map = originalBodyMap;
      mats.body.needsUpdate = true;
    }
  }, [texturesSnap.body, mats.body, patternArray, originalBodyMap]);

  return (
    <group dispose={null} /* ...pointer handlers */ >
      {/* When pattern active → material-color="#ffffff" (neutral, no tinting) */}
      {/* When no pattern   → material-color={snap.body} (user's chosen color) */}
      <mesh
        castShadow
        geometry={nodes.body_node.geometry}
        material={mats.body}
        material-color={texturesSnap.body ? "#ffffff" : snap.body}
      />
    </group>
  );
}
```

**Why `sRGBEncoding`:** `useTexture` loads textures as `LinearEncoding` by default. Color/design images are in sRGB color space. Without this, textures look washed out and faded.

**Why `flipY = false`:** GLTF/GLB models use `flipY = false` for UVs. Loaded textures default to `flipY = true`. Mismatch causes the design to appear flipped or misaligned.

**Why `material-color="#ffffff"` when pattern active:** In THREE.js PBR, `material.color` multiplies with the texture. Any non-white color tints the texture. Setting to white ensures the design shows its true colors.

---

## How to Add Design Presets (Line Overlays)

Design presets are transparent PNG overlays (e.g. line art, stripes) that layer on top of the model's body color. Users can switch between designs and pick the overlay color.

**Reference implementation:** `src/Components/HighNeckTshirt.js`

---

### Step 1 — Prepare design textures

- Format: **2048×2048 PNG** with **transparent background**
- The design (e.g. lines) should be **white** on transparent — the material color tints them at runtime
- Each file covers a single UV atlas region (front, back, sleeve) on a full 2048×2048 canvas
- Place files in: `public/[modelname]/textures/[design-name]/front_1.png`, `back_1.png`, etc.
- Add thumbnail images (256×256 PNG) in: `public/[modelname]/thumbs/[design-name].png`

---

### Step 2 — Add designs to models.js

```js
MyModel: {
  // ...
  designs: [
    { label: "Basic", thumb: "/mymodel/thumbs/basic.png", textures: {} },
    {
      label: "Double Lines",
      thumb: "/mymodel/thumbs/double-lines.png",
      textures: {
        front: ["/mymodel/textures/double-lines/front_1.png"],
        back:  ["/mymodel/textures/double-lines/back_1.png"],
      },
    },
  ],
}
```

- First design should be "Basic" with empty `textures: {}` (no overlay)
- Multiple textures per part are supported (layered on top of each other)
- Parts without entries get no overlay

The state auto-generates `design: 0` and `designColor: "#000000"` for models with `designs`.

---

### Step 3 — Add overlay rendering to the component

In your component, handle the design overlay in a `useEffect`:

```jsx
// PART_TO_MESH maps design part names to GLB mesh names
const PART_TO_MESH = { front: "Mesh_Front", back: "Mesh_Back" };

// In the component:
const overlayRef = useRef([]);

useEffect(() => {
  if (!designs) return;
  const designCfg = designs[design ?? 0];

  // Remove old overlays
  overlayRef.current.forEach((o) => {
    if (o.parent) o.parent.remove(o);
    o.material?.dispose(); o.geometry?.dispose();
  });
  overlayRef.current = [];

  if (!designCfg?.textures || Object.keys(designCfg.textures).length === 0) return;

  const loader = new THREE.TextureLoader();
  Object.entries(designCfg.textures).forEach(([part, paths]) => {
    const meshName = PART_TO_MESH[part];
    clonedScene.traverse((child) => {
      if (child.isMesh && child.name === meshName) {
        paths.forEach((texPath) => {
          const geom = child.geometry.clone();
          // Flip UV Y if needed for your model's UV layout
          loader.load(texPath, (tex) => {
            const mat = new THREE.MeshBasicMaterial({
              map: tex, transparent: true, color: 0x000000,
              depthWrite: true, polygonOffset: true, polygonOffsetFactor: -1,
            });
            const overlay = new THREE.Mesh(geom, mat);
            overlay.userData.isDesignOverlay = true;
            overlay.renderOrder = 0;
            child.add(overlay);
            overlayRef.current.push(overlay);
          });
        });
      }
    });
  });
}, [design, designs, clonedScene]);

// Update overlay color reactively
useEffect(() => {
  if (!designColor) return;
  overlayRef.current.forEach((o) => {
    o.material.color.set(designColor);
    o.material.needsUpdate = true;
  });
}, [designColor]);
```

**Important:** Skip overlay meshes in body color effects with `child.userData.isDesignOverlay` check.

---

### Step 4 — Design UI is automatic

The PartsPicker automatically shows design thumbnails and color picker when `designs` is configured. No UI changes needed.

---

## How to Add Toggle Options (Show/Hide Parts)

Used to show or hide a mesh part (e.g. Back Strap on Sneaker).

**Reference implementation:** `src/Components/Sneaker.js`, option key: `strap`

---

### Step 1 — Add to models.js

```js
MyModel: {
  // ...
  options: {
    flap: { label: "Front Flap", default: true },
    //      ↑ shown in UI           ↑ true = visible by default
  },
},
```

The state proxy auto-generates `options.flap = true` from this config.

---

### Step 2 — Use in component

```jsx
import { useSnapshot } from "valtio";

export default function MyModel({ colors, options, textures, updateCurrent }) {
  const optionsSnap = useSnapshot(options);

  return (
    <group>
      <mesh geometry={nodes.body.geometry} material={mats.body} material-color={snap.body} />

      {/* Conditionally render based on toggle */}
      {optionsSnap.flap && (
        <mesh geometry={nodes.flap.geometry} material={mats.flap} material-color={snap.flap} />
      )}
    </group>
  );
}
```

The toggle UI in PartsPicker is automatically generated from the `options` config — no changes needed there.

---

## Per-Model Camera Settings

Both fields are optional in `models.js`:

```js
MyModel: {
  // Initial camera position when switching to this model
  // Format: [x, y, z]
  cameraPosition: [0, 0.2, 2],

  // Minimum zoom distance (how close the user can zoom in)
  // Default: 1.5 — use smaller value for small models
  minDistance: 0.5,
}
```

Camera angles per part (for auto-rotation when clicking a part in the panel):
```js
cameraAngles: {
  partName: [azimuthalAngle, polarAngle], // radians
  // azimuthal: left/right rotation (0 = front)
  // polar: up/down tilt (0 = top, Math.PI/2 ≈ 1.57 = side, Math.PI = bottom)
}
```

---

## Logo / Text Overlay (Multi-Overlay)

The Logo/Text feature uses `<Decal>` from drei to project logo/text onto the 3D model surface. Users can place **multiple** overlays simultaneously.

### How it works

1. On model load, `LogoTextOverlay.jsx` raycasts from each placement direction to find the surface mesh and hit point
2. Each overlay is rendered as an independent `<Decal>` via `DecalItem` sub-component, portaled into the hit mesh
3. Decals use `renderOrder=10` + `depthTest=false` to render above design overlays
4. Text is rendered to a 1024×1024 canvas via `createTextTexture.js`, then used as a `CanvasTexture`

### Per-model placements

Placements are defined in `models.js` under the `placements` field (same field used for raycast targeting):

```js
MyModel: {
  placements: {
    chest:       { label: "Chest",        dir: "front", rayHeight: 0.35 },
    back:        { label: "Back",         dir: "back",  rayHeight: 0.35 },
    leftSleeve:  { label: "Left Sleeve",  dir: "left",  rayHeight: 0.72 },
    rightSleeve: { label: "Right Sleeve", dir: "right", rayHeight: 0.72 },
  },
}
```

- `dir` — raycast direction: front, back, left, right, top, bottom
- `rayHeight` — vertical position as fraction of model height (0 = bottom, 1 = top). For sleeves, use ~0.7 (shoulder level)
- The UI auto-generates placement buttons from this config

### Adding new fonts

Fonts are defined in `src/Components/LogoTextPanel.jsx` in the `FONTS` array:
```js
const FONTS = [
  { label: "My Font", value: "My Font" },
  // ...
];
```

The font must be loaded in the browser before canvas can use it. Add Google Font links to `public/index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=My+Font&display=swap" rel="stylesheet" />
```

### Multi-overlay state

The `logoTextState.js` manages an `items[]` array for placed overlays:

- **Place on Model** — saves current editor content as a new item in the array
- **Edit** — click a placed item to load it back into the editor for live editing
- **Delete** — remove individual items
- **Per-model save/restore** — items are saved/restored when switching models via deep copy

### Key files

| File | Purpose |
|------|---------|
| `src/config/logoTextState.js` | Valtio proxy — items array, editor fields, per-model save/restore |
| `src/utils/createTextTexture.js` | Canvas text renderer (1024px, auto-sized font, straight + curved) |
| `src/Components/LogoTextPanel.jsx` | UI panel (tabs, placement, size 0.02–4.0, rotation, pad, items list) |
| `src/Components/LogoTextOverlay.jsx` | 3D decal renderer — DecalItem sub-component, raycast setup, renderOrder=10 |
| `public/index.html` | Google Fonts `<link>` tags |

---

## File Reference

| File | Purpose | Edit when |
|------|---------|-----------|
| `src/config/models.js` | All model config: colors, options, camera | Adding a model, changing defaults |
| `src/config/patterns.js` | Texture patterns per model per part | Adding/removing design patterns |
| `src/config/swatches.js` | Predefined color swatches | Changing available colors per part |
| `src/Components/ModelPicker.jsx` | Model selector thumbnails | Adding a model to the UI |
| `src/Components/[Model].js` | 3D mesh + material logic | New model, pattern support, toggle parts |
| `src/img/` | Thumbnail images for model picker | Adding model thumbnail |
| `public/[model]/` | GLB file + pattern images | Updating the 3D model or designs |
| `src/config/logoTextState.js` | Logo/text overlay state | Changing logo/text state fields |
| `src/utils/createTextTexture.js` | Canvas text renderer | Changing text rendering logic |
| `src/Components/LogoTextPanel.jsx` | Logo/text UI panel | Adding fonts, UI controls |
| `src/Components/LogoTextOverlay.jsx` | 3D overlay plane | Changing how overlay renders |
| `public/index.html` | Google Fonts links | Adding new fonts |
| `CHANGELOG.md` | Change history | Every commit that changes functionality |
| `DEVELOPER_GUIDE.md` | This file | When workflow or architecture changes |
