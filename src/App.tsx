import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActiveTool,
  AdjustmentsState,
  BrushSettings,
  CurvesState,
  ExportSettings,
  ExtendState,
  GeometryState,
  HistoryStep,
  MaskAdjustments,
  NormalizedRect,
  PresetLook,
  TextOverlayState
} from './types/editor';
import { getDefaultCurvesState, isCurvesStateModified } from './engine/curves';
import { generateSamplePhotograph } from './utils/sampleImage';
import { exportImage, triggerDownload } from './utils/export';
import { Toolbar } from './components/Toolbar';
import { ToolDrawer } from './components/ToolDrawer';
import { CanvasViewport } from './components/CanvasViewport';
import { AdjustmentsPanel } from './components/AdjustmentsPanel';
import { CropPanel } from './components/CropPanel';
import { CurvesEditor } from './components/CurvesEditor';
import { BrushPanel } from './components/BrushPanel';
import { PresetsPanel } from './components/PresetsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { ExportModal } from './components/ExportModal';
import { EmptyState } from './components/EmptyState';
import { ExtendPanel } from './components/ExtendPanel';
import { TextPanel } from './components/TextPanel';

const DEFAULT_ADJUSTMENTS: AdjustmentsState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0
};

const DEFAULT_GEOMETRY: GeometryState = {
  rotation: 0,
  flipH: false,
  flipV: false,
  cropRect: null
};

const DEFAULT_MASK_ADJUSTMENTS: MaskAdjustments = {
  brightness: 30,
  saturation: 20,
  contrast: 10,
  warmth: 0
};

const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
  size: 70,
  hardness: 0.4,
  opacity: 0.85,
  mode: 'paint'
};

const DEFAULT_EXTEND: ExtendState = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  mode: 'mirror'
};

const DEFAULT_TEXT: TextOverlayState = {
  content: '',
  style: 'simple',
  fontFamily: "'Inter', sans-serif",
  fontSize: 32,
  textColor: '#ffffff',
  badgeColor: '#000000',
  opacity: 1,
  posX: 0.5,
  posY: 0.85
};

