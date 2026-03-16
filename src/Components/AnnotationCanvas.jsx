import React, { useRef, useState, useCallback, useEffect } from "react";
import { MdClose, MdUndo, MdSave } from "react-icons/md";

const COLORS = ["#ff0000", "#0066ff", "#00cc44", "#ff9900", "#000000", "#ffffff"];

export default function AnnotationCanvas({ imageDataURL, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#ff0000");
  const [penSize, setPenSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const historyRef = useRef([]);
  const imgRef = useRef(null);

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

  const getPos = useCallback((e) => {
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

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? "#ececed" : penColor;
    ctx.lineWidth = (isEraser ? penSize * 3 : penSize) * (canvas.width / canvasRef.current.getBoundingClientRect().width);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }
    setIsDrawing(true);
  }, [getPos, penColor, penSize, isEraser]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    // If eraser was used, redraw image underneath
    if (isEraser && imgRef.current) {
      // Save current drawing
      const drawingData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Create temp canvas with original image
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = canvas.height;
      const tmpCtx = tmpCanvas.getContext("2d");
      tmpCtx.drawImage(imgRef.current, 0, 0);
      tmpCtx.putImageData(drawingData, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tmpCanvas, 0, 0);
    }
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }, [isDrawing, isEraser]);

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
    // Composite: draw original image first, then annotations on top
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const fCtx = finalCanvas.getContext("2d");
    if (imgRef.current) {
      fCtx.drawImage(imgRef.current, 0, 0);
    }
    // Draw annotations (current canvas minus original = only annotations)
    fCtx.drawImage(canvas, 0, 0);
    onSave(finalCanvas.toDataURL("image/png"));
  }, [onSave]);

  return (
    <div className="annotation-overlay">
      <div className="annotation-modal">
        <div className="annotation-header">
          <span className="annotation-title">Annotate View</span>
          <button className="annotation-close" onClick={onCancel}>
            <MdClose size={18} />
          </button>
        </div>
        <div className="annotation-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="annotation-canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        <div className="annotation-tools">
          <div className="annotation-colors">
            {COLORS.map((c) => (
              <div
                key={c}
                className={`annotation-color-swatch ${penColor === c && !isEraser ? "active" : ""}`}
                style={{ background: c, border: c === "#ffffff" ? "1.5px solid #ccc" : undefined }}
                onClick={() => { setPenColor(c); setIsEraser(false); }}
              />
            ))}
          </div>
          <div className="annotation-controls">
            <button
              className={`annotation-tool-btn ${isEraser ? "active" : ""}`}
              onClick={() => setIsEraser(!isEraser)}
              title="Eraser"
            >
              Eraser
            </button>
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
    </div>
  );
}
