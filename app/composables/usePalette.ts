export type PaletteId = 'mint' | 'cyan' | 'amber' | 'rose' | 'peach'

export interface PaletteInfo {
  id: PaletteId
  label: string
  primary: string
  secondary: string
}

export const PALETTES: readonly PaletteInfo[] = [
  { id: 'mint', label: 'Mint & Violet', primary: 'hsl(168,64%,70%)', secondary: 'hsl(252,57%,20%)' },
  { id: 'cyan', label: 'Cyan & Magenta', primary: 'hsl(190,60%,68%)', secondary: 'hsl(330,50%,22%)' },
  { id: 'amber', label: 'Amber & Slate', primary: 'hsl(38,68%,68%)', secondary: 'hsl(220,44%,22%)' },
  { id: 'rose', label: 'Rose & Emerald', primary: 'hsl(350,58%,72%)', secondary: 'hsl(160,48%,20%)' },
  { id: 'peach', label: 'Peach & Indigo', primary: 'hsl(20,64%,70%)', secondary: 'hsl(240,50%,22%)' },
] as const

const VALID_IDS = new Set<string>(PALETTES.map(p => p.id))

function isValidPaletteId(value: unknown): value is PaletteId {
  return typeof value === 'string' && VALID_IDS.has(value)
}

export function usePalette() {
  const cookie = useCookie<string>('due-palette', {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    default: () => 'mint',
  })

  const current = computed<PaletteId>(() =>
    isValidPaletteId(cookie.value) ? cookie.value : 'mint',
  )

  function setPalette(id: PaletteId) {
    cookie.value = id

    if (import.meta.client) {
      const html = document.documentElement
      // Strip old palette class
      html.classList.forEach((cls) => {
        if (cls.startsWith('palette-')) html.classList.remove(cls)
      })
      // Add new palette class
      html.classList.add(`palette-${id}`)
    }
  }

  // Apply palette on client mount
  if (import.meta.client) {
    onMounted(() => {
      const html = document.documentElement
      // Only add if not already present (SSR plugin may have added it)
      if (!html.classList.contains(`palette-${current.value}`)) {
        html.classList.forEach((cls) => {
          if (cls.startsWith('palette-')) html.classList.remove(cls)
        })
        html.classList.add(`palette-${current.value}`)
      }
    })
  }

  return {
    palettes: PALETTES,
    current,
    setPalette,
  }
}
