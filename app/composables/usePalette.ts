export type PaletteId = 'mono' | 'cyber-mint' | 'neon-sage' | 'tokyo-night' | 'aurora' | 'vapor' | 'sunset' | 'ocean' | 'forest' | 'berry' | 'solar' | 'rose' | 'midnight'

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
  { id: 'sunset', label: 'Sunset', primary: 'hsl(15,80%,62%)', secondary: 'hsl(240,42%,45%)', accent: 'hsl(340,55%,58%)', success: 'hsl(155,58%,50%)', warning: 'hsl(42,65%,55%)', info: 'hsl(210,55%,58%)', danger: 'hsl(350,58%,55%)' },
  { id: 'ocean', label: 'Ocean', primary: 'hsl(205,72%,62%)', secondary: 'hsl(10,55%,52%)', accent: 'hsl(175,50%,50%)', success: 'hsl(162,58%,50%)', warning: 'hsl(38,62%,55%)', info: 'hsl(220,55%,58%)', danger: 'hsl(0,55%,54%)' },
  { id: 'forest', label: 'Forest', primary: 'hsl(152,55%,52%)', secondary: 'hsl(340,45%,45%)', accent: 'hsl(42,52%,52%)', success: 'hsl(145,55%,48%)', warning: 'hsl(44,60%,54%)', info: 'hsl(215,50%,58%)', danger: 'hsl(355,52%,52%)' },
  { id: 'berry', label: 'Berry', primary: 'hsl(315,58%,60%)', secondary: 'hsl(185,45%,45%)', accent: 'hsl(270,45%,58%)', success: 'hsl(158,55%,50%)', warning: 'hsl(40,60%,55%)', info: 'hsl(225,50%,58%)', danger: 'hsl(0,50%,54%)' },
  { id: 'solar', label: 'Solar', primary: 'hsl(42,78%,58%)', secondary: 'hsl(220,45%,45%)', accent: 'hsl(28,58%,55%)', success: 'hsl(150,55%,50%)', warning: 'hsl(32,62%,55%)', info: 'hsl(210,52%,58%)', danger: 'hsl(5,55%,54%)' },
  { id: 'rose', label: 'Rosé', primary: 'hsl(345,50%,68%)', secondary: 'hsl(215,18%,46%)', accent: 'hsl(20,48%,55%)', success: 'hsl(155,48%,50%)', warning: 'hsl(40,54%,54%)', info: 'hsl(210,46%,58%)', danger: 'hsl(0,48%,54%)' },
  { id: 'midnight', label: 'Midnight', primary: 'hsl(235,42%,70%)', secondary: 'hsl(220,8%,52%)', accent: 'hsl(195,42%,55%)', success: 'hsl(158,48%,50%)', warning: 'hsl(42,52%,54%)', info: 'hsl(220,44%,58%)', danger: 'hsl(352,48%,54%)' },
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
