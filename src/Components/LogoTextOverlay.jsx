import React, { useMemo, useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import * as THREE from "three";
import { logoTextState } from "../config/logoTextState";
import { modelConfig } from "../config/models";
import { createTextTexture } from "../utils/createTextTexture";

// Default placement positions per placement key [x, y, z] world units
const DEFAULT_PLACEMENTS = {
  front: { position: [0, 0.05, 0.10], rotation: [0, 0, 0] },
  back:  { position: [0, 0.05, -0.10], rotation: [0, Math.PI, 0] },
  left:  { position: [-0.10, 0.05, 0], rotation: [0, -Math.PI / 2, 0] },
  right: { position: [0.10, 0.05, 0],  rotation: [0, Math.PI / 2, 0] },
};

export default function LogoTextOverlay({ modelName }) {
  const snap = useSnapshot(logoTextState);
  const config = modelConfig[modelName];
  const placements = config.decalPositions || DEFAULT_PLACEMENTS;
  const pl = placements[snap.placement] || placements.front || DEFAULT_PLACEMENTS.front;

  // Adjust with user offset (each unit = 0.08 world units)
  const pos = [
    pl.position[0] + snap.offsetX * 0.08,
    pl.position[1] + snap.offsetY * 0.08,
    pl.position[2],
  ];

  // ── Text texture ────────────────────────────────────────────────────
  const textCanvas = useMemo(() => {
    if (!snap.text.trim()) return null;
    return createTextTexture({
      text: snap.text,
      font: snap.font,
      textColor: snap.textColor,
      bold: snap.bold,
      curved: snap.curved,
      curveUp: snap.curveUp,
    });
  }, [snap.text, snap.font, snap.textColor, snap.bold, snap.curved, snap.curveUp]);

  const textTexture = useMemo(() => {
    if (!textCanvas) return null;
    const tex = new THREE.CanvasTexture(textCanvas);
    tex.needsUpdate = true;
    return tex;
  }, [textCanvas]);

  // ── Logo texture ────────────────────────────────────────────────────
  const [logoTexture, setLogoTexture] = useState(null);

  useEffect(() => {
    if (!snap.logo) {
      setLogoTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(snap.logo, (tex) => {
      tex.needsUpdate = true;
      setLogoTexture(tex);
    });
  }, [snap.logo]);

  // ── Which texture to show ───────────────────────────────────────────
  const activeTexture = snap.activeTab === "logo" ? logoTexture : textTexture;
  if (!activeTexture) return null;

  return (
    <mesh position={pos} rotation={pl.rotation} scale={[snap.size, snap.size, snap.size]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={activeTexture}
        transparent
        alphaTest={0.01}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
