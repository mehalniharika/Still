import {
  AdjustmentsState,
  CurvesState,
  ExtendState,
  GeometryState,
  MaskAdjustments,
  NormalizedRect,
  TextOverlayState
} from '../types/editor';
import { buildCurveLUT, isCurvesStateModified } from './curves';

export interface ProcessPipelineOptions {
  source: CanvasImageSource; // HTMLImageElement | HTMLCanvasElement | ImageBitmap
  geometry: GeometryState;
  adjustments: AdjustmentsState;
  curves: CurvesState;
  maskCanvas: HTMLCanvasElement | null;
  maskAdjustments: MaskAdjustments | null;
  showMaskOverlay: boolean;
  targetCanvas?: HTMLCanvasElement;
  maxDimension?: number; // Optional downscale for fast interactive preview
  extend?: ExtendState;
  text?: TextOverlayState;
}

/**
 * Creates an oriented, flipped, and cropped canvas from source.
 */
export function applyGeometry(
  source: CanvasImageSource,
  geometry: GeometryState,
  sourceWidth: number,
  sourceHeight: number,
  maxDimension?: number
): HTMLCanvasElement {
  const { rotation, flipH, flipV, cropRect } = geometry;

  // Determine post-rotation dimensions
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const rotatedWidth = isRotated90or270 ? sourceHeight : sourceWidth;
  const rotatedHeight = isRotated90or270 ? sourceWidth : sourceHeight;

  // First create canvas with rotation & flips
  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = rotatedWidth;
  rotCanvas.height = rotatedHeight;
  const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true });
  if (!rotCtx) throw new Error('Could not get 2D context for rotation');

  rotCtx.save();
  rotCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotCtx.rotate((rotation * Math.PI) / 180);
  rotCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  rotCtx.drawImage(
    source,
    -sourceWidth / 2,
    -sourceHeight / 2,
    sourceWidth,
    sourceHeight
  );
  rotCtx.restore();

  // If there's a crop rectangle
  let finalCanvas = rotCanvas;
  if (cropRect && isValidCrop(cropRect)) {
    const cropX = Math.round(cropRect.x * rotatedWidth);
    const cropY = Math.round(cropRect.y * rotatedHeight);
    const cropW = Math.max(1, Math.round(cropRect.width * rotatedWidth));
    const cropH = Math.max(1, Math.round(cropRect.height * rotatedHeight));

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const cropCtx = croppedCanvas.getContext('2d', { willReadFrequently: true });
    if (!cropCtx) throw new Error('Could not get 2D context for crop');

    cropCtx.drawImage(rotCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    finalCanvas = croppedCanvas;
  }

  // If maxDimension is set and image exceeds it, downsample smoothly
  if (maxDimension && (finalCanvas.width > maxDimension || finalCanvas.height > maxDimension)) {
    const scale = Math.min(maxDimension / finalCanvas.width, maxDimension / finalCanvas.height);
    const targetW = Math.max(1, Math.round(finalCanvas.width * scale));
    const targetH = Math.max(1, Math.round(finalCanvas.height * scale));

    const downCanvas = document.createElement('canvas');
    downCanvas.width = targetW;
    downCanvas.height = targetH;
    const downCtx = downCanvas.getContext('2d', { willReadFrequently: true });
    if (downCtx) {
      downCtx.imageSmoothingEnabled = true;
      downCtx.imageSmoothingQuality = 'high';
      downCtx.drawImage(finalCanvas, 0, 0, targetW, targetH);
      return downCanvas;
    }
  }

  return finalCanvas;
}

function isValidCrop(rect: NormalizedRect): boolean {
  return (
    rect.width > 0.001 &&
    rect.height > 0.001 &&
    (rect.x > 0.001 || rect.y > 0.001 || rect.width < 0.999 || rect.height < 0.999)
  );
}

/**
 * Expands canvas margins using Smart Mirror or solid color fill.
 */
