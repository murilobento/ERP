import { createContext, useContext, useEffect, useState } from 'react'
import { type Palette, palettes, paletteLabels } from '@/config/palettes'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const PALETTE_COOKIE_NAME = 'palette'
const PALETTE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year
const PALETTE_ATTR = 'data-palette'

const DEFAULT_PALETTE: Palette = 'default'

function isPalette(value: string | undefined): value is Palette {
  return !!value && (palettes as readonly string[]).includes(value)
}

type PaletteContextType = {
  defaultPalette: Palette
  palette: Palette
  label: string
  setPalette: (palette: Palette) => void
  resetPalette: () => void
}

const PaletteContext = createContext<PaletteContextType | null>(null)

type PaletteProviderProps = {
  children: React.ReactNode
}

export function PaletteProvider({ children }: PaletteProviderProps) {
  const [palette, _setPalette] = useState<Palette>(() => {
    const saved = getCookie(PALETTE_COOKIE_NAME)
    return isPalette(saved) ? saved : DEFAULT_PALETTE
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (palette === DEFAULT_PALETTE) {
      root.removeAttribute(PALETTE_ATTR)
    } else {
      root.setAttribute(PALETTE_ATTR, palette)
    }
  }, [palette])

  const setPalette = (palette: Palette) => {
    setCookie(PALETTE_COOKIE_NAME, palette, PALETTE_COOKIE_MAX_AGE)
    _setPalette(palette)
  }

  const resetPalette = () => {
    removeCookie(PALETTE_COOKIE_NAME)
    _setPalette(DEFAULT_PALETTE)
  }

  const contextValue: PaletteContextType = {
    defaultPalette: DEFAULT_PALETTE,
    palette,
    label: paletteLabels[palette],
    setPalette,
    resetPalette,
  }

  return <PaletteContext value={contextValue}>{children}</PaletteContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePalette() {
  const context = useContext(PaletteContext)
  if (!context) {
    throw new Error('usePalette must be used within a PaletteProvider')
  }
  return context
}
