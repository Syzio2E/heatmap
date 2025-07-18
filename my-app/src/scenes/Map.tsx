import * as THREE from "three";
import { MapControls as MapControlsImpl } from 'three-stdlib';
import { Perf } from "r3f-perf";
import { useLoader, useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, useMemo } from "react";
import PixelGrid from "../components/PixelGrid";
import { io } from "socket.io-client";
import { ShaderMaterial, DataTexture, RedFormat, FloatType } from "three";
import vertexShader from "../shaders/heatMap/vertex.glsl?raw";
import fragmentShader from "../shaders/heatMap/fragment.glsl?raw";
import { PerspectiveCamera } from 'three';
import { MapControls } from "@react-three/drei";

const socket = io("http://localhost:3001");

type Position = { x: number; y: number };

export default function Map({
  showBaseMap,
  showObjects,
  showHeatmap,
  showPixelGrid,
}: {
  showBaseMap: boolean;
  showObjects: boolean;
  showHeatmap: boolean;
  showPixelGrid: boolean;
}) {
  const [positions, setPositions] = useState<Position[]>([]);
  const mapTexture = useLoader(THREE.TextureLoader, "/map.jpg");

  
const heatmapTextureRef = useRef<DataTexture | null>(null);

// Create a texture storing density data
const resolution = 512;
const heatmapData = useMemo(() => new Float32Array(resolution * resolution), []);
const heatmapMaterial = useMemo(() => {
  const texture = new DataTexture(heatmapData, resolution, resolution, RedFormat, FloatType);
  texture.needsUpdate = true;
  heatmapTextureRef.current = texture;

  return new ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
     blending: THREE.NormalBlending
  });
}, [heatmapData]);

//   const markerMaterial = useMemo(() => {
//   return new THREE.ShaderMaterial({
//     markerVertexShader,
//     markerFragmentShader,
//   });
// }, []);

  const mapWidth = 1920;
  const mapHeight = 1080;
  const scaleFactor = 0.005;
  const worldWidth = mapWidth * scaleFactor;
  const worldHeight = mapHeight * scaleFactor;

  const toWorldCoords = (x: number, y: number) => {
  const worldX = (x / mapWidth - 0.5) * worldWidth;
  const worldY = -(y / mapHeight - 0.5) * worldHeight;
  return { x: worldX, y: worldY };
};

  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const markerGeometry = useMemo(() => new THREE.BoxGeometry(0.05, 0.05, 0.05), []);
  const markerMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "hotpink" }), []);

  const { camera, gl } = useThree();
const controlsRef = useRef<MapControlsImpl | null>(null);
  const mapRef = useRef<THREE.Mesh>(null);

  // 🟢 Receive real-time data
  useEffect(() => {
    socket.on("positionUpdate", (data: Position[]) => {
      setPositions(data);
    });

    return () => {
      socket.off("positionUpdate");
    };
  }, []);

  // 🟢 Animate movement
  const currentPositionsRef = useRef<THREE.Vector3[]>([]);
  const targetPositionsRef = useRef<THREE.Vector3[]>([]);

useEffect(() => {
  if (!positions.length) return;

  targetPositionsRef.current = positions.map((p) => {
    const { x, y } = toWorldCoords(p.x, p.y);
    return new THREE.Vector3(x, y, 0.1);
  });

  // Initialize current positions if empty
  if (currentPositionsRef.current.length === 0) {
    currentPositionsRef.current = targetPositionsRef.current.map((v) =>
      v.clone()
    );
  }
});

useFrame((_, delta) => {
  if (!showObjects || !instancedRef.current) return;

  const speed = 5;
  for (let i = 0; i < targetPositionsRef.current.length; i++) {
    const current = currentPositionsRef.current[i];
    const target = targetPositionsRef.current[i];

    if (current && target) {
      current.lerp(target, 1 - Math.exp(-speed * delta));
      dummy.position.copy(current);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    }
  }

  instancedRef.current.instanceMatrix.needsUpdate = true;
});

useFrame(() => {
  heatmapData.fill(0);

  const radius = 10;
  const strength = 1.0;

  const positions = [...currentPositionsRef.current];
positions.forEach(({ x, y }) => {
    const u = (x / worldWidth) + 0.5;
    const v = (-y / worldHeight) + 0.5;
    const px = Math.floor(u * resolution);
    const py = Math.floor(v * resolution);

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) continue;

        const falloff = Math.max(0, 1 - dist / radius);
        const nx = px + dx;
        const ny = py + dy;
        if (nx >= 0 && nx < resolution && ny >= 0 && ny < resolution) {
          const index = ny * resolution + nx;
          heatmapData[index] += strength * falloff;
        }
      }
    }
  });

  // Normalize
  for (let i = 0; i < heatmapData.length; i++) {
    heatmapData[i] = Math.min(1.0, heatmapData[i]);
  }

  if (heatmapTextureRef.current) {
    heatmapTextureRef.current.needsUpdate = true;
  }
});



  // 🟢 Map controls
  useEffect(() => {
    const canvas = gl.domElement;
    const handleGrab = () => canvas.classList.add("canvas-grabbing");
    const handleRelease = () => canvas.classList.remove("canvas-grabbing");

    canvas.addEventListener("mousedown", handleGrab);
    canvas.addEventListener("mouseup", handleRelease);
    canvas.addEventListener("mouseleave", handleRelease);

    return () => {
      canvas.removeEventListener("mousedown", handleGrab);
      canvas.removeEventListener("mouseup", handleRelease);
      canvas.removeEventListener("mouseleave", handleRelease);
    };
  }, [gl]);

  // 🟢 Camera setup
  useEffect(() => {
      const perspectiveCamera = camera as PerspectiveCamera;
  const fov = perspectiveCamera.fov * (Math.PI / 180);
    const distance = worldHeight / (2 * Math.tan(fov / 2));
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.update();
  }, [camera]);

  // 🟢 Keyboard map rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mapRef.current) return;
      if (e.key === "q") mapRef.current.rotation.y += 0.1;
      if (e.key === "e") mapRef.current.rotation.y -= 0.1;
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useMemo(() => {
    mapTexture.minFilter = THREE.LinearFilter;
    mapTexture.magFilter = THREE.LinearFilter;
    mapTexture.anisotropy = 16;
    mapTexture.generateMipmaps = true;
  }, [mapTexture]);

  return (
    <>
      <Perf position="top-left" />
      <MapControls
        ref={controlsRef}
        makeDefault
        enableZoom
        enablePan
        enableRotate={false}
        screenSpacePanning
        zoomSpeed={1.2}
        panSpeed={2}
        maxDistance={50}
        dampingFactor={0.1}
      />

      <ambientLight intensity={1.2} />
      <directionalLight
        castShadow
        position={[3, 5, 4]}
        intensity={2}
        shadow-normalBias={0.04}
      />

      {showBaseMap && showPixelGrid && <PixelGrid mapWidth={1920} mapHeight={1080} />}

      {showBaseMap && (
        <mesh ref={mapRef} position={[0, 0, 0]} scale={[worldWidth, worldHeight, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial map={mapTexture} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showBaseMap && showObjects && (
        <instancedMesh
          ref={instancedRef}
          args={[markerGeometry, markerMaterial, 100]}
        />
      )}

{showHeatmap && (
  <mesh position={[0, 0, 0.01]} scale={[worldWidth, worldHeight, 1]}>
    <planeGeometry args={[1, 1]} />
    <primitive object={heatmapMaterial} attach="material" />
  </mesh>
)}

    </>
  );
}
