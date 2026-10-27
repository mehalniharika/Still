import React from 'react';
import { RotateCcw } from 'lucide-react';
import { TextOverlayState } from '../types/editor';

export type { TextOverlayState };

interface TextPanelProps {
  textState: TextOverlayState;
  onChange: (newState: TextOverlayState) => void;
  onReset: () => void;
}

export const TextPanel: React.FC<TextPanelProps> = ({
  textState,
  onChange,
  onReset
}) => {
  const handleChange = (key: keyof TextOverlayState, val: any) => {
    onChange({
      ...textState,
      [key]: val
    });
  };

  const hasContent = textState.content.trim().length > 0;

  return (
    <div className="panel-content">
      <div className="panel-header">
        <div>
          <span className="eyebrow">THE EDITOR / TOOL</span>
          <h2 className="panel-title">Typography & Badges</h2>
          <p className="panel-desc">Add styled caption badges and film typography</p>
        </div>
        {hasContent && (
          <button className="icon-btn-ghost" onClick={onReset} title="Clear Text" type="button">
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {/* Text Input */}
        <div className="control-group">
          <label className="control-label" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Caption Text</label>
          <input
            type="text"
            className="form-input"
            value={textState.content}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="Type your caption here..."
            style={{ width: '100%', padding: '0.45rem', marginTop: '0.35rem', borderRadius: '6px' }}
          />
        </div>

        {/* Style Preset */}
        <div className="control-group">
          <label className="control-label" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Badge Style</label>
          <select
            className="form-select"
            value={textState.style}
            onChange={(e) => handleChange('style', e.target.value as any)}
            style={{ width: '100%', padding: '0.45rem', marginTop: '0.35rem', borderRadius: '6px' }}
          >
            <option value="simple">Clean Text (No Badge)</option>
            <option value="badge">Solid Pill Badge</option>
            <option value="outline">Outlined Border Box</option>
            <option value="ribbon">Cinematic Ribbon Banner</option>
            <option value="knockout">Inverted Knockout Mask</option>
          </select>
        </div>

        {/* Font Family */}
        <div className="control-group">
          <label className="control-label" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Font Family</label>
          <select
            className="form-select"
            value={textState.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            style={{ width: '100%', padding: '0.45rem', marginTop: '0.35rem', borderRadius: '6px' }}
          >
            <option value="'Inter', sans-serif">Modern Sans-Serif (Inter)</option>
            <option value="'Cinzel', serif">Luxury Serif (Cinzel)</option>
            <option value="'Playfair Display', serif">Editorial Italic (Playfair)</option>
            <option value="'JetBrains Mono', monospace">Monospace Terminal</option>
            <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
            <option value="'DM Mono', monospace">DM Mono</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="slider-control">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span>Font Size</span>
            <span>{textState.fontSize}px</span>
          </div>
          <input
            type="range"
            min="16"
            max="120"
            value={textState.fontSize}
            onChange={(e) => handleChange('fontSize', parseInt(e.target.value) || 32)}
            style={{ width: '100%', marginTop: '0.4rem' }}
          />
        </div>

        {/* Colors */}
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Text Color</label>
            <input
              type="color"
              value={textState.textColor}
              onChange={(e) => handleChange('textColor', e.target.value)}
              style={{ width: '100%', height: '32px', cursor: 'pointer', border: 'none', borderRadius: '4px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Badge Color</label>
            <input
              type="color"
              value={textState.badgeColor}
              onChange={(e) => handleChange('badgeColor', e.target.value)}
              style={{ width: '100%', height: '32px', cursor: 'pointer', border: 'none', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Opacity */}
        <div className="slider-control">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span>Opacity</span>
            <span>{Math.round(textState.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={Math.round(textState.opacity * 100)}
            onChange={(e) => handleChange('opacity', (parseInt(e.target.value) || 100) / 100)}
            style={{ width: '100%', marginTop: '0.4rem' }}
          />
        </div>

        {/* Vertical Position */}
        <div className="slider-control">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span>Vertical Position</span>
            <span>{Math.round(textState.posY * 100)}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="95"
            value={Math.round(textState.posY * 100)}
            onChange={(e) => handleChange('posY', (parseInt(e.target.value) || 85) / 100)}
            style={{ width: '100%', marginTop: '0.4rem' }}
          />
        </div>
      </div>
    </div>
  );
};
