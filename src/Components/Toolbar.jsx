import React from "react";
import {
  AiOutlineCamera,
  AiOutlineSync,
  AiOutlineExpand,
  AiOutlineCompress,
  AiOutlineReload,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
} from "react-icons/ai";

export default function Toolbar({
  onScreenshot,
  onToggleRotate,
  isRotating,
  onResetView,
  onToggleFullscreen,
  isFullscreen,
  onZoomIn,
  onZoomOut,
}) {
  return (
    <div className="toolbar">
      <button
        className="toolbar-btn"
        onClick={onScreenshot}
        title="Take Screenshot"
      >
        <AiOutlineCamera size={20} />
        <span>Screenshot</span>
      </button>

      <button
        className={`toolbar-btn ${isRotating ? "active" : ""}`}
        onClick={onToggleRotate}
        title="Auto Rotate 360"
      >
        <AiOutlineSync size={20} />
        <span>{isRotating ? "Stop" : "Rotate"}</span>
      </button>

      <button
        className="toolbar-btn"
        onClick={onResetView}
        title="Reset View"
      >
        <AiOutlineReload size={20} />
        <span>Reset</span>
      </button>

      <button className="toolbar-btn" onClick={onZoomIn} title="Zoom In">
        <AiOutlineZoomIn size={20} />
      </button>

      <button className="toolbar-btn" onClick={onZoomOut} title="Zoom Out">
        <AiOutlineZoomOut size={20} />
      </button>

      <button
        className="toolbar-btn"
        onClick={onToggleFullscreen}
        title="Fullscreen"
      >
        {isFullscreen ? (
          <AiOutlineCompress size={20} />
        ) : (
          <AiOutlineExpand size={20} />
        )}
      </button>
    </div>
  );
}
