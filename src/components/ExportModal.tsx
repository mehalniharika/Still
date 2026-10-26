import React, { useState } from 'react';
import { ExportSettings } from '../types/editor';
import { Download, X, FileImage, CheckCircle, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => Promise<void>;
  outputWidth: number;
  outputHeight: number;
  originalFilename: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  outputWidth,
  outputHeight,
  originalFilename
}) => {
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.92);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExportClick = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      await onExport({
        format,
        quality,
        scale: 1.0
      });
      setExportSuccess(true);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
    }
  };

  const baseName = originalFilename.replace(/\.[^/.]+$/, '') || 'photo';
  let ext = 'jpg';
  if (format === 'image/png') ext = 'png';
  if (format === 'image/webp') ext = 'webp';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <FileImage size={20} className="modal-icon" />
            <h3 className="modal-title">Export Photograph</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Format Selection */}
          <div className="modal-field">
            <label className="modal-label">Output Format</label>
            <div className="format-options-grid">
              <button
                type="button"
                className={`format-card ${format === 'image/jpeg' ? 'is-active' : ''}`}
                onClick={() => setFormat('image/jpeg')}
              >
                <span className="format-name">JPEG</span>
                <span className="format-desc">Best for photos, compressed</span>
              </button>
              <button
                type="button"
                className={`format-card ${format === 'image/png' ? 'is-active' : ''}`}
                onClick={() => setFormat('image/png')}
              >
                <span className="format-name">PNG</span>
                <span className="format-desc">Lossless, crisp graphics</span>
              </button>
              <button
                type="button"
                className={`format-card ${format === 'image/webp' ? 'is-active' : ''}`}
                onClick={() => setFormat('image/webp')}
              >
                <span className="format-name">WebP</span>
                <span className="format-desc">Modern web, high efficiency</span>
              </button>
            </div>
          </div>

          {/* Quality Slider (for JPEG / WebP) */}
          {format !== 'image/png' && (
            <div className="modal-field">
              <div className="modal-label-row">
                <label className="modal-label">Compression Quality</label>
                <span className="modal-value-badge">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={1.0}
                step={0.02}
                value={quality}
                className="adjustment-slider"
                onChange={(e) => setQuality(parseFloat(e.target.value))}
              />
              <div className="quality-hints">
                <span>Smaller File</span>
                <span>Balanced</span>
                <span>Maximum Fidelity</span>
              </div>
            </div>
          )}

          {/* Image Dimensions & Destination */}
          <div className="export-summary-box">
            <div className="summary-row">
              <span className="summary-label">Target Dimensions</span>
              <span className="summary-value font-mono">
                {outputWidth} × {outputHeight} px
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Download Filename</span>
              <span className="summary-value font-mono">
                {baseName}-lumina.{ext}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleExportClick}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="spin-animate" />
                <span>Rendering High-Res...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle size={16} />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Export & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
