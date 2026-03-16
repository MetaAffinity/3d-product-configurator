import { proxy } from "valtio";
import { modelConfig } from "./models";

/**
 * Build default selections for a model from its customOptions config.
 */
function buildDefaults(modelName) {
  const cfg = modelConfig[modelName]?.customOptions;
  if (!cfg?.enabled || !cfg.groups) return {};
  const defaults = {};
  cfg.groups.forEach((g) => {
    defaults[g.key] = g.default ?? (g.type === "toggle" ? false : g.choices?.[0]?.key);
  });
  return defaults;
}

// Build per-model backing store
const perModel = {};
Object.keys(modelConfig).forEach((name) => {
  perModel[name] = buildDefaults(name);
});

const firstModel = Object.keys(modelConfig)[0];

export const customOptionsState = proxy({
  selections: { ...perModel[firstModel] },
  _currentModel: firstModel,
  _perModel: perModel,
});

/**
 * Set an option value.
 */
export function setOption(groupKey, value) {
  customOptionsState.selections[groupKey] = value;
}

/**
 * Calculate total price for a model based on current selections.
 */
export function getTotal(modelName) {
  const cfg = modelConfig[modelName]?.customOptions;
  if (!cfg?.enabled) return 0;
  let total = cfg.basePrice || 0;
  const sel = customOptionsState.selections;
  (cfg.groups || []).forEach((g) => {
    if (g.type === "toggle") {
      if (sel[g.key]) total += g.price || 0;
    } else if (g.type === "select") {
      const choice = g.choices?.find((c) => c.key === sel[g.key]);
      if (choice) total += choice.price || 0;
    }
  });
  return total;
}

/**
 * Get summary of selections for PDF export.
 */
export function getSelectedSummary(modelName) {
  const cfg = modelConfig[modelName]?.customOptions;
  if (!cfg?.enabled) return [];
  const sel = customOptionsState.selections;
  const summary = [];
  (cfg.groups || []).forEach((g) => {
    if (g.type === "toggle") {
      summary.push({
        label: g.label,
        choiceLabel: sel[g.key] ? "Yes" : "No",
        price: sel[g.key] ? (g.price || 0) : 0,
      });
    } else if (g.type === "select") {
      const choice = g.choices?.find((c) => c.key === sel[g.key]);
      summary.push({
        label: g.label,
        choiceLabel: choice?.label || sel[g.key],
        price: choice?.price || 0,
      });
    }
  });
  return summary;
}

/**
 * Switch model — save current, restore new.
 */
export function switchCustomOptionsModel(newModel) {
  const old = customOptionsState._currentModel;
  if (old === newModel) return;

  // Save current
  customOptionsState._perModel[old] = { ...customOptionsState.selections };

  // Restore or create defaults
  if (!customOptionsState._perModel[newModel]) {
    customOptionsState._perModel[newModel] = buildDefaults(newModel);
  }
  const restored = customOptionsState._perModel[newModel];

  // Clear and restore selections
  Object.keys(customOptionsState.selections).forEach((k) => {
    delete customOptionsState.selections[k];
  });
  Object.entries(restored).forEach(([k, v]) => {
    customOptionsState.selections[k] = v;
  });

  customOptionsState._currentModel = newModel;
}
