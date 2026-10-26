import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ActiveTool,
  AdjustmentsState,
  BrushSettings,
  CurvesState,
  GeometryState,
  MaskAdjustments,
  NormalizedRect
} from '../types/editor';
import { renderPipeline } from '../engine/processor';
import { CropOverlay } from './CropOverlay';

interface CanvasViewportProps {
  originalImage: HTMLImageElement;
  geometry: GeometryState;
  adjustments: AdjustmentsState;
  curves: CurvesState;
  maskCanvas: HTMLCanvasElement | null;
  maskAdjustments: MaskAdjustments | null;
  showMaskOverlay: boolean;
  brushSettings: BrushSettings;
  activeTool: ActiveTool;
  isComparing: boolean;
  onCompareChange: (comparing: boolean) => void;
  // Crop state
  cropRect: NormalizedRect;
  cropAspectRatio: number | null;
  onCropRectChange: (rect: NormalizedRect) => void;
  // Brush callback
  onMaskStrokeEnd: (maskCanvas: HTMLCanvasElement) => void;
  // Zoom & view controls
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  originalImage,
  geometry,
  adjustments,
  curves,
  maskCanvas,
  maskAdjustments,
  showMaskOverlay,
  brushSettings,
  activeTool,
  isComparing,
  cropRect,
  cropAspectRatio,
  onCropRectChange,
  onMaskStrokeEnd,
  zoomLevel,
  onZoomChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport pan & zoom transform
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number } | null>(null);

  // Before/after split position (0 to 1, default 0.5)
  const [splitPos, setSplitPos] = useState<number>(0.5);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Brush cursor position
  const [brushCursor, setBrushCursor] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  });
  const isPaintingRef = useRef(false);
  const lastBrushPointRef = useRef<{ x: number; y: number } | null>(null);

  // Keep a local working mask canvas
  const localMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Base rendered dimensions
  const [renderDim, setRenderDim] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Initialize/synchronize local mask canvas
  useEffect(() => {
    if (!maskCanvas) {
      localMaskCanvasRef.current = null;
      return;
    }
    const copy = document.createElement('canvas');
    copy.width = maskCanvas.width;
    copy.height = maskCanvas.height;
    const ctx = copy.getContext('2d');
    if (ctx) ctx.drawImage(maskCanvas, 0, 0);
    localMaskCanvasRef.current = copy;
  }, [maskCanvas]);

  // Main render function: re-runs when pipeline parameters or original image change
  const performRender = useCallback(() => {
    if (!mainCanvasRef.current || !originalImage) return;

    // Fast preview max dimension: 1600px for crisp, high-res editing
    const previewCanvas = renderPipeline({
      source: originalImage,
      geometry: activeTool === 'crop' ? { ...geometry, cropRect: null } : geometry,
      adjustments,
      curves,
      maskCanvas: localMaskCanvasRef.current || maskCanvas,
      maskAdjustments,
      showMaskOverlay,
      maxDimension: 1600
    });

    const canvas = mainCanvasRef.current;
    if (canvas.width !== previewCanvas.width || canvas.height !== previewCanvas.height) {
      canvas.width = previewCanvas.width;
      canvas.height = previewCanvas.height;
      setRenderDim({ width: previewCanvas.width, height: previewCanvas.height });
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isComparing) {
      // Comparison split mode: Left is untouched original, Right is edited
      // First render unedited geometry onto a temp canvas
      const originalCanvas = renderPipeline({
        source: originalImage,
        geometry: activeTool === 'crop' ? { ...geometry, cropRect: null } : geometry,
        adjustments: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          warmth: 0,
          highlights: 0,
          shadows: 0,
          sharpness: 0
        },
        curves: {
          rgb: [{ id: '0', x: 0, y: 0 }, { id: '1', x: 1, y: 1 }],
          red: [{ id: '0', x: 0, y: 0 }, { id: '1', x: 1, y: 1 }],
          green: [{ id: '0', x: 0, y: 0 }, { id: '1', x: 1, y: 1 }],
          blue: [{ id: '0', x: 0, y: 0 }, { id: '1', x: 1, y: 1 }],
          activeChannel: 'rgb'
        },
        maskCanvas: null,
        maskAdjustments: null,
        showMaskOverlay: false,
        maxDimension: 1600
      });

      const splitX = Math.round(previewCanvas.width * splitPos);

      // Draw original on left
      ctx.drawImage(
        originalCanvas,
        0, 0, splitX, previewCanvas.height,
        0, 0, splitX, previewCanvas.height
      );
      // Draw edited on right
      ctx.drawImage(
        previewCanvas,
        splitX, 0, previewCanvas.width - splitX, previewCanvas.height,
        splitX, 0, previewCanvas.width - splitX, previewCanvas.height
      );

      // Draw split divider line on canvas
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, previewCanvas.height);
      ctx.stroke();
    } else {
      ctx.drawImage(previewCanvas, 0, 0);
    }
  }, [
    originalImage,
    geometry,
    adjustments,
    curves,
    maskCanvas,
    maskAdjustments,
    showMaskOverlay,
    isComparing,
    splitPos,
    activeTool
  ]);

  useEffect(() => {
    performRender();
  }, [performRender]);

  // Center image on container resize or initial load
  useEffect(() => {
    if (!containerRef.current || renderDim.width === 0) return;
    const cWidth = containerRef.current.clientWidth;
    const cHeight = containerRef.current.clientHeight;

    // Calculate fit-to-screen scale
    const padding = 60;
    const fitScale = Math.min(
      (cWidth - padding) / renderDim.width,
      (cHeight - padding) / renderDim.height
    );

    // Initial zoom
    if (zoomLevel === 1.0) {
      onZoomChange(Math.min(1.0, fitScale));
    }

    setPan({
      x: (cWidth - renderDim.width * (zoomLevel === 1.0 ? fitScale : zoomLevel)) / 2,
      y: (cHeight - renderDim.height * (zoomLevel === 1.0 ? fitScale : zoomLevel)) / 2
    });
  }, [renderDim.width, renderDim.height]);

  // Pointer panning & wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.1, Math.min(6.0, zoomLevel * zoomFactor));

    // Zoom centered on cursor
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoomLevel);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoomLevel);

      setPan({ x: newPanX, y: newPanY });
    }

    onZoomChange(newZoom);
  };

  // Convert viewport screen coordinates to image coordinates
  const screenToImageCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!containerRef.current || renderDim.width === 0) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const vx = clientX - rect.left;
    const vy = clientY - rect.top;

    const imgX = (vx - pan.x) / zoomLevel;
    const imgY = (vy - pan.y) / zoomLevel;

    if (imgX < 0 || imgX > renderDim.width || imgY < 0 || imgY > renderDim.height) {
      return null;
    }
    return { x: imgX, y: imgY };
  };

  // Brush Painting
  const drawBrushStamp = (x: number, y: number) => {
    if (!localMaskCanvasRef.current && renderDim.width > 0) {
      const c = document.createElement('canvas');
      c.width = renderDim.width;
      c.height = renderDim.height;
      localMaskCanvasRef.current = c;
    }
    const mask = localMaskCanvasRef.current;
    if (!mask) return;

    const ctx = mask.getContext('2d');
    if (!ctx) return;

    const radius = brushSettings.size / 2;
    const isErase = brushSettings.mode === 'erase';

    ctx.save();
    if (isErase) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${brushSettings.opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      const grad = ctx.createRadialGradient(x, y, radius * (1 - brushSettings.hardness), x, y, radius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${brushSettings.opacity})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    performRender();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // 1. Check if dragging split comparison bar
    if (isComparing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const splitScreenX = pan.x + (renderDim.width * zoomLevel) * splitPos;

      if (Math.abs(mouseX - splitScreenX) < 18) {
        setIsDraggingSplit(true);
        (e.target as Element).setPointerCapture(e.pointerId);
        return;
      }
    }

    // 2. Spacebar or middle button or non-brush tool pans viewport
    if (e.button === 1 || e.buttons === 4 || e.altKey || (activeTool !== 'brush' && activeTool !== 'crop')) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y
      };
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }

    // 3. Brush painting
    if (activeTool === 'brush') {
      const coords = screenToImageCoords(e.clientX, e.clientY);
      if (coords) {
        isPaintingRef.current = true;
        lastBrushPointRef.current = coords;
        drawBrushStamp(coords.x, coords.y);
        (e.target as Element).setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Split bar dragging
    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const imgWidthScreen = renderDim.width * zoomLevel;
      const newPos = Math.max(0.01, Math.min(0.99, (mouseX - pan.x) / imgWidthScreen));
      setSplitPos(newPos);
      return;
    }

    // Panning
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.startPanX + dx,
        y: panStartRef.current.startPanY + dy
      });
      return;
    }

    // Brush cursor update
    if (activeTool === 'brush' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setBrushCursor({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true
      });

      // If active painting stroke
      if (isPaintingRef.current) {
        const coords = screenToImageCoords(e.clientX, e.clientY);
        if (coords) {
          // Interpolate between last point and current for unbroken brush strokes
          if (lastBrushPointRef.current) {
            const last = lastBrushPointRef.current;
            const dist = Math.hypot(coords.x - last.x, coords.y - last.y);
            const step = Math.max(1, (brushSettings.size / 4));
            const count = Math.ceil(dist / step);

            for (let i = 1; i <= count; i++) {
              const t = i / count;
              drawBrushStamp(
                last.x + (coords.x - last.x) * t,
                last.y + (coords.y - last.y) * t
              );
            }
          }
          lastBrushPointRef.current = coords;
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingSplit) {
      setIsDraggingSplit(false);
    }

    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }

    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      lastBrushPointRef.current = null;
      if (localMaskCanvasRef.current) {
        onMaskStrokeEnd(localMaskCanvasRef.current);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`viewport-container ${isPanning ? 'is-panning' : ''} ${activeTool === 'brush' ? 'is-brush-active' : ''}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        setBrushCursor(c => ({ ...c, visible: false }));
        setIsPanning(false);
        setIsDraggingSplit(false);
        isPaintingRef.current = false;
      }}
    >
      {/* Centered Canvas Container */}
      <div
        className="canvas-transform-wrapper"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`
        }}
      >
        <canvas
          ref={mainCanvasRef}
          className="viewport-image-canvas"
          style={{
            width: renderDim.width * zoomLevel,
            height: renderDim.height * zoomLevel
          }}
        />

        {/* Interactive Crop Overlay */}
        {activeTool === 'crop' && renderDim.width > 0 && (
          <CropOverlay
            imageWidth={renderDim.width}
            imageHeight={renderDim.height}
            cropRect={cropRect}
            aspectRatio={cropAspectRatio}
            onChange={onCropRectChange}
            viewportTransform={{
              scale: zoomLevel,
              offsetX: 0,
              offsetY: 0
            }}
          />
        )}
      </div>

      {/* Comparison Split Slider Handle Overlay */}
      {isComparing && renderDim.width > 0 && (
        <div
          className="split-handle-overlay"
          style={{
            left: pan.x + (renderDim.width * zoomLevel) * splitPos,
            top: pan.y,
            height: renderDim.height * zoomLevel
          }}
        >
          <div className="split-badge split-badge-before">BEFORE</div>
          <div className="split-badge split-badge-after">AFTER</div>
          <div className="split-center-knob">
            <span>‹ | ›</span>
          </div>
        </div>
      )}

      {/* Custom Brush Cursor */}
      {activeTool === 'brush' && brushCursor.visible && (
        <div
          className={`brush-cursor-circle ${brushSettings.mode === 'erase' ? 'is-erase' : ''}`}
          style={{
            left: brushCursor.x,
            top: brushCursor.y,
            width: brushSettings.size * zoomLevel,
            height: brushSettings.size * zoomLevel
          }}
        />
      )}
    </div>
  );
};
