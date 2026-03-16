import React from "react";
import { useSnapshot } from "valtio";
import { modelConfig } from "../config/models";
import {
  customOptionsState,
  setOption,
  getTotal,
} from "../config/customOptionsState";
import { exportPDF } from "../utils/pdfExport";

export default function CustomOptionsPanel({ modelName, embedded }) {
  const snap = useSnapshot(customOptionsState);
  const cfg = modelConfig[modelName]?.customOptions;

  if (!cfg?.enabled) return null;

  const currency = cfg.currency || "USD";
  const total = getTotal(modelName);

  return (
    <div className={embedded ? "custom-options-embedded" : "custom-options-panel"}>
      {!embedded && <h3>Customize Options</h3>}

      {cfg.groups.map((group, idx) => (
        <div key={group.key} className="co-group" style={embedded ? { animationDelay: `${idx * 0.08}s` } : undefined}>
          <label className="co-group-label">{group.label}</label>

          {group.type === "select" && (
            <div className="co-choices">
              {group.choices.map((choice) => (
                <div
                  key={choice.key}
                  className={`co-choice ${snap.selections[group.key] === choice.key ? "active" : ""}`}
                  onClick={() => setOption(group.key, choice.key)}
                >
                  <span className="co-choice-label">{choice.label}</span>
                  <span className="co-choice-price">
                    {choice.price > 0 ? `+${currency} ${choice.price.toFixed(2)}` : "Included"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {group.type === "toggle" && (
            <div className="co-toggle-row">
              <span className="co-toggle-price">
                +{currency} {(group.price || 0).toFixed(2)}
              </span>
              <div
                className={`toggle-switch ${snap.selections[group.key] ? "on" : ""}`}
                onClick={() => setOption(group.key, !snap.selections[group.key])}
              >
                <div className="toggle-knob" />
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="co-divider" />

      <div className="co-total">
        <span>Total</span>
        <span className="co-total-price">{currency} {total.toFixed(2)}</span>
      </div>

      <button className="co-pdf-btn" onClick={() => exportPDF(modelName)}>
        Download PDF
      </button>
    </div>
  );
}
