import { HexColorPicker } from "react-colorful";
import { useSnapshot } from "valtio";
import { productColors, defaultColors } from "../config/swatches";
import { modelPatterns } from "../config/patterns";

const ENABLE_FREE_COLOR_PICKER = false;

export default function ColorPicker({ state, updateColor, updateTexture, modelName }) {
  const snap = useSnapshot(state);

  const swatches = productColors[modelName]?.[snap.current] || defaultColors;
  const patterns = modelPatterns[modelName]?.[snap.current] || [];
  const hasPatterns = patterns.length > 0;

  return (
    <div className={snap.current !== null ? "color-picker" : "color-picker hidden"}>
      <h1>{snap.current}</h1>

      {hasPatterns && (
        <div className="pattern-swatches">
          <p className="pattern-label">Patterns</p>
          <div className="pattern-grid">
            <div
              className={`pattern-thumb ${!snap.textures?.[snap.current] ? "active" : ""}`}
              style={{ background: snap.colors[snap.current] || "#fff" }}
              onClick={() => updateTexture(snap.current, null)}
              title="Plain color"
            />
            {patterns.map((path) => (
              <img
                key={path}
                src={path}
                alt="pattern"
                className={`pattern-thumb ${snap.textures?.[snap.current] === path ? "active" : ""}`}
                onClick={() => updateTexture(snap.current, path)}
              />
            ))}
          </div>
        </div>
      )}

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
