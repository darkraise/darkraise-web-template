import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import type {
  AccentColor,
  SurfaceColor,
  SurfaceStyle,
  Mode,
  ResolvedMode,
  ThemeContextValue,
} from "./types"
import { generateTokens } from "./engine/generate-tokens"

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const LS_ACCENT = "theme-accent"
const LS_SURFACE = "theme-surface"
const LS_STYLE = "theme-style"
const LS_MODE = "mode"

function getSystemMode(): ResolvedMode {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function resolveMode(mode: Mode): ResolvedMode {
  return mode === "system" ? getSystemMode() : mode
}

function applyTokens(tokens: Record<string, string>) {
  const style = document.documentElement.style
  for (const [key, value] of Object.entries(tokens)) {
    style.setProperty(key, value)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const stored = localStorage.getItem(LS_ACCENT)
    return (stored as AccentColor) || "blue"
  })

  const [surfaceColor, setSurfaceColorState] = useState<SurfaceColor>(() => {
    const stored = localStorage.getItem(LS_SURFACE)
    return (stored as SurfaceColor) || "slate"
  })

  const [surfaceStyle, setSurfaceStyleState] = useState<SurfaceStyle>(() => {
    const stored = localStorage.getItem(LS_STYLE)
    return (stored as SurfaceStyle) || "default"
  })

  const [mode, setModeState] = useState<Mode>(() => {
    const stored = localStorage.getItem(LS_MODE)
    return (stored as Mode) || "system"
  })

  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(() =>
    resolveMode(mode),
  )

  const applyTheme = useCallback(
    (
      accent: AccentColor,
      surface: SurfaceColor,
      style: SurfaceStyle,
      resolved: ResolvedMode,
    ) => {
      document.documentElement.setAttribute("data-mode", resolved)
      const tokens = generateTokens({
        accentColor: accent,
        surfaceColor: surface,
        surfaceStyle: style,
        mode: resolved,
      })
      applyTokens(tokens)
    },
    [],
  )

  const setAccentColor = useCallback(
    (color: AccentColor) => {
      setAccentColorState(color)
      localStorage.setItem(LS_ACCENT, color)
      applyTheme(color, surfaceColor, surfaceStyle, resolvedMode)
    },
    [applyTheme, surfaceColor, surfaceStyle, resolvedMode],
  )

  const setSurfaceColor = useCallback(
    (color: SurfaceColor) => {
      setSurfaceColorState(color)
      localStorage.setItem(LS_SURFACE, color)
      applyTheme(accentColor, color, surfaceStyle, resolvedMode)
    },
    [applyTheme, accentColor, surfaceStyle, resolvedMode],
  )

  const setSurfaceStyle = useCallback(
    (style: SurfaceStyle) => {
      setSurfaceStyleState(style)
      localStorage.setItem(LS_STYLE, style)
      applyTheme(accentColor, surfaceColor, style, resolvedMode)
    },
    [applyTheme, accentColor, surfaceColor, resolvedMode],
  )

  const setMode = useCallback(
    (m: Mode) => {
      const resolved = resolveMode(m)
      setModeState(m)
      setResolvedMode(resolved)
      localStorage.setItem(LS_MODE, m)
      applyTheme(accentColor, surfaceColor, surfaceStyle, resolved)
    },
    [applyTheme, accentColor, surfaceColor, surfaceStyle],
  )

  useEffect(() => {
    applyTheme(accentColor, surfaceColor, surfaceStyle, resolvedMode)
  }, [applyTheme, accentColor, surfaceColor, surfaceStyle, resolvedMode])

  useEffect(() => {
    if (mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const resolved = getSystemMode()
      setResolvedMode(resolved)
      applyTheme(accentColor, surfaceColor, surfaceStyle, resolved)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [mode, accentColor, surfaceColor, surfaceStyle, applyTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      accentColor,
      surfaceColor,
      surfaceStyle,
      mode,
      resolvedMode,
      setAccentColor,
      setSurfaceColor,
      setSurfaceStyle,
      setMode,
    }),
    [
      accentColor,
      surfaceColor,
      surfaceStyle,
      mode,
      resolvedMode,
      setAccentColor,
      setSurfaceColor,
      setSurfaceStyle,
      setMode,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
