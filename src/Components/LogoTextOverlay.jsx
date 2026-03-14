import React, { useMemo, useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { logoTextState } from "../config/logoTextState";
import { createTextTexture } from "../utils/createTextTexture";
import { modelConfig } from "../config/models";

const FACE_DIR = {
  front: new THREE.Vector3( 0,  0, -1),
  back:  new THREE.Vector3( 0,  0,  1),
  left:  new THREE.Vector3( 1,  0,  0),
  right: new THREE.Vector3(-1,  0,  0),
};

const FACE_EULER = {
  front: new THREE.Euler(0,              0, 0),
  back:  new THREE.Euler(0,  Math.PI,       0),
  left:  new THREE.Euler(0, -Math.PI / 2,  0),
  right: new THREE.Euler(0,  Math.PI / 2,  0),
};

// Per-frame reusable vectors
const _pos = new THREE.Vector3();
const _lk  = new THREE.Vector3();
const _n   = new THREE.Vector3();

export default function LogoTextOverlay({ modelGroupRef, modelName }) {
  const snap = useSnapshot(logoTextState);

  // JSX mesh ref — used as flat-plane fallback (always rendered; hidden when decal works)
  const meshRef = useRef();

  // Imperative decal mesh added as child of hit mesh for surface-conforming rendering
  const decalMeshRef   = useRef(null);
  const decalMatRef    = useRef(null);
  const currentParent  = useRef(null);

  // Per-placement setup cache
  // { [p]: { hitMesh, localPos, localTangent, localBitangent, stepH, stepV } }
  const setupCache = useRef({});

  // Dirty flag — do NOT consume until ALL preconditions are met
  const dirty = useRef(true);

  // ── Create persistent imperative decal mesh (once) ───────────────────────
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
    // Hide fallback plane on model switch until ready
    if (meshRef.current) meshRef.current.visible = false;
    if (decalMeshRef.current) decalMeshRef.current.visible = false;

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

        // Shoot ray from outside bbox toward model center on each face axis.
        // For front/back use 35% height to target chest, not protruding collar.
        const origin = wCenter.clone();
        const yChest = worldBox.min.y + wSize.y * 0.35;
        const margin = Math.max(wSize.x, wSize.y, wSize.z) * 0.5 + 0.3;

        if      (p === "front") { origin.z = worldBox.max.z + margin; origin.y = yChest; }
        else if (p === "back")  { origin.z = worldBox.min.z - margin; origin.y = yChest; }
        else if (p === "left")  { origin.x = worldBox.min.x - margin; }
        else if (p === "right") { origin.x = worldBox.max.x + margin; }

        raycaster.set(origin, dir);
        const hits = raycaster.intersectObjects(meshes, false);

        let hitMesh, localPos, worldNormal;

        if (hits.length > 0) {
          const hit = hits[0];
          hitMesh = hit.object;
          worldNormal = hit.face.normal.clone()
            .transformDirection(hitMesh.matrixWorld)
            .normalize();
          const worldHit = hit.point.clone().addScaledVector(worldNormal, 0.001);
          localPos = hitMesh.worldToLocal(worldHit.clone());
        } else {
          // Fallback: bbox face centre — pick the mesh with most vertices as target
          hitMesh = meshes.reduce((a, b) =>
            (a.geometry?.attributes?.position?.count || 0) >=
            (b.geometry?.attributes?.position?.count || 0) ? a : b
          );
          // Use face direction as the outward normal
          worldNormal = dir.clone().negate();
          const fbWorld = wCenter.clone();
          if      (p === "front") fbWorld.z = worldBox.max.z + 0.002;
          else if (p === "back")  fbWorld.z = worldBox.min.z - 0.002;
          else if (p === "left")  fbWorld.x = worldBox.min.x - 0.002;
          else if (p === "right") fbWorld.x = worldBox.max.x + 0.002;
          if (p === "front" || p === "back") fbWorld.y = yChest;
          localPos = hitMesh.worldToLocal(fbWorld.clone());
        }

        // Build tangent/bitangent in hit mesh local space for pad offsets
        const worldUp = new THREE.Vector3(0, 1, 0);
        let wTangent = new THREE.Vector3().crossVectors(worldUp, worldNormal);
        if (wTangent.lengthSq() < 0.001) {
          wTangent.crossVectors(new THREE.Vector3(0, 0, 1), worldNormal);
        }
        wTangent.normalize();
        const wBitangent = new THREE.Vector3()
          .crossVectors(worldNormal, wTangent)
          .normalize();

        const matInv = hitMesh.matrixWorld.clone().invert();
        const localTangent   = wTangent.clone().transformDirection(matInv).normalize();
        const localBitangent = wBitangent.clone().transformDirection(matInv).normalize();

        // Adaptive step — 10% of model bbox dimension per pad unit (range ±3 → ±30%)
        const stepH = (p === "left" || p === "right") ? wSize.z * 0.1 : wSize.x * 0.1;
        const stepV = wSize.y * 0.1;

        // Also store world-space data for the flat-plane fallback
        const worldCenterForFallback = wCenter.clone();
        if (p === "front" || p === "back") worldCenterForFallback.y = yChest;

        setupCache.current[p] = {
          hitMesh, localPos, localTangent, localBitangent, stepH, stepV,
          // fallback flat-plane data (world-space, for meshRef)
          fbWorldCenter: worldCenterForFallback,
          fbWorldNormal: worldNormal.clone(),
          stepHw: stepH, stepVw: stepV,
          wTangent: wTangent.clone(), wBitangent: wBitangent.clone(),
        };
      });

      dirty.current = true; // signal useFrame to (re-)build
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

  // Raise dirty flag on any visual state change
  useEffect(() => { dirty.current = true; },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snap.offsetX, snap.offsetY, snap.placement, snap.size, activeTexture]);

  // ── Per-frame: rebuild when dirty ────────────────────────────────────────
  useFrame(() => {
    // ── Hide everything if no texture ──
    if (!activeTexture) {
      if (meshRef.current)      meshRef.current.visible = false;
      if (decalMeshRef.current) decalMeshRef.current.visible = false;
      return;
    }

    // Wait until dirty AND setup cache has the required entry
    // (do NOT consume dirty until we can actually process it)
    if (!dirty.current) return;
    const entry = setupCache.current[snap.placement];
    if (!entry) return; // retry next frame

    dirty.current = false; // consume only now

    const {
      hitMesh, localPos, localTangent, localBitangent, stepH, stepV,
      fbWorldCenter, fbWorldNormal, wTangent, wBitangent,
    } = entry;

    // Compute local-space position with pad offset
    const localWithOffset = localPos.clone()
      .addScaledVector(localTangent,   snap.offsetX * stepH)
      .addScaledVector(localBitangent, snap.offsetY * stepV);

    // ── Try DecalGeometry (surface-conforming) ──
    let decalOk = false;
    const decalMesh = decalMeshRef.current;
    const decalMat  = decalMatRef.current;

    if (decalMesh && decalMat) {
      try {
        const worldPos = hitMesh.localToWorld(localWithOffset.clone());
        const geo = new DecalGeometry(
          hitMesh,
          worldPos,
          FACE_EULER[snap.placement] || new THREE.Euler(),
          new THREE.Vector3(snap.size, snap.size, snap.size),
        );

        // Verify geometry is non-empty
        if (geo.attributes.position && geo.attributes.position.count > 0) {
          // Reparent to hit mesh if needed
          if (currentParent.current !== hitMesh) {
            if (currentParent.current) currentParent.current.remove(decalMesh);
            hitMesh.add(decalMesh);
            decalMesh.position.set(0, 0, 0);
            decalMesh.rotation.set(0, 0, 0);
            decalMesh.scale.set(1, 1, 1);
            currentParent.current = hitMesh;
          }

          const oldGeo = decalMesh.geometry;
          decalMesh.geometry = geo;
          if (oldGeo && oldGeo !== geo) oldGeo.dispose();

          decalMat.map = activeTexture;
          decalMat.needsUpdate = true;
          decalMesh.visible = true;
          decalOk = true;
        } else {
          geo.dispose();
        }
      } catch (_) {
        // DecalGeometry failed — fall through to flat-plane fallback
      }
    }

    // Hide decal if it didn't work
    if (!decalOk && decalMesh) decalMesh.visible = false;

    // ── Flat-plane fallback (always works) ──
    // Shown only when decal failed; kept up to date either way.
    if (meshRef.current) {
      // Compute world-space position for flat plane
      const worldOffset = fbWorldCenter.clone()
        .addScaledVector(wTangent,   snap.offsetX * stepH)
        .addScaledVector(wBitangent, snap.offsetY * stepV);

      // Normal offset tiny nudge
      worldOffset.addScaledVector(fbWorldNormal, 0.003);

      // Convert to modelGroupRef local space (Float-immune)
      const localFb = modelGroupRef.current
        ? modelGroupRef.current.worldToLocal(worldOffset.clone())
        : worldOffset;

      meshRef.current.position.copy(localFb);

      // Orient plane to face the surface normal
      _lk.copy(localFb).add(fbWorldNormal);
      meshRef.current.lookAt(
        modelGroupRef.current
          ? modelGroupRef.current.worldToLocal(_lk.clone().add(meshRef.current.parent?.position || new THREE.Vector3()))
          : _lk
      );
      // Simpler orientation: just use preset rotation
      meshRef.current.rotation.set(
        ...(FACE_EULER[snap.placement]
          ? [FACE_EULER[snap.placement].x, FACE_EULER[snap.placement].y, FACE_EULER[snap.placement].z]
          : [0, 0, 0])
      );

      meshRef.current.scale.setScalar(snap.size);
      meshRef.current.visible = !decalOk; // show fallback only when decal failed
    }
  });

  // Always render the fallback mesh (hidden by default); decal is imperative
  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        map={activeTexture || undefined}
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
