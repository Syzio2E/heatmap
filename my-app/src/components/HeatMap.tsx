import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import vertexShader from "../shaders/heatMap/vertex.glsl?raw";
import fragmentShader from "../shaders/heatMap/fragment.glsl?raw";

// Custom Shader Material
const HeatmapMaterial = shaderMaterial(
  { heatmap: null, opacity: 1.0 },
  vertexShader,
  fragmentShader
);
extend({ HeatmapMaterial });

export default function HeatmapOverlay({ currentPositionsRef, worldWidth, worldHeight, resolution = 256 }) {
  const heatmapTextureRef = useRef();
  const planeRef = useRef();

  const heatmapData = useMemo(() => new Float32Array(resolution * resolution), [resolution]);
  const heatmapTexture = useMemo(() => {
    const tex = new THREE.DataTexture(heatmapData, resolution, resolution, THREE.LuminanceFormat, THREE.FloatType);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    heatmapTextureRef.current = tex;
    return tex;
  }, []);

  useFrame(() => {
    heatmapData.fill(0);
    const radius = 10;
    const strength = 1.0;

    currentPositionsRef.current.forEach(({ x, y }) => {
      const u = (x / worldWidth) + 0.5;
      const v = (-y / worldHeight) + 0.5;
      const px = Math.floor(u * resolution);
      const py = Math.floor(v * resolution);

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx >= 0 && nx < resolution && ny >= 0 && ny < resolution) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            const falloff = Math.exp(-(dist * dist) / (2 * radius * radius));
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

    heatmapTexture.needsUpdate = true;
  });

  return (
    <mesh ref={planeRef} position={[0, 0, 0]} scale={[worldWidth, worldHeight, 1]}>
      <planeGeometry args={[1, 1]} />
      <heatmapMaterial heatmap={heatmapTexture} opacity={1.0} transparent />
    </mesh>
  );
}
