import React, { useMemo, useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { logoTextState } from "../config/logoTextState";
import { createTextTexture } from "../utils/createTextTexture";
import { modelConfig } from "../config/models";

// Reusable per-frame objects
const _pos = new THREE.Vector3();
const _tangent   = new THREE.Vector3();
const _bitangent = new THREE.Vector3();
const _euler     = new THREE.Euler();

/**
 * Logo / Text overlay — correct multi-model strategy:
 *
 * SETUP (once per model load, ~400 ms after mount):
 *   For every placement the model defines, fire a ray from outside the model
 *   toward its world-space center in the expected face direction.
 *   The hit point is converted to modelGroupRef LOCAL space via worldToLocal.
 *   Since Float is a pure translation, worldToLocal cancels the Float offset —
 *   the cached position is identical at every animation frame.
 *
 *   Why one-time raycast instead of bbox face?
 *   Bbox face center is in mid-air for non-box shapes (shoes, rockets, etc.).
 *   The ray finds the ACTUAL surface point for any model geometry.
 *
 * RENDER (per frame, zero cost):
 *   Read cached local-space position + preset face rotation.
 *   Apply pad offset along the face's own X/Y axes (tangent/bitangent derived
 *   from the preset rotation). No ray fired, no bbox work.
 *
 * FALLBACK:
 *   If a ray misses (placement ray doesn't intersect this model), fall back to
 *   the bbox face centre so something is always shown.
 */

// Preset face directions for raycasting: [ray-origin offset, ray direction]
// origin = model center + this offset (scaled by bbox size), dir = unit direction
const FACE_RAY = {
  front: { dir: new THREE.Vector3( 0,  0, -1), originAxis: "max.z", side:  1 },
  back:  { dir: new THREE.Vector3( 0,  0,  1), originAxis: "min.z", side: -1 },
  left:  { dir: new THREE.Vector3( 1,  0,  0), originAxis: "min.x", side: -1 },
  right: { dir: new THREE.Vector3(-1,  0,  0), originAxis: "max.x", side:  1 },
};

// Preset rotation (Euler) each face uses so the plane faces outward correctly
const FACE_ROTATION = {
  front: [0,              0,            0],
  back:  [0,  Math.PI,                  0],
  left:  [0, -Math.PI / 2,              0],
  right: [0,  Math.PI / 2,              0],
};

export default function LogoTextOverlay({ modelGroupRef, modelName }) {
  const snap    = useSnapshot(logoTextState);
  const meshRef = useRef();

  // cached: { front: { pos: Vector3, stepH, stepV }, back: {...}, ... }
  const cache = useRef({});

  // ── One-time setup after model loads ────────────────────────────────────
  useEffect(() => {
    cache.current = {};
    const t = setTimeout(() => {
      if (!modelGroupRef?.current) return;

      // Collect all renderable meshes (exclude shadow plane)
      const meshes = [];
      modelGroupRef.current.traverse((child) => {
        if (child.isMesh && !(child.material instanceof THREE.ShadowMaterial)) {
          meshes.push(child);
        }
      });
      if (meshes.length === 0) return;

      // World-space bounding box and center
      const worldBox = new THREE.Box3().setFromObject(modelGroupRef.current);
      const wCenter  = new THREE.Vector3();
      worldBox.getCenter(wCenter);
      const wSize    = new THREE.Vector3();
      worldBox.getSize(wSize);

      const raycaster = new THREE.Raycaster();
      const cfg = modelConfig[modelName];
      const placements = cfg?.decalPositions ? Object.keys(cfg.decalPositions) : Object.keys(FACE_RAY);

      placements.forEach((p) => {
        const face = FACE_RAY[p];
        if (!face) return;

        // Fire ray from well outside the model toward its centre on this axis.
        // We shoot FROM the face outward so we hit the OUTER surface, not inner.
        const origin = wCenter.clone();
        // Move origin to outside the bbox on the relevant axis + a margin
        const margin = 0.5;
        if      (p === "front") origin.z = worldBox.max.z + margin;
        else if (p === "back")  origin.z = worldBox.min.z - margin;
        else if (p === "left")  origin.x = worldBox.min.x - margin;
        else if (p === "right") origin.x = worldBox.max.x + margin;

        raycaster.set(origin, face.dir);
        const hits = raycaster.intersectObjects(meshes, false);

        let localPos;
        if (hits.length > 0) {
          // Surface hit — convert world hit point to modelGroupRef local space.
          // Use the FACE normal direction (not raw hit normal) for a tiny outward
          // offset so the plane never clips through the model.
          const outward = face.dir.clone().negate(); // direction away from model
          const worldHit = hits[0].point.clone().addScaledVector(outward, 0.003);
          localPos = modelGroupRef.current.worldToLocal(worldHit);
        } else {
          // Fallback: bbox face centre in local space
          const fbWorld = wCenter.clone();
          if      (p === "front") fbWorld.z = worldBox.max.z + 0.002;
          else if (p === "back")  fbWorld.z = worldBox.min.z - 0.002;
          else if (p === "left")  fbWorld.x = worldBox.min.x - 0.002;
          else if (p === "right") fbWorld.x = worldBox.max.x + 0.002;
          localPos = modelGroupRef.current.worldToLocal(fbWorld);
        }

        // Convert bbox size to local-space step for the pad offset.
        // Max pad travel (±3 units) = ±30% of the relevant face dimension.
        const localBox = new THREE.Box3();
        const lMin = modelGroupRef.current.worldToLocal(worldBox.min.clone());
        const lMax = modelGroupRef.current.worldToLocal(worldBox.max.clone());
        const localW = Math.abs(lMax.x - lMin.x);
        const localH = Math.abs(lMax.y - lMin.y);
        const localD = Math.abs(lMax.z - lMin.z);

        // stepH = horizontal movement per pad unit, stepV = vertical
        const stepH = (p === "left" || p === "right")
          ? localD * 0.1   // on side faces, horizontal = Z depth
          : localW * 0.1;  // on front/back, horizontal = X width
        const stepV = localH * 0.1;

        cache.current[p] = { pos: localPos, stepH, stepV };
      });
    }, 400);
    return () => clearTimeout(t);
  }, [modelGroupRef, modelName]);

  // ── Text texture ─────────────────────────────────────────────────────────
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

  // ── Per-frame render — zero raycasting cost ──────────────────────────────
  useFrame(() => {
    if (!meshRef.current || !activeTexture) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    const entry = cache.current[snap.placement];
    if (!entry) {
      meshRef.current.visible = false;
      return;
    }

    const { pos, stepH, stepV } = entry;
    const rot = FACE_ROTATION[snap.placement] || [0, 0, 0];

    // Derive the face's own axes from its rotation so the pad always
    // moves the logo along the surface, not through it.
    _euler.set(...rot);
    _tangent.set(1, 0, 0).applyEuler(_euler);   // horizontal on this face
    _bitangent.set(0, 1, 0).applyEuler(_euler); // vertical on this face

    _pos
      .copy(pos)
      .addScaledVector(_tangent,   snap.offsetX * stepH)
      .addScaledVector(_bitangent, snap.offsetY * stepV);

    meshRef.current.position.copy(_pos);
    meshRef.current.rotation.set(...rot);
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
