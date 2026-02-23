import { ref, watch, readonly } from 'vue'

type PaletteVars = Record<string, string>

export interface ColorPalette {
  id: string
  name: string
  dark: PaletteVars
  light: PaletteVars
  preview: {
    primary: string
    secondary: string
    accent: string
  }
}

/**
 * Variables overridden per palette.
 * When "default" is active, all inline overrides are removed
 * so the original tailwind.css :root / .dark values take effect.
 */
const PALETTE_VARS = [
  '--primary', '--primary-foreground', '--primary-accent',
  '--secondary', '--secondary-foreground', '--secondary-accent',
  '--accent', '--accent-foreground',
  '--ring',
  '--ai-accent', '--ai-accent-foreground',
  '--brand-accent', '--brand-accent-foreground',
]

export const palettes: ColorPalette[] = [
  // ── 0. Default (grayscale) ────────────────────────────────────
  {
    id: 'default',
    name: 'Mono',
    dark: {},
    light: {},
    preview: { primary: '#e6e6e6', secondary: '#262626', accent: '#999999' },
  },

  // ── 1. Cyber Mint — clean digital cyberpunk ───────────────────
  {
    id: 'cyber-mint',
    name: 'Cyber Mint',
    dark: {
      '--primary': '162 42% 62%',
      '--primary-foreground': '0 0% 7%',
      '--primary-accent': '162 38% 45%',
      '--secondary': '268 20% 18%',
      '--secondary-foreground': '268 15% 82%',
      '--secondary-accent': '268 38% 58%',
      '--accent': '198 48% 58%',
      '--accent-foreground': '0 0% 7%',
      '--ring': '162 42% 62%',
      '--ai-accent': '198 48% 58%',
      '--ai-accent-foreground': '0 0% 7%',
      '--brand-accent': '268 20% 22%',
      '--brand-accent-foreground': '268 15% 82%',
    },
    light: {
      '--primary': '162 42% 32%',
      '--primary-foreground': '0 0% 98%',
      '--primary-accent': '162 38% 42%',
      '--secondary': '268 18% 93%',
      '--secondary-foreground': '268 25% 22%',
      '--secondary-accent': '268 35% 45%',
      '--accent': '198 42% 38%',
      '--accent-foreground': '0 0% 98%',
      '--ring': '162 42% 32%',
      '--ai-accent': '198 42% 38%',
      '--ai-accent-foreground': '0 0% 98%',
      '--brand-accent': '268 18% 90%',
      '--brand-accent-foreground': '268 25% 22%',
    },
    preview: { primary: '#6ec4a2', secondary: '#8265b8', accent: '#5aa3c9' },
  },

  // ── 2. Neon Sage — nature-inspired, warm accent ───────────────
  {
    id: 'neon-sage',
    name: 'Neon Sage',
    dark: {
      '--primary': '152 35% 58%',
      '--primary-foreground': '0 0% 7%',
      '--primary-accent': '152 30% 42%',
      '--secondary': '262 18% 18%',
      '--secondary-foreground': '262 14% 82%',
      '--secondary-accent': '262 32% 55%',
      '--accent': '12 48% 60%',
      '--accent-foreground': '0 0% 7%',
      '--ring': '152 35% 58%',
      '--ai-accent': '12 48% 60%',
      '--ai-accent-foreground': '0 0% 7%',
      '--brand-accent': '262 18% 22%',
      '--brand-accent-foreground': '262 14% 82%',
    },
    light: {
      '--primary': '152 35% 30%',
      '--primary-foreground': '0 0% 98%',
      '--primary-accent': '152 30% 40%',
      '--secondary': '262 16% 93%',
      '--secondary-foreground': '262 22% 22%',
      '--secondary-accent': '262 28% 42%',
      '--accent': '12 42% 42%',
      '--accent-foreground': '0 0% 98%',
      '--ring': '152 35% 30%',
      '--ai-accent': '12 42% 42%',
      '--ai-accent-foreground': '0 0% 98%',
      '--brand-accent': '262 16% 90%',
      '--brand-accent-foreground': '262 22% 22%',
    },
    preview: { primary: '#6fad8c', secondary: '#7758a8', accent: '#c97a5c' },
  },

  // ── 3. Tokyo Night — vibrant city lights ──────────────────────
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    dark: {
      '--primary': '168 48% 56%',
      '--primary-foreground': '0 0% 7%',
      '--primary-accent': '168 42% 40%',
      '--secondary': '278 22% 18%',
      '--secondary-foreground': '278 16% 82%',
      '--secondary-accent': '278 42% 58%',
      '--accent': '328 48% 60%',
      '--accent-foreground': '0 0% 7%',
      '--ring': '168 48% 56%',
      '--ai-accent': '328 48% 60%',
      '--ai-accent-foreground': '0 0% 7%',
      '--brand-accent': '278 22% 22%',
      '--brand-accent-foreground': '278 16% 82%',
    },
    light: {
      '--primary': '168 48% 28%',
      '--primary-foreground': '0 0% 98%',
      '--primary-accent': '168 42% 38%',
      '--secondary': '278 18% 93%',
      '--secondary-foreground': '278 25% 22%',
      '--secondary-accent': '278 38% 42%',
      '--accent': '328 42% 42%',
      '--accent-foreground': '0 0% 98%',
      '--ring': '168 48% 28%',
      '--ai-accent': '328 42% 42%',
      '--ai-accent-foreground': '0 0% 98%',
      '--brand-accent': '278 18% 90%',
      '--brand-accent-foreground': '278 25% 22%',
    },
    preview: { primary: '#4fc4a8', secondary: '#8c60c4', accent: '#cc6898' },
  },

  // ── 4. Aurora — cool northern lights, amber accent ────────────
  {
    id: 'aurora',
    name: 'Aurora',
    dark: {
      '--primary': '164 40% 58%',
      '--primary-foreground': '0 0% 7%',
      '--primary-accent': '164 35% 42%',
      '--secondary': '274 20% 18%',
      '--secondary-foreground': '274 15% 82%',
      '--secondary-accent': '274 35% 55%',
      '--accent': '38 52% 58%',
      '--accent-foreground': '0 0% 7%',
      '--ring': '164 40% 58%',
      '--ai-accent': '38 52% 58%',
      '--ai-accent-foreground': '0 0% 7%',
      '--brand-accent': '274 20% 22%',
      '--brand-accent-foreground': '274 15% 82%',
    },
    light: {
      '--primary': '164 40% 30%',
      '--primary-foreground': '0 0% 98%',
      '--primary-accent': '164 35% 40%',
      '--secondary': '274 16% 93%',
      '--secondary-foreground': '274 22% 22%',
      '--secondary-accent': '274 30% 42%',
      '--accent': '38 46% 42%',
      '--accent-foreground': '0 0% 98%',
      '--ring': '164 40% 30%',
      '--ai-accent': '38 46% 42%',
      '--ai-accent-foreground': '0 0% 98%',
      '--brand-accent': '274 16% 90%',
      '--brand-accent-foreground': '274 22% 22%',
    },
    preview: { primary: '#66bf9f', secondary: '#7c5ab2', accent: '#ccaa5c' },
  },

  // ── 5. Vapor — retro-futuristic, peach accent ─────────────────
  {
    id: 'vapor',
    name: 'Vapor',
    dark: {
      '--primary': '148 40% 55%',
      '--primary-foreground': '0 0% 7%',
      '--primary-accent': '148 35% 40%',
      '--secondary': '258 22% 19%',
      '--secondary-foreground': '258 16% 82%',
      '--secondary-accent': '258 40% 58%',
      '--accent': '18 52% 60%',
      '--accent-foreground': '0 0% 7%',
      '--ring': '148 40% 55%',
      '--ai-accent': '18 52% 60%',
      '--ai-accent-foreground': '0 0% 7%',
      '--brand-accent': '258 22% 23%',
      '--brand-accent-foreground': '258 16% 82%',
    },
    light: {
      '--primary': '148 40% 28%',
      '--primary-foreground': '0 0% 98%',
      '--primary-accent': '148 35% 38%',
      '--secondary': '258 18% 93%',
      '--secondary-foreground': '258 24% 22%',
      '--secondary-accent': '258 35% 42%',
      '--accent': '18 46% 42%',
      '--accent-foreground': '0 0% 98%',
      '--ring': '148 40% 28%',
      '--ai-accent': '18 46% 42%',
      '--ai-accent-foreground': '0 0% 98%',
      '--brand-accent': '258 18% 90%',
      '--brand-accent-foreground': '258 24% 22%',
    },
    preview: { primary: '#5cb38c', secondary: '#7c5cc4', accent: '#cc8a5c' },
  },
]

