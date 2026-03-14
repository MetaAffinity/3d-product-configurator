import React, { useMemo, useEffect, useRef, useState } from "react";
import { createPortal } from "@react-three/fiber";
import { Decal } from "@react-three/drei";
import { useSnapshot } from "valtio";
import * as THREE from "three";
import { logoTextState } from "../config/logoTextState";
import { createTextTexture } from "../utils/createTextTexture";
import { modelConfig } from "../config/models";

const FACE_DIR = {
  front: new THREE.Vector3( 0,  0, -1),
  back:  new THREE.Vector3( 0,  0,  1),
  left:  new THREE.Vector3( 1,  0,  0),
  right: new THREE.Vector3(-1,  0,  0),
};

/**
 * Surface-conforming logo/text overlay.
 *
 * Strategy:
 *  1. One-time setup (400 ms after mount): raycast per placement to find the
 *     actual surface hit mesh + hit point. Convert everything to HIT MESH
 *     LOCAL SPACE — this is Float-immune because Float is a pure translation
 *     and worldToLocal cancels it.
 *  2. Use R3F createPortal to render drei's <Decal> directly INSIDE the hit
 *     mesh's Three.js object. The <Decal> component reads its parent mesh from
 *     the Three.js hierarchy and bakes DecalGeometry onto its surface.
 *     Because <Decal> is a child of the hit mesh, it floats with the model
 *     automatically — no per-frame tracking needed.
 *  3. The 2D pad offsetX/Y slides localPos along the surface tangent/bitangent
 *     (computed in mesh local space), keeping movement on-surface.
 *  4. scale = snap.size / meshWorldScale so the world-unit size slider maps
 *     correctly to the mesh's local coordinate system.
 */
