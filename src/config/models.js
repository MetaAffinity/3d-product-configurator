import { proxy } from "valtio";
import Shoe from "../Components/Shoe";
import Rocket from "../Components/Rocket";
import Axe from "../Components/Axe";
import Insect from "../Components/Insect";
import Teapot from "../Components/Teapot";
import Sneaker from "../Components/Sneaker";
import PoloShirt from "../Components/PoloShirt";

// ============================================================
// MODEL CONFIGURATION
// Add/remove/modify models here. Everything else adapts automatically.
// Each model needs: component, default colors, camera angles per part.
// ============================================================

const modelConfig = {
  Shoe: {
    component: Shoe,
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
    minDistance: 0.5,
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
};

// Auto-generate proxy states from config
const modelStates = {};
Object.keys(modelConfig).forEach((name) => {
  const opts = modelConfig[name].options || {};
  const optionDefaults = {};
  Object.keys(opts).forEach((key) => {
    optionDefaults[key] = opts[key].default;
  });
  modelStates[name] = proxy({
    current: null,
    colors: { ...modelConfig[name].colors },
    options: optionDefaults,
  });
});

export { modelConfig, modelStates };
export const modelNames = Object.keys(modelConfig);
export const defaultModel = modelNames[0];
