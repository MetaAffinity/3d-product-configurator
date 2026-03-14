import React, { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { logoTextState } from "../config/logoTextState";
import { createTextTexture } from "../utils/createTextTexture";
import { modelConfig } from "../config/models";

// Preset face-ray directions used during the one-time setup raycast
const FACE_DIR = {
  front: new THREE.Vector3( 0,  0, -1),
  back:  new THREE.Vector3( 0,  0,  1),
  left:  new THREE.Vector3( 1,  0,  0),
  right: new THREE.Vector3(-1,  0,  0),
};

// Preset decal orientations matching the expected surface normal per face
const FACE_EULER = {
  front: new THREE.Euler(0,              0, 0),
  back:  new THREE.Euler(0,  Math.PI,       0),
  left:  new THREE.Euler(0, -Math.PI / 2,  0),
  right: new THREE.Euler(0,  Math.PI / 2,  0),
};

/**
 * Surface-conforming logo / text overlay using THREE.DecalGeometry.
 *
 * HOW IT WORKS
 * ─────────────
 * Setup (once per model, ~400 ms after mount):
 *   • For each placement the model exposes, fire a ray from outside toward
 *     the model to find the actual surface hit point and the hit mesh.
 *   • Convert the hit point to the hit mesh's LOCAL space (strips Float offset).
 *   • Derive tangent/bitangent axes (also in local space) from the face normal.
 *   • Cache { hitMesh, localPos, localTangent, localBitangent, stepH, stepV }.
 *
 * Rendering (per state-change, not per frame):
 *   • A dirty flag is raised whenever snap values change.
 *   • In useFrame, when dirty: compute the new world-space position (via
 *     localToWorld), build DecalGeometry, and attach the decal mesh as a
 *     THREE.js child of the hit mesh.
 *   • Because the decal mesh is a child of the hit mesh (which lives inside
 *     Float), it floats with the model automatically.
 *   • DecalGeometry vertices are baked in the hit mesh's local space and
 *     wrap around its curved surface — no flat-plane artifact.
 *   • Geometry is disposed and rebuilt only on state changes, not every frame.
 *
 * Y-height fix for front/back:
 *   • Collar/top protrudes furthest in Z, so a center-Y ray hits collar, not
 *     the flat chest area. We start the ray at 35% up from the bottom (≈ chest).
 */
export default function LogoTextOverlay({ modelGroupRef, modelName }) {
  const snap = useSnapshot(logoTextState);

  // Per-placement setup cache
  // { [placement]: { hitMesh, localPos, localTangent, localBitangent, stepH, stepV } }
  const setupCache = useRef({});

  // Single persistent decal mesh + material (geometry swapped on state change)
  const decalMeshRef = useRef(null);
  const decalMatRef  = useRef(null);

  // Dirty flag — set true whenever snap changes so useFrame rebuilds geometry once
  const dirty = useRef(true);

  // Track which hitMesh currently owns the decal so we can reparent if needed
  const currentParentRef = useRef(null);

  // ── Create the persistent decal mesh once ───────────────────────────────
  useEffect(() => {
    const mat = new THREE.MeshStandardMaterial({
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      roughness: 0.85,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
    mesh.renderOrder = 999;
    mesh.visible = false;
    decalMeshRef.current = mesh;
    decalMatRef.current  = mat;
    return () => {
      if (mesh.parent) mesh.parent.remove(mesh);
      mat.dispose();
      mesh.geometry.dispose();
    };
  }, []);

  // ── One-time setup: raycast per placement ───────────────────────────────
  useEffect(() => {
    setupCache.current = {};
    dirty.current = true;

    const t = setTimeout(() => {
      if (!modelGroupRef?.current) return;

      // Gather renderable meshes
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

        // Ray origin: outside the bbox on the relevant axis.
        // For front/back use 35% height (chest area) so collar doesn't intercept.
        const origin = wCenter.clone();
        const yChest = worldBox.min.y + wSize.y * 0.35;
        const margin = 0.5;
        if      (p === "front") { origin.z = worldBox.max.z + margin; origin.y = yChest; }
        else if (p === "back")  { origin.z = worldBox.min.z - margin; origin.y = yChest; }
        else if (p === "left")  { origin.x = worldBox.min.x - margin; }
        else if (p === "right") { origin.x = worldBox.max.x + margin; }

        raycaster.set(origin, dir);
        const hits = raycaster.intersectObjects(meshes, false);
        if (!hits.length) return;

        const hit      = hits[0];
        const hitMesh  = hit.object;

        // Face normal in world space
        const worldNormal = hit.face.normal.clone()
          .transformDirection(hitMesh.matrixWorld)
          .normalize();

        // Tiny outward nudge so the decal sits just above the surface
        const worldHit = hit.point.clone().addScaledVector(worldNormal, 0.001);

        // Convert to hit mesh LOCAL space so the position is Float-immune
        const localPos = hitMesh.worldToLocal(worldHit.clone());

        // Tangent/bitangent in local space for pad-offset movement
        // Derive from world-space face normal → bring to local space
        const worldUp     = new THREE.Vector3(0, 1, 0);
        let   worldTangent = new THREE.Vector3().crossVectors(worldUp, worldNormal);
        if (worldTangent.lengthSq() < 0.001) {
          worldTangent.crossVectors(new THREE.Vector3(0, 0, 1), worldNormal);
        }
        worldTangent.normalize();
        const worldBitangent = new THREE.Vector3()
          .crossVectors(worldNormal, worldTangent)
          .normalize();

        // Bring tangent/bitangent to hit mesh local space (direction only, no translate)
        const matInv = hitMesh.matrixWorld.clone().invert();
        const localTangent = worldTangent.clone()
          .transformDirection(matInv).normalize();
        const localBitangent = worldBitangent.clone()
          .transformDirection(matInv).normalize();

        // Adaptive step: 10% of the model's relevant bbox dimension per pad unit
        const stepH = (p === "left" || p === "right") ? wSize.z * 0.1 : wSize.x * 0.1;
        const stepV = wSize.y * 0.1;

        setupCache.current[p] = {
          hitMesh, localPos, localTangent, localBitangent, stepH, stepV,
        };
      });

      dirty.current = true;
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

  // Raise dirty flag whenever anything visual changes
  useEffect(() => { dirty.current = true; },
    [snap.offsetX, snap.offsetY, snap.placement, snap.size, activeTexture]);

  // ── Per-frame: rebuild decal when dirty ──────────────────────────────────
  useFrame(() => {
    const decalMesh = decalMeshRef.current;
    const decalMat  = decalMatRef.current;
    if (!decalMesh || !decalMat) return;

    if (!activeTexture) {
      decalMesh.visible = false;
      return;
    }

    if (!dirty.current) return;
    dirty.current = false;

    const entry = setupCache.current[snap.placement];
    if (!entry) { decalMesh.visible = false; return; }

    const { hitMesh, localPos, localTangent, localBitangent, stepH, stepV } = entry;

    // Compute new local-space position with pad offset applied
    const localWithOffset = localPos.clone()
      .addScaledVector(localTangent,   snap.offsetX * stepH)
      .addScaledVector(localBitangent, snap.offsetY * stepV);

    // Convert to world space for DecalGeometry (uses hitMesh.matrixWorld internally,
    // which it then immediately inverts — round-trip cancel, Float-immune).
    const worldPos = hitMesh.localToWorld(localWithOffset.clone());

    // Build the surface-conforming decal geometry
    let geo;
    try {
      geo = new DecalGeometry(
        hitMesh,
        worldPos,
        FACE_EULER[snap.placement] || new THREE.Euler(),
        new THREE.Vector3(snap.size, snap.size, snap.size),
      );
    } catch (e) {
      console.warn("DecalGeometry failed:", e);
      decalMesh.visible = false;
      return;
    }

    // Reparent decal to the hit mesh if placement/model changed
    if (currentParentRef.current !== hitMesh) {
      if (currentParentRef.current) currentParentRef.current.remove(decalMesh);
      hitMesh.add(decalMesh);
      // Identity transform — geometry is already in hitMesh local space
      decalMesh.position.set(0, 0, 0);
      decalMesh.rotation.set(0, 0, 0);
      decalMesh.scale.set(1, 1, 1);
      currentParentRef.current = hitMesh;
    }

    // Swap geometry, dispose old
    const oldGeo = decalMesh.geometry;
    decalMesh.geometry = geo;
    if (oldGeo && oldGeo !== geo) oldGeo.dispose();

    // Update material map
    decalMat.map = activeTexture;
    decalMat.needsUpdate = true;

    decalMesh.visible = true;
  });

  // This component renders nothing into JSX — the decal mesh is managed imperatively
  return null;
}
