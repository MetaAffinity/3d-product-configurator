import React from "react";
import { useSnapshot } from "valtio";
import { modelConfig } from "../config/models";

export default function PartsPicker({ state, updateCurrent, modelName }) {
  const snap = useSnapshot(state);
  const optionsConfig = modelConfig[modelName]?.options;
  const designsConfig = modelConfig[modelName]?.designs;
  const DESIGN_COLORS = ["#000000", "#ffffff", "#c0392b", "#2980b9", "#27ae60", "#f39c12", "#8e44ad", "#e74c3c"];
  const ENABLE_CUSTOM_DESIGN_COLOR = true;
  // Hide parts that have a toggle option and it's off
  const parts = Object.keys(snap.colors).filter(
    (part) => !optionsConfig?.[part] || snap.options[part]
  );

  return (
    <div className="parts-picker">
      {/* Design selection (for models that support it) */}
      {designsConfig && (
        <div className="parts-designs">
          <h3>Design</h3>
          <div className="design-grid">
            {designsConfig.map((d, idx) => (
              <div
                key={idx}
                className={`design-card ${snap.design === idx ? "active" : ""}`}
                onClick={() => { state.design = idx; }}
              >
                <img src={d.thumb} alt={d.label} />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
          {/* Design color picker — only show when non-Basic design selected */}
          {snap.design > 0 && (
            <div className="design-color-picker">
              <label className="design-color-label">Design Color</label>
              <div className="design-color-swatches">
                {DESIGN_COLORS.map((color) => (
                  <div
                    key={color}
                    className={`design-color-swatch ${snap.designColor === color ? "active" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => { state.designColor = color; }}
                  />
                ))}
                {ENABLE_CUSTOM_DESIGN_COLOR && (
                  <label className="design-color-more" title="Pick any color">
                    <span className="design-color-more-icon">+</span>
                    <input
                      type="color"
                      value={snap.designColor || "#000000"}
                      onChange={(e) => { state.designColor = e.target.value; }}
                      className="design-color-hidden-input"
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <h3>{modelName} Parts</h3>
      <div className="parts-list">
        {parts.map((part) => (
          <div
            key={part}
            className={`part-item ${snap.current === part ? "active" : ""}`}
            onClick={() => updateCurrent(part)}
          >
            <div
              className="part-color-dot"
              style={{ backgroundColor: snap.colors[part] }}
            />
            <span>{part}</span>
          </div>
        ))}
      </div>
      {optionsConfig && Object.keys(optionsConfig).length > 0 && (
        <div className="parts-options">
          <h3>Options</h3>
          {Object.entries(optionsConfig).map(([key, opt]) => (
            <label key={key} className="option-toggle">
              <span>{opt.label}</span>
              <div
                className={`toggle-switch ${snap.options[key] ? "on" : ""}`}
                onClick={() => { state.options[key] = !state.options[key]; }}
              >
                <div className="toggle-knob" />
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
