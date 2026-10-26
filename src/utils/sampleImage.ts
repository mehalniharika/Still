/**
 * Generates a beautiful, high-resolution test photograph (mountains, sunset sky, lake reflection, sun glow)
 * so users can immediately start editing without needing to search their disk for an image.
 */
export function generateSamplePhotograph(): Promise<string> {
  return new Promise((resolve) => {
    const width = 1920;
    const height = 1280;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // 1. Sky Gradient (Golden hour twilight)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
    skyGrad.addColorStop(0, '#1e293b');    // Deep twilight slate
    skyGrad.addColorStop(0.3, '#334155');  // Indigo atmosphere
    skyGrad.addColorStop(0.55, '#f97316'); // Vibrant orange glow
    skyGrad.addColorStop(0.75, '#fbbf24'); // Golden yellow horizon
    skyGrad.addColorStop(1, '#fed7aa');    // Soft apricot light
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.65);

    // 2. Sun Glow & Corona
    const sunX = width * 0.45;
    const sunY = height * 0.42;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 320);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    sunGrad.addColorStop(0.15, 'rgba(254, 240, 138, 0.8)');
    sunGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.4)');
    sunGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 320, 0, Math.PI * 2);
    ctx.fill();

    // 3. Clouds
    ctx.fillStyle = 'rgba(255, 237, 213, 0.25)';
    for (let c = 0; c < 12; c++) {
      const cx = (c * 190 + 80) % width;
      const cy = 120 + Math.sin(c * 1.5) * 80;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 140 + (c % 4) * 30, 28 + (c % 3) * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Distant Mountain Range (Atmospheric haze)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.58);
    const mPoints = [
      [0.1, 0.45], [0.18, 0.52], [0.28, 0.40], [0.38, 0.48],
      [0.46, 0.36], [0.55, 0.47], [0.68, 0.38], [0.8, 0.49],
      [0.9, 0.42], [1.0, 0.56]
    ];
    for (const [px, py] of mPoints) {
      ctx.lineTo(width * px, height * py);
    }
    ctx.lineTo(width, height * 0.65);
    ctx.lineTo(0, height * 0.65);
    ctx.closePath();
    ctx.fill();

    // 5. Foreground Mountain Ridge (Dark silhouette with textured ridges)
    const fgGrad = ctx.createLinearGradient(0, height * 0.44, 0, height * 0.68);
    fgGrad.addColorStop(0, '#1e293b');
    fgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = fgGrad;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.62);
    const fgPoints = [
      [0.08, 0.55], [0.15, 0.50], [0.24, 0.58], [0.35, 0.46],
      [0.5, 0.54], [0.62, 0.44], [0.74, 0.52], [0.85, 0.45],
      [0.95, 0.54], [1.0, 0.62]
    ];
    for (const [px, py] of fgPoints) {
      ctx.lineTo(width * px, height * py);
    }
    ctx.lineTo(width, height * 0.68);
    ctx.lineTo(0, height * 0.68);
    ctx.closePath();
    ctx.fill();

    // 6. Calm Lake Water with Sky Reflections
    const waterGrad = ctx.createLinearGradient(0, height * 0.65, 0, height);
    waterGrad.addColorStop(0, '#0f172a');
    waterGrad.addColorStop(0.15, '#1e1b4b');
    waterGrad.addColorStop(0.5, '#312e81');
    waterGrad.addColorStop(0.8, '#1e293b');
    waterGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, height * 0.65, width, height * 0.35);

    // 7. Golden Sunset Reflection Trail across the Water
    const reflGrad = ctx.createLinearGradient(sunX - 160, 0, sunX + 160, 0);
    reflGrad.addColorStop(0, 'rgba(251, 191, 36, 0)');
    reflGrad.addColorStop(0.3, 'rgba(251, 146, 60, 0.35)');
    reflGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.75)');
    reflGrad.addColorStop(0.7, 'rgba(251, 146, 60, 0.35)');
    reflGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');

    ctx.fillStyle = reflGrad;
    for (let r = 0; r < 36; r++) {
      const ry = height * 0.66 + (r / 36) * (height * 0.33);
      const rWidth = 70 + r * 14;
      const rx = sunX - rWidth / 2 + Math.sin(r * 2.3) * 12;
      ctx.fillRect(rx, ry, rWidth, 3 + (r % 2) * 2);
    }

    // 8. Natural Photographic Grain & Micro-texture
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Subtle natural sensor noise
      const noise = (Math.random() - 0.5) * 7;
      d[i] = Math.max(0, Math.min(255, d[i] + noise));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    resolve(canvas.toDataURL('image/jpeg', 0.95));
  });
}
