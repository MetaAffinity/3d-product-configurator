import { proxy } from "valtio";
import { modelPatterns } from "./patterns";
import Shoe from "../Components/Shoe";
import Rocket from "../Components/Rocket";
import Axe from "../Components/Axe";
import Insect from "../Components/Insect";
import Teapot from "../Components/Teapot";
import Sneaker from "../Components/Sneaker";
import PoloShirt from "../Components/PoloShirt";
import HighNeckTshirt from "../Components/HighNeckTshirt";
import Hoodie from "../Components/Hoodie";

// ============================================================
// MODEL CONFIGURATION
// Add/remove/modify models here. Everything else adapts automatically.
// Each model needs: component, default colors, camera angles per part.
// ============================================================

const modelConfig = {
  Shoe: {
    component: Shoe,
    placements: {
      front: { label: "Front", dir: "front", rayHeight: 0.35 },
      back:  { label: "Back",  dir: "back",  rayHeight: 0.35 },
      left:  { label: "Left",  dir: "left",  rayHeight: 0.5 },
      right: { label: "Right", dir: "right", rayHeight: 0.5 },
    },
    colors: {
      laces: "#d3d3d3",
      mesh: "#d3d3d3",
      caps: "#d3d3d3",
      inner: "#d3d3d3",
      sole: "#d3d3d3",
      stripes: "#d3d3d3",
      band: "#d3d3d3",
      patch: "#d3d3d3",
    },
    // Camera angles: [azimuthal, polar] in radians
    cameraAngles: {
      laces: [0, 1.2],
      mesh: [0.5, 1.4],
      caps: [2.5, 1.3],
      inner: [1.8, 0.8],
      sole: [0.3, 2.2],
      stripes: [-0.8, 1.3],
      band: [-1.5, 1.4],
      patch: [3.0, 1.2],
    },
  },
  Rocket: {
    component: Rocket,
    placements: {
      hullFront: { label: "Hull Front", dir: "front", rayHeight: 0.5 },
      hullBack:  { label: "Hull Back",  dir: "back",  rayHeight: 0.5 },
    },
    colors: {
      hull: "#d3d3d3",
      base: "#d3d3d3",
      tip: "#d3d3d3",
      wings: "#a8a8a8",
      window: "#a8a8a8",
    },
    cameraAngles: {
      hull: [0, 1.4],
      base: [0, 2.0],
      tip: [0, 0.6],
      wings: [0.8, 1.8],
      window: [-0.3, 1.0],
    },
  },
  Axe: {
    component: Axe,
    placements: {
      blade:  { label: "Blade",  dir: "front", rayHeight: 0.7 },
      handle: { label: "Handle", dir: "front", rayHeight: 0.2 },
    },
    colors: {
      body: "#a8a8a8",
      design: "#d3d3d3",
      support: "#d3d3d3",
      inner: "#d3d3d3",
    },
    cameraAngles: {
      body: [0, 1.4],
      design: [0.6, 1.2],
      support: [-0.5, 1.5],
      inner: [1.2, 1.0],
    },
  },
  Insect: {
    component: Insect,
    placements: {
      shell: { label: "Shell", dir: "top",   rayHeight: 0.9 },
      body:  { label: "Body",  dir: "front", rayHeight: 0.35 },
    },
    colors: {
      body: "#d3d3d3",
      shell: "#a8a8a8",
    },
    cameraAngles: {
      body: [0, 1.2],
      shell: [0, 0.7],
    },
  },
  Teapot: {
    component: Teapot,
    placements: {
      body: { label: "Body", dir: "front", rayHeight: 0.35 },
      lid:  { label: "Lid",  dir: "top",   rayHeight: 1.0 },
    },
    colors: {
      lid: "#d3d3d3",
      base: "#a8a8a8",
    },
    cameraAngles: {
      lid: [0, 0.6],
      base: [0.5, 1.8],
    },
  },
  Sneaker: {
    component: Sneaker,
    cameraPosition: [0, 0, 1.5],
    minDistance: 0.5,
    placements: {
      front: { label: "Front", dir: "front", rayHeight: 0.35 },
      back:  { label: "Back",  dir: "back",  rayHeight: 0.35 },
      left:  { label: "Left",  dir: "left",  rayHeight: 0.5 },
      right: { label: "Right", dir: "right", rayHeight: 0.5 },
    },
    colors: {
      laces: "#ffffff",
      front: "#ffffff",
      middle: "#ffffff",
      top: "#ffffff",
      flaps: "#ffffff",
      sole: "#e0e0e0",
      strap: "#ffffff",
      inside: "#d3d3d3",
      stitches: "#cccccc",
    },
    // Toggleable parts: { key: { label, default } }
    options: {
      strap: { label: "Back Strap", default: true },
    },
    cameraAngles: {
      laces: [0, 1.2],
      front: [0.3, 1.3],
      middle: [-0.8, 1.4],
      top: [0, 0.8],
      flaps: [1.5, 1.3],
      sole: [0.3, 2.2],
      strap: [0, 1.0],
      inside: [1.8, 0.8],
      stitches: [0.5, 1.5],
    },
  },
  PoloShirt: {
    component: PoloShirt,
    cameraPosition: [0, 0.2, 2],
    placements: {
      chest:       { label: "Chest",        dir: "front", rayHeight: 0.35 },
      back:        { label: "Back",         dir: "back",  rayHeight: 0.35 },
      leftSleeve:  { label: "Left Sleeve",  dir: "left",  rayHeight: 0.5 },
      rightSleeve: { label: "Right Sleeve", dir: "right", rayHeight: 0.5 },
    },
    colors: {
      body: "#ffffff",
      buttons: "#cccccc",
      sleeves: "#ffffff",
    },
    cameraAngles: {
      body: [0, 1.2],
      buttons: [0, 1.0],
      sleeves: [0.8, 1.3],
    },
  },
  HighNeckTshirt: {
    component: HighNeckTshirt,
    cameraPosition: [0, 0.2, 2],
    placements: {
      chest:       { label: "Chest",        dir: "front", rayHeight: 0.35 },
      back:        { label: "Back",         dir: "back",  rayHeight: 0.35 },
      leftSleeve:  { label: "Left Sleeve",  dir: "left",  rayHeight: 0.72 },
      rightSleeve: { label: "Right Sleeve", dir: "right", rayHeight: 0.72 },
    },
    colors: {
      body: "#c8c8c8",
    },
    cameraAngles: {
      body: [0, 1.2],
    },
    // Design presets — transparent overlay textures per part
    designs: [
      {
        label: "Basic",
        thumb: "/highneck-tshirt/thumbs/basic-tshirt.png",
        textures: {},
      },
      {
        label: "Double Lines",
        thumb: "/highneck-tshirt/thumbs/double-lines.png",
        textures: {
          front: ["/highneck-tshirt/textures/double-lines/front_1.png"],
          back:  ["/highneck-tshirt/textures/double-lines/back_1.png"],
        },
      },
      {
        label: "Tribal Lines",
        thumb: "/highneck-tshirt/thumbs/trible-lines.png",
        textures: {
          front: ["/highneck-tshirt/textures/trible-lines/front_1.png"],
          back:  ["/highneck-tshirt/textures/trible-lines/back_1.png"],
        },
      },
      {
        label: "Lines",
        thumb: "/highneck-tshirt/thumbs/basic-tshirt.png",
        textures: {
          front:       ["/highneck-tshirt/textures/lines/front_1.png", "/highneck-tshirt/textures/lines/front_2.png"],
          back:        ["/highneck-tshirt/textures/lines/back_1.png", "/highneck-tshirt/textures/lines/back_2.png"],
          rightSleeve: ["/highneck-tshirt/textures/lines/right_1.png"],
          leftSleeve:  ["/highneck-tshirt/textures/lines/left_1.png"],
        },
      },
    ],
  },
  Hoodie: {
    component: Hoodie,
    cameraPosition: [0, 0, 2],
    placements: {
      chest:  { label: "Chest",  dir: "front", rayHeight: 0.45 },
      back:   { label: "Back",   dir: "back",  rayHeight: 0.45 },
      hood:   { label: "Hood",   dir: "front", rayHeight: 0.85 },
      pocket: { label: "Pocket", dir: "front", rayHeight: 0.15 },
    },
    colors: {
      body:       "#d0d0d0",
      hood:       "#d0d0d0",
      drawstring: "#e8e8e8",
      bottom:     "#e8e8e8",
      cuff:       "#d0d0d0",
      pocket:     "#e8e8e8",
    },
    cameraAngles: {
      body:       [0, 1.2],
      hood:       [0, 0.8],
      drawstring: [0, 0.9],
      bottom:     [0, 1.8],
      cuff:       [0.8, 1.5],
      pocket:     [0, 1.4],
    },
  },
};

// Auto-generate proxy states from config
const modelStates = {};
Object.keys(modelConfig).forEach((name) => {
  const opts = modelConfig[name].options || {};
  const optionDefaults = {};
  Object.keys(opts).forEach((key) => {
    optionDefaults[key] = opts[key].default;
  });
  // Generate default texture state — null means use original GLB texture
  const partPatterns = modelPatterns[name] || {};
  const textureDefaults = {};
  Object.keys(partPatterns).forEach((part) => { textureDefaults[part] = null; });

  modelStates[name] = proxy({
    current: null,
    colors: { ...modelConfig[name].colors },
    options: optionDefaults,
    textures: textureDefaults,
    design: modelConfig[name].designs ? 0 : null,
    designColor: modelConfig[name].designs ? "#000000" : null,
  });
});

export { modelConfig, modelStates };
export const modelNames = Object.keys(modelConfig);
export const defaultModel = modelNames[0];
export function getDefaultPlacement(modelName) {
  const cfg = modelConfig[modelName];
  if (cfg?.placements) return Object.keys(cfg.placements)[0];
  return "front";
}