export function applyExtend(
  sourceCanvas: HTMLCanvasElement,
  extend?: ExtendState
): HTMLCanvasElement {
  if (!extend) return sourceCanvas;
  const { top = 0, bottom = 0, left = 0, right = 0, mode = 'mirror' } = extend;

  if (top <= 0 && bottom <= 0 && left <= 0 && right <= 0) {
    return sourceCanvas;
  }

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const newW = srcW + left + right;
  const newH = srcH + top + bottom;

  const extCanvas = document.createElement('canvas');
  extCanvas.width = newW;
  extCanvas.height = newH;
  const ctx = extCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  if (mode === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newW, newH);
    ctx.drawImage(sourceCanvas, left, top);
    return extCanvas;
  }

  if (mode === 'black') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, newW, newH);
    ctx.drawImage(sourceCanvas, left, top);
    return extCanvas;
  }

  // Smart Mirror Mode
  // 1. Top margin (mirror vertically from top edge)
  if (top > 0) {
    const sliceH = Math.min(top, srcH);
    ctx.save();
    ctx.translate(left, top);
    ctx.scale(1, -1);
    ctx.drawImage(sourceCanvas, 0, 0, srcW, sliceH, 0, 0, srcW, top);
    ctx.restore();
  }

  // 2. Bottom margin (mirror vertically from bottom edge)
  if (bottom > 0) {
    const sliceH = Math.min(bottom, srcH);
    ctx.save();
    ctx.translate(left, top + srcH);
    ctx.scale(1, -1);
    ctx.drawImage(sourceCanvas, 0, srcH - sliceH, srcW, sliceH, 0, -bottom, srcW, bottom);
    ctx.restore();
  }

  // 3. Left margin (mirror horizontally from left edge)
  if (left > 0) {
    const sliceW = Math.min(left, srcW);
    ctx.save();
    ctx.translate(left, top);
    ctx.scale(-1, 1);
    ctx.drawImage(sourceCanvas, 0, 0, sliceW, srcH, 0, 0, left, srcH);
    ctx.restore();
  }

  // 4. Right margin (mirror horizontally from right edge)
  if (right > 0) {
    const sliceW = Math.min(right, srcW);
    ctx.save();
    ctx.translate(left + srcW, top);
    ctx.scale(-1, 1);
    ctx.drawImage(sourceCanvas, srcW - sliceW, 0, sliceW, srcH, -right, 0, right, srcH);
    ctx.restore();
  }

  // 5. Corners (mirror both horizontally and vertically)
  // Top-Left Corner
  if (top > 0 && left > 0) {
    const sliceW = Math.min(left, srcW);
    const sliceH = Math.min(top, srcH);
    ctx.save();
    ctx.translate(left, top);
    ctx.scale(-1, -1);
    ctx.drawImage(sourceCanvas, 0, 0, sliceW, sliceH, 0, 0, left, top);
    ctx.restore();
  }

  // Top-Right Corner
  if (top > 0 && right > 0) {
    const sliceW = Math.min(right, srcW);
    const sliceH = Math.min(top, srcH);
    ctx.save();
    ctx.translate(left + srcW, top);
    ctx.scale(-1, -1);
    ctx.drawImage(sourceCanvas, srcW - sliceW, 0, sliceW, sliceH, -right, 0, right, top);
    ctx.restore();
  }

  // Bottom-Left Corner
  if (bottom > 0 && left > 0) {
    const sliceW = Math.min(left, srcW);
    const sliceH = Math.min(bottom, srcH);
    ctx.save();
    ctx.translate(left, top + srcH);
    ctx.scale(-1, -1);
    ctx.drawImage(sourceCanvas, 0, srcH - sliceH, sliceW, sliceH, 0, -bottom, left, bottom);
    ctx.restore();
  }

  // Bottom-Right Corner
  if (bottom > 0 && right > 0) {
    const sliceW = Math.min(right, srcW);
    const sliceH = Math.min(bottom, srcH);
    ctx.save();
    ctx.translate(left + srcW, top + srcH);
    ctx.scale(-1, -1);
    ctx.drawImage(sourceCanvas, srcW - sliceW, srcH - sliceH, sliceW, sliceH, -right, -bottom, right, bottom);
    ctx.restore();
  }

  // 6. Draw original pristine content in center
  ctx.drawImage(sourceCanvas, left, top);

  return extCanvas;
}

/**
 * Draws styled typography badge overlays.
 */
