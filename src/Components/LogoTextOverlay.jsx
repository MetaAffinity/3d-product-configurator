import React, { useMemo, useEffect, useRef, useState } from "react";
import { createPortal } from "@react-three/fiber";
import { Decal } from "@react-three/drei";
import { useSnapshot } from "valtio";
import * as THREE from "three";
import { logoTextState } from "../config/logoTextState";
import { createTextTexture } from "../utils/createTextTexture";
import { modelConfig } from "../config/models";

const FACE_DIR = {
  front:  new THREE.Vector3( 0,  0, -1),
  back:   new THREE.Vector3( 0,  0,  1),
  left:   new THREE.Vector3( 1,  0,  0),
  right:  new THREE.Vector3(-1,  0,  0),
  top:    new THREE.Vector3( 0, -1,  0),
  bottom: new THREE.Vector3( 0,  1,  0),
};

/**
 * Multi-overlay logo/text renderer.
 * Renders all placed items from logoTextState.items + a live preview of the
 * current editor content. Each item is portaled as a <Decal> into the
 * surface mesh found via raycast.
 */
export default function LogoTextOverlay({ modelGroupRef, modelName }) {
  const snap = useSnapshot(logoTextState);

  // Per-placement cache built after model loads
  const setupCache = useRef({});
  const [cacheReady, setCacheReady] = useState(0);

  // ── One-time setup ───────────────────────────────────────────────────────
  useEffect(() => {
    setupCache.current = {};
    setCacheReady(0);

    const t = setTimeout(() => {
      if (!modelGroupRef?.current) return;

      const meshes = [];
      modelGroupRef.current.traverse((child) => {
        if (child.isMesh && !(child.material instanceof THREE.ShadowMaterial) && !child.userData.isDesignOverlay) {
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
      const placementsCfg = cfg?.placements || {
        front: { dir: "front", rayHeight: 0.35 },
        back:  { dir: "back",  rayHeight: 0.35 },
      };

      Object.keys(placementsCfg).forEach((placementKey) => {
        const pc = placementsCfg[placementKey];
        const dir = FACE_DIR[pc.dir];
        if (!dir) return;

        const origin = wCenter.clone();
        const margin = Math.max(wSize.x, wSize.y, wSize.z) * 0.5 + 0.3;
        const rayY = worldBox.min.y + wSize.y * (pc.rayHeight ?? 0.5);

        switch (pc.dir) {
          case "front":  origin.z = worldBox.max.z + margin; origin.y = rayY; break;
          case "back":   origin.z = worldBox.min.z - margin; origin.y = rayY; break;
          case "left":   origin.x = worldBox.min.x - margin; origin.y = rayY; break;
          case "right":  origin.x = worldBox.max.x + margin; origin.y = rayY; break;
          case "top":    origin.y = worldBox.max.y + margin; break;
          case "bottom": origin.y = worldBox.min.y - margin; break;
          default: break;
        }

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
          hitMesh = meshes.reduce((a, b) =>
            (a.geometry?.attributes?.position?.count || 0) >=
            (b.geometry?.attributes?.position?.count || 0) ? a : b
          );
          worldNormal = dir.clone().negate();
          worldHit    = wCenter.clone();
          switch (pc.dir) {
            case "front":  worldHit.z = worldBox.max.z + 0.002; worldHit.y = rayY; break;
            case "back":   worldHit.z = worldBox.min.z - 0.002; worldHit.y = rayY; break;
            case "left":   worldHit.x = worldBox.min.x - 0.002; worldHit.y = rayY; break;
            case "right":  worldHit.x = worldBox.max.x + 0.002; worldHit.y = rayY; break;
            case "top":    worldHit.y = worldBox.max.y + 0.002; break;
            case "bottom": worldHit.y = worldBox.min.y - 0.002; break;
            default: break;
          }
        }

        const matInv    = hitMesh.matrixWorld.clone().invert();
        const localPos  = hitMesh.worldToLocal(worldHit.clone());

        const worldUp   = new THREE.Vector3(0, 1, 0);
        let wTangent    = new THREE.Vector3().crossVectors(worldUp, worldNormal);
        if (wTangent.lengthSq() < 0.001)
          wTangent.crossVectors(new THREE.Vector3(0, 0, 1), worldNormal);
        wTangent.normalize();
        const wBitangent = new THREE.Vector3()
          .crossVectors(worldNormal, wTangent).normalize();

        const localTangent   = wTangent.clone().transformDirection(matInv).normalize();
        const localBitangent = wBitangent.clone().transformDirection(matInv).normalize();

        const localNormal = worldNormal.clone().transformDirection(matInv).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          localNormal
        );
        const localRotation = new THREE.Euler().setFromQuaternion(quat);

        const meshWorldScale = new THREE.Vector3();
        hitMesh.getWorldScale(meshWorldScale);
        const avgScale = (meshWorldScale.x + meshWorldScale.y + meshWorldScale.z) / 3;

        const stepH = (pc.dir === "left" || pc.dir === "right")
          ? (wSize.z / avgScale) * 0.1
          : (wSize.x / avgScale) * 0.1;
        const stepV = (pc.dir === "top" || pc.dir === "bottom")
          ? (wSize.z / avgScale) * 0.1
          : (wSize.y / avgScale) * 0.1;

        setupCache.current[placementKey] = {
          hitMesh, localPos, localTangent, localBitangent,
          localRotation, avgScale, stepH, stepV,
        };
      });

      setCacheReady((n) => n + 1);
    }, 400);

    return () => clearTimeout(t);
  }, [modelGroupRef, modelName]);

  if (!cacheReady) return null;

  // Build list of overlays to render:
  // - All placed items (using saved values, or editor values if being edited)
  // - Live preview if creating new item with content
  const overlays = [];

  snap.items.forEach((item) => {
    if (item.id === snap.editingId) {
      // Render with current editor values for live editing
      overlays.push({ ...snap, _key: `item-${item.id}` });
    } else {
      overlays.push({ ...item, _key: `item-${item.id}` });
    }
  });

  // Live preview for new item (only when not editing existing)
  if (snap.editingId === null) {
    const hasPreviewContent =
      (snap.activeTab === "logo" && snap.logo) ||
      (snap.activeTab === "text" && snap.text.trim());
    if (hasPreviewContent) {
      overlays.push({ ...snap, _key: "preview" });
    }
  }

  return (
    <>
      {overlays.map((overlay) => (
        <DecalItem
          key={overlay._key}
          overlay={overlay}
          cache={setupCache.current}
        />
      ))}
    </>
  );
}

/**
 * Renders a single Decal for one overlay item.
 */
function DecalItem({ overlay, cache }) {
  const entry = cache[overlay.placement];

  // ── Text texture ──────────────────────────────────────────────────────
  const textCanvas = useMemo(() => {
    if (overlay.activeTab !== "text" || !overlay.text?.trim()) return null;
    return createTextTexture({
      text: overlay.text, font: overlay.font, textColor: overlay.textColor,
      bold: overlay.bold, curved: overlay.curved, curveUp: overlay.curveUp,
    });
  }, [overlay.activeTab, overlay.text, overlay.font, overlay.textColor,
      overlay.bold, overlay.curved, overlay.curveUp]);

  const textTexture = useMemo(() => {
    if (!textCanvas) return null;
    const tex = new THREE.CanvasTexture(textCanvas);
    tex.needsUpdate = true;
    return tex;
  }, [textCanvas]);

  // ── Logo texture ──────────────────────────────────────────────────────
  const [logoTexture, setLogoTexture] = useState(null);
  const logoSrc = overlay.activeTab === "logo" ? overlay.logo : null;
  useEffect(() => {
    if (!logoSrc) { setLogoTexture(null); return; }
    new THREE.TextureLoader().load(logoSrc, (tex) => {
      tex.needsUpdate = true;
      setLogoTexture(tex);
    });
  }, [logoSrc]);

  const activeTexture = overlay.activeTab === "logo" ? logoTexture : textTexture;

  // ── Position / scale / rotation ───────────────────────────────────────
  const localPos = useMemo(() => {
    if (!entry) return null;
    return entry.localPos.clone()
      .addScaledVector(entry.localTangent,   overlay.offsetX * entry.stepH)
      .addScaledVector(entry.localBitangent, overlay.offsetY * entry.stepV);
  }, [entry, overlay.offsetX, overlay.offsetY]);

  const localScale = useMemo(() => {
    if (!entry) return 0.1;
    return overlay.size / entry.avgScale;
  }, [entry, overlay.size]);

  const localRotation = useMemo(() => {
    if (!entry) return new THREE.Euler();
    const baseQuat = new THREE.Quaternion().setFromEuler(entry.localRotation);
    const localNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(baseQuat).normalize();
    const userQuat = new THREE.Quaternion().setFromAxisAngle(
      localNormal,
      (overlay.rotation * Math.PI) / 180
    );
    const combined = userQuat.multiply(baseQuat);
    return new THREE.Euler().setFromQuaternion(combined);
  }, [entry, overlay.rotation]);

  if (!activeTexture || !entry || !localPos) return null;

  return createPortal(
    <Decal
      position={localPos.toArray()}
      rotation={localRotation}
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
