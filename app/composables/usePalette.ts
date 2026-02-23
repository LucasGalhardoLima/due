export type PaletteId = 'mono' | 'cyber-mint' | 'neon-sage' | 'tokyo-night' | 'aurora' | 'vapor'

export interface PaletteInfo {
  id: PaletteId
  label: string
  primary: string
  secondary: string
  accent: string
}

export const PALETTES: readonly PaletteInfo[] = [
  { id: 'mono', label: 'Mono', primary: 'hsl(0,0%,18%)', secondary: 'hsl(0,0%,46%)', accent: 'hsl(0,0%,64%)' },
  { id: 'cyber-mint', label: 'Cyber Mint', primary: 'hsl(168,64%,70%)', secondary: 'hsl(252,57%,20%)', accent: 'hsl(210,50%,60%)' },
  { id: 'neon-sage', label: 'Neon Sage', primary: 'hsl(142,44%,62%)', secondary: 'hsl(270,40%,22%)', accent: 'hsl(12,50%,60%)' },
  { id: 'tokyo-night', label: 'Tokyo Night', primary: 'hsl(260,50%,72%)', secondary: 'hsl(340,50%,28%)', accent: 'hsl(200,55%,60%)' },
  { id: 'aurora', label: 'Aurora', primary: 'hsl(150,44%,62%)', secondary: 'hsl(265,44%,22%)', accent: 'hsl(42,60%,56%)' },
  { id: 'vapor', label: 'Vapor', primary: 'hsl(175,48%,64%)', secondary: 'hsl(268,44%,22%)', accent: 'hsl(24,55%,60%)' },
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
