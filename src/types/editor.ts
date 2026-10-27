export interface NormalizedRect {
  x: number; // 0 to 1
  y: number; // 0 to 1
  width: number; // 0 to 1
  height: number; // 0 to 1
}

export interface GeometryState {
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  cropRect: NormalizedRect | null; // null means full image
}

export interface AdjustmentsState {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  warmth: number; // -100 to 100 (temperature)
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  sharpness: number; // 0 to 100
}

export interface CurvePoint {
  id: string;
  x: number; // 0 to 1
  y: number; // 0 to 1
}

export type CurveChannel = 'rgb' | 'red' | 'green' | 'blue';

export interface CurvesState {
  rgb: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
  activeChannel: CurveChannel;
}

export interface MaskAdjustments {
  brightness: number; // -100 to 100
  saturation: number; // -100 to 100
  contrast: number; // -100 to 100
  warmth: number; // -100 to 100
}

export interface BrushSettings {
  size: number; // 10 to 300 px
  hardness: number; // 0 to 1 (0 = soft, 1 = hard)
  opacity: number; // 0.1 to 1.0
  mode: 'paint' | 'erase';
}

export interface SelectiveMaskState {
  hasMask: boolean;
  showOverlay: boolean;
  brush: BrushSettings;
  adjustments: MaskAdjustments;
  // Serialized mask as DataURL or ImageData for history snapshot
  maskDataUrl: string | null;
}

export interface ExtendState {
  top: number;
  bottom: number;
  left: number;
  right: number;
  mode: 'mirror' | 'white' | 'black';
}

export interface TextOverlayState {
  content: string;
  style: 'simple' | 'badge' | 'outline' | 'ribbon' | 'knockout';
  fontFamily: string;
  fontSize: number;
  textColor: string;
  badgeColor: string;
  opacity: number;
  posX: number;
  posY: number;
}

export interface PresetLook {
  id: string;
  name: string;
  subtitle: string;
  category: 'classic' | 'moody' | 'creative' | 'film' | 'vintage' | 'vibrant' | 'bw' | 'glow' | 'digicam' | 'cinematic' | string;
  gradient: string;
  adjustments: Partial<AdjustmentsState>;
  curves?: {
    rgb?: CurvePoint[];
    red?: CurvePoint[];
    green?: CurvePoint[];
    blue?: CurvePoint[];
  };
}

export interface HistoryStep {
  id: string;
  label: string;
  timestamp: number;
  geometry: GeometryState;
  adjustments: AdjustmentsState;
  curves: CurvesState;
  maskDataUrl: string | null;
  maskAdjustments: MaskAdjustments;
  activePresetId: string | null;
  extend?: ExtendState;
  text?: TextOverlayState;
}

export type ActiveTool = 
  | 'none'
  | 'adjust'
  | 'crop'
  | 'curves'
  | 'brush'
  | 'presets'
  | 'history'
  | 'extend'
  | 'text';

export interface ExportSettings {
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number; // 0.1 to 1.0 for jpeg/webp
  scale: number; // 1.0 for original, or downscale
}
