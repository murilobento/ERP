/**
 * Available color palettes (switchable via the "Paleta" section in ConfigDrawer).
 * The active palette is applied to <html> as `data-palette="<name>"`.
 * The matching CSS blocks live in `src/styles/theme.css`.
 *
 * 📝 How to Add a New Palette (Tailwind v4+):
 * 1. Add the palette id here (and a label).
 * 2. Add the `[data-palette='<id>']` and `[data-palette='<id>'].dark` blocks
 *    in `src/styles/theme.css` with the theme tokens.
 * 3. If the palette uses fonts that aren't loaded yet, add them to the
 *    Google Fonts `<link>` in `index.html`.
 */
export const palettes = [
  'default',
  'amethyst-haze',
  'candyland',
  'claude',
  'mocha',
  'modern-minimal',
  'nature',
  'pastel-dreams',
  'perpetuity',
  'retro-arcade',
  'solar-dust',
  'supabase',
  'clean-green',
  'gold-blue',
] as const

export type Palette = (typeof palettes)[number]

/**
 * Human-readable labels shown in the palette selector.
 * Kept separate from the id so the cookie stores a stable value.
 */
export const paletteLabels: Record<Palette, string> = {
  default: 'Padrão',
  'amethyst-haze': 'Amethyst Haze',
  candyland: 'Candyland',
  claude: 'Claude',
  mocha: 'Mocha',
  'modern-minimal': 'Modern Minimal',
  nature: 'Nature',
  'pastel-dreams': 'Pastel Dreams',
  perpetuity: 'Perpetuity',
  'retro-arcade': 'Retro Arcade',
  'solar-dust': 'Solar Dust',
  supabase: 'Supabase',
  'clean-green': 'Clean Green',
  'gold-blue': 'Gold Blue',
}
