import { modelConfig, modelStates } from "../config/models";
import { customOptionsState } from "../config/customOptionsState";

/**
 * Encode current configuration (model + colors + custom options) into a shareable URL.
 */
export function generateShareURL(modelName) {
  const state = modelStates[modelName];
  if (!state) return window.location.href;

  const payload = {
    m: modelName,
    c: { ...state.colors },
    s: { ...customOptionsState.selections },
  };

  const json = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  const url = new URL(window.location.href);
  url.searchParams.set("config", encoded);
  return url.toString();
}

/**
 * Decode configuration from URL and apply it.
 * Returns the model name if found, or null.
 */
export function loadFromURL() {
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get("config");
  if (!encoded) return null;

  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(json);
    const { m: modelName, c: colors, s: selections } = payload;

    if (!modelName || !modelConfig[modelName]) return null;

    // Apply colors
    const state = modelStates[modelName];
    if (state && colors) {
      Object.entries(colors).forEach(([key, value]) => {
        if (key in state.colors) {
          state.colors[key] = value;
        }
      });
    }

    // Apply custom options selections
    if (selections) {
      Object.keys(customOptionsState.selections).forEach((k) => {
        delete customOptionsState.selections[k];
      });
      Object.entries(selections).forEach(([k, v]) => {
        customOptionsState.selections[k] = v;
      });
    }

    // Clean URL without reloading
    url.searchParams.delete("config");
    window.history.replaceState({}, "", url.toString());

    return modelName;
  } catch (_) {
    return null;
  }
}