export function applyTextOverlay(
  ctx: CanvasRenderingContext2D,
  text: TextOverlayState | undefined,
  canvasW: number,
  canvasH: number
): void {
  if (!text || !text.content || !text.content.trim()) return;

  const content = text.content.trim();
  const scale = Math.max(0.6, Math.min(canvasW, canvasH) / 900);
  const fontSize = Math.max(14, Math.round(text.fontSize * scale));
  const posX = text.posX !== undefined ? text.posX : 0.5;
  const posY = text.posY !== undefined ? text.posY : 0.85;

  const cx = canvasW * posX;
  const cy = canvasH * posY;

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(1, text.opacity));
  ctx.font = `600 ${fontSize}px ${text.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(content);
  const textW = metrics.width;
  const textH = fontSize * 1.15;
  const padX = fontSize * 0.7;
  const padY = fontSize * 0.35;
  const boxW = textW + padX * 2;
  const boxH = textH + padY * 2;
  const boxX = cx - boxW / 2;
  const boxY = cy - boxH / 2;
  const radius = Math.min(boxH / 2, 10 * scale);

  switch (text.style) {
    case 'simple': {
      // Clean drop-shadowed typography
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = Math.round(6 * scale);
      ctx.shadowOffsetY = Math.round(2 * scale);
      ctx.fillStyle = text.textColor;
      ctx.fillText(content, cx, cy);
      break;
    }

    case 'badge': {
      // Solid rounded pill badge
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = Math.round(12 * scale);
      ctx.shadowOffsetY = Math.round(4 * scale);
      ctx.fillStyle = text.badgeColor;

      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(boxX, boxY, boxW, boxH, radius);
      } else {
        ctx.rect(boxX, boxY, boxW, boxH);
      }
      ctx.fill();

      // Reset shadow for text
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = text.textColor;
      ctx.fillText(content, cx, cy);
      break;
    }

    case 'outline': {
      // Outlined elegant box with subtle tint
      ctx.fillStyle = text.badgeColor;
      ctx.globalAlpha = Math.max(0.1, text.opacity * 0.4);
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(boxX, boxY, boxW, boxH, radius);
      } else {
        ctx.rect(boxX, boxY, boxW, boxH);
      }
      ctx.fill();

      ctx.globalAlpha = text.opacity;
      ctx.strokeStyle = text.textColor;
      ctx.lineWidth = Math.max(2, Math.round(2.5 * scale));
      ctx.stroke();

      ctx.fillStyle = text.textColor;
      ctx.fillText(content, cx, cy);
      break;
    }

    case 'ribbon': {
      // Full-bleed cinematic letterboxed ribbon
      const ribbonH = boxH * 1.25;
      ctx.fillStyle = text.badgeColor;
      ctx.fillRect(0, cy - ribbonH / 2, canvasW, ribbonH);

      ctx.fillStyle = text.textColor;
      ctx.fillText(content.toUpperCase(), cx, cy);
      break;
    }

    case 'knockout': {
      // Solid badge with transparent knocked-out text showing background
      ctx.fillStyle = text.badgeColor;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(boxX, boxY, boxW, boxH, radius);
      } else {
        ctx.rect(boxX, boxY, boxW, boxH);
      }
      ctx.fill();

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.fillText(content, cx, cy);
      break;
    }
  }

  ctx.restore();
}

/**
 * Applies color adjustments, tone curves, and optional selective brush mask to ImageData.
 */
export function processImageData(
  imgData: ImageData,
  adjustments: AdjustmentsState,
  curves: CurvesState,
  maskData?: Uint8ClampedArray | null,
  maskAdjustments?: MaskAdjustments | null,
  showMaskOverlay?: boolean
): void {
  const data = imgData.data;
  const len = data.length;

  // Extract adjustments
  const b = adjustments.brightness; // -100 to 100
  const c = adjustments.contrast;   // -100 to 100
  const s = adjustments.saturation; // -100 to 100
  const w = adjustments.warmth;     // -100 to 100
  const hl = adjustments.highlights; // -100 to 100
  const sh = adjustments.shadows;    // -100 to 100

  // Pre-calculate contrast factor
  // factor = (259 * (contrast * 2.55 + 255)) / (255 * (259 - contrast * 2.55))
  const cFactor = (259 * (c * 2.55 + 255)) / (255 * (259 - c * 2.55));
  const brightnessOffset = b * 2.55;
  const satFactor = 1 + s / 100;
  const warmR = w * 0.55;
  const warmB = -w * 0.55;
  const warmG = w * 0.12;

  // Build curve LUTs if curves are modified
  const curvesModified = isCurvesStateModified(curves);
  let lutRGB: Uint8Array | null = null;
  let lutR: Uint8Array | null = null;
  let lutG: Uint8Array | null = null;
  let lutB: Uint8Array | null = null;

  if (curvesModified) {
    lutRGB = buildCurveLUT(curves.rgb);
    lutR = buildCurveLUT(curves.red);
    lutG = buildCurveLUT(curves.green);
    lutB = buildCurveLUT(curves.blue);
  }

  // Selective mask parameters
  const hasMask = !!(maskData && maskAdjustments);
  let maskBright = 0;
  let maskCFactor = 1;
  let maskSatFactor = 1;
  let maskWarmR = 0;
  let maskWarmB = 0;
  let maskWarmG = 0;

  if (hasMask && maskAdjustments) {
    maskBright = maskAdjustments.brightness * 2.55;
    maskCFactor = (259 * (maskAdjustments.contrast * 2.55 + 255)) / (255 * (259 - maskAdjustments.contrast * 2.55));
    maskSatFactor = 1 + maskAdjustments.saturation / 100;
    maskWarmR = maskAdjustments.warmth * 0.55;
    maskWarmB = -maskAdjustments.warmth * 0.55;
    maskWarmG = maskAdjustments.warmth * 0.12;
  }

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let bVal = data[i + 2];

    // 1. Brightness
    if (b !== 0) {
      r += brightnessOffset;
      g += brightnessOffset;
      bVal += brightnessOffset;
    }

    // 2. Contrast
    if (c !== 0) {
      r = cFactor * (r - 128) + 128;
      g = cFactor * (g - 128) + 128;
      bVal = cFactor * (bVal - 128) + 128;
    }

    // 3. Highlights & Shadows (calculated smoothly using normalized luminance)
    if (hl !== 0 || sh !== 0) {
      const lum = (0.299 * r + 0.587 * g + 0.114 * bVal) / 255;
      const clampedLum = lum < 0 ? 0 : lum > 1 ? 1 : lum;

      // Shadows affect dark tones (peak at 0, falloff to 1)
      const sWeight = (1 - clampedLum) * (1 - clampedLum);
      const sOffset = sh * 0.45 * sWeight;

      // Highlights affect light tones (peak at 1, falloff to 0)
      const hWeight = clampedLum * clampedLum;
      const hOffset = hl * 0.45 * hWeight;

      r += sOffset + hOffset;
      g += sOffset + hOffset;
      bVal += sOffset + hOffset;
    }

    // 4. Warmth (Temperature)
    if (w !== 0) {
      r += warmR;
      g += warmG;
      bVal += warmB;
    }

    // 5. Saturation
    if (s !== 0) {
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * bVal;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      bVal = gray + (bVal - gray) * satFactor;
    }

    // Clamp before curve lookup
    let cR = r < 0 ? 0 : r > 255 ? 255 : Math.round(r);
    let cG = g < 0 ? 0 : g > 255 ? 255 : Math.round(g);
    let cB = bVal < 0 ? 0 : bVal > 255 ? 255 : Math.round(bVal);

    // 6. Tone Curves Lookup
    if (curvesModified && lutRGB && lutR && lutG && lutB) {
      // Individual channel splines
      cR = lutR[cR];
      cG = lutG[cG];
      cB = lutB[cB];

      // Master composite RGB spline
      cR = lutRGB[cR];
      cG = lutRGB[cG];
      cB = lutRGB[cB];
    }

    // 7. Selective Brush Mask evaluation
    if (hasMask && maskData) {
      // Mask alpha stored in R channel (grayscale mask)
      const maskWeight = maskData[i] / 255;

      if (maskWeight > 0.005) {
        let mr = cR;
        let mg = cG;
        let mb = cB;

        // Mask brightness
        if (maskBright !== 0) {
          mr += maskBright;
          mg += maskBright;
          mb += maskBright;
        }

        // Mask contrast
        if (maskAdjustments!.contrast !== 0) {
          mr = maskCFactor * (mr - 128) + 128;
          mg = maskCFactor * (mg - 128) + 128;
          mb = maskCFactor * (mb - 128) + 128;
        }

        // Mask warmth
        if (maskAdjustments!.warmth !== 0) {
          mr += maskWarmR;
          mg += maskWarmG;
          mb += maskWarmB;
        }

        // Mask saturation
        if (maskAdjustments!.saturation !== 0) {
          const mGray = 0.2989 * mr + 0.5870 * mg + 0.1140 * mb;
          mr = mGray + (mr - mGray) * maskSatFactor;
          mg = mGray + (mg - mGray) * maskSatFactor;
          mb = mGray + (mb - mGray) * maskSatFactor;
        }

        // Clamp mask-adjusted colors
        mr = mr < 0 ? 0 : mr > 255 ? 255 : mr;
        mg = mg < 0 ? 0 : mg > 255 ? 255 : mg;
        mb = mb < 0 ? 0 : mb > 255 ? 255 : mb;

        // Blend based on mask weight
        cR = Math.round(cR * (1 - maskWeight) + mr * maskWeight);
        cG = Math.round(cG * (1 - maskWeight) + mg * maskWeight);
        cB = Math.round(cB * (1 - maskWeight) + mb * maskWeight);
      }
    }

    // 8. Visual red mask overlay mode
    if (showMaskOverlay && maskData) {
      const maskAlpha = maskData[i] / 255;
      if (maskAlpha > 0.01) {
        // Overlay semi-transparent ruby red tint (standard photo mask visualizer)
        const overlayStrength = maskAlpha * 0.45;
        cR = Math.round(cR * (1 - overlayStrength) + 235 * overlayStrength);
        cG = Math.round(cG * (1 - overlayStrength) + 40 * overlayStrength);
        cB = Math.round(cB * (1 - overlayStrength) + 40 * overlayStrength);
      }
    }

    data[i] = cR;
    data[i + 1] = cG;
    data[i + 2] = cB;
  }

  // 9. Sharpness (Convolution pass)
  if (adjustments.sharpness > 0) {
    applySharpness(imgData, adjustments.sharpness);
  }
}

/**
 * High-pass edge sharpening filter.
 */
function applySharpness(imgData: ImageData, sharpness: number): void {
  const width = imgData.width;
  const height = imgData.height;
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;

  const strength = (sharpness / 100) * 0.6; // normalized strength

  for (let y = 1; y < height - 1; y++) {
    const yOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = (yOffset + x) * 4;

      // 4-neighborhood cross kernel
      const up = idx - width * 4;
      const down = idx + width * 4;
      const left = idx - 4;
      const right = idx + 4;

      for (let c = 0; c < 3; c++) {
        const center = src[idx + c];
        const laplacian =
          4 * center -
          src[up + c] -
          src[down + c] -
          src[left + c] -
          src[right + c];

        const sharpened = center + laplacian * strength;
        dst[idx + c] = sharpened < 0 ? 0 : sharpened > 255 ? 255 : sharpened;
      }
    }
  }
}

/**
 * Complete deterministic rendering pipeline.
 * Evaluates geometry, canvas extension/mirror, basic adjustments, tone curves, selective brush masks, and text badges.
 */
export function renderPipeline(options: ProcessPipelineOptions): HTMLCanvasElement {
  const {
    source,
    geometry,
    adjustments,
    curves,
    maskCanvas,
    maskAdjustments,
    showMaskOverlay,
    targetCanvas,
    maxDimension,
    extend,
    text
  } = options;

  const sourceW = (source as any).naturalWidth || (source as any).videoWidth || (source as any).width;
  const sourceH = (source as any).naturalHeight || (source as any).videoHeight || (source as any).height;

  // Step 1: Geometry & Cropping
  const geomCanvas = applyGeometry(source, geometry, sourceW, sourceH, maxDimension);

  // Step 2: Canvas Padding & Mirror Extrapolation (applied before pixel adjustments)
  const extendedCanvas = applyExtend(geomCanvas, extend);
  const width = extendedCanvas.width;
  const height = extendedCanvas.height;

  // Output canvas
  const canvas = targetCanvas || document.createElement('canvas');
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2d rendering context');

  // Draw extended canvas
  ctx.drawImage(extendedCanvas, 0, 0);

  // Check if any pixel adjustments, curves, or masks need to run
  const hasAdjustments =
    adjustments.brightness !== 0 ||
    adjustments.contrast !== 0 ||
    adjustments.saturation !== 0 ||
    adjustments.warmth !== 0 ||
    adjustments.highlights !== 0 ||
    adjustments.shadows !== 0 ||
    adjustments.sharpness !== 0;

  const hasCurves = isCurvesStateModified(curves);
  const hasMask = !!(maskCanvas && maskAdjustments);

  if (hasAdjustments || hasCurves || hasMask || showMaskOverlay) {
    // Get image pixels for processing
    const imgData = ctx.getImageData(0, 0, width, height);

    // If there is a selective mask, resample/scale mask to match current canvas dimensions
    let maskPixelData: Uint8ClampedArray | null = null;
    if (maskCanvas) {
      let scaledMask = maskCanvas;
      if (maskCanvas.width !== width || maskCanvas.height !== height) {
        scaledMask = document.createElement('canvas');
        scaledMask.width = width;
        scaledMask.height = height;
        const mCtx = scaledMask.getContext('2d', { willReadFrequently: true });
        if (mCtx) {
          mCtx.drawImage(maskCanvas, 0, 0, width, height);
        }
      }
      const mCtx = scaledMask.getContext('2d', { willReadFrequently: true });
      if (mCtx) {
        maskPixelData = mCtx.getImageData(0, 0, width, height).data;
      }
    }

    // Step 3, 4, 5: Pixel Adjustments, Curves, and Selective Mask
    processImageData(
      imgData,
      adjustments,
      curves,
      maskPixelData,
      maskAdjustments,
      showMaskOverlay
    );

    // Put processed pixels back to canvas
    ctx.putImageData(imgData, 0, 0);
  }

  // Step 6: Text Typography & Badge Overlay
  applyTextOverlay(ctx, text, width, height);

  return canvas;
}
