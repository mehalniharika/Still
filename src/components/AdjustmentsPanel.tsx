import React from 'react';
import { AdjustmentsState } from '../types/editor';
import {
  Sun,
  Contrast,
  Droplet,
  Thermometer,
  Sparkles,
  Layers,
  RotateCcw
} from 'lucide-react';

interface AdjustmentsPanelProps {
  adjustments: AdjustmentsState;
  onChange: (adjustments: AdjustmentsState) => void;
  onCommit: (adjustments: AdjustmentsState) => void;
  onReset: () => void;
}

interface SliderConfig {
  key: keyof AdjustmentsState;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'brightness', label: 'Brightness', icon: Sun, min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'contrast', label: 'Contrast', icon: Contrast, min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'saturation', label: 'Saturation', icon: Droplet, min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'warmth', label: 'Warmth', icon: Thermometer, min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'highlights', label: 'Highlights', icon: Sun, min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'shadows', label: 'Shadows', icon: Layers, min: -100, max: 100, step: 1, defaultValue: 0 },
  { key: 'sharpness', label: 'Structure / Sharpness', icon: Sparkles, min: 0, max: 100, step: 1, defaultValue: 0 }
];

export const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({
  adjustments,
  onChange,
  onCommit,
  onReset
}) => {
  const handleSliderChange = (key: keyof AdjustmentsState, value: number) => {
    onChange({
      ...adjustments,
      [key]: value
    });
  };

  const handleSliderCommit = () => {
    onCommit(adjustments);
  };

  const handleResetSingle = (key: keyof AdjustmentsState, defaultValue: number) => {
    const updated = {
      ...adjustments,
      [key]: defaultValue
    };
    onChange(updated);
    onCommit(updated);
  };

  const isAnyModified = SLIDERS.some(s => adjustments[s.key] !== s.defaultValue);

  return (
    <div className="panel-content">
      <div className="panel-header">
        <div>
          <span className="eyebrow">THE EDITOR / TOOL</span>
          <h2 className="panel-title">Tune Image</h2>
          <p className="panel-desc">Master light and colour</p>
        </div>
        {isAnyModified && (
          <button
            type="button"
            className="action-pill-btn"
            onClick={onReset}
            title="Reset all adjustments"
          >
            <RotateCcw size={13} />
            <span>Reset All</span>
          </button>
        )}
      </div>

      <div className="sliders-list">
        {SLIDERS.map((slider) => {
          const Icon = slider.icon;
          const val = adjustments[slider.key];
          const isModified = val !== slider.defaultValue;

          return (
            <div key={slider.key} className={`slider-group ${isModified ? 'is-modified' : ''}`}>
              <div className="slider-label-row">
                <div className="slider-title-wrap">
                  <Icon size={15} className="slider-icon" />
                  <span className="slider-name">{slider.label}</span>
                </div>
                <button
                  type="button"
                  className="slider-value-badge"
                  title="Double click or click to reset"
                  onClick={() => handleResetSingle(slider.key, slider.defaultValue)}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              </div>

              <div className="slider-track-wrap">
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={val}
                  className="adjustment-slider"
                  onChange={(e) => handleSliderChange(slider.key, parseFloat(e.target.value))}
                  onPointerUp={handleSliderCommit}
                  onKeyUp={handleSliderCommit}
                />
                {slider.min < 0 && <div className="slider-center-tick" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
