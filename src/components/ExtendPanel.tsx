import React from 'react';
import { RotateCcw } from 'lucide-react';
import { ExtendState } from '../types/editor';

export type { ExtendState };

interface ExtendPanelProps {
  extendState: ExtendState;
  onChange: (newState: ExtendState) => void;
  onReset: () => void;
}

export const ExtendPanel: React.FC<ExtendPanelProps> = ({
  extendState,
  onChange,
  onReset
}) => {
  const handleChange = (key: keyof ExtendState, val: any) => {
    onChange({
      ...extendState,
      [key]: val
    });
  };

  const isModified = extendState.top > 0 || extendState.bottom > 0 || extendState.left > 0 || extendState.right > 0;

  return (
    <div className="panel-content">
      <div className="panel-header">
        <div>
          <span className="eyebrow">THE EDITOR / TOOL</span>
          <h2 className="panel-title">Extend Canvas</h2>
          <p className="panel-desc">Expand framing with smart mirror or solid fill</p>
        </div>
        {isModified && (
          <button className="icon-btn-ghost" onClick={onReset} title="Reset Extend" type="button">
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      <div className="panel-body">
        {/* Fill Mode */}
        <div className="control-group">
          <label className="control-label">Fill Mode</label>
          <div className="radio-group" style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
            <button
              type="button"
              className={`pill-btn ${extendState.mode === 'mirror' ? 'active' : ''}`}
              onClick={() => handleChange('mode', 'mirror')}
            >
              Smart Mirror
            </button>
            <button
              type="button"
              className={`pill-btn ${extendState.mode === 'white' ? 'active' : ''}`}
              onClick={() => handleChange('mode', 'white')}
            >
              White
            </button>
            <button
              type="button"
              className={`pill-btn ${extendState.mode === 'black' ? 'active' : ''}`}
              onClick={() => handleChange('mode', 'black')}
            >
              Black
            </button>
          </div>
        </div>

        {/* Padding Sliders */}
        {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
          <div className="slider-control" key={side} style={{ marginTop: '0.8rem' }}>
            <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ textTransform: 'capitalize' }}>{side} Margin</span>
              <span className="slider-val">{extendState[side]}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              value={extendState[side]}
              onChange={(e) => handleChange(side, parseInt(e.target.value) || 0)}
              style={{ width: '100%', marginTop: '0.4rem' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
