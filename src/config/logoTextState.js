import { proxy } from "valtio";

// Global state for logo / text overlay on the 3D model.
// This is shared across all models — placement positions are defined per-model in models.js.
export const logoTextState = proxy({
  activeTab: "logo",    // "logo" | "text" — which tab is open in the panel
  // Logo
  logo: null,           // data URL of uploaded image (null = no logo)
  // Text
  text: "",
  font: "Arial",
  textColor: "#ffffff",
  bold: true,
  curved: false,
  curveUp: true,        // true = curve up (arch), false = curve down
  // Common
  placement: "front",   // "front" | "back" | "left" | "right"
  offsetX: 0,           // -1 to 1
  offsetY: 0,           // -1 to 1
  size: 0.12,           // world-unit scale of the overlay plane
});
