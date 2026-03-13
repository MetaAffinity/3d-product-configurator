import React, { useState, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useSnapshot } from "valtio";

export default function PoloShirt(props) {
  const { nodes, materials } = useGLTF("/poloshirt/poloshirt01.gltf");
  const snap = useSnapshot(props.colors);
  const [hovered, setHovered] = useState(null);

  // Clone materials — rename to simple lowercase keys matching state
  const mats = useMemo(() => {
    const clone = (mat, name) => {
      const c = mat.clone();
      c.name = name;
      return c;
    };
    return {
      body: clone(materials["Main Design"], "body"),
      buttons: clone(materials["Button Colour"], "buttons"),
      sleeves: clone(materials["Sleeve End Colour"], "sleeves"),
    };
  }, [materials]);

  useEffect(() => {
    const cursor = `<svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0)"><path fill="rgba(255, 255, 255, 0.5)" d="M29.5 54C43.031 54 54 43.031 54 29.5S43.031 5 29.5 5 5 15.969 5 29.5 15.969 54 29.5 54z" stroke="#000"/><g filter="url(#filter0_d)"><path d="M29.5 47C39.165 47 47 39.165 47 29.5S39.165 12 29.5 12 12 19.835 12 29.5 19.835 47 29.5 47z" fill="${snap[hovered]}"/></g><path d="M2 2l11 2.947L4.947 13 2 2z" fill="#000"/><text fill="#000" style="white-space:pre" font-family="Inter var, sans-serif" font-size="10" letter-spacing="-.01em"><tspan x="35" y="63">${hovered}</tspan></text></g><defs><clipPath id="clip0"><path fill="#fff" d="M0 0h64v64H0z"/></clipPath><filter id="filter0_d" x="6" y="8" width="47" height="47" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dy="2"/><feGaussianBlur stdDeviation="3"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter></defs></svg>`;
    if (hovered) {
      document.body.style.cursor = `url('data:image/svg+xml;base64,${btoa(
        cursor
      )}'), auto`;
    }
    return () => (document.body.style.cursor = "auto");
  }, [hovered, snap]);

  return (
    <group
      {...props}
      dispose={null}
      position={[0, 4.8, 0.2]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(e.object.material.name);
      }}
      onPointerOut={(e) => {
        if (e.intersections.length === 0) setHovered(null);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        props.updateCurrent(e.object.material.name);
      }}
      onPointerMissed={() => props.updateCurrent(null)}
    >
      <group name="Polo" position={[0.084, -4.801, -0.214]} scale={0.006}>
        <mesh castShadow material-color={snap.body} geometry={nodes.cloth_shape_0008.geometry} material={mats.body} />
        <mesh castShadow material-color={snap.buttons} geometry={nodes.cloth_shape_0008_1.geometry} material={mats.buttons} />
        <mesh castShadow material-color={snap.sleeves} geometry={nodes.cloth_shape_0008_2.geometry} material={mats.sleeves} />
      </group>
    </group>
  );
}

useGLTF.preload("/poloshirt/poloshirt01.gltf");
