import React, { Suspense, useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import Loader from "./Components/Loader";
import ModelPicker from "./Components/ModelPicker";
import ColorPicker from "./Components/ColorPicker";
import PartsPicker from "./Components/PartsPicker";
import Toolbar from "./Components/Toolbar";
import LogoTextPanel from "./Components/LogoTextPanel";
import LogoTextOverlay from "./Components/LogoTextOverlay";
import { modelConfig, modelStates, defaultModel } from "./config/models";
import { AiOutlineUser } from "react-icons/ai";
import { MdTextFields } from "react-icons/md";

function App() {
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [isRotating, setIsRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogoText, setShowLogoText] = useState(false);
  const controls = useRef();
  const modelGroupRef = useRef();

  // Get current model's state and config
  const state = modelStates[selectedModel];
  const config = modelConfig[selectedModel];

  const updateCurrent = useCallback((value) => {
    state.current = value;
  }, [state]);

  const updateColor = useCallback((prop, value) => {
    state.colors[prop] = value;
  }, [state]);

  const updateTexture = useCallback((part, path) => {
    state.textures[part] = path;
  }, [state]);

  // Camera animation
  const animateCamera = useCallback((targetAzimuthal, targetPolar) => {
    if (!controls.current) return;
    const ctrl = controls.current;
    const startAzimuthal = ctrl.getAzimuthalAngle();
    const startPolar = ctrl.getPolarAngle();
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      ctrl.setAzimuthalAngle(startAzimuthal + (targetAzimuthal - startAzimuthal) * ease);
      ctrl.setPolarAngle(startPolar + (targetPolar - startPolar) * ease);
      ctrl.update();
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // Part selection from panel (with camera rotation)
  const handlePartSelect = useCallback((part) => {
    state.current = part;
    const angles = config.cameraAngles?.[part];
    if (angles) {
      animateCamera(angles[0], angles[1]);
    }
  }, [state, config, animateCamera]);

  // Render the active 3D model component
  const renderModel = () => {
    const ModelComponent = config.component;
    return (
      <group ref={modelGroupRef}>
        <ModelComponent
          castShadow
          colors={state.colors}
          options={state.options}
          textures={state.textures}
          updateCurrent={updateCurrent}
        />
      </group>
    );
  };

  // Model switching
  const handleModelChange = (model) => {
    if (controls.current) {
      controls.current.reset();
      const camPos = modelConfig[model].cameraPosition;
      if (camPos) controls.current.object.position.set(...camPos);
    }
    setIsRotating(false);
    setSelectedModel(model);
  };

  // Toolbar handlers
  const handleScreenshot = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${selectedModel}-screenshot.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleResetView = () => {
    if (controls.current) controls.current.reset();
    setIsRotating(false);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleZoom = (direction) => {
    if (!controls.current) return;
    const camera = controls.current.object;
    const dir = camera.position.clone().normalize().multiplyScalar(0.3);
    if (direction === "in") camera.position.sub(dir);
    else camera.position.add(dir);
    controls.current.update();
  };

  return (
    <>
      <ModelPicker updateSelectedModel={handleModelChange} />
      <ColorPicker state={state} updateColor={updateColor} updateTexture={updateTexture} modelName={selectedModel} />
      <PartsPicker state={state} updateCurrent={handlePartSelect} modelName={selectedModel} />
      {showLogoText && <LogoTextPanel modelName={selectedModel} />}
      <Toolbar
        onScreenshot={handleScreenshot}
        onToggleRotate={() => setIsRotating((prev) => !prev)}
        isRotating={isRotating}
        onResetView={handleResetView}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        onZoomIn={() => handleZoom("in")}
        onZoomOut={() => handleZoom("out")}
      />
      <button
        className={`logtext-toggle-btn ${showLogoText ? "active" : ""}`}
        onClick={() => setShowLogoText((p) => !p)}
        title="Logo / Text"
      >
        <MdTextFields size={18} />
        <span>Logo / Text</span>
      </button>
      <Canvas shadows camera={{ position: [1, 0, 2] }} gl={{ preserveDrawingBuffer: true }}>
        <ambientLight />
        <spotLight intensity={0.5} penumbra={1} position={[7, 15, 10]} castShadow />
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 1.1]} position={[0, -1, 0]}>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
        <Suspense fallback={<Loader />}>
          <Float speed={1} rotationIntensity={1} floatIntensity={1} floatingRange={[0, 0.3]}>
            {renderModel()}
          </Float>
          <LogoTextOverlay modelGroupRef={modelGroupRef} modelName={selectedModel} />
        </Suspense>
        <OrbitControls ref={controls} maxDistance={5} minDistance={config.minDistance || 1.5} autoRotate={isRotating} autoRotateSpeed={4} />
      </Canvas>
      <div className="info-icon">
        <AiOutlineUser size={14} />
        <span>metaaffinity.net/3d-product-customizer</span>
      </div>
    </>
  );
}

export default App;
