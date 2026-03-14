import React, { useState, useEffect, useMemo, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useSnapshot } from "valtio";
import * as THREE from "three";
import { modelPatterns } from "../config/patterns";
import { modelConfig } from "../config/models";

// Mesh names from GLB → these are the 4 body panels
const BODY_MESHES = [
  "Cloth_mesh_24", // front
  "Cloth_mesh_3",  // back
  "Cloth_mesh_9",  // right sleeve
  "Cloth_mesh_15", // left sleeve
];

const PART_TO_MESH = {
  front:       "Cloth_mesh_24",
  back:        "Cloth_mesh_3",
  rightSleeve: "Cloth_mesh_9",
  leftSleeve:  "Cloth_mesh_15",
};

const bodyPatternConfig = modelPatterns.HighNeckTshirt?.body || [];
const bodyPatterns = bodyPatternConfig.map((p) => p.src);

export default function HighNeckTshirt({ colors, options, textures, design, updateCurrent }) {
  const { scene } = useGLTF("/highneck-tshirt/HighNeckTshirt.glb");
  const snap = useSnapshot(colors);
  const texturesSnap = useSnapshot(textures);
  const [hovered, setHovered] = useState(null);
  const overlayRef = useRef([]);

  // Clone scene with independent materials
  const clonedScene = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.name = "body";
        child.castShadow = true;
      }
    });
    return s;
  }, [scene]);

  // Store original material maps
  const originalMaps = useRef({});
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        originalMaps.current[child.name] = child.material.map;
      }
    });
  }, [clonedScene]);

  // Preload pattern textures
  const patternTextures = useTexture(
    bodyPatterns.length > 0 ? bodyPatterns : ["/highneck-tshirt/patterns/Brazilian.jpg"]
  );
  const patternArray = Array.isArray(patternTextures) ? patternTextures : [patternTextures];

  useMemo(() => {
    patternArray.forEach((tex) => {
      tex.flipY = false;
      tex.encoding = THREE.sRGBEncoding;
      tex.needsUpdate = true;
    });
  }, [patternArray]);

  // Apply body color to all meshes
  useEffect(() => {
    const isPatternActive = !!texturesSnap.body;
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.set(isPatternActive ? "#ffffff" : snap.body);
        child.material.needsUpdate = true;
      }
    });
  }, [snap.body, texturesSnap.body, clonedScene]);

  // Apply pattern texture to body meshes
  useEffect(() => {
    const selected = texturesSnap.body;
    clonedScene.traverse((child) => {
      if (child.isMesh && BODY_MESHES.includes(child.name)) {
        if (selected) {
          const idx = bodyPatterns.indexOf(selected);
          if (idx !== -1 && patternArray[idx]) {
            child.material.map = patternArray[idx];
            child.material.color.set("#ffffff");
          }
        } else {
          child.material.map = originalMaps.current[child.name] || null;
        }
        child.material.needsUpdate = true;
      }
    });
  }, [texturesSnap.body, clonedScene, patternArray]);

  // Apply design overlays
  useEffect(() => {
    const designs = modelConfig.HighNeckTshirt?.designs;
    if (!designs) return;
    const designIdx = design ?? 0;
    const designCfg = designs[designIdx];

    // Remove old overlay meshes
    overlayRef.current.forEach((overlay) => {
      if (overlay.parent) overlay.parent.remove(overlay);
      if (overlay.material) overlay.material.dispose();
      if (overlay.geometry) overlay.geometry.dispose();
    });
    overlayRef.current = [];

    if (!designCfg?.textures || Object.keys(designCfg.textures).length === 0) return;

    const loader = new THREE.TextureLoader();

    Object.entries(designCfg.textures).forEach(([part, paths]) => {
      if (!paths || paths.length === 0) return;
      const meshName = PART_TO_MESH[part];

      clonedScene.traverse((child) => {
        if (child.isMesh && child.name === meshName) {
          paths.forEach((texPath) => {
            if (!texPath) return;
            const geom = child.geometry.clone();
            // Flip UV Y-axis to match texture orientation (same as reference project)
            const uv = geom.attributes.uv;
            for (let i = 0; i < uv.count; i++) {
              uv.setY(i, uv.getY(i) * -1);
            }
            uv.needsUpdate = true;

            loader.load(texPath, (tex) => {
              tex.encoding = THREE.sRGBEncoding;
              const mat = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
              });
              const overlay = new THREE.Mesh(geom, mat);
              overlay.userData.isDesignOverlay = true;
              overlay.castShadow = true;
              child.add(overlay);
              overlayRef.current.push(overlay);
            });
          });
        }
      });
    });
  }, [design, clonedScene]);

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
      scale={[0.35, 0.35, 0.35]}
      position={[0, -1.0, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(e.object.material.name); }}
      onPointerOut={(e) => { if (e.intersections.length === 0) setHovered(null); }}
      onPointerDown={(e) => { e.stopPropagation(); updateCurrent(e.object.material.name); }}
      onPointerMissed={() => updateCurrent(null)}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/highneck-tshirt/HighNeckTshirt.glb");
