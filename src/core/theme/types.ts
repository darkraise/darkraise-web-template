export const THEMES = ["default", "emerald", "rose", "amber", "violet"] as const
export type Theme = (typeof THEMES)[number]

export const MODES = ["light", "dark", "system"] as const
export type Mode = (typeof MODES)[number]

export type ResolvedMode = "light" | "dark"

export interface ThemeContextValue {
  theme: Theme
  mode: Mode
  resolvedMode: ResolvedMode
  setTheme: (theme: Theme) => void
  setMode: (mode: Mode) => void
}
