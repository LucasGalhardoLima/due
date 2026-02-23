export type PaletteId = 'mono' | 'cyber-mint' | 'neon-sage' | 'tokyo-night' | 'aurora' | 'vapor'

export interface PaletteInfo {
  id: PaletteId
  label: string
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  info: string
  danger: string
}

export const PALETTES: readonly PaletteInfo[] = [
  { id: 'mono', label: 'Mono', primary: 'hsl(0,0%,18%)', secondary: 'hsl(0,0%,46%)', accent: 'hsl(0,0%,64%)', success: 'hsl(0,0%,36%)', warning: 'hsl(0,0%,42%)', info: 'hsl(0,0%,48%)', danger: 'hsl(0,0%,30%)' },
  { id: 'cyber-mint', label: 'Cyber Mint', primary: 'hsl(168,64%,70%)', secondary: 'hsl(252,57%,20%)', accent: 'hsl(210,50%,60%)', success: 'hsl(160,58%,42%)', warning: 'hsl(46,62%,48%)', info: 'hsl(210,56%,50%)', danger: 'hsl(350,55%,48%)' },
  { id: 'neon-sage', label: 'Neon Sage', primary: 'hsl(142,44%,62%)', secondary: 'hsl(270,40%,22%)', accent: 'hsl(12,50%,60%)', success: 'hsl(155,52%,40%)', warning: 'hsl(38,58%,48%)', info: 'hsl(220,50%,50%)', danger: 'hsl(0,50%,48%)' },
  { id: 'tokyo-night', label: 'Tokyo Night', primary: 'hsl(260,50%,72%)', secondary: 'hsl(340,50%,28%)', accent: 'hsl(200,55%,60%)', success: 'hsl(170,54%,42%)', warning: 'hsl(42,60%,48%)', info: 'hsl(230,52%,52%)', danger: 'hsl(340,52%,48%)' },
  { id: 'aurora', label: 'Aurora', primary: 'hsl(150,44%,62%)', secondary: 'hsl(265,44%,22%)', accent: 'hsl(42,60%,56%)', success: 'hsl(158,56%,40%)', warning: 'hsl(44,60%,48%)', info: 'hsl(215,52%,50%)', danger: 'hsl(355,52%,48%)' },
  { id: 'vapor', label: 'Vapor', primary: 'hsl(175,48%,64%)', secondary: 'hsl(268,44%,22%)', accent: 'hsl(24,55%,60%)', success: 'hsl(162,54%,42%)', warning: 'hsl(36,58%,48%)', info: 'hsl(205,52%,50%)', danger: 'hsl(5,52%,48%)' },
] as const

const VALID_IDS = new Set<string>(PALETTES.map(p => p.id))

function isValidPaletteId(value: unknown): value is PaletteId {
  return typeof value === 'string' && VALID_IDS.has(value)
}

export function usePalette() {
  const cookie = useCookie<string>('due-palette', {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    default: () => 'neon-sage',
  })

  const current = computed<PaletteId>(() =>
    isValidPaletteId(cookie.value) ? cookie.value : 'neon-sage',
  )

  function setPalette(id: PaletteId) {
    cookie.value = id

    if (import.meta.client) {
      const html = document.documentElement
      // Strip old palette class
      html.classList.forEach((cls) => {
        if (cls.startsWith('palette-')) html.classList.remove(cls)
      })
      // Add new palette class (mono = no class needed, grayscale is the default)
      if (id !== 'mono') {
        html.classList.add(`palette-${id}`)
      }
    }
  }

  // Apply palette on client mount
  if (import.meta.client) {
    onMounted(() => {
      const html = document.documentElement
      const id = current.value
      // Strip any stale palette classes
      html.classList.forEach((cls) => {
        if (cls.startsWith('palette-')) html.classList.remove(cls)
      })
      // Only add class if not mono
      if (id !== 'mono') {
        html.classList.add(`palette-${id}`)
      }
    })
  }

  return {
    palettes: PALETTES,
    current,
    setPalette,
  }
}
