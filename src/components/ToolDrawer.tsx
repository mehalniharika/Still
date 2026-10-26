import React from 'react';
import { ActiveTool } from '../types/editor';
import {
  Sparkles,
  Sliders,
  Crop,
  Spline,
  Paintbrush,
  Layers
} from 'lucide-react';

interface ToolDrawerProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  hasAdjustments: boolean;
  hasCrop: boolean;
  hasCurves: boolean;
  hasMask: boolean;
  hasPreset: boolean;
  historyCount: number;
}

interface ToolItem {
  id: ActiveTool;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isModified: boolean;
}

export const ToolDrawer: React.FC<ToolDrawerProps> = ({
  activeTool,
  onSelectTool,
  hasAdjustments,
  hasCrop,
  hasCurves,
  hasMask,
  hasPreset,
  historyCount
}) => {
  const tools: ToolItem[] = [
    { id: 'presets', label: 'Looks', icon: Sparkles, isModified: hasPreset },
    { id: 'adjust', label: 'Tune', icon: Sliders, isModified: hasAdjustments },
    { id: 'crop', label: 'Crop', icon: Crop, isModified: hasCrop },
    { id: 'curves', label: 'Curves', icon: Spline, isModified: hasCurves },
    { id: 'brush', label: 'Brush', icon: Paintbrush, isModified: hasMask },
    { id: 'history', label: 'View Edits', icon: Layers, isModified: historyCount > 1 }
  ];

  return (
    <aside className="tool-drawer">
      <div className="drawer-tools-list">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              className={`drawer-tool-btn ${isActive ? 'is-active' : ''}`}
              title={tool.label}
              onClick={() => onSelectTool(isActive ? 'none' : tool.id)}
            >
              <div className="tool-icon-wrap">
                <Icon size={20} />
                {tool.isModified && <span className="tool-dot-indicator" />}
              </div>
              <span className="tool-btn-label">{tool.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
