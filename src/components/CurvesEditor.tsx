import React, { useRef, useState, useEffect } from 'react';
import { CurveChannel, CurvePoint, CurvesState } from '../types/editor';
import { buildCurveLUT, getDefaultCurvesState } from '../engine/curves';
import { RotateCcw } from 'lucide-react';

interface CurvesEditorProps {
  curves: CurvesState;
  onChange: (newCurves: CurvesState) => void;
  onCommit: (newCurves: CurvesState) => void;
  histogramData?: { r: Uint32Array; g: Uint32Array; b: Uint32Array } | null;
}

export const CurvesEditor: React.FC<CurvesEditorProps> = ({
  curves,
  onChange,
  onCommit,
  histogramData
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragPointIdRef = useRef<string | null>(null);

  const activeChannel = curves.activeChannel;
  const currentPoints = curves[activeChannel];

  // Generate interpolated curve path
  const lut = buildCurveLUT(currentPoints);
  const svgSize = 256;

  // Build SVG path data from the 256 LUT points
  let pathD = `M 0,${svgSize - (lut[0] / 255) * svgSize}`;
  for (let i = 1; i < 256; i++) {
    const px = (i / 255) * svgSize;
    const py = svgSize - (lut[i] / 255) * svgSize;
    pathD += ` L ${px.toFixed(1)},${py.toFixed(1)}`;
  }

  const handleChannelSelect = (channel: CurveChannel) => {
    onChange({ ...curves, activeChannel: channel });
    setSelectedPointId(null);
  };

  const handleResetChannel = () => {
    const defaultCurves = getDefaultCurvesState();
    const updated = {
      ...curves,
      [activeChannel]: defaultCurves[activeChannel]
    };
    onChange(updated);
    onCommit(updated);
    setSelectedPointId(null);
  };

  const handleResetAll = () => {
    const defaultCurves = getDefaultCurvesState();
    onChange(defaultCurves);
    onCommit(defaultCurves);
    setSelectedPointId(null);
  };

  // Convert SVG client coords to normalized [0, 1]
  const getNormalizedCoords = (e: React.PointerEvent<SVGSVGElement>): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const normX = Math.max(0, Math.min(1, clientX / rect.width));
    const normY = Math.max(0, Math.min(1, 1 - clientY / rect.height)); // SVG y is inverted
    return { x: normX, y: normY };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;
    (e.target as Element).setPointerCapture(e.pointerId);

    const { x, y } = getNormalizedCoords(e);

    // Check if clicked near an existing point (within ~14px)
    const threshold = 14 / svgSize;
    const existing = currentPoints.find(p => {
      const dx = p.x - x;
      const dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) < threshold;
    });

    if (existing) {
      setSelectedPointId(existing.id);
      dragPointIdRef.current = existing.id;
      setIsDragging(true);
    } else {
      // Add a new point if fewer than 10 points
      if (currentPoints.length < 10) {
        const newId = `pt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const newPoint: CurvePoint = { id: newId, x, y };
        const updatedPoints = [...currentPoints, newPoint].sort((a, b) => a.x - b.x);
        const updated = { ...curves, [activeChannel]: updatedPoints };
        setSelectedPointId(newId);
        dragPointIdRef.current = newId;
        setIsDragging(true);
        onChange(updated);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !dragPointIdRef.current) return;
    e.preventDefault();

    const { x, y } = getNormalizedCoords(e);
    const pointId = dragPointIdRef.current;

    const updatedPoints = currentPoints.map(p => {
      if (p.id !== pointId) return p;

      // Endpoints are fixed on X axis (0 or 1), but can move on Y axis
      const isStart = p.x === 0 || p.id.includes('-0') || currentPoints[0].id === p.id;
      const isEnd = p.x === 1 || p.id.includes('-1') || currentPoints[currentPoints.length - 1].id === p.id;

      if (isStart) {
        return { ...p, x: 0, y };
      }
      if (isEnd) {
        return { ...p, x: 1, y };
      }

      // Interior points: keep within neighboring bounds to preserve order
      return { ...p, x: Math.max(0.02, Math.min(0.98, x)), y };
    });

    const sorted = [...updatedPoints].sort((a, b) => a.x - b.x);
    onChange({ ...curves, [activeChannel]: sorted });
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      setIsDragging(false);
      dragPointIdRef.current = null;
      onCommit(curves);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedPointId) return;
    // Don't delete endpoints
    const idx = currentPoints.findIndex(p => p.id === selectedPointId);
    if (idx <= 0 || idx === currentPoints.length - 1) return;

    const filtered = currentPoints.filter(p => p.id !== selectedPointId);
    const updated = { ...curves, [activeChannel]: filtered };
    onChange(updated);
    onCommit(updated);
    setSelectedPointId(null);
  };

  // Channel color styling
  const channelColors = {
    rgb: '#f8fafc',
    red: '#f87171',
    green: '#4ade80',
    blue: '#60a5fa'
  };

  return (
    <div className="curves-editor-container">
      {/* Channel Selector Header */}
      <div className="curves-header">
        <div className="curves-channel-tabs">
          <button
            type="button"
            className={`curves-tab ${activeChannel === 'rgb' ? 'active' : ''}`}
            onClick={() => handleChannelSelect('rgb')}
          >
            RGB
          </button>
          <button
            type="button"
            className={`curves-tab red ${activeChannel === 'red' ? 'active' : ''}`}
            onClick={() => handleChannelSelect('red')}
          >
            Red
          </button>
          <button
            type="button"
            className={`curves-tab green ${activeChannel === 'green' ? 'active' : ''}`}
            onClick={() => handleChannelSelect('green')}
          >
            Green
          </button>
          <button
            type="button"
            className={`curves-tab blue ${activeChannel === 'blue' ? 'active' : ''}`}
            onClick={() => handleChannelSelect('blue')}
          >
            Blue
          </button>
        </div>

        <button
          type="button"
          className="curves-reset-btn"
          title="Reset this channel curve"
          onClick={handleResetChannel}
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Curves Interactive Graph */}
      <div className="curves-graph-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="curves-svg"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Background Grid */}
          <rect width={svgSize} height={svgSize} fill="#14171d" />

          {/* Quarters grid lines */}
          <line x1={svgSize * 0.25} y1={0} x2={svgSize * 0.25} y2={svgSize} stroke="#242a36" strokeDasharray="3 3" />
          <line x1={svgSize * 0.50} y1={0} x2={svgSize * 0.50} y2={svgSize} stroke="#2e3544" strokeDasharray="3 3" />
          <line x1={svgSize * 0.75} y1={0} x2={svgSize * 0.75} y2={svgSize} stroke="#242a36" strokeDasharray="3 3" />

          <line x1={0} y1={svgSize * 0.25} x2={svgSize} y2={svgSize * 0.25} stroke="#242a36" strokeDasharray="3 3" />
          <line x1={0} y1={svgSize * 0.50} x2={svgSize} y2={svgSize * 0.50} stroke="#2e3544" strokeDasharray="3 3" />
          <line x1={0} y1={svgSize * 0.75} x2={svgSize} y2={svgSize * 0.75} stroke="#242a36" strokeDasharray="3 3" />

          {/* Diagonal Identity Reference Line */}
          <line x1={0} y1={svgSize} x2={svgSize} y2={0} stroke="#3b4252" strokeWidth="1" strokeDasharray="4 4" />

          {/* Spline Path */}
          <path
            d={pathD}
            fill="none"
            stroke={channelColors[activeChannel]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Control Points */}
          {currentPoints.map((pt, i) => {
            const cx = pt.x * svgSize;
            const cy = svgSize - pt.y * svgSize;
            const isSelected = pt.id === selectedPointId;

            return (
              <g key={pt.id} className="curve-point-group">
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 7 : 5}
                  fill={isSelected ? '#38bdf8' : channelColors[activeChannel]}
                  stroke="#0d0f12"
                  strokeWidth="2"
                  className="curve-control-point"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Point details and delete helper */}
      <div className="curves-footer">
        <span className="curves-hint">
          {selectedPointId
            ? 'Drag to adjust. Click "Delete Point" to remove.'
            : 'Click anywhere on line to add control point.'}
        </span>
        {selectedPointId &&
          currentPoints.findIndex(p => p.id === selectedPointId) > 0 &&
          currentPoints.findIndex(p => p.id === selectedPointId) < currentPoints.length - 1 && (
            <button
              type="button"
              className="curves-del-btn"
              onClick={handleDeleteSelected}
            >
              Delete Point
            </button>
          )}
      </div>
    </div>
  );
};
