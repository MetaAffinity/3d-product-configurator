import { proxy } from "valtio";
import { modelConfig } from "./models";

// Default overlay values for a fresh model
const DEFAULT_OVERLAY = {
  activeTab: "logo",
  logo: null,
  text: "",
  font: "Arial",
  textColor: "#ffffff",
  bold: true,
  curved: false,
  curveUp: true,
  placement: null,   // set per model on init
  offsetX: 0,
  offsetY: 0,
  size: 0.12,
  rotation: 0,
};

const OVERLAY_FIELDS = Object.keys(DEFAULT_OVERLAY);

function getFirstPlacement(modelName) {
  const cfg = modelConfig[modelName];
  if (cfg?.placements) return Object.keys(cfg.placements)[0];
  return "front";
}

function makeModelDefault(modelName) {
  return { ...DEFAULT_OVERLAY, placement: getFirstPlacement(modelName) };
}

// Build initial per-model backing store
const perModel = {};
Object.keys(modelConfig).forEach((name) => {
  perModel[name] = makeModelDefault(name);
});

const firstModel = Object.keys(modelConfig)[0];

// The active (top-level) fields are what all UI components read/write.
// _perModel stores snapshots keyed by model name.
export const logoTextState = proxy({
  ...makeModelDefault(firstModel),
  _currentModel: firstModel,
  _perModel: perModel,
});

/**
 * Call on model switch. Saves current state into _perModel[old],
 * restores _perModel[new] into the active fields.
 */
export function switchLogoTextModel(newModel) {
  const old = logoTextState._currentModel;
  if (old === newModel) return;

  // Save current active state → old model's slot
  OVERLAY_FIELDS.forEach((k) => {
    logoTextState._perModel[old][k] = logoTextState[k];
  });

  // Restore new model's state (create defaults if first visit)
  if (!logoTextState._perModel[newModel]) {
    logoTextState._perModel[newModel] = makeModelDefault(newModel);
  }
  const restored = logoTextState._perModel[newModel];
  OVERLAY_FIELDS.forEach((k) => {
    logoTextState[k] = restored[k];
  });

  // Validate placement exists on new model
  const cfg = modelConfig[newModel];
  const validPlacements = cfg?.placements
    ? Object.keys(cfg.placements)
    : ["front", "back"];
  if (!validPlacements.includes(logoTextState.placement)) {
    logoTextState.placement = validPlacements[0];
  }

  logoTextState._currentModel = newModel;
}
