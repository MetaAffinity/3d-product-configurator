import { HexColorPicker } from "react-colorful";
import { useSnapshot } from "valtio";
import { productColors, defaultColors } from "../config/swatches";

// ============================================================
// Set to true to show free HexColorPicker alongside swatches.
// Set to false (default) for predefined swatches only.
// ============================================================
const ENABLE_FREE_COLOR_PICKER = false;

export default function ColorPicker({ state, updateColor, modelName }) {
  const snap = useSnapshot(state);

  const swatches = productColors[modelName]?.[snap.current] || defaultColors;

  return (
    <div className={snap.current !== null ? "color-picker" : "color-picker hidden"}>
      <h1>{snap.current}</h1>

      <div className="color-swatches">
        {swatches.map((color) => (
          <div
            key={color}
            className={`swatch ${snap.colors[snap.current] === color ? "active" : ""}`}
            style={{ backgroundColor: color }}
            onClick={() => updateColor(snap.current, color)}
          />
        ))}
      </div>

      {ENABLE_FREE_COLOR_PICKER && (
        <div className="free-picker">
          <HexColorPicker
            color={snap.colors[snap.current]}
            onChange={(color) => updateColor(snap.current, color)}
          />
        </div>
      )}
    </div>
  );
}
