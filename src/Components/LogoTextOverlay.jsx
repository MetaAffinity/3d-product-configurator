import React, { useMemo, useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { logoTextState } from "../config/logoTextState";
import { createTextTexture } from "../utils/createTextTexture";

// Reusable THREE objects — avoid per-frame allocation
const _box       = new THREE.Box3();
const _center    = new THREE.Vector3();
const _size      = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _rayOrigin = new THREE.Vector3();
const _rayDir    = new THREE.Vector3();
const _normal    = new THREE.Vector3();
const _lookAt    = new THREE.Vector3();

export default function LogoTextOverlay({ modelGroupRef, modelName }) {
  const snap     = useSnapshot(logoTextState);
  const meshRef  = useRef();
  const meshList = useRef([]); // cached list of model meshes for raycasting

  // Rebuild mesh list when model switches
  useEffect(() => {
    meshList.current = [];
    // Small delay so new model's meshes are mounted before traversal
    const t = setTimeout(() => {
      if (!modelGroupRef?.current) return;
      modelGroupRef.current.traverse((child) => {
        if (child.isMesh && !(child.material instanceof THREE.ShadowMaterial)) {
          meshList.current.push(child);
        }
      });
    }, 300);
    return () => clearTimeout(t);
  }, [modelGroupRef, modelName]);

  // ── Text texture ──────────────────────────────────────────────────
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

  // ── Logo texture ──────────────────────────────────────────────────
  const [logoTexture, setLogoTexture] = useState(null);
  useEffect(() => {
    if (!snap.logo) { setLogoTexture(null); return; }
    new THREE.TextureLoader().load(snap.logo, (tex) => {
      tex.needsUpdate = true;
      setLogoTexture(tex);
    });
  }, [snap.logo]);

  const activeTexture = snap.activeTab === "logo" ? logoTexture : textTexture;

  // ── Per-frame: raycast onto model surface, align plane to surface normal ─
  useFrame(() => {
    if (!meshRef.current || !modelGroupRef?.current || !activeTexture) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    // Lazily populate mesh list after model loads
    if (meshList.current.length === 0) {
      modelGroupRef.current.traverse((child) => {
        if (child.isMesh && !(child.material instanceof THREE.ShadowMaterial)) {
          meshList.current.push(child);
        }
      });
    }
    if (meshList.current.length === 0) { meshRef.current.visible = false; return; }

    // World-space bounding box of the model
    _box.setFromObject(modelGroupRef.current);
    if (_box.isEmpty()) { meshRef.current.visible = false; return; }
    _box.getCenter(_center);
    _box.getSize(_size);

    const ox = snap.offsetX * _size.x * 0.35;
    const oy = snap.offsetY * _size.y * 0.35;

    // Shoot a ray from outside the model toward the chosen face
    switch (snap.placement) {
      case "back":
        _rayOrigin.set(_center.x + ox, _center.y + oy, _box.min.z - 0.5);
        _rayDir.set(0, 0, 1);
        break;
      case "left":
        _rayOrigin.set(_box.min.x - 0.5, _center.y + oy, _center.z - ox);
        _rayDir.set(1, 0, 0);
        break;
      case "right":
        _rayOrigin.set(_box.max.x + 0.5, _center.y + oy, _center.z + ox);
        _rayDir.set(-1, 0, 0);
        break;
      default: // front
        _rayOrigin.set(_center.x + ox, _center.y + oy, _box.max.z + 0.5);
        _rayDir.set(0, 0, -1);
    }

    _raycaster.set(_rayOrigin, _rayDir);
    const hits = _raycaster.intersectObjects(meshList.current, false);

    if (hits.length > 0) {
      const hit = hits[0];

      // Surface normal in world space
      _normal
        .copy(hit.face.normal)
        .transformDirection(hit.object.matrixWorld)
        .normalize();

      // World-space position on surface
      const worldPos = hit.point.clone().addScaledVector(_normal, 0.0015);

      // Convert to local space of this mesh's parent (the modelGroupRef group inside Float)
      meshRef.current.position.copy(
        modelGroupRef.current.worldToLocal(worldPos.clone())
      );

      // lookAt uses world-space target — point one unit along the normal
      _lookAt.copy(worldPos).add(_normal);
      meshRef.current.lookAt(_lookAt);

      meshRef.current.scale.setScalar(snap.size);
      meshRef.current.visible = true;
    } else {
      // No intersection — fall back: convert world-space bbox corners to group local space
      const lc = modelGroupRef.current.worldToLocal(_center.clone());
      const lMin = modelGroupRef.current.worldToLocal(_box.min.clone());
      const lMax = modelGroupRef.current.worldToLocal(_box.max.clone());

      if (snap.placement === "back") {
        meshRef.current.position.set(lc.x + ox, lc.y + oy, lMin.z - 0.003);
        meshRef.current.rotation.set(0, Math.PI, 0);
      } else {
        meshRef.current.position.set(lc.x + ox, lc.y + oy, lMax.z + 0.003);
        meshRef.current.rotation.set(0, 0, 0);
      }
      meshRef.current.scale.setScalar(snap.size);
      meshRef.current.visible = true;
    }
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
