import React from "react";
import { useSnapshot } from "valtio";
import { modelConfig } from "../config/models";

export default function PartsPicker({ state, updateCurrent, modelName }) {
  const snap = useSnapshot(state);
  const parts = Object.keys(snap.colors);
  const optionsConfig = modelConfig[modelName]?.options;

  return (
    <div className="parts-picker">
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
