import React, { useMemo, useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { logoTextState } from "../config/logoTextState";
import { createTextTexture } from "../utils/createTextTexture";

// Reusable THREE objects — avoid per-frame allocation
const _pos = new THREE.Vector3();

/**
 * Logo / Text overlay — robust multi-model strategy:
 *
 *   1. After each model loads, compute the world-space bounding box ONCE and
 *      convert it to the modelGroupRef group's LOCAL space (worldToLocal).
 *      Since Float is a pure translation, worldToLocal cancels it out — the
 *      resulting local bbox is identical at every Float animation frame.
 *      This cached box never drifts.
 *
 *   2. In useFrame, read the cached local bbox and place the plane at the
 *      chosen face (front/back/left/right) in LOCAL space. No raycasting,
 *      no per-frame bbox work — just a few vector ops.
 *
 *   3. The overlay is a sibling of the model inside the Float group, so it
 *      floats naturally without any tracking.
 *
 *   4. The 2D drag-pad offsets (offsetX/offsetY) slide the logo along the
 *      correct surface axes of each face (horizontal / vertical), scaled
 *      relative to the model's own dimensions — works for any model size.
 */
export default function LogoTextOverlay({ modelGroupRef, modelName }) {
  const snap    = useSnapshot(logoTextState);
  const meshRef = useRef();

  // Bounding box in modelGroupRef LOCAL space — stable across Float animation
  const localBox = useRef(null);

  useEffect(() => {
    localBox.current = null; // invalidate on model switch
    const t = setTimeout(() => {
      if (!modelGroupRef?.current) return;

      // World bbox → local bbox (strips Float's current Y offset)
      const worldBox = new THREE.Box3().setFromObject(modelGroupRef.current);
      const lMin = modelGroupRef.current.worldToLocal(worldBox.min.clone());
      const lMax = modelGroupRef.current.worldToLocal(worldBox.max.clone());

      // worldToLocal can invert axes — re-normalise so min < max on every axis
      localBox.current = new THREE.Box3(
        new THREE.Vector3(
          Math.min(lMin.x, lMax.x),
          Math.min(lMin.y, lMax.y),
          Math.min(lMin.z, lMax.z),
        ),
        new THREE.Vector3(
          Math.max(lMin.x, lMax.x),
          Math.max(lMin.y, lMax.y),
          Math.max(lMin.z, lMax.z),
        ),
      );
    }, 400);
    return () => clearTimeout(t);
  }, [modelGroupRef, modelName]);

  // ── Text texture ──────────────────────────────────────────────────────────
  const textCanvas = useMemo(() => {
    if (!snap.text.trim()) return null;
    return createTextTexture({
      text:      snap.text,
      font:      snap.font,
      textColor: snap.textColor,
      bold:      snap.bold,
      curved:    snap.curved,
      curveUp:   snap.curveUp,
    });
  }, [snap.text, snap.font, snap.textColor, snap.bold, snap.curved, snap.curveUp]);

  const textTexture = useMemo(() => {
    if (!textCanvas) return null;
    const tex = new THREE.CanvasTexture(textCanvas);
    tex.needsUpdate = true;
    return tex;
  }, [textCanvas]);

  // ── Logo texture ──────────────────────────────────────────────────────────
  const [logoTexture, setLogoTexture] = useState(null);
  useEffect(() => {
    if (!snap.logo) { setLogoTexture(null); return; }
    new THREE.TextureLoader().load(snap.logo, (tex) => {
      tex.needsUpdate = true;
      setLogoTexture(tex);
    });
  }, [snap.logo]);

  const activeTexture = snap.activeTab === "logo" ? logoTexture : textTexture;

  // ── Per-frame placement ───────────────────────────────────────────────────
  useFrame(() => {
    if (!meshRef.current || !activeTexture || !localBox.current) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    const box = localBox.current;
    const cx = (box.min.x + box.max.x) / 2;
    const cy = (box.min.y + box.max.y) / 2;
    const cz = (box.min.z + box.max.z) / 2;

    // Offset step: relative to model's own bbox size so it works for every
    // model regardless of scale. Max pad travel (±3) = ±30% of that dimension.
    const stepH = (box.max.x - box.min.x) * 0.1; // horizontal step
    const stepV = (box.max.y - box.min.y) * 0.1; // vertical step
    const stepD = (box.max.z - box.min.z) * 0.1; // depth-axis step (left/right faces)

    const eps = 0.003; // tiny outward offset to prevent z-fighting

    switch (snap.placement) {
      case "back":
        _pos.set(cx + snap.offsetX * stepH, cy + snap.offsetY * stepV, box.min.z - eps);
        meshRef.current.position.copy(_pos);
        meshRef.current.rotation.set(0, Math.PI, 0);
        break;

      case "left":
        // offsetX slides along Z (depth axis of this face), offsetY along Y
        _pos.set(box.min.x - eps, cy + snap.offsetY * stepV, cz - snap.offsetX * stepD);
        meshRef.current.position.copy(_pos);
        meshRef.current.rotation.set(0, -Math.PI / 2, 0);
        break;

      case "right":
        _pos.set(box.max.x + eps, cy + snap.offsetY * stepV, cz + snap.offsetX * stepD);
        meshRef.current.position.copy(_pos);
        meshRef.current.rotation.set(0, Math.PI / 2, 0);
        break;

      default: // front
        _pos.set(cx + snap.offsetX * stepH, cy + snap.offsetY * stepV, box.max.z + eps);
        meshRef.current.position.copy(_pos);
        meshRef.current.rotation.set(0, 0, 0);
    }

    meshRef.current.scale.setScalar(snap.size);
    meshRef.current.visible = true;
  });

  if (!activeTexture) return null;

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        map={activeTexture}
        transparent
        alphaTest={0.005}
        depthWrite={false}
        roughness={0.85}
        metalness={0}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}