export const App: React.FC = () => {
  // Document state
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string>('');
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Active Tool & UI state
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Parametric state
  const [geometry, setGeometry] = useState<GeometryState>(DEFAULT_GEOMETRY);
  const [adjustments, setAdjustments] = useState<AdjustmentsState>(DEFAULT_ADJUSTMENTS);
  const [curves, setCurves] = useState<CurvesState>(getDefaultCurvesState());
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Crop temporary state while crop tool is open
  const [tempCropRect, setTempCropRect] = useState<NormalizedRect>({ x: 0, y: 0, width: 1, height: 1 });
  const [cropAspectRatio, setCropAspectRatio] = useState<number | null>(null);

  // Mask state
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [maskHasContent, setMaskHasContent] = useState<boolean>(false);
  const [showMaskOverlay, setShowMaskOverlay] = useState<boolean>(false);
  const [brushSettings, setBrushSettings] = useState<BrushSettings>(DEFAULT_BRUSH_SETTINGS);
  const [maskAdjustments, setMaskAdjustments] = useState<MaskAdjustments>(DEFAULT_MASK_ADJUSTMENTS);

  // Extend & Text state
  const [extendState, setExtendState] = useState<ExtendState>(DEFAULT_EXTEND);
  const [textState, setTextState] = useState<TextOverlayState>(DEFAULT_TEXT);

  // History ledger
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Helper to commit a state change to the non-destructive history stack
  const commitHistoryStep = useCallback(
    (label: string, overrides?: Partial<HistoryStep>) => {
      const stepGeometry = overrides?.geometry ?? geometry;
      const stepAdjustments = overrides?.adjustments ?? adjustments;
      const stepCurves = overrides?.curves ?? curves;
      const stepPreset = overrides?.activePresetId !== undefined ? overrides.activePresetId : activePresetId;
      const stepMaskAdjustments = overrides?.maskAdjustments ?? maskAdjustments;
      const stepExtend = overrides?.extend ?? extendState;
      const stepText = overrides?.text ?? textState;

      // Serialize mask data url if mask canvas has content
      let maskDataUrl: string | null = null;
      if (maskCanvasRef.current && maskHasContent) {
        maskDataUrl = maskCanvasRef.current.toDataURL();
      }

      const newStep: HistoryStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        label,
        timestamp: Date.now(),
        geometry: { ...stepGeometry },
        adjustments: { ...stepAdjustments },
        curves: JSON.parse(JSON.stringify(stepCurves)),
        maskDataUrl,
        maskAdjustments: { ...stepMaskAdjustments },
        activePresetId: stepPreset,
        extend: { ...stepExtend },
        text: { ...stepText }
      };

      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndex + 1);
        return [...truncated, newStep];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [geometry, adjustments, curves, activePresetId, maskAdjustments, maskHasContent, historyIndex, extendState, textState]
  );

  // Restore a specific history step
  const restoreStep = useCallback((targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= history.length) return;
    const step = history[targetIndex];

    setGeometry({ ...step.geometry });
    setAdjustments({ ...step.adjustments });
    setCurves(JSON.parse(JSON.stringify(step.curves)));
    setActivePresetId(step.activePresetId);
    setMaskAdjustments({ ...step.maskAdjustments });
    setExtendState(step.extend ? { ...step.extend } : DEFAULT_EXTEND);
    setTextState(step.text ? { ...step.text } : DEFAULT_TEXT);

    // Restore mask canvas
    if (step.maskDataUrl && originalImage) {
      const img = new Image();
      img.onload = () => {
        if (!maskCanvasRef.current) {
          maskCanvasRef.current = document.createElement('canvas');
        }
        maskCanvasRef.current.width = img.width;
        maskCanvasRef.current.height = img.height;
        const ctx = maskCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, img.width, img.height);
          ctx.drawImage(img, 0, 0);
          setMaskHasContent(true);
        }
      };
      img.src = step.maskDataUrl;
    } else {
      if (maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
      setMaskHasContent(false);
    }

    setHistoryIndex(targetIndex);
  }, [history, originalImage]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      restoreStep(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      restoreStep(historyIndex + 1);
    }
  };

  const handleResetAllEdits = () => {
    if (history.length > 0) {
      const rootStep = history[0];
      setGeometry({ ...rootStep.geometry });
      setAdjustments({ ...rootStep.adjustments });
      setCurves(JSON.parse(JSON.stringify(rootStep.curves)));
      setActivePresetId(null);
      setMaskAdjustments(DEFAULT_MASK_ADJUSTMENTS);
      setExtendState(DEFAULT_EXTEND);
      setTextState(DEFAULT_TEXT);
      if (maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
      setMaskHasContent(false);

      commitHistoryStep('Reset All Edits', {
        geometry: DEFAULT_GEOMETRY,
        adjustments: DEFAULT_ADJUSTMENTS,
        curves: getDefaultCurvesState(),
        activePresetId: null,
        maskAdjustments: DEFAULT_MASK_ADJUSTMENTS,
        extend: DEFAULT_EXTEND,
        text: DEFAULT_TEXT
      });
    }
  };

  // Keyboard Shortcuts (Undo, Redo, Open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        if (isExportModalOpen) {
          setIsExportModalOpen(false);
        } else if (activeTool === 'crop') {
          setActiveTool('none');
        }
      } else if (e.key === '\\') {
        // Quick comparison toggle (like Lightroom / Snapseed)
        setIsComparing((c) => !c);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history.length, isExportModalOpen, activeTool]);

  // Image Ingest
  const loadPhotoFromSource = (src: string, filename: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img);
      setOriginalFilename(filename);
      setGeometry(DEFAULT_GEOMETRY);
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setCurves(getDefaultCurvesState());
      setActivePresetId(null);
      setMaskAdjustments(DEFAULT_MASK_ADJUSTMENTS);
      setExtendState(DEFAULT_EXTEND);
      setTextState(DEFAULT_TEXT);
      setActiveTool('adjust');
      setZoomLevel(1.0);
      setIsComparing(false);

      // Reset mask canvas
      const mCanvas = document.createElement('canvas');
      mCanvas.width = img.width;
      mCanvas.height = img.height;
      maskCanvasRef.current = mCanvas;
      setMaskHasContent(false);

      // Initial root history step
      const rootStep: HistoryStep = {
        id: 'step-root',
        label: 'Original Photo',
        timestamp: Date.now(),
        geometry: DEFAULT_GEOMETRY,
        adjustments: DEFAULT_ADJUSTMENTS,
        curves: getDefaultCurvesState(),
        maskDataUrl: null,
        maskAdjustments: DEFAULT_MASK_ADJUSTMENTS,
        activePresetId: null,
        extend: DEFAULT_EXTEND,
        text: DEFAULT_TEXT
      };

      setHistory([rootStep]);
      setHistoryIndex(0);
      setIsLoadingSample(false);
    };
    img.onerror = () => {
      alert('Failed to decode the image file. Please verify it is a valid JPEG, PNG, or WebP.');
      setIsLoadingSample(false);
    };
    img.src = src;
  };

  const handleOpenFile = (file: File) => {
    const url = URL.createObjectURL(file);
    loadPhotoFromSource(url, file.name);
  };

  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    const dataUrl = await generateSamplePhotograph();
    loadPhotoFromSource(dataUrl, 'alpine-sunset-sample.jpg');
  };

  // Preset Selection
  const handleSelectPreset = (preset: PresetLook) => {
    const newAdjustments: AdjustmentsState = {
      ...DEFAULT_ADJUSTMENTS,
      ...(preset.adjustments || {})
    };

    let newCurves = getDefaultCurvesState();
    if (preset.curves) {
      if (preset.curves.rgb) newCurves.rgb = preset.curves.rgb;
      if (preset.curves.red) newCurves.red = preset.curves.red;
      if (preset.curves.green) newCurves.green = preset.curves.green;
      if (preset.curves.blue) newCurves.blue = preset.curves.blue;
    }

    setAdjustments(newAdjustments);
    setCurves(newCurves);
    setActivePresetId(preset.id);

    commitHistoryStep(`Applied Look: ${preset.name}`, {
      adjustments: newAdjustments,
      curves: newCurves,
      activePresetId: preset.id
    });
  };

  const handleClearPreset = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setCurves(getDefaultCurvesState());
    setActivePresetId(null);
    commitHistoryStep('Cleared Preset', {
      adjustments: DEFAULT_ADJUSTMENTS,
      curves: getDefaultCurvesState(),
      activePresetId: null
    });
  };

  // Adjustments Panel handlers
  const handleAdjustmentsChange = (newAdjustments: AdjustmentsState) => {
    setAdjustments(newAdjustments);
  };

  const handleAdjustmentsCommit = (newAdjustments: AdjustmentsState) => {
    commitHistoryStep('Tune Image', { adjustments: newAdjustments });
  };

  const handleAdjustmentsReset = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    commitHistoryStep('Reset Adjustments', { adjustments: DEFAULT_ADJUSTMENTS });
  };

  // Crop & Geometry handlers
  const handleRotate = () => {
    const nextRot = ((geometry.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    const newGeom: GeometryState = {
      ...geometry,
      rotation: nextRot
    };
    setGeometry(newGeom);
    commitHistoryStep('Rotate 90°', { geometry: newGeom });
  };

  const handleFlipH = () => {
    const newGeom: GeometryState = { ...geometry, flipH: !geometry.flipH };
    setGeometry(newGeom);
    commitHistoryStep('Flip Horizontal', { geometry: newGeom });
  };

  const handleFlipV = () => {
    const newGeom: GeometryState = { ...geometry, flipV: !geometry.flipV };
    setGeometry(newGeom);
    commitHistoryStep('Flip Vertical', { geometry: newGeom });
  };

  const handleApplyCrop = () => {
    const newGeom: GeometryState = {
      ...geometry,
      cropRect: tempCropRect
    };
    setGeometry(newGeom);
    setActiveTool('none');
    commitHistoryStep('Applied Crop', { geometry: newGeom });
  };

  const handleCancelCrop = () => {
    setTempCropRect(geometry.cropRect || { x: 0, y: 0, width: 1, height: 1 });
    setActiveTool('none');
  };

  const handleResetCrop = () => {
    const newGeom: GeometryState = {
      ...geometry,
      cropRect: null
    };
    setGeometry(newGeom);
    setTempCropRect({ x: 0, y: 0, width: 1, height: 1 });
    commitHistoryStep('Reset Crop', { geometry: newGeom });
  };

  // Curves handlers
  const handleCurvesChange = (newCurves: CurvesState) => {
    setCurves(newCurves);
  };

  const handleCurvesCommit = (newCurves: CurvesState) => {
    commitHistoryStep('Curves Adjustment', { curves: newCurves });
  };

  // Selective Mask handlers
  const handleMaskStrokeEnd = (newMaskCanvas: HTMLCanvasElement) => {
    setMaskHasContent(true);
    commitHistoryStep('Brush Stroke');
  };

  const handleMaskAdjustmentsChange = (newMaskAdj: MaskAdjustments) => {
    setMaskAdjustments(newMaskAdj);
  };

  const handleMaskAdjustmentsCommit = (newMaskAdj: MaskAdjustments) => {
    commitHistoryStep('Tune Selective Brush', { maskAdjustments: newMaskAdj });
  };

  const handleClearMask = () => {
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    }
    setMaskHasContent(false);
    commitHistoryStep('Cleared Brush Mask');
  };

  const handleInvertMask = () => {
    if (!maskCanvasRef.current || !originalImage) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];       // Invert alpha/luminance
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
      d[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    setMaskHasContent(true);
    commitHistoryStep('Inverted Brush Mask');
  };

  // Full-Res Export Handler
  const handleExport = async (settings: ExportSettings) => {
    if (!originalImage) return;

    const result = await exportImage({
      source: originalImage,
      geometry,
      adjustments,
      curves,
      maskCanvas: maskHasContent ? maskCanvasRef.current : null,
      maskAdjustments: maskHasContent ? maskAdjustments : null,
      settings,
      originalFilename,
      extend: extendState,
      text: textState
    });

    triggerDownload(result.dataUrl, result.filename);
  };

  // Check which tools have active modifications
  const hasAdjustmentsModified = Object.keys(DEFAULT_ADJUSTMENTS).some(
    (k) => adjustments[k as keyof AdjustmentsState] !== DEFAULT_ADJUSTMENTS[k as keyof AdjustmentsState]
  );
  const hasCropModified = geometry.rotation !== 0 || geometry.flipH || geometry.flipV || geometry.cropRect !== null;
  const hasCurvesModified = isCurvesStateModified(curves);
  const hasExtendModified = extendState.top > 0 || extendState.bottom > 0 || extendState.left > 0 || extendState.right > 0;
  const hasTextModified = textState.content.trim().length > 0;

  // Compute current rendered output dimensions for export display
  let computedExportW = originalImage?.width || 0;
  let computedExportH = originalImage?.height || 0;
  if (geometry.rotation === 90 || geometry.rotation === 270) {
    const temp = computedExportW;
    computedExportW = computedExportH;
    computedExportH = temp;
  }
  if (geometry.cropRect) {
    computedExportW = Math.round(computedExportW * geometry.cropRect.width);
    computedExportH = Math.round(computedExportH * geometry.cropRect.height);
  }
  computedExportW += (extendState.left + extendState.right);
  computedExportH += (extendState.top + extendState.bottom);

  return (
    <div className="app-root">
      {/* Top Bar */}
      <Toolbar
        hasImage={!!originalImage}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetAll={handleResetAllEdits}
        onOpenFile={handleOpenFile}
        onLoadSample={handleLoadSample}
        zoomLevel={zoomLevel}
        onZoomIn={() => setZoomLevel((z) => Math.min(5.0, z * 1.25))}
        onZoomOut={() => setZoomLevel((z) => Math.max(0.1, z * 0.8))}
        onZoomFit={() => setZoomLevel(1.0)}
        onZoom100={() => setZoomLevel(1.0)}
        isComparing={isComparing}
        onToggleCompare={() => setIsComparing((c) => !c)}
        onOpenExport={() => setIsExportModalOpen(true)}
        filename={originalFilename}
      />

      {/* Main Workspace Body */}
      {originalImage ? (
        <div className="editor-workspace">
          {/* Vertical Tool Drawer (Left) */}
          <ToolDrawer
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            hasAdjustments={hasAdjustmentsModified}
            hasCrop={hasCropModified}
            hasCurves={hasCurvesModified}
            hasMask={maskHasContent}
            hasPreset={!!activePresetId}
            hasExtend={hasExtendModified}
            hasText={hasTextModified}
            historyCount={history.length}
          />

          {/* Contextual Adjustment Panel (Left flyout) */}
          {activeTool !== 'none' && (
            <aside className="contextual-panel">
              {activeTool === 'presets' && (
                <PresetsPanel
                  activePresetId={activePresetId}
                  onSelectPreset={handleSelectPreset}
                  onClearPreset={handleClearPreset}
                />
              )}

              {activeTool === 'adjust' && (
                <AdjustmentsPanel
                  adjustments={adjustments}
                  onChange={handleAdjustmentsChange}
                  onCommit={handleAdjustmentsCommit}
                  onReset={handleAdjustmentsReset}
                />
              )}

              {activeTool === 'crop' && (
                <CropPanel
                  geometry={geometry}
                  tempCropRect={tempCropRect}
                  cropAspectRatio={cropAspectRatio}
                  onAspectRatioSelect={setCropAspectRatio}
                  onRotate={handleRotate}
                  onFlipH={handleFlipH}
                  onFlipV={handleFlipV}
                  onApplyCrop={handleApplyCrop}
                  onCancelCrop={handleCancelCrop}
                  onResetCrop={handleResetCrop}
                />
              )}

              {activeTool === 'curves' && (
                <div className="panel-content">
                  <div className="panel-header">
                    <div>
                      <span className="eyebrow">THE EDITOR / TOOL</span>
                      <h2 className="panel-title">Tone Curves</h2>
                      <p className="panel-desc">Spline tonal remapping across colour channels</p>
                    </div>
                  </div>
                  <CurvesEditor
                    curves={curves}
                    onChange={handleCurvesChange}
                    onCommit={handleCurvesCommit}
                  />
                </div>
              )}

              {activeTool === 'brush' && (
                <BrushPanel
                  brushSettings={brushSettings}
                  maskAdjustments={maskAdjustments}
                  showOverlay={showMaskOverlay}
                  hasMask={maskHasContent}
                  onBrushChange={setBrushSettings}
                  onAdjustmentsChange={handleMaskAdjustmentsChange}
                  onAdjustmentsCommit={handleMaskAdjustmentsCommit}
                  onToggleOverlay={() => setShowMaskOverlay((s) => !s)}
                  onClearMask={handleClearMask}
                  onInvertMask={handleInvertMask}
                />
              )}

              {activeTool === 'extend' && (
                <ExtendPanel
                  extendState={extendState}
                  onChange={(newState) => {
                    setExtendState(newState);
                  }}
                  onReset={() => {
                    setExtendState(DEFAULT_EXTEND);
                    commitHistoryStep('Reset Expand', { extend: DEFAULT_EXTEND });
                  }}
                />
              )}

              {activeTool === 'text' && (
                <TextPanel
                  textState={textState}
                  onChange={(newState) => {
                    setTextState(newState);
                  }}
                  onReset={() => {
                    setTextState(DEFAULT_TEXT);
                    commitHistoryStep('Clear Text', { text: DEFAULT_TEXT });
                  }}
                />
              )}

              {activeTool === 'history' && (
                <HistoryPanel
                  history={history}
                  currentIndex={historyIndex}
                  onJumpToStep={restoreStep}
                  onResetAll={handleResetAllEdits}
                />
              )}
            </aside>
          )}

          {/* Central Viewport & Canvas */}
          <CanvasViewport
            originalImage={originalImage}
            geometry={geometry}
            adjustments={adjustments}
            curves={curves}
            maskCanvas={maskHasContent ? maskCanvasRef.current : null}
            maskAdjustments={maskHasContent ? maskAdjustments : null}
            showMaskOverlay={showMaskOverlay}
            brushSettings={brushSettings}
            activeTool={activeTool}
            isComparing={isComparing}
            onCompareChange={setIsComparing}
            cropRect={tempCropRect}
            cropAspectRatio={cropAspectRatio}
            onCropRectChange={setTempCropRect}
            onMaskStrokeEnd={handleMaskStrokeEnd}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            extendState={extendState}
            textState={textState}
          />
        </div>
      ) : (
        <EmptyState
          onOpenFile={handleOpenFile}
          onLoadSample={handleLoadSample}
          isLoadingSample={isLoadingSample}
        />
      )}

      {/* Export Dialog Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        outputWidth={computedExportW}
        outputHeight={computedExportH}
        originalFilename={originalFilename}
      />
    </div>
  );
};
export default App;
