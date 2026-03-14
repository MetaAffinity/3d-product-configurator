import React, { useMemo, useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { logoTextState } from "../config/logoTextState";
import { createTextTexture } from "../utils/createTextTexture";

const _box   = new THREE.Box3();
const _center = new THREE.Vector3();
const _size   = new THREE.Vector3();

// Returns face position & rotation in world space based on model bounding box
function getFaceTransform(box, placement, offsetX, offsetY) {
  box.getCenter(_center);
  box.getSize(_size);

  const ox = offsetX * _size.x * 0.35;
  const oy = offsetY * _size.y * 0.35;

  switch (placement) {
    case "back":
      return {
        pos: [_center.x + ox, _center.y + oy, box.min.z - 0.003],
        rot: [0, Math.PI, 0],
      };
    case "left":
      return {
        pos: [box.min.x - 0.003, _center.y + oy, _center.z - ox],
        rot: [0, -Math.PI / 2, 0],
      };
    case "right":
      return {
        pos: [box.max.x + 0.003, _center.y + oy, _center.z + ox],
        rot: [0, Math.PI / 2, 0],
      };
    default: // front
      return {
        pos: [_center.x + ox, _center.y + oy, box.max.z + 0.003],
        rot: [0, 0, 0],
      };
  }
}

export default function LogoTextOverlay({ modelGroupRef }) {
  const snap = useSnapshot(logoTextState);
  const meshRef = useRef();

  // ── Text texture ─────────────────────────────────────────────────────
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

  // ── Logo texture ──────────────────────────────────────────────────────
  const [logoTexture, setLogoTexture] = useState(null);
  useEffect(() => {
    if (!snap.logo) { setLogoTexture(null); return; }
    new THREE.TextureLoader().load(snap.logo, (tex) => {
      tex.needsUpdate = true;
      setLogoTexture(tex);
    });
  }, [snap.logo]);

  // ── Active texture ────────────────────────────────────────────────────
  const activeTexture = snap.activeTab === "logo" ? logoTexture : textTexture;

  // ── Follow model every frame (tracks Float animation) ────────────────
  useFrame(() => {
    if (!meshRef.current || !modelGroupRef?.current || !activeTexture) return;

    _box.setFromObject(modelGroupRef.current);
    if (_box.isEmpty()) return;

    const { pos, rot } = getFaceTransform(_box, snap.placement, snap.offsetX, snap.offsetY);
    meshRef.current.position.set(...pos);
    meshRef.current.rotation.set(...rot);
    meshRef.current.scale.setScalar(snap.size);
    meshRef.current.visible = true;
  });

  if (!activeTexture) return null;

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={activeTexture}
        transparent
        alphaTest={0.005}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
