import React from "react";
import { useSnapshot } from "valtio";

export default function PartsPicker({ state, updateCurrent, modelName }) {
  const snap = useSnapshot(state);
  const parts = Object.keys(snap.colors);

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
    </div>
  );
}