// ── Shared state (singleton across all component instances) ──────
const _activePaletteId = ref('default')
const _initialized = ref(false)

export function useColorPalette() {
  const colorMode = useColorMode()

  function applyPalette(paletteId: string) {
    const palette = palettes.find(p => p.id === paletteId)
    if (!palette) return

    _activePaletteId.value = paletteId

    if (import.meta.client) {
      localStorage.setItem('due-palette', paletteId)
    }

    if (!import.meta.client) return

    const root = document.documentElement

    // Default → remove all inline overrides so CSS cascade works
    if (paletteId === 'default') {
      PALETTE_VARS.forEach(v => root.style.removeProperty(v))
      return
    }

    const isDark = colorMode.value === 'dark'
    const vars = isDark ? palette.dark : palette.light

    // Clear any vars not in this palette, then apply
    PALETTE_VARS.forEach(v => root.style.removeProperty(v))
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value)
    }
  }

  // Re-apply on dark/light toggle
  watch(() => colorMode.value, () => {
    if (_activePaletteId.value !== 'default') {
      applyPalette(_activePaletteId.value)
    }
  })

  // Hydrate from localStorage once
  if (import.meta.client && !_initialized.value) {
    _initialized.value = true
    const saved = localStorage.getItem('due-palette')
    if (saved && palettes.some(p => p.id === saved)) {
      _activePaletteId.value = saved
      // Defer to next tick so colorMode is settled
      nextTick(() => applyPalette(saved))
    }
  }

  return {
    activePaletteId: readonly(_activePaletteId),
    palettes,
    applyPalette,
  }
}
