import React, { useState, useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import metaAffinityLogo from "../img/metaaffinity.png";

// ── Floating particles in 3D space ──────────────────────────────────────
function Particles({ count = 300 }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 6,
        speed: 0.2 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2,
        scale: 0.02 + Math.random() * 0.04,
      });
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.offset) * 0.5,
        p.y + Math.cos(t * p.speed * 0.7 + p.offset) * 0.4,
        p.z + Math.sin(t * p.speed * 0.3 + p.offset) * 0.3
      );
      const pulse = 1 + Math.sin(t * 2 + p.offset) * 0.3;
      dummy.scale.setScalar(p.scale * pulse);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#6c63ff" transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ── Orbiting ring of glowing dots ────────────────────────────────────────
function OrbitalRing({ radius = 2.5, count = 60 }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + t * 0.4;
      dummy.position.set(
        Math.cos(angle) * radius,
        Math.sin(t * 0.5 + i * 0.1) * 0.3,
        Math.sin(angle) * radius
      );
      const pulse = 0.03 + Math.sin(t * 3 + i) * 0.015;
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.9} />
    </instancedMesh>
  );
}

// ── Central glowing sphere ───────────────────────────────────────────────
function CenterGlow() {
  const ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scale = 0.5 + Math.sin(t * 1.5) * 0.08;
    ref.current.scale.setScalar(scale);
    ref.current.rotation.y = t * 0.3;
    ref.current.rotation.z = t * 0.2;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.6} />
    </mesh>
  );
}

// ── Main DevCredits component ────────────────────────────────────────────
export default function DevCredits() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef();

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback((e) => {
    if (e.target === overlayRef.current) setOpen(false);
  }, []);

  return (
    <>
      {/* Logo badge — replaces old info-icon */}
      <div className="dev-credit-badge" onClick={handleOpen} title="Developer Credits">
        <img src={metaAffinityLogo} alt="MetaAffinity" className="dev-credit-logo" />
      </div>

      {/* Fullscreen credits overlay */}
      {open && (
        <div className="dev-credit-overlay" ref={overlayRef} onClick={handleClose}>
          <div className="dev-credit-modal">
            {/* 3D particle background */}
            <div className="dev-credit-canvas-wrap">
              <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 2]}>
                <Particles />
                <OrbitalRing />
                <OrbitalRing radius={1.8} count={40} />
                <CenterGlow />
              </Canvas>
            </div>

            {/* Info card overlay on top of canvas */}
            <div className="dev-credit-content">
              <img src={metaAffinityLogo} alt="MetaAffinity" className="dev-credit-hero-logo" />
              <h2 className="dev-credit-name">Muhammad Imran</h2>
              <p className="dev-credit-role">Full-Stack Developer & 3D Designer</p>

              <div className="dev-credit-links">
                <a href="https://metaaffinity.net" target="_blank" rel="noopener noreferrer" className="dev-credit-link">
                  <span className="dev-credit-link-icon">&#127760;</span>
                  <span>metaaffinity.net</span>
                </a>
                <a href="mailto:metaaffinity@gmail.com" className="dev-credit-link">
                  <span className="dev-credit-link-icon">&#9993;</span>
                  <span>metaaffinity@gmail.com</span>
                </a>
              </div>

              <button className="dev-credit-close-btn" onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
