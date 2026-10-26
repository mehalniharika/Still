import React from 'react';
import { GeometryState, NormalizedRect } from '../types/editor';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
  Maximize2
} from 'lucide-react';

interface CropPanelProps {
  geometry: GeometryState;
  tempCropRect: NormalizedRect;
  cropAspectRatio: number | null;
  onAspectRatioSelect: (ratio: number | null) => void;
  onRotate: (deltaDegrees: number) => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  onResetCrop: () => void;
}

const RATIO_PRESETS = [
  { label: 'Freeform', ratio: null },
  { label: '1 : 1', ratio: 1.0 },
  { label: '4 : 5', ratio: 4 / 5 },
  { label: '3 : 2', ratio: 3 / 2 },
  { label: '16 : 9', ratio: 16 / 9 }
];

export const CropPanel: React.FC<CropPanelProps> = ({
  geometry,
  cropAspectRatio,
  onAspectRatioSelect,
  onRotate,
  onFlipH,
  onFlipV,
  onApplyCrop,
  onCancelCrop,
  onResetCrop
}) => {
  return (
    <div className="panel-content">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Crop & Rotate</h3>
          <p className="panel-desc">Geometric framing, orientation, and aspect ratios</p>
        </div>
      </div>

      {/* Geometry Rotation and Flips */}
      <div className="panel-section">
        <label className="section-label">Orientation & Transform</label>
        <div className="button-group-row">
          <button
            type="button"
            className="action-icon-btn"
            title="Rotate 90° Counter-Clockwise"
            onClick={() => onRotate(-90)}
          >
            <RotateCcw size={16} />
            <span>-90°</span>
          </button>
          <button
            type="button"
            className="action-icon-btn"
            title="Rotate 90° Clockwise"
            onClick={() => onRotate(90)}
          >
            <RotateCw size={16} />
            <span>+90°</span>
          </button>
          <button
            type="button"
            className={`action-icon-btn ${geometry.flipH ? 'is-active' : ''}`}
            title="Flip Horizontally"
            onClick={onFlipH}
          >
            <FlipHorizontal size={16} />
            <span>Flip H</span>
          </button>
          <button
            type="button"
            className={`action-icon-btn ${geometry.flipV ? 'is-active' : ''}`}
            title="Flip Vertically"
            onClick={onFlipV}
          >
            <FlipVertical size={16} />
            <span>Flip V</span>
          </button>
        </div>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="panel-section">
        <label className="section-label">Aspect Ratio</label>
        <div className="aspect-ratio-grid">
          {RATIO_PRESETS.map((p) => {
            const isSelected =
              cropAspectRatio === null
                ? p.ratio === null
                : p.ratio !== null && Math.abs(cropAspectRatio - p.ratio) < 0.01;

            return (
              <button
                key={p.label}
                type="button"
                className={`ratio-btn ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onAspectRatioSelect(p.ratio)}
              >
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Apply / Cancel Crop Actions */}
      <div className="crop-actions-bar">
        <button
          type="button"
          className="btn-danger-outline"
          onClick={onResetCrop}
          title="Reset crop to full image"
        >
          <Maximize2 size={15} />
          <span>Reset Box</span>
        </button>

        <div className="action-buttons-right">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancelCrop}
          >
            <X size={15} />
            <span>Cancel</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onApplyCrop}
          >
            <Check size={15} />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
