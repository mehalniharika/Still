import React, { useRef, useState } from 'react';
import {
  FolderOpen,
  Image as ImageIcon,
  Undo2,
  Redo2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  SplitSquareVertical
} from 'lucide-react';

interface ToolbarProps {
  hasImage: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetAll: () => void;
  onOpenFile: (file: File) => void;
  onLoadSample: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoom100: () => void;
  isComparing: boolean;
  onToggleCompare: () => void;
  onOpenExport: () => void;
  filename?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  hasImage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetAll,
  onOpenFile,
  onLoadSample,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoom100,
  isComparing,
  onToggleCompare,
  onOpenExport,
  filename
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
    // Reset input so same file can be reloaded if desired
    e.target.value = '';
  };

  const [logoError, setLogoError] = useState(false);

  return (
    <header className="top-toolbar">
      {/* Still. Brand & Wordmark */}
      <div className="toolbar-left">
        <div className="brand-lockup">
          {!logoError ? (
            <img
              src="/still-logo.svg"
              alt="Still."
              className="still-logo-img"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="still-wordmark">STILL<span className="dot">.</span></span>
          )}
        </div>

        {/* File Open / Import buttons */}
        <div className="toolbar-separator" />
        <div className="toolbar-button-group">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden-file-input"
            onChange={handleFileInputChange}
          />
          <button
            type="button"
            className="toolbar-btn"
            title="Import photograph (Ctrl+O)"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={16} />
            <span className="btn-label-desktop">Open Photo</span>
          </button>

          <button
            type="button"
            className="toolbar-btn secondary"
            title="Load sample landscape photo"
            onClick={onLoadSample}
          >
            <ImageIcon size={16} />
            <span className="btn-label-desktop">Sample</span>
          </button>
        </div>

        {filename && (
          <div className="active-filename-badge" title={filename}>
            <span>{filename}</span>
          </div>
        )}
      </div>

      {/* Center: Undo / Redo & Compare */}
      <div className="toolbar-center">
        {hasImage && (
          <>
            <div className="toolbar-button-group">
              <button
                type="button"
                className="toolbar-icon-btn"
                title="Undo (Ctrl+Z)"
                disabled={!canUndo}
                onClick={onUndo}
              >
                <Undo2 size={16} />
              </button>
              <button
                type="button"
                className="toolbar-icon-btn"
                title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                disabled={!canRedo}
                onClick={onRedo}
              >
                <Redo2 size={16} />
              </button>
              <button
                type="button"
                className="toolbar-icon-btn"
                title="Reset all edits"
                onClick={onResetAll}
              >
                <RotateCcw size={15} />
              </button>
            </div>

            <div className="toolbar-separator" />

            {/* Before / After Comparison */}
            <button
              type="button"
              className={`toolbar-btn ${isComparing ? 'is-comparing-active' : ''}`}
              title="Toggle split Before / After comparison"
              onClick={onToggleCompare}
            >
              <SplitSquareVertical size={16} />
              <span>{isComparing ? 'Exit Split' : 'Compare'}</span>
            </button>
          </>
        )}
      </div>

      {/* Right: Zoom controls & Export button */}
      <div className="toolbar-right">
        {hasImage && (
          <>
            {/* Zoom Controls */}
            <div className="zoom-controls-cluster">
              <button
                type="button"
                className="zoom-btn"
                title="Zoom Out"
                onClick={onZoomOut}
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                className="zoom-badge-btn"
                title="Reset to 100% scale"
                onClick={onZoom100}
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                className="zoom-btn"
                title="Zoom In"
                onClick={onZoomIn}
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                className="zoom-btn"
                title="Zoom to Fit"
                onClick={onZoomFit}
              >
                <Maximize size={14} />
              </button>
            </div>

            <div className="toolbar-separator" />

            {/* Export Button */}
            <button
              type="button"
              className="export-primary-btn"
              title="Export high-resolution image"
              onClick={onOpenExport}
            >
              <Download size={15} />
              <span>EXPORT</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
