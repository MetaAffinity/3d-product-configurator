import React, { useRef, useEffect, useCallback } from "react";
import { useSnapshot } from "valtio";
import { logoTextState } from "../config/logoTextState";
import { modelConfig } from "../config/models";

const FONTS = [
  { label: "Arial",           value: "Arial" },
  { label: "Georgia",         value: "Georgia" },
  { label: "Impact",          value: "Impact" },
  { label: "Courier New",     value: "Courier New" },
  { label: "Bebas Neue",      value: "Bebas Neue" },
  { label: "Oswald",          value: "Oswald" },
  { label: "Pacifico",        value: "Pacifico" },
  { label: "Playfair Display",value: "Playfair Display" },
  { label: "Anton",           value: "Anton" },
];

const PLACEMENTS = ["front", "back", "left", "right"];

export default function LogoTextPanel({ modelName }) {
  const snap = useSnapshot(logoTextState);
  const fileRef = useRef();
  const padRef = useRef();
  const padDragging = useRef(false);

  // 2D Position Pad — drag anywhere inside the square
  // Range ±12 so the full shirt height (collar → hem) is reachable
  const PAD_RANGE = 12;
  const ARROW_STEP = 0.4;

  const getPadOffset = useCallback((clientX, clientY) => {
    const rect = padRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    logoTextState.offsetX = (x - 0.5) * PAD_RANGE;
    logoTextState.offsetY = -(y - 0.5) * PAD_RANGE;
  }, []);

  const handlePadDown = useCallback((e) => {
    e.preventDefault();
    padDragging.current = true;
    getPadOffset(e.clientX, e.clientY);
  }, [getPadOffset]);

  useEffect(() => {
    const onMove = (e) => { if (padDragging.current) getPadOffset(e.clientX, e.clientY); };
    const onUp   = () => { padDragging.current = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [getPadOffset]);

  // Dot position in pad (0–100%)
  const dotX = Math.max(2, Math.min(98, (snap.offsetX / PAD_RANGE + 0.5) * 100));
  const dotY = Math.max(2, Math.min(98, (-snap.offsetY / PAD_RANGE + 0.5) * 100));
  const config = modelConfig[modelName];
  const availablePlacements = config.decalPositions
    ? Object.keys(config.decalPositions)
    : PLACEMENTS;

  // ── Handlers ───────────────────────────────────────────────────────
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    logoTextState.logo = url;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    logoTextState.logo = url;
  };

  return (
    <div className="logtext-panel">
      {/* Tabs */}
      <div className="logtext-tabs">
        <button
          className={snap.activeTab === "logo" ? "active" : ""}
          onClick={() => (logoTextState.activeTab = "logo")}
        >
          Logo
        </button>
        <button
          className={snap.activeTab === "text" ? "active" : ""}
          onClick={() => (logoTextState.activeTab = "text")}
        >
          Text
        </button>
      </div>

      {/* ── LOGO TAB ─────────────────────────────────────────── */}
      {snap.activeTab === "logo" && (
        <div className="logtext-section">
          <div
            className={`logo-dropzone ${snap.logo ? "has-logo" : ""}`}
            onClick={() => fileRef.current.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {snap.logo ? (
              <img src={snap.logo} alt="logo preview" className="logo-preview" />
            ) : (
              <span>Click or drag &amp; drop<br />your logo here</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleLogoUpload}
          />
          {snap.logo && (
            <button
              className="logtext-clear"
              onClick={() => { logoTextState.logo = null; }}
            >
              Remove Logo
            </button>
          )}
        </div>
      )}

      {/* ── TEXT TAB ─────────────────────────────────────────── */}
      {snap.activeTab === "text" && (
        <div className="logtext-section">
          <textarea
            className="logtext-textarea"
            placeholder="Enter text..."
            value={snap.text}
            onChange={(e) => (logoTextState.text = e.target.value)}
            rows={2}
          />

          <label className="logtext-label">Font</label>
          <select
            className="logtext-select"
            value={snap.font}
            onChange={(e) => (logoTextState.font = e.target.value)}
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </select>

          <div className="logtext-row">
            <label className="logtext-label">Color</label>
            <input
              type="color"
              value={snap.textColor}
              onChange={(e) => (logoTextState.textColor = e.target.value)}
              className="logtext-color"
            />
          </div>

          <div className="logtext-toggles">
            <label className="logtext-toggle-item">
              <span>Bold</span>
              <div
                className={`toggle-switch ${snap.bold ? "on" : ""}`}
                onClick={() => (logoTextState.bold = !snap.bold)}
              >
                <div className="toggle-knob" />
              </div>
            </label>
            <label className="logtext-toggle-item">
              <span>Curved</span>
              <div
                className={`toggle-switch ${snap.curved ? "on" : ""}`}
                onClick={() => (logoTextState.curved = !snap.curved)}
              >
                <div className="toggle-knob" />
              </div>
            </label>
            {snap.curved && (
              <label className="logtext-toggle-item">
                <span>Arch Up</span>
                <div
                  className={`toggle-switch ${snap.curveUp ? "on" : ""}`}
                  onClick={() => (logoTextState.curveUp = !snap.curveUp)}
                >
                  <div className="toggle-knob" />
                </div>
              </label>
            )}
          </div>

          {snap.text && (
            <button
              className="logtext-clear"
              onClick={() => { logoTextState.text = ""; }}
            >
              Clear Text
            </button>
          )}
        </div>
      )}

      {/* ── COMMON CONTROLS ──────────────────────────────────── */}
      <div className="logtext-divider" />

      <label className="logtext-label">Placement</label>
      <div className="logtext-placements">
        {availablePlacements.map((p) => (
          <button
            key={p}
            className={snap.placement === p ? "active" : ""}
            onClick={() => (logoTextState.placement = p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 2D Position Pad */}
      <label className="logtext-label">Position — drag to move</label>
      <div
        ref={padRef}
        className="logtext-pad"
        onPointerDown={handlePadDown}
      >
        <div className="logtext-pad-hint">drag anywhere</div>
        <div
          className="logtext-pad-dot"
          style={{ left: `${dotX}%`, top: `${dotY}%` }}
        />
      </div>

      {/* Arrow nudge buttons */}
      <div className="logtext-arrows">
        <div className="logtext-arrows-row">
          <button
            className="logtext-arrow-btn"
            onClick={() => { logoTextState.offsetY = Math.min(PAD_RANGE / 2, snap.offsetY + ARROW_STEP); }}
            title="Up"
          >▲</button>
        </div>
        <div className="logtext-arrows-row">
          <button
            className="logtext-arrow-btn"
            onClick={() => { logoTextState.offsetX = Math.max(-PAD_RANGE / 2, snap.offsetX - ARROW_STEP); }}
            title="Left"
          >◀</button>
          <button
            className="logtext-arrow-btn logtext-arrow-center"
            onClick={() => { logoTextState.offsetX = 0; logoTextState.offsetY = 0; }}
            title="Center"
          >·</button>
          <button
            className="logtext-arrow-btn"
            onClick={() => { logoTextState.offsetX = Math.min(PAD_RANGE / 2, snap.offsetX + ARROW_STEP); }}
            title="Right"
          >▶</button>
        </div>
        <div className="logtext-arrows-row">
          <button
            className="logtext-arrow-btn"
            onClick={() => { logoTextState.offsetY = Math.max(-PAD_RANGE / 2, snap.offsetY - ARROW_STEP); }}
            title="Down"
          >▼</button>
        </div>
      </div>

      <label className="logtext-label">Size</label>
      <input
        type="range" min="0.02" max="0.6" step="0.01"
        value={snap.size}
        onChange={(e) => (logoTextState.size = parseFloat(e.target.value))}
        className="logtext-range"
      />

      <label className="logtext-label">Rotation — {snap.rotation}°</label>
      <input
        type="range" min="-180" max="180" step="1"
        value={snap.rotation}
        onChange={(e) => (logoTextState.rotation = parseFloat(e.target.value))}
        className="logtext-range"
      />

      <button
        className="logtext-clear"
        style={{ marginTop: 4 }}
        onClick={() => {
          logoTextState.offsetX = 0;
          logoTextState.offsetY = 0;
          logoTextState.size = 0.12;
          logoTextState.rotation = 0;
        }}
      >
        Reset Position, Size &amp; Rotation
      </button>
    </div>
  );
}
