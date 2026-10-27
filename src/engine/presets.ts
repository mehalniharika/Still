import { PresetLook } from '../types/editor';

export interface LookCategoryMeta {
  id: 'all' | 'classic' | 'vibrant' | 'glow' | 'digicam' | 'bw' | 'cinematic';
  label: string;
  description: string;
}

export const LOOK_CATEGORIES: LookCategoryMeta[] = [
  { id: 'all', label: 'All', description: 'Complete library of 22 looks' },
  { id: 'classic', label: 'Classic', description: 'Snapseed core essentials & portraits' },
  { id: 'vibrant', label: 'Vibrant', description: 'Punchy color, contrast & high clarity' },
  { id: 'glow', label: 'Glow & Bloom', description: 'Luminous diffusion & vintage halation' },
  { id: 'digicam', label: 'Y2K Digicam', description: '2000s CCD sensors, direct flash & disposable 35mm' },
  { id: 'bw', label: 'B&W', description: 'Monochrome silver gelatin & deep silhouettes' },
  { id: 'cinematic', label: 'Cinematic', description: 'Blockbuster color separation & moody film' },
];

export const PRESET_LOOKS: PresetLook[] = [
  // ==========================================
  // 1. CLASSIC / CORE SNAPSEED LOOKS
  // ==========================================
  {
    id: 'portrait',
    name: 'Portrait',
    subtitle: 'Soft skin tones, bright face & gentle contrast',
    category: 'classic',
    gradient: 'linear-gradient(135deg, #fbcfe8, #f43f5e)',
    adjustments: { brightness: 6, contrast: 8, saturation: 4, warmth: 10, highlights: -12, shadows: 22, sharpness: 10 }
  },
  {
    id: 'smooth',
    name: 'Smooth',
    subtitle: 'Softened micro-contrast with creamy highlights',
    category: 'classic',
    gradient: 'linear-gradient(135deg, #e0e7ff, #a5b4fc)',
    adjustments: { brightness: 10, contrast: -15, saturation: -5, warmth: 4, highlights: 10, shadows: 30, sharpness: 0 }
  },
  {
    id: 'bright',
    name: 'Bright',
    subtitle: 'Clean high-key commercial look with sparkling whites',
    category: 'classic',
    gradient: 'linear-gradient(135deg, #ffffff, #67e8f9)',
    adjustments: { brightness: 22, contrast: 10, saturation: 6, warmth: -4, highlights: -10, shadows: 40, sharpness: 12 }
  },
  {
    id: 'structure',
    name: 'Structure',
    subtitle: 'Sharp micro-contrast for architecture & landscapes',
    category: 'classic',
    gradient: 'linear-gradient(135deg, #475569, #0f172a)',
    adjustments: { brightness: 0, contrast: 24, saturation: 8, warmth: 0, highlights: -20, shadows: 25, sharpness: 45 }
  },

  // ==========================================
  // 2. VIBRANT & HIGH DYNAMIC CLARITY
  // ==========================================
  {
    id: 'pop',
    name: 'Pop',
    subtitle: 'Crisp vibrancy, deep blacks & punchy color',
    category: 'vibrant',
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    adjustments: { brightness: 4, contrast: 25, saturation: 28, warmth: 2, highlights: -10, shadows: 14, sharpness: 15 }
  },
  {
    id: 'accentuate',
    name: 'Accentuate',
    subtitle: 'Deepened shadows & high dynamic midtone clarity',
    category: 'vibrant',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    adjustments: { brightness: 0, contrast: 30, saturation: 12, warmth: 0, highlights: -25, shadows: -10, sharpness: 20 }
  },
  {
    id: 'morning',
    name: 'Morning',
    subtitle: 'Warm golden sunrise pastel glow & soft highlights',
    category: 'vibrant',
    gradient: 'linear-gradient(135deg, #fef08a, #f97316)',
    adjustments: { brightness: 12, contrast: -6, saturation: 8, warmth: 32, highlights: 18, shadows: 25, sharpness: 8 }
  },
  {
    id: 'hdr-scape',
    name: 'HDR Scape',
    subtitle: 'Maximized dynamic range with crisp local contrast',
    category: 'vibrant',
    gradient: 'linear-gradient(135deg, #6366f1, #ec4899)',
    adjustments: { brightness: 0, contrast: 18, saturation: 22, warmth: 4, highlights: -50, shadows: 55, sharpness: 25 }
  },

  // ==========================================
  // 3. GLOW & BLOOM SERIES
  // ==========================================
  {
    id: 'faded-glow',
    name: 'Faded Glow',
    subtitle: 'Milky lifted blacks with dreamy highlight bloom',
    category: 'glow',
    gradient: 'linear-gradient(135deg, #fed7aa, #fb7185)',
    adjustments: { brightness: 8, contrast: -10, saturation: -6, warmth: 12, highlights: 15, shadows: 35, sharpness: 5 }
  },
  {
    id: 'golden-glow',
    name: 'Golden Glow',
    subtitle: 'Sun-drenched luminous highlights & amber warmth',
    category: 'glow',
    gradient: 'linear-gradient(135deg, #fbbf24, #b45309)',
    adjustments: { brightness: 8, contrast: 15, saturation: 22, warmth: 42, highlights: -15, shadows: 20, sharpness: 10 }
  },
  {
    id: 'vintage-glow',
    name: 'Vintage Glow',
    subtitle: 'Milky retro film shadows with golden halation',
    category: 'glow',
    gradient: 'linear-gradient(135deg, #d97706, #78350f)',
    adjustments: { brightness: 12, contrast: -12, saturation: -8, warmth: 26, highlights: -20, shadows: 38, sharpness: 5 }
  },
  {
    id: 'glamour-bloom',
    name: 'Glamour Bloom',
    subtitle: 'Soft portrait diffusion & radiant skin glow',
    category: 'glow',
    gradient: 'linear-gradient(135deg, #fda4af, #f43f5e)',
    adjustments: { brightness: 10, contrast: -16, saturation: 18, warmth: 14, highlights: 20, shadows: 30, sharpness: 0 }
  },

  // ==========================================
  // 4. DIGICAM & Y2K CCD COLLECTION
  // ==========================================
  {
    id: 'y2k-flash',
    name: 'Y2K Direct Flash',
    subtitle: 'Harsh on-camera flash & punchy saturated color',
    category: 'digicam',
    gradient: 'linear-gradient(135deg, #ffffff, #38bdf8)',
    adjustments: { brightness: 14, contrast: 32, saturation: 18, warmth: -6, highlights: 30, shadows: -18, sharpness: 30 }
  },
  {
    id: 'powershot-ccd',
    name: 'PowerShot CCD',
    subtitle: 'Early 2000s Canon compact sensor warmth & punch',
    category: 'digicam',
    gradient: 'linear-gradient(135deg, #ef4444, #f59e0b)',
    adjustments: { brightness: 8, contrast: 22, saturation: 25, warmth: 20, highlights: 15, shadows: 8, sharpness: 22 }
  },
  {
    id: 'cybershot-2003',
    name: 'Cyber-shot 2003',
    subtitle: 'Cool electronic blue tint & digital sharpness',
    category: 'digicam',
    gradient: 'linear-gradient(135deg, #0284c7, #22d3ee)',
    adjustments: { brightness: 10, contrast: 26, saturation: 12, warmth: -22, highlights: 20, shadows: 15, sharpness: 35 }
  },
  {
    id: 'finepix-chrome',
    name: 'FinePix Chrome',
    subtitle: 'Vivid slide-film greens & punchy cerulean skies',
    category: 'digicam',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    adjustments: { brightness: 4, contrast: 34, saturation: 35, warmth: 6, highlights: -18, shadows: 12, sharpness: 20 }
  },
  {
    id: 'disposable-35mm',
    name: 'Disposable 35mm',
    subtitle: 'Plastic lens softness & nostalgic warm-green tint',
    category: 'digicam',
    gradient: 'linear-gradient(135deg, #84cc16, #a16207)',
    adjustments: { brightness: 12, contrast: 15, saturation: -8, warmth: 18, highlights: 22, shadows: 28, sharpness: 5 }
  },

  // ==========================================
  // 5. BLACK & WHITE / MONOCHROME
  // ==========================================
  {
    id: 'fine-art',
    name: 'Fine Art B&W',
    subtitle: 'Silver-gelatin monochrome with rich tonal depth',
    category: 'bw',
    gradient: 'linear-gradient(135deg, #71717a, #09090b)',
    adjustments: { brightness: 0, contrast: 36, saturation: -100, warmth: 0, highlights: -15, shadows: 15, sharpness: 15 }
  },
  {
    id: 'push',
    name: 'Push High B&W',
    subtitle: 'Aggressive film push-processing with deep blacks',
    category: 'bw',
    gradient: 'linear-gradient(135deg, #ffffff, #000000)',
    adjustments: { brightness: -4, contrast: 48, saturation: -100, warmth: 0, highlights: 25, shadows: -35, sharpness: 25 }
  },
  {
    id: 'silhouette',
    name: 'Silhouette',
    subtitle: 'Crushes dark shapes into pure black against backlighting',
    category: 'bw',
    gradient: 'linear-gradient(135deg, #ea580c, #000000)',
    adjustments: { brightness: -15, contrast: 65, saturation: 18, warmth: 16, highlights: 35, shadows: -85, sharpness: 10 }
  },

  // ==========================================
  // 6. CINEMATIC & MOODY
  // ==========================================
  {
    id: 'drama-film',
    name: 'Drama Film',
    subtitle: 'Desaturated cinematic micro-contrast & moody skies',
    category: 'cinematic',
    gradient: 'linear-gradient(135deg, #334155, #1e293b)',
    adjustments: { brightness: -4, contrast: 38, saturation: -35, warmth: -6, highlights: -35, shadows: 25, sharpness: 30 }
  },
  {
    id: 'teal-orange',
    name: 'Teal & Orange',
    subtitle: 'Hollywood blockbuster color separation & warm skin',
    category: 'cinematic',
    gradient: 'linear-gradient(135deg, #0e7490, #ea580c)',
    adjustments: { brightness: 2, contrast: 24, saturation: 18, warmth: 12, highlights: -12, shadows: 15, sharpness: 20 }
  }
];
