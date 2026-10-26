import React from 'react';
import { BrushSettings, MaskAdjustments } from '../types/editor';
import {
  Paintbrush,
  Eraser,
  Eye,
  RotateCcw,
  Sun,
  Droplet,
  Contrast,
  Thermometer,
  FlipHorizontal2
} from 'lucide-react';

interface BrushPanelProps {
  brushSettings: BrushSettings;
  maskAdjustments: MaskAdjustments;
  showOverlay: boolean;
  hasMask: boolean;
  onBrushChange: (settings: BrushSettings) => void;
  onAdjustmentsChange: (adjustments: MaskAdjustments) => void;
  onAdjustmentsCommit: (adjustments: MaskAdjustments) => void;
  onToggleOverlay: () => void;
  onClearMask: () => void;
  onInvertMask: () => void;
}

export const BrushPanel: React.FC<BrushPanelProps> = ({
  brushSettings,
  maskAdjustments,
  showOverlay,
  hasMask,
  onBrushChange,
  onAdjustmentsChange,
  onAdjustmentsCommit,
  onToggleOverlay,
  onClearMask,
  onInvertMask
}) => {
  return (
    <div className="panel-content">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Selective Brush</h3>
          <p className="panel-desc">Paint localized tonal adjustments with alpha masking</p>
        </div>
      </div>

      {/* Paint / Erase Mode Switch */}
      <div className="panel-section">
        <label className="section-label">Tool Mode</label>
        <div className="mode-segmented-control">
          <button
            type="button"
            className={`mode-segment-btn ${brushSettings.mode === 'paint' ? 'is-active' : ''}`}
            onClick={() => onBrushChange({ ...brushSettings, mode: 'paint' })}
          >
            <Paintbrush size={15} />
            <span>Paint Mask</span>
          </button>
          <button
            type="button"
            className={`mode-segment-btn ${brushSettings.mode === 'erase' ? 'is-active' : ''}`}
            onClick={() => onBrushChange({ ...brushSettings, mode: 'erase' })}
          >
            <Eraser size={15} />
            <span>Erase Mask</span>
          </button>
        </div>
      </div>

      {/* Brush Settings */}
      <div className="panel-section">
        <label className="section-label">Brush Parameters</label>

        {/* Size */}
        <div className="slider-group">
          <div className="slider-label-row">
            <span className="slider-name">Brush Size</span>
            <span className="slider-value-badge">{brushSettings.size}px</span>
          </div>
          <input
            type="range"
            min={10}
            max={250}
            value={brushSettings.size}
            className="adjustment-slider"
            onChange={(e) => onBrushChange({ ...brushSettings, size: parseInt(e.target.value, 10) })}
          />
        </div>

        {/* Hardness */}
        <div className="slider-group">
          <div className="slider-label-row">
            <span className="slider-name">Edge Feather / Hardness</span>
            <span className="slider-value-badge">{Math.round(brushSettings.hardness * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(brushSettings.hardness * 100)}
            className="adjustment-slider"
            onChange={(e) => onBrushChange({ ...brushSettings, hardness: parseInt(e.target.value, 10) / 100 })}
          />
        </div>

        {/* Opacity / Strength */}
        <div className="slider-group">
          <div className="slider-label-row">
            <span className="slider-name">Flow / Opacity</span>
            <span className="slider-value-badge">{Math.round(brushSettings.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={Math.round(brushSettings.opacity * 100)}
            className="adjustment-slider"
            onChange={(e) => onBrushChange({ ...brushSettings, opacity: parseInt(e.target.value, 10) / 100 })}
          />
        </div>
      </div>

      {/* Overlay & Mask Actions */}
      <div className="panel-section">
        <label className="section-label">Mask Visibility & Actions</label>
        <div className="mask-actions-row">
          <button
            type="button"
            className={`action-pill-btn ${showOverlay ? 'is-active-overlay' : ''}`}
            onClick={onToggleOverlay}
          >
            <Eye size={14} />
            <span>{showOverlay ? 'Hide Ruby Overlay' : 'Show Ruby Overlay'}</span>
          </button>

          {hasMask && (
            <>
              <button
                type="button"
                className="action-pill-btn"
                onClick={onInvertMask}
                title="Invert current mask"
              >
                <FlipHorizontal2 size={14} />
                <span>Invert</span>
              </button>
              <button
                type="button"
                className="action-pill-btn btn-danger-text"
                onClick={onClearMask}
                title="Clear all painted mask strokes"
              >
                <RotateCcw size={14} />
                <span>Clear Mask</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mask Adjustments */}
      <div className="panel-section">
        <label className="section-label">Adjustments Applied to Mask</label>

        {/* Mask Brightness */}
        <div className="slider-group">
          <div className="slider-label-row">
            <div className="slider-title-wrap">
              <Sun size={14} className="slider-icon" />
              <span className="slider-name">Brightness</span>
            </div>
            <span className="slider-value-badge">
              {maskAdjustments.brightness > 0 ? `+${maskAdjustments.brightness}` : maskAdjustments.brightness}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={maskAdjustments.brightness}
            className="adjustment-slider"
            onChange={(e) => onAdjustmentsChange({ ...maskAdjustments, brightness: parseInt(e.target.value, 10) })}
            onPointerUp={() => onAdjustmentsCommit(maskAdjustments)}
          />
        </div>

        {/* Mask Saturation */}
        <div className="slider-group">
          <div className="slider-label-row">
            <div className="slider-title-wrap">
              <Droplet size={14} className="slider-icon" />
              <span className="slider-name">Saturation</span>
            </div>
            <span className="slider-value-badge">
              {maskAdjustments.saturation > 0 ? `+${maskAdjustments.saturation}` : maskAdjustments.saturation}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={maskAdjustments.saturation}
            className="adjustment-slider"
            onChange={(e) => onAdjustmentsChange({ ...maskAdjustments, saturation: parseInt(e.target.value, 10) })}
            onPointerUp={() => onAdjustmentsCommit(maskAdjustments)}
          />
        </div>

        {/* Mask Contrast */}
        <div className="slider-group">
          <div className="slider-label-row">
            <div className="slider-title-wrap">
              <Contrast size={14} className="slider-icon" />
              <span className="slider-name">Contrast</span>
            </div>
            <span className="slider-value-badge">
              {maskAdjustments.contrast > 0 ? `+${maskAdjustments.contrast}` : maskAdjustments.contrast}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={maskAdjustments.contrast}
            className="adjustment-slider"
            onChange={(e) => onAdjustmentsChange({ ...maskAdjustments, contrast: parseInt(e.target.value, 10) })}
            onPointerUp={() => onAdjustmentsCommit(maskAdjustments)}
          />
        </div>

        {/* Mask Warmth */}
        <div className="slider-group">
          <div className="slider-label-row">
            <div className="slider-title-wrap">
              <Thermometer size={14} className="slider-icon" />
              <span className="slider-name">Warmth</span>
            </div>
            <span className="slider-value-badge">
              {maskAdjustments.warmth > 0 ? `+${maskAdjustments.warmth}` : maskAdjustments.warmth}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={maskAdjustments.warmth}
            className="adjustment-slider"
            onChange={(e) => onAdjustmentsChange({ ...maskAdjustments, warmth: parseInt(e.target.value, 10) })}
            onPointerUp={() => onAdjustmentsCommit(maskAdjustments)}
          />
        </div>
      </div>
    </div>
  );
};
