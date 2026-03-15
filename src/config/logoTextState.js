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
  size: 0.8,
  rotation: 0,
};

const EDITOR_FIELDS = Object.keys(DEFAULT_OVERLAY);

function getFirstPlacement(modelName) {
  const cfg = modelConfig[modelName];
  if (cfg?.placements) return Object.keys(cfg.placements)[0];
  return "front";
}

function makeModelDefault(modelName) {
  return {
    ...DEFAULT_OVERLAY,
    placement: getFirstPlacement(modelName),
    items: [],       // placed overlays
    editingId: null,  // id of item being edited (null = new)
  };
}

// Build initial per-model backing store
const perModel = {};
Object.keys(modelConfig).forEach((name) => {
  perModel[name] = makeModelDefault(name);
});

const firstModel = Object.keys(modelConfig)[0];
const firstDefaults = makeModelDefault(firstModel);

// The active (top-level) fields are what all UI components read/write.
// _perModel stores snapshots keyed by model name.
export const logoTextState = proxy({
  ...firstDefaults,
  _currentModel: firstModel,
  _perModel: perModel,
});

let _nextId = 1;

/**
 * Place current editor content as a new item, or save edits to existing item.
 */
export function placeItem() {
  const hasContent =
    (logoTextState.activeTab === "logo" && logoTextState.logo) ||
    (logoTextState.activeTab === "text" && logoTextState.text.trim());
  if (!hasContent) return;

  const itemData = {};
  EDITOR_FIELDS.forEach((k) => { itemData[k] = logoTextState[k]; });

  if (logoTextState.editingId !== null) {
    // Update existing item
    const idx = logoTextState.items.findIndex((i) => i.id === logoTextState.editingId);
    if (idx !== -1) {
      itemData.id = logoTextState.editingId;
      logoTextState.items[idx] = itemData;
    }
    logoTextState.editingId = null;
  } else {
    // Add new item
    itemData.id = _nextId++;
    logoTextState.items.push(itemData);
  }

  // Reset editor for next item
  resetEditor();
}

/**
 * Start editing an existing item — load its values into the editor.
 */
export function editItem(id) {
  const item = logoTextState.items.find((i) => i.id === id);
  if (!item) return;
  EDITOR_FIELDS.forEach((k) => { logoTextState[k] = item[k]; });
  logoTextState.editingId = id;
}

/**
 * Remove a placed item.
 */
export function removeItem(id) {
  const idx = logoTextState.items.findIndex((i) => i.id === id);
  if (idx !== -1) logoTextState.items.splice(idx, 1);
  if (logoTextState.editingId === id) {
    logoTextState.editingId = null;
    resetEditor();
  }
}

/**
 * Reset editor to blank state (for adding a new item).
 */
export function resetEditor() {
  const placement = logoTextState.placement; // keep current placement
  const activeTab = logoTextState.activeTab; // keep current tab
  EDITOR_FIELDS.forEach((k) => { logoTextState[k] = DEFAULT_OVERLAY[k]; });
  logoTextState.placement = placement;
  logoTextState.activeTab = activeTab;
}

/**
 * Cancel editing — revert to new-item mode without saving changes.
 */
export function cancelEditing() {
  logoTextState.editingId = null;
  resetEditor();
}

/**
 * Call on model switch. Saves current state into _perModel[old],
 * restores _perModel[new] into the active fields.
 */
export function switchLogoTextModel(newModel) {
  const old = logoTextState._currentModel;
  if (old === newModel) return;

  // Save current active state → old model's slot
  EDITOR_FIELDS.forEach((k) => {
    logoTextState._perModel[old][k] = logoTextState[k];
  });
  logoTextState._perModel[old].items = JSON.parse(JSON.stringify(logoTextState.items));
  logoTextState._perModel[old].editingId = logoTextState.editingId;

  // Restore new model's state (create defaults if first visit)
  if (!logoTextState._perModel[newModel]) {
    logoTextState._perModel[newModel] = makeModelDefault(newModel);
  }
  const restored = logoTextState._perModel[newModel];
  EDITOR_FIELDS.forEach((k) => {
    logoTextState[k] = restored[k];
  });

  // Restore items array
  logoTextState.items.splice(0, logoTextState.items.length);
  (restored.items || []).forEach((item) => {
    logoTextState.items.push({ ...item });
  });
  logoTextState.editingId = restored.editingId || null;

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
