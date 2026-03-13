import { HexColorPicker } from "react-colorful";
import { useSnapshot } from "valtio";
import { productColors, defaultColors } from "../config/swatches";
import { modelPatterns } from "../config/patterns";

const ENABLE_FREE_COLOR_PICKER = false;

export default function ColorPicker({ state, updateColor, updateTexture, modelName }) {
  const snap = useSnapshot(state);

  const swatches = productColors[modelName]?.[snap.current] || defaultColors;
  const patternConfig = modelPatterns[modelName]?.[snap.current] || [];
  const hasPatterns = patternConfig.length > 0;
  const activePattern = snap.textures?.[snap.current] ?? null;

  return (
    <div className={snap.current !== null ? "color-picker" : "color-picker hidden"}>
      <h1>{snap.current}</h1>

      {hasPatterns && (
        <div className="pattern-swatches">
          <p className="pattern-label">Patterns</p>
          <div className="pattern-grid">
            {/* Plain color option */}
            <div
              className={`pattern-thumb plain-thumb ${!activePattern ? "active" : ""}`}
              style={{ background: snap.colors[snap.current] || "#fff" }}
              onClick={() => updateTexture(snap.current, null)}
              title="Plain color"
            />
            {patternConfig.map((p) => (
              <img
                key={p.src}
                src={p.thumb || p.src}
                alt="pattern"
                className={`pattern-thumb ${activePattern === p.src ? "active" : ""}`}
                onClick={() => updateTexture(snap.current, p.src)}
                onError={(e) => { e.target.src = p.src; }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hide color swatches when a pattern is active */}
      {!activePattern && (
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
      )}

      {ENABLE_FREE_COLOR_PICKER && !activePattern && (
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
