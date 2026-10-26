import {
  AdjustmentsState,
  CurvesState,
  GeometryState,
  MaskAdjustments,
  NormalizedRect
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

      const toneOffset = sOffset + hOffset;
      r += toneOffset;
      g += toneOffset;
      bVal += toneOffset;
    }

    // 4. Warmth / White Balance
    if (w !== 0) {
      r += warmR;
      g += warmG;
      bVal += warmB;
    }

    // 5. Saturation
    if (s !== 0) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * bVal;
      r = lum + (r - lum) * satFactor;
      g = lum + (g - lum) * satFactor;
      bVal = lum + (bVal - lum) * satFactor;
    }

    // Clamp before curves
    r = r < 0 ? 0 : r > 255 ? 255 : r;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    bVal = bVal < 0 ? 0 : bVal > 255 ? 255 : bVal;

    // 6. Tone Curves
    if (curvesModified && lutRGB && lutR && lutG && lutB) {
      // Composite RGB curve
      let cr = lutRGB[Math.round(r)];
      let cg = lutRGB[Math.round(g)];
      let cb = lutRGB[Math.round(bVal)];

      // Individual channel curves
      r = lutR[cr];
      g = lutG[cg];
      bVal = lutB[cb];
    }

    // 7. Selective Mask Adjustments
    if (hasMask && maskData) {
      const maskPixelIndex = (i / 4);
      const maskAlpha = maskData[maskPixelIndex * 4 + 3] / 255.0; // alpha 0..1

      if (maskAlpha > 0.005) {
        // Compute adjusted version of the pixel
        let mr = r + maskBright;
        let mg = g + maskBright;
        let mb = bVal + maskBright;

        if (maskAdjustments && maskAdjustments.contrast !== 0) {
          mr = maskCFactor * (mr - 128) + 128;
          mg = maskCFactor * (mg - 128) + 128;
          mb = maskCFactor * (mb - 128) + 128;
        }

        if (maskAdjustments && maskAdjustments.warmth !== 0) {
          mr += maskWarmR;
          mg += maskWarmG;
          mb += maskWarmB;
        }

        if (maskAdjustments && maskAdjustments.saturation !== 0) {
          const mLum = 0.299 * mr + 0.587 * mg + 0.114 * mb;
          mr = mLum + (mr - mLum) * maskSatFactor;
          mg = mLum + (mg - mLum) * maskSatFactor;
          mb = mLum + (mb - mLum) * maskSatFactor;
        }

        mr = mr < 0 ? 0 : mr > 255 ? 255 : mr;
        mg = mg < 0 ? 0 : mg > 255 ? 255 : mg;
        mb = mb < 0 ? 0 : mb > 255 ? 255 : mb;

        // Blend with base pixel based on mask weight
        r = (1 - maskAlpha) * r + maskAlpha * mr;
        g = (1 - maskAlpha) * g + maskAlpha * mg;
        bVal = (1 - maskAlpha) * bVal + maskAlpha * mb;

        // Optional ruby overlay representation
        if (showMaskOverlay) {
          // Tint towards ruby red: rgba(239, 68, 68, 0.45)
          const overlayAmount = maskAlpha * 0.45;
          r = (1 - overlayAmount) * r + overlayAmount * 239;
          g = (1 - overlayAmount) * g + overlayAmount * 68;
          bVal = (1 - overlayAmount) * bVal + overlayAmount * 68;
        }
      }
    }

    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = bVal < 0 ? 0 : bVal > 255 ? 255 : bVal;
  }

  // 8. Sharpness (Laplacian high-pass filter)
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
 * Evaluates geometry, basic adjustments, tone curves, and selective brush masks.
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
    maxDimension
  } = options;

  const sourceW = (source as any).naturalWidth || (source as any).videoWidth || (source as any).width;
  const sourceH = (source as any).naturalHeight || (source as any).videoHeight || (source as any).height;

  // Step 1: Geometry & Cropping
  const geomCanvas = applyGeometry(source, geometry, sourceW, sourceH, maxDimension);
  const width = geomCanvas.width;
  const height = geomCanvas.height;

  // Output canvas
  const canvas = targetCanvas || document.createElement('canvas');
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2d rendering context');

  // Draw geometry result
  ctx.drawImage(geomCanvas, 0, 0);

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

  if (!hasAdjustments && !hasCurves && !hasMask && !showMaskOverlay) {
    return canvas;
  }

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

  // Step 2, 3, 4: Pixel Adjustments, Curves, and Selective Mask
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

  return canvas;
}
