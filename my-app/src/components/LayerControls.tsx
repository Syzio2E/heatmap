import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';


type LayerControlsProps = {
  showBaseMap: boolean;
  setShowBaseMap: Dispatch<SetStateAction<boolean>>;
  showObjects: boolean;
  setShowObjects: Dispatch<SetStateAction<boolean>>;
  showHeatmap: boolean;
  setShowHeatmap: Dispatch<SetStateAction<boolean>>;
  showPixelGrid: boolean;
  setShowPixelGrid: Dispatch<SetStateAction<boolean>>
};

export default function LayerControls({
  showBaseMap,
  setShowBaseMap,
  showObjects,
  setShowObjects,
  showHeatmap,
  setShowHeatmap,
  showPixelGrid,
  setShowPixelGrid
}: LayerControlsProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="position-fixed top-0 end-0 m-4" style={{ width: '300px', zIndex: 1050 }}>
      <div className="accordion">
        <div className="accordion-item border rounded">
          <h2 className="accordion-header">
            <button
              className={`accordion-button ${!isOpen ? 'collapsed' : ''}`}
              onClick={() => setIsOpen(prev => !prev)}
              type="button"
            >
              Layer Controls
            </button>
          </h2>
          {isOpen && (
            <div className="accordion-body">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={showBaseMap}
                  onChange={() => setShowBaseMap(!showBaseMap)}
                  id="baseMapToggle"
                />
                <label className="form-check-label" htmlFor="baseMapToggle">
                  Base Map
                </label>
              </div>
               <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={showPixelGrid}
                  onChange={() => setShowPixelGrid(!showPixelGrid)}
                  id="pixelGridToggle"
                />
                <label className="form-check-label" htmlFor="baseMapToggle">
                  Pixel Grid
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={showObjects}
                  onChange={() => setShowObjects(!showObjects)}
                  id="objectsToggle"
                />
                <label className="form-check-label" htmlFor="objectsToggle">
                  Objects
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={() => setShowHeatmap(!showHeatmap)}
                  id="heatmapToggle"
                />
                <label className="form-check-label" htmlFor="heatmapToggle">
                  Heatmap
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
