import { Canvas } from '@react-three/fiber'
import './App.css'
import Map from './scenes/Map'
import { useState } from 'react';
import LayerControls from './components/LayerControls';

function App() {
  const [showBaseMap, setShowBaseMap] = useState(true);
const [showObjects, setShowObjects] = useState(false);
const [showHeatmap, setShowHeatmap] = useState(false);
const [showPixelGrid, setShowPixelGrid] = useState(false)

  return (
    <>
      <LayerControls 
  showBaseMap={showBaseMap}
  setShowBaseMap={setShowBaseMap}
  showObjects={showObjects}
  setShowObjects={setShowObjects}
  showHeatmap={showHeatmap}
  setShowHeatmap={setShowHeatmap}
  showPixelGrid={showPixelGrid}
  setShowPixelGrid={setShowPixelGrid}
/>
     <Canvas
      className="canvas-container"
      shadows
      camera={{
        fov: 45,
        near: 0.1,
        far: 1000,
        position: [0, 0, 10]
      }}
    >
      <Map showBaseMap={showBaseMap} showObjects={showObjects} showHeatmap={showHeatmap} showPixelGrid={showPixelGrid} />
    </Canvas>
    </>
  )
}

export default App
