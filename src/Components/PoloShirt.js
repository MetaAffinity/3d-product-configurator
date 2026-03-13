import React, { useState, useEffect, useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useSnapshot } from "valtio";
import { modelPatterns } from "../config/patterns";

const bodyPatterns = modelPatterns.PoloShirt?.body || [];

export default function PoloShirt({ colors, options, textures, updateCurrent }) {
  const { nodes, materials } = useGLTF("/poloshirt/poloshirt01.glb");
  const snap = useSnapshot(colors);
  const texturesSnap = useSnapshot(textures);
  const [hovered, setHovered] = useState(null);

  // Clone materials so each part colors independently
  const mats = useMemo(() => {
    const clone = (mat, name) => { const c = mat.clone(); c.name = name; return c; };
    return {
      body: clone(materials["Main Design"], "body"),
      buttons: clone(materials["Button Colour"], "buttons"),
      sleeves: clone(materials["Sleeve End Colour"], "sleeves"),
    };
  }, [materials]);

  // Store original body texture map so we can restore it
  const originalBodyMap = useMemo(() => mats.body.map, [mats]);

  // Preload all pattern textures
  const patternTextures = useTexture(bodyPatterns.length > 0 ? bodyPatterns : ["/poloshirt/patterns/design1.png"]);
  const patternArray = Array.isArray(patternTextures) ? patternTextures : [patternTextures];

  // GLTF models use flipY=false — match it so designs align correctly with UV map
  useMemo(() => {
    patternArray.forEach((tex) => {
      tex.flipY = false;
      tex.needsUpdate = true;
    });
  }, [patternArray]);

  // Apply selected pattern texture to body material
  useEffect(() => {
    const selected = texturesSnap.body;
    if (selected) {
      const idx = bodyPatterns.indexOf(selected);
      if (idx !== -1 && patternArray[idx]) {
        mats.body.map = patternArray[idx];
        mats.body.map.needsUpdate = true;
        mats.body.needsUpdate = true;
      }
    } else {
      mats.body.map = originalBodyMap;
      mats.body.needsUpdate = true;
    }
  }, [texturesSnap.body, mats.body, patternArray, originalBodyMap]);

  useEffect(() => {
    const cursor = `<svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0)"><path fill="rgba(255, 255, 255, 0.5)" d="M29.5 54C43.031 54 54 43.031 54 29.5S43.031 5 29.5 5 5 15.969 5 29.5 15.969 54 29.5 54z" stroke="#000"/><g filter="url(#filter0_d)"><path d="M29.5 47C39.165 47 47 39.165 47 29.5S39.165 12 29.5 12 12 19.835 12 29.5 19.835 47 29.5 47z" fill="${snap[hovered]}"/></g><path d="M2 2l11 2.947L4.947 13 2 2z" fill="#000"/><text fill="#000" style="white-space:pre" font-family="Inter var, sans-serif" font-size="10" letter-spacing="-.01em"><tspan x="35" y="63">${hovered}</tspan></text></g><defs><clipPath id="clip0"><path fill="#fff" d="M0 0h64v64H0z"/></clipPath><filter id="filter0_d" x="6" y="8" width="47" height="47" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dy="2"/><feGaussianBlur stdDeviation="3"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter></defs></svg>`;
    if (hovered) {
      document.body.style.cursor = `url('data:image/svg+xml;base64,${btoa(cursor)}'), auto`;
    }
    return () => (document.body.style.cursor = "auto");
  }, [hovered, snap]);

  return (
    <group
      dispose={null}
      scale={[0.35, 0.35, 0.35]}
      position={[0, -1.0, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(e.object.material.name); }}
      onPointerOut={(e) => { if (e.intersections.length === 0) setHovered(null); }}
      onPointerDown={(e) => { e.stopPropagation(); updateCurrent(e.object.material.name); }}
      onPointerMissed={() => updateCurrent(null)}
    >
      <group name="Polo" position={[0.084, -4.801, -0.214]} scale={0.006}>
        <mesh castShadow material-color={snap.body} geometry={nodes.cloth_shape_0008.geometry} material={mats.body} />
        <mesh castShadow material-color={snap.buttons} geometry={nodes.cloth_shape_0008_1.geometry} material={mats.buttons} />
        <mesh castShadow material-color={snap.sleeves} geometry={nodes.cloth_shape_0008_2.geometry} material={mats.sleeves} />
      </group>
    </group>
  );
}

useGLTF.preload("/poloshirt/poloshirt01.glb");
