import { PresetLook } from '../types/editor';

export const PRESET_LOOKS: PresetLook[] = [
  {
    id: 'warm-glow',
    name: 'Warm Glow',
    subtitle: 'Golden ambient warmth & lifted shadows',
    category: 'classic',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    adjustments: {
      brightness: 4,
      contrast: 12,
      saturation: 16,
      warmth: 38,
      highlights: -18,
      shadows: 22,
      sharpness: 10
    }
  },
  {
    id: 'cool-nordic',
    name: 'Cool Nordic',
    subtitle: 'Crisp scandinavian blues & clean contrast',
    category: 'moody',
    gradient: 'linear-gradient(135deg, #38bdf8, #0284c7)',
    adjustments: {
      brightness: 6,
      contrast: 18,
      saturation: -12,
      warmth: -34,
      highlights: -12,
      shadows: 8,
      sharpness: 15
    }
  },
  {
    id: 'mono-crisp',
    name: 'Mono Crisp',
    subtitle: 'High contrast black & white with deep blacks',
    category: 'classic',
    gradient: 'linear-gradient(135deg, #71717a, #18181b)',
    adjustments: {
      brightness: 2,
      contrast: 36,
      saturation: -100,
      warmth: 0,
      highlights: -15,
      shadows: 18,
      sharpness: 30
    },
    curves: {
      rgb: [
        { id: 'p0', x: 0, y: 0 },
        { id: 'p1', x: 0.28, y: 0.20 },
        { id: 'p2', x: 0.72, y: 0.82 },
        { id: 'p3', x: 1, y: 1 }
      ]
    }
  },
  {
    id: 'matte-film',
    name: 'Matte Film',
    subtitle: 'Faded analogue shadows & nostalgic warmth',
    category: 'film',
    gradient: 'linear-gradient(135deg, #a78bfa, #6d28d9)',
    adjustments: {
      brightness: 5,
      contrast: -15,
      saturation: -18,
      warmth: 14,
      highlights: -24,
      shadows: 35,
      sharpness: 8
    },
    curves: {
      rgb: [
        { id: 'p0', x: 0, y: 0.12 }, // Raised black floor for matte look
        { id: 'p1', x: 0.45, y: 0.42 },
        { id: 'p2', x: 0.78, y: 0.76 },
        { id: 'p3', x: 1, y: 0.94 }  // Softened peak white
      ]
    }
  },
  {
    id: 'vivid-pop',
    name: 'Vivid Pop',
    subtitle: 'Rich dynamic colors with punchy midtones',
    category: 'creative',
    gradient: 'linear-gradient(135deg, #f43f5e, #be123c)',
    adjustments: {
      brightness: 6,
      contrast: 22,
      saturation: 42,
      warmth: 6,
      highlights: -10,
      shadows: 14,
      sharpness: 24
    }
  },
  {
    id: 'cinematic-drama',
    name: 'Cinematic Drama',
    subtitle: 'Moody contrast with rich teal-toned shadows',
    category: 'moody',
    gradient: 'linear-gradient(135deg, #0d9488, #115e59)',
    adjustments: {
      brightness: -4,
      contrast: 34,
      saturation: 12,
      warmth: -16,
      highlights: -28,
      shadows: -14,
      sharpness: 32
    },
    curves: {
      rgb: [
        { id: 'p0', x: 0, y: 0 },
        { id: 'p1', x: 0.22, y: 0.14 },
        { id: 'p2', x: 0.75, y: 0.84 },
        { id: 'p3', x: 1, y: 1 }
      ]
    }
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    subtitle: 'Sunset luminescence and warm amber tonality',
    category: 'creative',
    gradient: 'linear-gradient(135deg, #fbbf24, #b45309)',
    adjustments: {
      brightness: 8,
      contrast: 15,
      saturation: 24,
      warmth: 58,
      highlights: -32,
      shadows: 28,
      sharpness: 12
    }
  },
  {
    id: 'clean-minimal',
    name: 'Clean Minimal',
    subtitle: 'Bright, airy, subtle modern aesthetic',
    category: 'classic',
    gradient: 'linear-gradient(135deg, #94a3b8, #475569)',
    adjustments: {
      brightness: 12,
      contrast: 8,
      saturation: -8,
      warmth: 2,
      highlights: -8,
      shadows: 12,
      sharpness: 16
    }
  }
];
