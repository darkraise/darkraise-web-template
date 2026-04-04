import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import type {
  AccentColor,
  BackgroundStyle,
  SurfaceStyle,
  Mode,
  ResolvedMode,
  ThemeContextValue,
} from "./types"
import { generateTokens } from "./engine/generate-tokens"

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const LS_ACCENT = "theme-accent"
const LS_STYLE = "theme-style"
const LS_BG_STYLE = "theme-bg-style"
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

  const [surfaceStyle, setSurfaceStyleState] = useState<SurfaceStyle>(() => {
    const stored = localStorage.getItem(LS_STYLE)
    return (stored as SurfaceStyle) || "default"
  })

  const [backgroundStyle, setBackgroundStyleState] = useState<BackgroundStyle>(
    () => {
      const stored = localStorage.getItem(LS_BG_STYLE)
      return (stored as BackgroundStyle) || "solid"
    },
  )

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
      style: SurfaceStyle,
      bgStyle: BackgroundStyle,
      resolved: ResolvedMode,
    ) => {
      document.documentElement.setAttribute("data-mode", resolved)
      const tokens = generateTokens({
        accentColor: accent,
        surfaceStyle: style,
        backgroundStyle: bgStyle,
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
      applyTheme(color, surfaceStyle, backgroundStyle, resolvedMode)
    },
    [applyTheme, surfaceStyle, backgroundStyle, resolvedMode],
  )

  const setSurfaceStyle = useCallback(
    (style: SurfaceStyle) => {
      setSurfaceStyleState(style)
      localStorage.setItem(LS_STYLE, style)
      applyTheme(accentColor, style, backgroundStyle, resolvedMode)
    },
    [applyTheme, accentColor, backgroundStyle, resolvedMode],
  )

  const setBackgroundStyle = useCallback(
    (bgStyle: BackgroundStyle) => {
      setBackgroundStyleState(bgStyle)
      localStorage.setItem(LS_BG_STYLE, bgStyle)
      applyTheme(accentColor, surfaceStyle, bgStyle, resolvedMode)
    },
    [applyTheme, accentColor, surfaceStyle, resolvedMode],
  )

  const setMode = useCallback(
    (m: Mode) => {
      const resolved = resolveMode(m)
      setModeState(m)
      setResolvedMode(resolved)
      localStorage.setItem(LS_MODE, m)
      applyTheme(accentColor, surfaceStyle, backgroundStyle, resolved)
    },
    [applyTheme, accentColor, surfaceStyle, backgroundStyle],
  )

  useEffect(() => {
    applyTheme(accentColor, surfaceStyle, backgroundStyle, resolvedMode)
  }, [applyTheme, accentColor, surfaceStyle, backgroundStyle, resolvedMode])

  useEffect(() => {
    if (mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const resolved = getSystemMode()
      setResolvedMode(resolved)
      applyTheme(accentColor, surfaceStyle, backgroundStyle, resolved)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [mode, accentColor, surfaceStyle, backgroundStyle, applyTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      accentColor,
      surfaceStyle,
      backgroundStyle,
      mode,
      resolvedMode,
      setAccentColor,
      setSurfaceStyle,
      setBackgroundStyle,
      setMode,
    }),
    [
      accentColor,
      surfaceStyle,
      backgroundStyle,
      mode,
      resolvedMode,
      setAccentColor,
      setSurfaceStyle,
      setBackgroundStyle,
      setMode,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
