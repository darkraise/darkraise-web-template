import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import type { Theme, Mode, ResolvedMode, ThemeContextValue } from "./types"

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemMode(): ResolvedMode {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function resolveMode(mode: Mode): ResolvedMode {
  return mode === "system" ? getSystemMode() : mode
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme")
    return (stored as Theme) || "default"
  })

  const [mode, setModeState] = useState<Mode>(() => {
    const stored = localStorage.getItem("mode")
    return (stored as Mode) || "system"
  })

  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(() =>
    resolveMode(mode),
  )

  const applyTheme = useCallback((t: Theme, m: ResolvedMode) => {
    document.documentElement.setAttribute("data-theme", t)
    document.documentElement.setAttribute("data-mode", m)
  }, [])

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t)
      localStorage.setItem("theme", t)
      applyTheme(t, resolvedMode)
    },
    [applyTheme, resolvedMode],
  )

  const setMode = useCallback(
    (m: Mode) => {
      const resolved = resolveMode(m)
      setModeState(m)
      setResolvedMode(resolved)
      localStorage.setItem("mode", m)
      applyTheme(theme, resolved)
    },
    [applyTheme, theme],
  )

  useEffect(() => {
    applyTheme(theme, resolvedMode)
  }, [applyTheme, theme, resolvedMode])

  useEffect(() => {
    if (mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const resolved = getSystemMode()
      setResolvedMode(resolved)
      applyTheme(theme, resolved)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [mode, theme, applyTheme])

  const value = useMemo(
    () => ({ theme, mode, resolvedMode, setTheme, setMode }),
    [theme, mode, resolvedMode, setTheme, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
