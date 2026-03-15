import React, { useState, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useSnapshot } from "valtio";

export default function Hoodie({ colors, options, textures, updateCurrent }) {
  const { nodes, materials } = useGLTF("/hoodie/hoodie.glb");
  const snap = useSnapshot(colors);
  const [hovered, setHovered] = useState(null);

  // Clone materials so each part colors independently
  const mats = useMemo(() => {
    const clone = (mat, name) => {
      const c = mat.clone();
      c.name = name;
      return c;
    };
    return {
      body:       clone(materials["Material.029"], "body"),
      hood:       clone(materials["Material.027"], "hood"),
      drawstring: clone(materials["Material.028"], "drawstring"),
      bottom:     clone(materials["Material.030"], "bottom"),
      cuff:       clone(materials["Material.031"], "cuff"),
      pocket:     clone(materials["Material.032"], "pocket"),
    };
  }, [materials]);

  // Hover cursor
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
      scale={[0.75, 0.75, 0.75]}
      position={[0, 0.1, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(e.object.material.name); }}
      onPointerOut={(e) => { if (e.intersections.length === 0) setHovered(null); }}
      onPointerDown={(e) => { e.stopPropagation(); updateCurrent(e.object.material.name); }}
      onPointerMissed={() => updateCurrent(null)}
    >
      {/* Main body */}
      <mesh castShadow geometry={nodes["body"].geometry} material={mats.body} material-color={snap.body} />
      {/* Hood */}
      <mesh castShadow geometry={nodes["hoodie-neck"].geometry} material={mats.hood} material-color={snap.hood} />
      {/* Drawstring */}
      <mesh castShadow geometry={nodes["hoodie-draw"].geometry} material={mats.drawstring} material-color={snap.drawstring} />
      {/* Bottom band */}
      <mesh castShadow geometry={nodes["hoodie-bottom"].geometry} material={mats.bottom} material-color={snap.bottom} />
      {/* Cuffs */}
      <mesh castShadow geometry={nodes["hoodie-cuff"].geometry} material={mats.cuff} material-color={snap.cuff} />
      {/* Pocket */}
      <mesh castShadow geometry={nodes["hoodie-pocket"].geometry} material={mats.pocket} material-color={snap.pocket} />
      {/* Zipper hardware — keep original metallic material */}
      <mesh castShadow geometry={nodes["hoodie-matShap"].geometry} material={materials["Material.033"]} />
    </group>
  );
}

useGLTF.preload("/hoodie/hoodie.glb");
