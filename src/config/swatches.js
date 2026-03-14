// ============================================================
// PREDEFINED COLOR SWATCHES
// Customize colors per product per part.
// Add/remove colors as needed. Fallback palette used if not defined.
// ============================================================

export const productColors = {
  Shoe: {
    laces: ["#ffffff", "#000000", "#ff0000", "#0055ff", "#ffcc00", "#00cc44", "#ff6600", "#8833cc"],
    mesh: ["#ffffff", "#000000", "#d3d3d3", "#1a1a2e", "#e94560", "#0f3460", "#16213e", "#533483"],
    caps: ["#ffffff", "#000000", "#d3d3d3", "#c0c0c0", "#2c3e50", "#8e44ad", "#e74c3c", "#f39c12"],
    inner: ["#ffffff", "#000000", "#f5e6ca", "#d4a373", "#e6ccb2", "#ddb892", "#b08968", "#7f5539"],
    sole: ["#ffffff", "#000000", "#d3d3d3", "#2c3e50", "#e74c3c", "#27ae60", "#f39c12", "#8e44ad"],
    stripes: ["#ffffff", "#000000", "#ff0000", "#0055ff", "#ffcc00", "#00cc44", "#ff6600", "#e74c3c"],
    band: ["#ffffff", "#000000", "#d3d3d3", "#1a1a2e", "#e94560", "#0f3460", "#533483", "#c0c0c0"],
    patch: ["#ffffff", "#000000", "#ff0000", "#0055ff", "#ffcc00", "#00cc44", "#8e44ad", "#e74c3c"],
  },
  Rocket: {
    hull: ["#d3d3d3", "#ffffff", "#c0392b", "#2980b9", "#1abc9c", "#f1c40f", "#2c3e50", "#ecf0f1"],
    base: ["#d3d3d3", "#ffffff", "#34495e", "#7f8c8d", "#95a5a6", "#2c3e50", "#e74c3c", "#f39c12"],
    tip: ["#ff0000", "#ff6600", "#ffcc00", "#ffffff", "#d3d3d3", "#e74c3c", "#c0392b", "#f39c12"],
    wings: ["#a8a8a8", "#d3d3d3", "#2c3e50", "#e74c3c", "#3498db", "#f1c40f", "#1abc9c", "#8e44ad"],
    window: ["#87ceeb", "#00bfff", "#1e90ff", "#4169e1", "#a8a8a8", "#2c3e50", "#1abc9c", "#ffffff"],
  },
  Axe: {
    body: ["#a8a8a8", "#8B4513", "#654321", "#3e2723", "#5d4037", "#795548", "#4e342e", "#d3d3d3"],
    design: ["#d3d3d3", "#ffd700", "#c0c0c0", "#cd7f32", "#b87333", "#e5c100", "#ffffff", "#000000"],
    support: ["#d3d3d3", "#8B4513", "#654321", "#a0522d", "#6b3a2a", "#3e2723", "#deb887", "#d2691e"],
    inner: ["#d3d3d3", "#c0c0c0", "#808080", "#696969", "#a9a9a9", "#778899", "#2f4f4f", "#000000"],
  },
  Insect: {
    body: ["#d3d3d3", "#228b22", "#006400", "#2e8b57", "#32cd32", "#8b4513", "#556b2f", "#000000"],
    shell: ["#a8a8a8", "#006400", "#8b0000", "#ff4500", "#ffd700", "#4b0082", "#2e8b57", "#000000"],
  },
  Teapot: {
    lid: ["#d3d3d3", "#ffffff", "#ffd700", "#c0392b", "#2980b9", "#1abc9c", "#8e44ad", "#2c3e50"],
    base: ["#a8a8a8", "#ffffff", "#ffd700", "#c0392b", "#2980b9", "#1abc9c", "#8e44ad", "#2c3e50"],
  },
  Sneaker: {
    laces: ["#ffffff", "#000000", "#ff0000", "#0055ff", "#ffcc00", "#00cc44", "#8b4513", "#808080"],
    front: ["#ffffff", "#000000", "#d3d3d3", "#1a1a2e", "#c0392b", "#2980b9", "#f39c12", "#8e44ad"],
    middle: ["#ffffff", "#000000", "#d3d3d3", "#2c3e50", "#e74c3c", "#3498db", "#27ae60", "#f1c40f"],
    top: ["#ffffff", "#000000", "#d3d3d3", "#1a1a2e", "#e94560", "#0f3460", "#533483", "#c0c0c0"],
    flaps: ["#ffffff", "#000000", "#d3d3d3", "#c0392b", "#2980b9", "#1abc9c", "#8e44ad", "#f39c12"],
    sole: ["#ffffff", "#e0e0e0", "#000000", "#d3d3d3", "#c0392b", "#2c3e50", "#8b4513", "#f39c12"],
    strap: ["#ffffff", "#000000", "#d3d3d3", "#c0392b", "#2980b9", "#f1c40f", "#1abc9c", "#8e44ad"],
    inside: ["#d3d3d3", "#ffffff", "#000000", "#f5e6ca", "#d4a373", "#b08968", "#2c3e50", "#808080"],
    stitches: ["#cccccc", "#ffffff", "#000000", "#ff0000", "#ffd700", "#0055ff", "#00cc44", "#808080"],
  },
  PoloShirt: {
    body: ["#ffffff", "#000000", "#1a1a2e", "#c0392b", "#2980b9", "#27ae60", "#f39c12", "#8e44ad"],
    buttons: ["#cccccc", "#ffffff", "#000000", "#d4a373", "#c0392b", "#2980b9", "#f39c12", "#2c3e50"],
    sleeves: ["#ffffff", "#000000", "#d3d3d3", "#1a1a2e", "#c0392b", "#2980b9", "#27ae60", "#8e44ad"],
  },
  HighNeckTshirt: {
    body: ["#b8b8b8", "#ffffff", "#000000", "#c0392b", "#e67e22", "#f1c40f", "#808000", "#27ae60", "#2980b9", "#8e44ad", "#e91e63"],
  },
};

export const defaultColors = ["#ffffff", "#000000", "#d3d3d3", "#a8a8a8", "#ff0000", "#0055ff", "#ffcc00", "#00cc44"];
