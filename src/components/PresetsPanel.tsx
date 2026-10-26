import React from 'react';
import { PRESET_LOOKS } from '../engine/presets';
import { PresetLook } from '../types/editor';
import { Check, RotateCcw } from 'lucide-react';

interface PresetsPanelProps {
  activePresetId: string | null;
  onSelectPreset: (preset: PresetLook) => void;
  onClearPreset: () => void;
}

export const PresetsPanel: React.FC<PresetsPanelProps> = ({
  activePresetId,
  onSelectPreset,
  onClearPreset
}) => {
  return (
    <div className="panel-content">
      <div className="panel-header">
        <div>
          <span className="eyebrow">THE EDITOR / TOOL</span>
          <h2 className="panel-title">Looks</h2>
          <p className="panel-desc">Curated tonal recipes and colour grades</p>
        </div>
        {activePresetId && (
          <button
            type="button"
            className="action-pill-btn"
            onClick={onClearPreset}
            title="Reset to default unstyled look"
          >
            <RotateCcw size={13} />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="presets-grid">
        {PRESET_LOOKS.map((preset) => {
          const isSelected = preset.id === activePresetId;

          return (
            <div
              key={preset.id}
              className={`preset-card ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectPreset(preset)}
            >
              <div
                className="preset-swatch"
                style={{ background: preset.gradient }}
              />
              <div className="preset-info">
                <span className="preset-name">{preset.name}</span>
                <span className="preset-subtitle">{preset.subtitle}</span>
              </div>
              {isSelected && (
                <div className="preset-active-badge" style={{ marginLeft: 'auto' }}>
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
