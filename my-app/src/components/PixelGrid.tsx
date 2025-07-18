import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import {
  LineSegments,
} from 'three';


export default function PixelGrid({ mapWidth, mapHeight, scaleFactor = 0.005 }) {
  const gridRef = useRef<THREE.BufferGeometry>(null);

  const { positions, count } = useMemo(() => {
    const lines: number[] = [];

    const step = 100; // every 100 pixels
    const w = mapWidth;
    const h = mapHeight;

    for (let x = 0; x <= w; x += step) {
      const xWorld = (x - w / 2) * scaleFactor;
      lines.push(xWorld, h / 2 * scaleFactor, 0);
      lines.push(xWorld, -h / 2 * scaleFactor, 0);
    }

    for (let y = 0; y <= h; y += step) {
      const yWorld = (y - h / 2) * -scaleFactor;
      lines.push(w / 2 * scaleFactor, yWorld, 0);
      lines.push(-w / 2 * scaleFactor, yWorld, 0);
    }

    return {
      positions: new Float32Array(lines),
      count: lines.length / 3,
    };
  }, [mapWidth, mapHeight, scaleFactor]);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
    }
  }, [positions]);

  return (
    <lineSegments position={[0, 0, 0.02]}>
      <bufferGeometry ref={gridRef} />
      <lineBasicMaterial color="lime" transparent/>
    </lineSegments>
  );
}
