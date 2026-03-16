import React, { useRef, useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import { MdClose, MdUndo, MdSave } from "react-icons/md";

const COLORS = ["#ff0000", "#0066ff", "#00cc44", "#ff9900", "#000000", "#ffffff"];
const TOOLS = [
  { key: "pen", label: "Pen" },
  { key: "arrow", label: "Arrow" },
  { key: "text", label: "Text" },
  { key: "eraser", label: "Eraser" },
];

function drawArrowHead(ctx, fromX, fromY, toX, toY, headLen) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

export default function AnnotationCanvas({ imageDataURL, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState("pen");
  const [penColor, setPenColor] = useState("#ff0000");
  const [penSize, setPenSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const historyRef = useRef([]);
  const imgRef = useRef(null);

  // Arrow tool state
  const arrowStartRef = useRef(null);
  const previewRef = useRef(null); // for arrow preview snapshot

  // Text tool state
  const [textInput, setTextInput] = useState(null); // { x, y } screen coords
  const [textValue, setTextValue] = useState("");
  const textInputRef = useRef(null);

  // Load image and set canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      imgRef.current = img;
      historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    };
    img.src = imageDataURL;
  }, [imageDataURL]);

  // Focus text input when it appears
  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput]);

  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const getScale = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    return canvas.width / canvas.getBoundingClientRect().width;
  }, []);

  const pushSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }, []);

  // ── PEN / ERASER ──────────────────────────────────────────────────
  const startPen = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getCanvasPos(e);
    const scale = getScale();
    const isEraser = activeTool === "eraser";
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? "#ececed" : penColor;
    ctx.lineWidth = (isEraser ? penSize * 3 : penSize) * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    setIsDrawing(true);
  }, [getCanvasPos, getScale, penColor, penSize, activeTool]);

  const movePen = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getCanvasPos]);

  const endPen = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    pushSnapshot();
  }, [isDrawing, pushSnapshot]);

  // ── ARROW ─────────────────────────────────────────────────────────
  const startArrow = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    arrowStartRef.current = getCanvasPos(e);
    previewRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setIsDrawing(true);
  }, [getCanvasPos]);

  const moveArrow = useCallback((e) => {
    if (!isDrawing || !arrowStartRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getCanvasPos(e);
    const from = arrowStartRef.current;
    const scale = getScale();

    // Restore snapshot to clear previous preview
    if (previewRef.current) {
      ctx.putImageData(previewRef.current, 0, 0);
    }

    // Draw arrow preview
    const lineW = penSize * scale;
    ctx.strokeStyle = penColor;
    ctx.fillStyle = penColor;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    drawArrowHead(ctx, from.x, from.y, pos.x, pos.y, lineW * 4 + 6 * scale);
  }, [isDrawing, getCanvasPos, getScale, penColor, penSize]);

  const endArrow = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    arrowStartRef.current = null;
    previewRef.current = null;
    pushSnapshot();
  }, [isDrawing, pushSnapshot]);

  // ── TEXT ───────────────────────────────────────────────────────────
  const handleTextClick = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setTextInput({
      x: clientX - rect.left,
      y: clientY - rect.top,
      canvasX: getCanvasPos(e).x,
      canvasY: getCanvasPos(e).y,
    });
    setTextValue("");
  }, [getCanvasPos]);

  const placeText = useCallback(() => {
    if (!textInput || !textValue.trim()) {
      setTextInput(null);
      setTextValue("");
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const scale = getScale();
    const fontSize = Math.max(14, penSize * 4) * scale;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = penColor;
    ctx.globalCompositeOperation = "source-over";

    // Draw background for readability
    const metrics = ctx.measureText(textValue);
    const pad = 4 * scale;
    const bgX = textInput.canvasX - pad;
    const bgY = textInput.canvasY - fontSize - pad;
    const bgW = metrics.width + pad * 2;
    const bgH = fontSize + pad * 2;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillRect(bgX, bgY, bgW, bgH);

    ctx.fillStyle = penColor;
    ctx.fillText(textValue, textInput.canvasX, textInput.canvasY);

    pushSnapshot();
    setTextInput(null);
    setTextValue("");
  }, [textInput, textValue, penColor, penSize, getScale, pushSnapshot]);

  // ── UNIFIED HANDLERS ──────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    if (activeTool === "pen" || activeTool === "eraser") startPen(e);
    else if (activeTool === "arrow") startArrow(e);
    else if (activeTool === "text") handleTextClick(e);
  }, [activeTool, startPen, startArrow, handleTextClick]);

  const handlePointerMove = useCallback((e) => {
    if (activeTool === "pen" || activeTool === "eraser") movePen(e);
    else if (activeTool === "arrow") moveArrow(e);
  }, [activeTool, movePen, moveArrow]);

  const handlePointerUp = useCallback(() => {
    if (activeTool === "pen" || activeTool === "eraser") endPen();
    else if (activeTool === "arrow") endArrow();
  }, [activeTool, endPen, endArrow]);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);
  }, []);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    onSave(canvas.toDataURL("image/png"));
  }, [onSave]);

  // Render via portal so it's fullscreen, not inside offcanvas
  return ReactDOM.createPortal(
    <div className="annotation-overlay">
      <div className="annotation-modal">
        <div className="annotation-header">
          <span className="annotation-title">Annotate View</span>
          <button className="annotation-close" onClick={onCancel}>
            <MdClose size={18} />
          </button>
        </div>
        <div className="annotation-canvas-wrap">
          <div style={{ position: "relative", display: "inline-block" }}>
            <canvas
              ref={canvasRef}
              className="annotation-canvas"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
            {/* Floating text input when text tool is active */}
            {textInput && (
              <div
                className="annotation-text-input-wrap"
                style={{
                  left: textInput.x,
                  top: textInput.y,
                }}
              >
                <input
                  ref={textInputRef}
                  type="text"
                  className="annotation-text-input"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") placeText(); if (e.key === "Escape") { setTextInput(null); setTextValue(""); } }}
                  onBlur={placeText}
                  placeholder="Type here..."
                  style={{ color: penColor }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="annotation-tools">
          <div className="annotation-tool-row">
            {TOOLS.map((tool) => (
              <button
                key={tool.key}
                className={`annotation-tool-btn ${activeTool === tool.key ? "active" : ""}`}
                onClick={() => { setActiveTool(tool.key); setTextInput(null); }}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <div className="annotation-colors">
            {COLORS.map((c) => (
              <div
                key={c}
                className={`annotation-color-swatch ${penColor === c ? "active" : ""}`}
                style={{ background: c, border: c === "#ffffff" ? "1.5px solid #ccc" : undefined }}
                onClick={() => setPenColor(c)}
              />
            ))}
          </div>
          <div className="annotation-controls">
            <label className="annotation-size-label">
              Size
              <input
                type="range"
                min="1"
                max="12"
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="annotation-size-slider"
              />
            </label>
            <button className="annotation-tool-btn" onClick={handleUndo} title="Undo">
              <MdUndo size={16} />
            </button>
          </div>
          <div className="annotation-actions">
            <button className="annotation-cancel-btn" onClick={onCancel}>Cancel</button>
            <button className="annotation-save-btn" onClick={handleSave}>
              <MdSave size={14} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
