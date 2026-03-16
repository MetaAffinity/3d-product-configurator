import React, { useState, useCallback, useEffect, useRef } from "react";
import { useSnapshot } from "valtio";
import { modelConfig } from "../config/models";
import {
  customOptionsState,
  setOption,
  getTotal,
} from "../config/customOptionsState";
import { exportPDF } from "../utils/pdfExport";
import { generateShareURL } from "../utils/shareLink";
import AnnotationCanvas from "./AnnotationCanvas";
import { MdAddAPhoto, MdClose, MdShare, MdEdit } from "react-icons/md";

function captureCanvas() {
  const canvas = document.querySelector("canvas");
  if (!canvas) return null;
  try {
    // Crop to center square to remove excess whitespace on sides
    const w = canvas.width;
    const h = canvas.height;
    const cropSize = Math.min(w, h);
    const sx = (w - cropSize) / 2;
    const sy = (h - cropSize) / 2;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropSize;
    tempCanvas.height = cropSize;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(canvas, sx, sy, cropSize, cropSize, 0, 0, cropSize, cropSize);
    return tempCanvas.toDataURL("image/png");
  } catch (_) {
    return null;
  }
}

/**
 * Hook for animated number transitions.
 */
function useAnimatedValue(target, duration = 350) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef(null);
  const startRef = useRef({ value: target, time: 0 });

  useEffect(() => {
    const startVal = display;
    if (startVal === target) return;
    startRef.current = { value: startVal, time: performance.now() };

    const animate = (now) => {
      const elapsed = now - startRef.current.time;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const current = startRef.current.value + (target - startRef.current.value) * ease;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

export default function CustomOptionsPanel({ modelName, embedded }) {
  const snap = useSnapshot(customOptionsState);
  const cfg = modelConfig[modelName]?.customOptions;
  const [extraViews, setExtraViews] = useState([]);
  const [copied, setCopied] = useState(false);
  const [annotatingIndex, setAnnotatingIndex] = useState(null);
  const [productNote, setProductNote] = useState("");

  const features = cfg?.features || {};

  const captureView = useCallback(() => {
    const dataURL = captureCanvas();
    if (!dataURL) return;
    setExtraViews((prev) => [
      ...prev,
      { label: `View ${prev.length + 1}`, dataURL },
    ]);
  }, []);

  const removeView = useCallback((index) => {
    setExtraViews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleExport = useCallback(() => {
    let allViews;
    if (extraViews.length > 0) {
      allViews = extraViews;
    } else {
      const defaultView = captureCanvas();
      allViews = defaultView ? [{ label: "Default View", dataURL: defaultView }] : [];
    }
    exportPDF(modelName, allViews, productNote);
  }, [modelName, extraViews, productNote]);

  const handleShare = useCallback(() => {
    const url = generateShareURL(modelName);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      window.prompt("Copy this link:", url);
    });
  }, [modelName]);

  const handleAnnotationSave = useCallback((annotatedDataURL) => {
    setExtraViews((prev) =>
      prev.map((view, i) =>
        i === annotatingIndex ? { ...view, dataURL: annotatedDataURL } : view
      )
    );
    setAnnotatingIndex(null);
  }, [annotatingIndex]);

  const currency = cfg?.currency || "USD";
  const total = cfg?.enabled ? getTotal(modelName) : 0;
  const animatedTotal = useAnimatedValue(total);

  if (!cfg?.enabled) return null;

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
        <span className="co-total-price co-total-animated">
          {currency} {animatedTotal.toFixed(2)}
        </span>
      </div>

      <div className="co-divider" />

      {/* Product Note */}
      <label className="co-group-label">Product Note</label>
      <p className="co-views-hint">Add any special instructions or notes for this order.</p>
      <textarea
        className="co-note-textarea"
        placeholder="e.g. Please use matte finish, deliver by March 25..."
        value={productNote}
        onChange={(e) => setProductNote(e.target.value)}
        rows={3}
      />

      <div className="co-divider" />

      {/* Share Link */}
      {features.shareLink && (
        <button className="co-share-btn" onClick={handleShare}>
          <MdShare size={15} />
          <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
        </button>
      )}

      {/* Custom Views Section */}
      <label className="co-group-label">Additional Views (optional)</label>
      <p className="co-views-hint">Rotate the model, then capture extra angles for the PDF.</p>
      <button className="co-capture-btn" onClick={captureView}>
        <MdAddAPhoto size={16} />
        <span>Capture Current View</span>
      </button>

      {extraViews.length > 0 && (
        <div className="co-views-grid">
          {extraViews.map((view, i) => (
            <div key={i} className="co-view-thumb">
              <img src={view.dataURL} alt={view.label} />
              <span className="co-view-label">{view.label}</span>
              {features.annotations && (
                <button
                  className="co-view-annotate"
                  onClick={() => setAnnotatingIndex(i)}
                  title="Annotate"
                >
                  <MdEdit size={10} />
                </button>
              )}
              <button className="co-view-remove" onClick={() => removeView(i)}>
                <MdClose size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="co-pdf-btn" onClick={handleExport}>
        Download PDF
        {extraViews.length > 0 && ` (1 + ${extraViews.length} views)`}
      </button>

      {/* Annotation Modal — rendered via portal at document.body */}
      {annotatingIndex !== null && extraViews[annotatingIndex] && (
        <AnnotationCanvas
          imageDataURL={extraViews[annotatingIndex].dataURL}
          onSave={handleAnnotationSave}
          onCancel={() => setAnnotatingIndex(null)}
        />
      )}
    </div>
  );
}
