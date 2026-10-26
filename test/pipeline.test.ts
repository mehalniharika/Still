import assert from 'node:assert';
import test from 'node:test';
import { buildCurveLUT, getDefaultCurvesState, isCurveDefault } from '../src/engine/curves';
import { PRESET_LOOKS } from '../src/engine/presets';

test('Curves - Default curve LUT creates exact 1:1 identity mapping', () => {
  const defaultCurves = getDefaultCurvesState();
  assert.strictEqual(isCurveDefault(defaultCurves.rgb), true);

  const lut = buildCurveLUT(defaultCurves.rgb);
  assert.strictEqual(lut.length, 256);

  // Check identity
  for (let i = 0; i < 256; i++) {
    assert.strictEqual(lut[i], i, `Index ${i} should map to ${i}`);
  }
});

test('Curves - Monotone Cubic Spline preserves endpoints and clamps to [0, 255]', () => {
  // S-Curve (lift highlights, compress shadows)
  const points = [
    { id: 'p0', x: 0, y: 0 },
    { id: 'p1', x: 0.25, y: 0.15 },
    { id: 'p2', x: 0.75, y: 0.85 },
    { id: 'p3', x: 1, y: 1 }
  ];

  const lut = buildCurveLUT(points);
  assert.strictEqual(lut.length, 256);
  assert.strictEqual(lut[0], 0);
  assert.strictEqual(lut[255], 255);

  // Check monotonic property (never decreases)
  for (let i = 1; i < 256; i++) {
    assert.ok(lut[i] >= lut[i - 1], `LUT at ${i} (${lut[i]}) should be >= LUT at ${i - 1} (${lut[i - 1]})`);
    assert.ok(lut[i] >= 0 && lut[i] <= 255);
  }
});

test('Curves - Matte film curve lifts black floor', () => {
  const mattePoints = [
    { id: 'p0', x: 0, y: 0.15 }, // Raised black floor
    { id: 'p1', x: 1, y: 1 }
  ];

  const lut = buildCurveLUT(mattePoints);
  assert.ok(lut[0] >= Math.round(0.15 * 255) - 2);
  assert.strictEqual(lut[255], 255);
});

test('Presets - All built-in looks are valid and defined', () => {
  assert.ok(PRESET_LOOKS.length >= 6);

  for (const preset of PRESET_LOOKS) {
    assert.ok(preset.id.length > 0);
    assert.ok(preset.name.length > 0);
    assert.ok(preset.gradient.startsWith('linear-gradient'));

    // Check adjustment values are within valid bounds [-100, 100]
    const adj = preset.adjustments;
    if (adj.brightness !== undefined) {
      assert.ok(adj.brightness >= -100 && adj.brightness <= 100);
    }
    if (adj.contrast !== undefined) {
      assert.ok(adj.contrast >= -100 && adj.contrast <= 100);
    }
    if (adj.saturation !== undefined) {
      assert.ok(adj.saturation >= -100 && adj.saturation <= 100);
    }
    if (adj.warmth !== undefined) {
      assert.ok(adj.warmth >= -100 && adj.warmth <= 100);
    }
  }
});
