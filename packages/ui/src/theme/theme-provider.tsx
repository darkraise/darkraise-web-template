import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  AccentColor,
  BackgroundStyle,
  SurfaceColor,
  SurfaceStyle,
  FontFamily,
  Mode,
  ResolvedMode,
  ThemeContextValue,
  ThemePersistenceAdapter,
  ThemeSettings,
  ThemeSyncStatus,
} from "./types"
import { SURFACE_COLORS, SURFACE_STYLES } from "./types"
import { generateTokens } from "./engine/generate-tokens"
import { loadFont, applyFontFamily } from "./engine/font-loader"
import { ThemeContext } from "./theme-context"
import { themeConfig, type ThemeConfig } from "./theme.config"
import { useDebouncedCallback } from "../hooks/use-debounced-callback"

const LS_ACCENT = "theme-accent"
const LS_SURFACE_COLOR = "theme-surface-color"
const LS_STYLE = "theme-style"
const LS_BG_STYLE = "theme-bg-style"
const LS_FONT = "theme-font"
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

interface ThemeProviderProps {
  children: React.ReactNode
  config?: ThemeConfig
  onChange?: (settings: ThemeSettings) => void
  persistence?: ThemePersistenceAdapter
  persistenceDebounce?: number
}

export function ThemeProvider({
  children,
  config,
  onChange,
  persistence,
  persistenceDebounce = 500,
}: ThemeProviderProps) {
  const cfg = config ?? themeConfig
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const stored = localStorage.getItem(LS_ACCENT)
    return (stored as AccentColor) || cfg.defaults.accentColor
  })

  const [surfaceColor, setSurfaceColorState] = useState<SurfaceColor>(() => {
    const stored = localStorage.getItem(LS_SURFACE_COLOR)
    if (stored && (SURFACE_COLORS as readonly string[]).includes(stored)) {
      return stored as SurfaceColor
    }
    return cfg.defaults.surfaceColor
  })

  const [surfaceStyle, setSurfaceStyleState] = useState<SurfaceStyle>(() => {
    const stored = localStorage.getItem(LS_STYLE)
    if (stored && (SURFACE_STYLES as readonly string[]).includes(stored)) {
      return stored as SurfaceStyle
    }
    return cfg.defaults.surfaceStyle
  })

  const [backgroundStyle, setBackgroundStyleState] = useState<BackgroundStyle>(
    () => {
      const stored = localStorage.getItem(LS_BG_STYLE)
      return (stored as BackgroundStyle) || cfg.defaults.backgroundStyle
    },
  )

  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
    const stored = localStorage.getItem(LS_FONT)
    return (stored as FontFamily) || cfg.defaults.fontFamily
  })

  const [mode, setModeState] = useState<Mode>(() => {
    const stored = localStorage.getItem(LS_MODE)
    return (stored as Mode) || cfg.defaults.mode
  })

  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(() =>
    resolveMode(mode),
  )

  const [syncStatus, setSyncStatus] = useState<ThemeSyncStatus>("idle")

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const persistenceRef = useRef(persistence)
  useEffect(() => {
    persistenceRef.current = persistence
  })

  const hasUserChanged = useRef(false)

  const notifyChange = useCallback((settings: ThemeSettings) => {
    onChangeRef.current?.(settings)
  }, [])

  const applyTheme = useCallback(
    (
      accent: AccentColor,
      surfColor: SurfaceColor,
      style: SurfaceStyle,
      bgStyle: BackgroundStyle,
      font: FontFamily,
      resolved: ResolvedMode,
    ) => {
      document.documentElement.setAttribute("data-mode", resolved)
      document.documentElement.setAttribute("data-surface-style", style)
      loadFont(font)
      applyFontFamily(font)
      const tokens = generateTokens({
        accentColor: accent,
        surfaceColor: surfColor,
        surfaceStyle: style,
        backgroundStyle: bgStyle,
        fontFamily: font,
        mode: resolved,
      })
      applyTokens(tokens)
    },
    [],
  )

  const applySettings = useCallback(
    (settings: ThemeSettings) => {
      const resolved = resolveMode(settings.mode)

      setAccentColorState(settings.accentColor)
      setSurfaceColorState(settings.surfaceColor)
      setSurfaceStyleState(settings.surfaceStyle)
      setBackgroundStyleState(settings.backgroundStyle)
      setFontFamilyState(settings.fontFamily)
      setModeState(settings.mode)
      setResolvedMode(resolved)

      localStorage.setItem(LS_ACCENT, settings.accentColor)
      localStorage.setItem(LS_SURFACE_COLOR, settings.surfaceColor)
      localStorage.setItem(LS_STYLE, settings.surfaceStyle)
      localStorage.setItem(LS_BG_STYLE, settings.backgroundStyle)
      localStorage.setItem(LS_FONT, settings.fontFamily)
      localStorage.setItem(LS_MODE, settings.mode)

      applyTheme(
        settings.accentColor,
        settings.surfaceColor,
        settings.surfaceStyle,
        settings.backgroundStyle,
        settings.fontFamily,
        resolved,
      )
    },
    [applyTheme],
  )

  const debouncedSave = useDebouncedCallback(
    (settings: ThemeSettings) => {
      if (!persistenceRef.current) return
      setSyncStatus("saving")
      persistenceRef.current.save(settings).then(
        () => setSyncStatus("idle"),
        () => setSyncStatus("error"),
      )
    },
    [persistence],
    persistenceDebounce,
  )

  const buildSettings = useCallback(
    (overrides: Partial<ThemeSettings> = {}): ThemeSettings => ({
      accentColor,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      fontFamily,
      mode,
      ...overrides,
    }),
    [
      accentColor,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      fontFamily,
      mode,
    ],
  )

  const setAccentColor = useCallback(
    (color: AccentColor) => {
      setAccentColorState(color)
      localStorage.setItem(LS_ACCENT, color)
      applyTheme(
        color,
        surfaceColor,
        surfaceStyle,
        backgroundStyle,
        fontFamily,
        resolvedMode,
      )
      const settings = buildSettings({ accentColor: color })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [
      applyTheme,
      notifyChange,
      buildSettings,
      debouncedSave,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      fontFamily,
      resolvedMode,
    ],
  )

  const setSurfaceColor = useCallback(
    (color: SurfaceColor) => {
      setSurfaceColorState(color)
      localStorage.setItem(LS_SURFACE_COLOR, color)
      applyTheme(
        accentColor,
        color,
        surfaceStyle,
        backgroundStyle,
        fontFamily,
        resolvedMode,
      )
      const settings = buildSettings({ surfaceColor: color })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [
      applyTheme,
      notifyChange,
      buildSettings,
      debouncedSave,
      accentColor,
      surfaceStyle,
      backgroundStyle,
      fontFamily,
      resolvedMode,
    ],
  )

  const setSurfaceStyle = useCallback(
    (style: SurfaceStyle) => {
      setSurfaceStyleState(style)
      localStorage.setItem(LS_STYLE, style)
      applyTheme(
        accentColor,
        surfaceColor,
        style,
        backgroundStyle,
        fontFamily,
        resolvedMode,
      )
      const settings = buildSettings({ surfaceStyle: style })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [
      applyTheme,
      notifyChange,
      buildSettings,
      debouncedSave,
      accentColor,
      surfaceColor,
      backgroundStyle,
      fontFamily,
      resolvedMode,
    ],
  )

  const setBackgroundStyle = useCallback(
    (bgStyle: BackgroundStyle) => {
      setBackgroundStyleState(bgStyle)
      localStorage.setItem(LS_BG_STYLE, bgStyle)
      applyTheme(
        accentColor,
        surfaceColor,
        surfaceStyle,
        bgStyle,
        fontFamily,
        resolvedMode,
      )
      const settings = buildSettings({ backgroundStyle: bgStyle })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [
      applyTheme,
      notifyChange,
      buildSettings,
      debouncedSave,
      accentColor,
      surfaceColor,
      surfaceStyle,
      fontFamily,
      resolvedMode,
    ],
  )

  const setFontFamily = useCallback(
    (font: FontFamily) => {
      setFontFamilyState(font)
      localStorage.setItem(LS_FONT, font)
      applyTheme(
        accentColor,
        surfaceColor,
        surfaceStyle,
        backgroundStyle,
        font,
        resolvedMode,
      )
      const settings = buildSettings({ fontFamily: font })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [
      applyTheme,
      notifyChange,
      buildSettings,
      debouncedSave,
      accentColor,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      resolvedMode,
    ],
  )

  const setMode = useCallback(
    (m: Mode) => {
      const resolved = resolveMode(m)
      setModeState(m)
      setResolvedMode(resolved)
      localStorage.setItem(LS_MODE, m)
      applyTheme(
        accentColor,
        surfaceColor,
        surfaceStyle,
        backgroundStyle,
        fontFamily,
        resolved,
      )
      const settings = buildSettings({ mode: m })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [
      applyTheme,
      notifyChange,
      buildSettings,
      debouncedSave,
      accentColor,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      fontFamily,
    ],
  )

  useEffect(() => {
    applyTheme(
      accentColor,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      fontFamily,
      resolvedMode,
    )
  }, [
    applyTheme,
    accentColor,
    surfaceColor,
    surfaceStyle,
    backgroundStyle,
    fontFamily,
    resolvedMode,
  ])

  useEffect(() => {
    if (mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const resolved = getSystemMode()
      setResolvedMode(resolved)
      applyTheme(
        accentColor,
        surfaceColor,
        surfaceStyle,
        backgroundStyle,
        fontFamily,
        resolved,
      )
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [
    mode,
    accentColor,
    surfaceColor,
    surfaceStyle,
    backgroundStyle,
    fontFamily,
    applyTheme,
  ])

  // Load theme from persistence adapter on mount
  useEffect(() => {
    if (!persistenceRef.current) return

    let cancelled = false
    setSyncStatus("loading")

    persistenceRef.current.load().then(
      (settings) => {
        if (cancelled) return
        if (settings && !hasUserChanged.current) {
          applySettings(settings)
        }
        setSyncStatus("idle")
      },
      () => {
        if (cancelled) return
        setSyncStatus("error")
      },
    )

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      accentColor,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      fontFamily,
      mode,
      resolvedMode,
      config: cfg,
      syncStatus,
      setAccentColor,
      setSurfaceColor,
      setSurfaceStyle,
      setBackgroundStyle,
      setFontFamily,
      setMode,
    }),
    [
      accentColor,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      fontFamily,
      mode,
      resolvedMode,
      cfg,
      syncStatus,
      setAccentColor,
      setSurfaceColor,
      setSurfaceStyle,
      setBackgroundStyle,
      setFontFamily,
      setMode,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