export default function LogoTextOverlay({ modelGroupRef, modelName }) {
  const snap = useSnapshot(logoTextState);

  // Per-placement cache built after model loads
  const setupCache = useRef({});
  const [cacheReady, setCacheReady] = useState(0); // bump to force re-render

  // ── One-time setup ───────────────────────────────────────────────────────
  useEffect(() => {
    setupCache.current = {};
    setCacheReady(0);

    const t = setTimeout(() => {
      if (!modelGroupRef?.current) return;

      const meshes = [];
      modelGroupRef.current.traverse((child) => {
        if (child.isMesh && !(child.material instanceof THREE.ShadowMaterial)) {
          meshes.push(child);
        }
      });
      if (!meshes.length) return;

      const worldBox = new THREE.Box3().setFromObject(modelGroupRef.current);
      const wCenter  = new THREE.Vector3();
      const wSize    = new THREE.Vector3();
      worldBox.getCenter(wCenter);
      worldBox.getSize(wSize);

      const raycaster = new THREE.Raycaster();
      const cfg = modelConfig[modelName];
      const placements = cfg?.decalPositions
        ? Object.keys(cfg.decalPositions)
        : Object.keys(FACE_DIR);

      placements.forEach((p) => {
        const dir = FACE_DIR[p];
        if (!dir) return;

        // Front/back: aim at 35% height (chest area, not collar)
        const origin = wCenter.clone();
        const yChest = worldBox.min.y + wSize.y * 0.35;
        const margin = Math.max(wSize.x, wSize.y, wSize.z) * 0.5 + 0.3;

        if      (p === "front") { origin.z = worldBox.max.z + margin; origin.y = yChest; }
        else if (p === "back")  { origin.z = worldBox.min.z - margin; origin.y = yChest; }
        else if (p === "left")  { origin.x = worldBox.min.x - margin; }
        else if (p === "right") { origin.x = worldBox.max.x + margin; }

        raycaster.set(origin, dir);
        const hits = raycaster.intersectObjects(meshes, false);

        let hitMesh, worldNormal, worldHit;

        if (hits.length > 0) {
          const hit   = hits[0];
          hitMesh     = hit.object;
          worldNormal = hit.face.normal.clone()
            .transformDirection(hitMesh.matrixWorld).normalize();
          worldHit    = hit.point.clone().addScaledVector(worldNormal, 0.002);
        } else {
          // Fallback: largest mesh + bbox face centre
          hitMesh = meshes.reduce((a, b) =>
            (a.geometry?.attributes?.position?.count || 0) >=
            (b.geometry?.attributes?.position?.count || 0) ? a : b
          );
          worldNormal = dir.clone().negate();
          worldHit    = wCenter.clone();
          if      (p === "front") { worldHit.z = worldBox.max.z + 0.002; worldHit.y = yChest; }
          else if (p === "back")  { worldHit.z = worldBox.min.z - 0.002; worldHit.y = yChest; }
          else if (p === "left")  worldHit.x = worldBox.min.x - 0.002;
          else if (p === "right") worldHit.x = worldBox.max.x + 0.002;
        }

        // Convert to hit mesh LOCAL space (Float-immune)
        const matInv    = hitMesh.matrixWorld.clone().invert();
        const localPos  = hitMesh.worldToLocal(worldHit.clone());

        // Tangent/bitangent in mesh local space for pad offset
        const worldUp   = new THREE.Vector3(0, 1, 0);
        let wTangent    = new THREE.Vector3().crossVectors(worldUp, worldNormal);
        if (wTangent.lengthSq() < 0.001)
          wTangent.crossVectors(new THREE.Vector3(0, 0, 1), worldNormal);
        wTangent.normalize();
        const wBitangent = new THREE.Vector3()
          .crossVectors(worldNormal, wTangent).normalize();

        const localTangent   = wTangent.clone().transformDirection(matInv).normalize();
        const localBitangent = wBitangent.clone().transformDirection(matInv).normalize();

        // Decal rotation in mesh local space — orient stamp box along surface normal
        const localNormal = worldNormal.clone().transformDirection(matInv).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          localNormal
        );
        const localRotation = new THREE.Euler().setFromQuaternion(quat);

        // Mesh world scale — needed to convert snap.size (world units) → local units
        const meshWorldScale = new THREE.Vector3();
        hitMesh.getWorldScale(meshWorldScale);
        const avgScale = (meshWorldScale.x + meshWorldScale.y + meshWorldScale.z) / 3;

        // Adaptive pad step in mesh local space units
        const stepH = (p === "left" || p === "right")
          ? (wSize.z / avgScale) * 0.1
          : (wSize.x / avgScale) * 0.1;
        const stepV = (wSize.y / avgScale) * 0.1;

        setupCache.current[p] = {
          hitMesh, localPos, localTangent, localBitangent,
          localRotation, avgScale, stepH, stepV,
        };
      });

      setCacheReady((n) => n + 1);
    }, 400);

    return () => clearTimeout(t);
  }, [modelGroupRef, modelName]);

  // ── Text texture ─────────────────────────────────────────────────────────
  const textCanvas = useMemo(() => {
    if (!snap.text.trim()) return null;
    return createTextTexture({
      text: snap.text, font: snap.font, textColor: snap.textColor,
      bold: snap.bold, curved: snap.curved, curveUp: snap.curveUp,
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

  // ── Current placement data ───────────────────────────────────────────────
  const entry = setupCache.current[snap.placement];

  // Local-space position with 2D pad offset applied
  const localPos = useMemo(() => {
    if (!entry) return null;
    return entry.localPos.clone()
      .addScaledVector(entry.localTangent,   snap.offsetX * entry.stepH)
      .addScaledVector(entry.localBitangent, snap.offsetY * entry.stepV);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, snap.offsetX, snap.offsetY, cacheReady]);

  // Local-space scale (snap.size is in world units; convert to mesh local units)
  const localScale = useMemo(() => {
    if (!entry) return 0.1;
    return snap.size / entry.avgScale;
  }, [entry, snap.size]);

  // Rotation around surface normal — combines base orientation with user rotation
  const localRotation = useMemo(() => {
    if (!entry) return new THREE.Euler();
    const baseQuat = new THREE.Quaternion().setFromEuler(entry.localRotation);
    // Compute local normal from localRotation (Z axis of the base quaternion)
    const localNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(baseQuat).normalize();
    const userQuat = new THREE.Quaternion().setFromAxisAngle(
      localNormal,
      (snap.rotation * Math.PI) / 180
    );
    const combined = userQuat.multiply(baseQuat);
    return new THREE.Euler().setFromQuaternion(combined);
  }, [entry, snap.rotation]);

  if (!activeTexture || !entry || !localPos) return null;

  // Portal the <Decal> INTO the hit mesh.
  // createPortal renders the element as a child of entry.hitMesh in the
  // Three.js scene graph. <Decal> from drei uses its parent mesh to build
  // DecalGeometry — so the decal bakes perfectly onto that mesh's surface.
  // Since <Decal> is a child of the hit mesh, it moves with Float for free.
  return createPortal(
    <Decal
      position={localPos.toArray()}
      rotation={localRotation}
      // XY = visual size in local units; Z = stamp depth — 1.5× captures
      // curved surface geometry without punching through to the back face.
      scale={[localScale, localScale, localScale * 1.5]}
    >
      <meshStandardMaterial
        map={activeTexture}
        transparent
        alphaTest={0.01}
        depthWrite={false}
        roughness={0.85}
        metalness={0}
        polygonOffset
        polygonOffsetFactor={-4}
        polygonOffsetUnits={-4}
      />
    </Decal>,
    entry.hitMesh
  );
}
