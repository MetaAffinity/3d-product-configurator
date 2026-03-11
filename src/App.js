import React, { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import { proxy, useSnapshot } from "valtio";
import Shoe from "./Components/Shoe";
import Rocket from "./Components/Rocket";
import Axe from "./Components/Axe";
import Loader from "./Components/Loader";
import ModelPicker from "./Components/ModelPicker";
import ColorPicker from "./Components/ColorPicker";
import Insect from "./Components/Insect";
import Teapot from "./Components/Teapot";
import PartsPicker from "./Components/PartsPicker";
import { AiOutlineStar, AiFillStar } from "react-icons/ai";

const RocketState = proxy({
  current: null,
  colors: {
    hull: "#d3d3d3",
    base: "#d3d3d3",
    tip: "#d3d3d3",
    wings: "#a8a8a8",
    window: "#a8a8a8",
  },
});
const AxeState = proxy({
  current: null,
  colors: {
    body: "#a8a8a8",
    design: "#d3d3d3",
    support: "#d3d3d3",
    inner: "#d3d3d3",
  },
});
const ShoeState = proxy({
  current: null,
  colors: {
    laces: "#d3d3d3",
    mesh: "#d3d3d3",
    caps: "#d3d3d3",
    inner: "#d3d3d3",
    sole: "#d3d3d3",
    stripes: "#d3d3d3",
    band: "#d3d3d3",
    patch: "#d3d3d3",
  },
});
const InsectState = proxy({
  current: null,
  colors: { body: "#d3d3d3", shell: "#a8a8a8" },
});
const TeapotState = proxy({
  current: null,
  colors: { lid: "#d3d3d3", base: "#a8a8a8" },
});

function App() {
  const [selectedModel, setSelectedModel] = useState("Shoe");
  const [linkOpened, setLinkOpened] = useState(false);
  const controls = useRef();

  const updateShoeCurrent = (value) => {
    ShoeState.current = value;
  };
  const updateShoeColor = (pro, value) => {
    ShoeState.colors[pro] = value;
  };

  const updateAxeCurrent = (value) => {
    AxeState.current = value;
  };
  const updateAxeColor = (pro, value) => {
    AxeState.colors[pro] = value;
  };

  const updateRocketCurrent = (value) => {
    RocketState.current = value;
  };
  const updateRocketColor = (pro, value) => {
    RocketState.colors[pro] = value;
  };

  const updateInsectCurrent = (value) => {
    InsectState.current = value;
  };
  const updateInsectColor = (pro, value) => {
    InsectState.colors[pro] = value;
  };

  const updateTeapotCurrent = (value) => {
    TeapotState.current = value;
  };
  const updateTeapotColor = (pro, value) => {
    TeapotState.colors[pro] = value;
  };

  const getActiveState = () => {
    switch (selectedModel) {
      case "Shoe": return ShoeState;
      case "Rocket": return RocketState;
      case "Axe": return AxeState;
      case "Insect": return InsectState;
      case "Teapot": return TeapotState;
      default: return ShoeState;
    }
  };

  const getActiveUpdateCurrent = () => {
    switch (selectedModel) {
      case "Shoe": return updateShoeCurrent;
      case "Rocket": return updateRocketCurrent;
      case "Axe": return updateAxeCurrent;
      case "Insect": return updateInsectCurrent;
      case "Teapot": return updateTeapotCurrent;
      default: return updateShoeCurrent;
    }
  };

  // Camera angles for each part [azimuthal, polar] in radians
  const partCameraAngles = {
    Shoe: {
      laces: [0, 1.2],
      mesh: [0.5, 1.4],
      caps: [2.5, 1.3],
      inner: [1.8, 0.8],
      sole: [0.3, 2.2],
      stripes: [-0.8, 1.3],
      band: [-1.5, 1.4],
      patch: [3.0, 1.2],
    },
    Rocket: {
      hull: [0, 1.4],
      base: [0, 2.0],
      tip: [0, 0.6],
      wings: [0.8, 1.8],
      window: [-0.3, 1.0],
    },
    Axe: {
      body: [0, 1.4],
      design: [0.6, 1.2],
      support: [-0.5, 1.5],
      inner: [1.2, 1.0],
    },
    Insect: {
      body: [0, 1.2],
      shell: [0, 0.7],
    },
    Teapot: {
      lid: [0, 0.6],
      base: [0.5, 1.8],
    },
  };

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
      // ease in-out
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      ctrl.setAzimuthalAngle(startAzimuthal + (targetAzimuthal - startAzimuthal) * ease);
      ctrl.setPolarAngle(startPolar + (targetPolar - startPolar) * ease);
      ctrl.update();

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const activeSnap = useSnapshot(getActiveState());

  useEffect(() => {
    if (activeSnap.current && partCameraAngles[selectedModel]) {
      const angles = partCameraAngles[selectedModel][activeSnap.current];
      if (angles) {
        animateCamera(angles[0], angles[1]);
      }
    }
  }, [activeSnap.current, selectedModel, animateCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderSelectedModel = () => {
    switch (selectedModel) {
      case "Shoe":
        return (
          <Shoe
            castShadow
            colors={ShoeState.colors}
            updateCurrent={updateShoeCurrent}
          />
        );
      case "Rocket":
        return (
          <Rocket
            castShadow
            colors={RocketState.colors}
            updateCurrent={updateRocketCurrent}
          />
        );
      case "Axe":
        return (
          <Axe
            castShadow
            colors={AxeState.colors}
            updateCurrent={updateAxeCurrent}
          />
        );
      case "Insect":
        return (
          <Insect
            castShadow
            colors={InsectState.colors}
            updateCurrent={updateInsectCurrent}
          />
        );
      case "Teapot":
        return (
          <Teapot
            castShadow
            colors={TeapotState.colors}
            updateCurrent={updateTeapotCurrent}
          />
        );
      default:
        break;
    }
  };

  const renderSelectedColorPicker = () => {
    switch (selectedModel) {
      case "Shoe":
        return <ColorPicker state={ShoeState} updateColor={updateShoeColor} />;
      case "Rocket":
        return (
          <ColorPicker state={RocketState} updateColor={updateRocketColor} />
        );
      case "Axe":
        return <ColorPicker state={AxeState} updateColor={updateAxeColor} />;
      case "Insect":
        return (
          <ColorPicker state={InsectState} updateColor={updateInsectColor} />
        );
      case "Teapot":
        return (
          <ColorPicker state={TeapotState} updateColor={updateTeapotColor} />
        );
      default:
        break;
    }
  };

  const updateSelectedModel = (selectedModel) => {
    controls.current.reset();
    setSelectedModel(selectedModel);
  };

  return (
    <>
      <ModelPicker updateSelectedModel={updateSelectedModel} />
      {renderSelectedColorPicker()}
      <PartsPicker state={getActiveState()} updateCurrent={getActiveUpdateCurrent()} />
      <Canvas shadows camera={{ position: [1, 0, 2] }}>
        <ambientLight />
        <spotLight
          intensity={0.5}
          penumbra={1}
          position={[7, 15, 10]}
          castShadow
        />
        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 1.1]}
          position={[0, -1, 0]}
        >
          <planeGeometry args={[100, 100]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
        <Suspense fallback={<Loader />}>
          <Float
            speed={1}
            rotationIntensity={1}
            floatIntensity={1}
            floatingRange={[0, 0.3]}
          >
            {renderSelectedModel()}
          </Float>
        </Suspense>
        <OrbitControls ref={controls} maxDistance={5} minDistance={1.5} />
      </Canvas>
      <div className="info-icon">
        <div
          className="holder"
          onClick={() => {
            setLinkOpened(true);
            window.open("https://github.com/Madewill/3d-product-configurator.git");
          }}
        >
          {linkOpened ? (
            <AiFillStar color="#a8a8a8" size={24} />
          ) : (
            <AiOutlineStar color="#a8a8a8" size={24} />
          )}
          <span>Madewill/3d-product-configurator</span>
        </div>
      </div>
    </>
  );
}

export default App;
