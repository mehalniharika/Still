import {
  AdjustmentsState,
  CurvesState,
  ExportSettings,
  GeometryState,
  MaskAdjustments
} from '../types/editor';
import { renderPipeline } from '../engine/processor';

export interface ExportImageParams {
  source: HTMLImageElement;
  geometry: GeometryState;
  adjustments: AdjustmentsState;
  curves: CurvesState;
  maskCanvas: HTMLCanvasElement | null;
  maskAdjustments: MaskAdjustments | null;
  settings: ExportSettings;
  originalFilename: string;
}

export interface ExportResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  filename: string;
}

/**
 * Executes a full-resolution render and generates an exported Blob.
 */
export async function exportImage(params: ExportImageParams): Promise<ExportResult> {
  const {
    source,
    geometry,
    adjustments,
    curves,
    maskCanvas,
    maskAdjustments,
    settings,
    originalFilename
  } = params;

  // Render at full native resolution
  const renderedCanvas = renderPipeline({
    source,
    geometry,
    adjustments,
    curves,
    maskCanvas,
    maskAdjustments,
    showMaskOverlay: false // Never export mask overlay!
  });

  const width = renderedCanvas.width;
  const height = renderedCanvas.height;

  // Format filename
  const baseName = originalFilename.replace(/\.[^/.]+$/, '') || 'edited-photo';
  let ext = 'jpg';
  if (settings.format === 'image/png') ext = 'png';
  if (settings.format === 'image/webp') ext = 'webp';
  const finalFilename = `${baseName}-lumina.${ext}`;

  return new Promise<ExportResult>((resolve, reject) => {
    try {
      renderedCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob from canvas'));
            return;
          }

          const dataUrl = URL.createObjectURL(blob);
          resolve({
            blob,
            dataUrl,
            width,
            height,
            fileSizeBytes: blob.size,
            filename: finalFilename
          });
        },
        settings.format,
        settings.quality
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Triggers a real browser download for an exported file.
 */
export function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
