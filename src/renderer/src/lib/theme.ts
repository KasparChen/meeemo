export type ThemeSetting = 'light' | 'dark' | 'system'
export type EffectiveTheme = 'light' | 'dark'

export const THEME_DEFAULTS: Record<EffectiveTheme, { panelColor: string; fontColor: string }> = {
  light: { panelColor: '#ffffff', fontColor: '#1a1a1a' },
  dark: { panelColor: '#1c1c1e', fontColor: '#f2f2f2' }
}

export function resolveTheme(setting: ThemeSetting): EffectiveTheme {
  if (setting === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return setting
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  }
}
