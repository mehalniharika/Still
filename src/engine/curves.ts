import { CurvePoint, CurvesState } from '../types/editor';

/**
 * Computes a Monotone Cubic Spline (Fritsch-Carlson) lookup table of 256 values.
 * This guarantees no overshoots or oscillating artifacts for tone curve control points.
 */
export function buildCurveLUT(points: CurvePoint[]): Uint8Array {
  const lut = new Uint8Array(256);

  // If invalid or fewer than 2 points, identity map
  if (!points || points.length < 2) {
    for (let i = 0; i < 256; i++) {
      lut[i] = i;
    }
    return lut;
  }

  // Sort points by x coordinate
  const pts = [...points].sort((a, b) => a.x - b.x);

  // Ensure endpoints exist
  if (pts[0].x > 0) {
    pts.unshift({ id: 'start', x: 0, y: pts[0].y });
  }
  if (pts[pts.length - 1].x < 1) {
    pts.push({ id: 'end', x: 1, y: pts[pts.length - 1].y });
  }

  const n = pts.length;
  const x = pts.map(p => Math.max(0, Math.min(1, p.x)));
  const y = pts.map(p => Math.max(0, Math.min(1, p.y)));

  // Secant slopes
  const delta = new Float64Array(n - 1);
  const m = new Float64Array(n);

  for (let k = 0; k < n - 1; k++) {
    const dx = x[k + 1] - x[k];
    delta[k] = dx === 0 ? 0 : (y[k + 1] - y[k]) / dx;
  }

  // Initial tangents
  m[0] = delta[0];
  m[n - 1] = delta[n - 2];
  for (let k = 1; k < n - 1; k++) {
    m[k] = (delta[k - 1] + delta[k]) / 2;
  }

  // Fritsch-Carlson monotonicity condition
  for (let k = 0; k < n - 1; k++) {
    if (delta[k] === 0) {
      m[k] = 0;
      m[k + 1] = 0;
    } else {
      const alpha = m[k] / delta[k];
      const beta = m[k + 1] / delta[k];
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        m[k] = tau * alpha * delta[k];
        m[k + 1] = tau * beta * delta[k];
      }
    }
  }

  // Interpolate for all 256 values
  let seg = 0;
  for (let i = 0; i < 256; i++) {
    const tVal = i / 255.0;

    // Advance segment
    while (seg < n - 2 && tVal > x[seg + 1]) {
      seg++;
    }

    const h = x[seg + 1] - x[seg];
    if (h === 0) {
      lut[i] = Math.round(y[seg] * 255);
      continue;
    }

    const t = (tVal - x[seg]) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    // Hermite basis functions
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const val = h00 * y[seg] + h10 * h * m[seg] + h01 * y[seg + 1] + h11 * h * m[seg + 1];
    lut[i] = Math.max(0, Math.min(255, Math.round(val * 255)));
  }

  return lut;
}

export function getDefaultCurvesState(): CurvesState {
  return {
    rgb: [
      { id: 'rgb-0', x: 0, y: 0 },
      { id: 'rgb-1', x: 1, y: 1 }
    ],
    red: [
      { id: 'r-0', x: 0, y: 0 },
      { id: 'r-1', x: 1, y: 1 }
    ],
    green: [
      { id: 'g-0', x: 0, y: 0 },
      { id: 'g-1', x: 1, y: 1 }
    ],
    blue: [
      { id: 'b-0', x: 0, y: 0 },
      { id: 'b-1', x: 1, y: 1 }
    ],
    activeChannel: 'rgb'
  };
}

export function isCurveDefault(points: CurvePoint[]): boolean {
  if (!points || points.length !== 2) return false;
  return points[0].x === 0 && points[0].y === 0 && points[1].x === 1 && points[1].y === 1;
}

export function isCurvesStateModified(curves: CurvesState): boolean {
  return !isCurveDefault(curves.rgb) ||
    !isCurveDefault(curves.red) ||
    !isCurveDefault(curves.green) ||
    !isCurveDefault(curves.blue);
}
