import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  AccentColor,
  BackgroundStyle,
  SurfaceColor,
  SurfaceStyle,
  Density,
  Elevation,
  Radius,
  Mode,
  ResolvedMode,
  ThemeContextValue,
  ThemePersistenceAdapter,
  ThemeSettings,
  ThemeSyncStatus,
} from "../types"
import {
  SURFACE_COLORS,
  SURFACE_STYLES,
  DENSITIES,
  ELEVATIONS,
  RADII,
} from "../types"
import { generateTokens, GLASS_ONLY_TOKEN_KEYS } from "../engine/generateTokens"
import { ThemeContext } from "../themeContext"
import { themeConfig, type ThemeConfig } from "../themeConfig"
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback"

const LS_ACCENT = "theme-accent"
const LS_SURFACE_COLOR = "theme-surface-color"
const LS_STYLE = "theme-style"
const LS_BG_STYLE = "theme-bg-style"
const LS_MODE = "mode"
const LS_DENSITY = "theme-density"
const LS_ELEVATION = "theme-elevation"
const LS_BUTTON_ELEVATION = "theme-button-elevation"
const LS_RADIUS = "theme-radius"

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
  for (const key of GLASS_ONLY_TOKEN_KEYS) {
    if (!(key in tokens)) {
      style.removeProperty(key)
    }
  }
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

  const [mode, setModeState] = useState<Mode>(() => {
    const stored = localStorage.getItem(LS_MODE)
    return (stored as Mode) || cfg.defaults.mode
  })

  const [density, setDensityState] = useState<Density>(() => {
    const stored = localStorage.getItem(LS_DENSITY)
    if (stored && (DENSITIES as readonly string[]).includes(stored)) {
      return stored as Density
    }
    return cfg.defaults.density
  })

  const [elevation, setElevationState] = useState<Elevation>(() => {
    const stored = localStorage.getItem(LS_ELEVATION)
    if (stored && (ELEVATIONS as readonly string[]).includes(stored)) {
      return stored as Elevation
    }
    return cfg.defaults.elevation
  })

  const [buttonElevation, setButtonElevationState] = useState<Elevation>(() => {
    const stored = localStorage.getItem(LS_BUTTON_ELEVATION)
    if (stored && (ELEVATIONS as readonly string[]).includes(stored)) {
      return stored as Elevation
    }
    return cfg.defaults.buttonElevation
  })

  const [radius, setRadiusState] = useState<Radius>(() => {
    const stored = localStorage.getItem(LS_RADIUS)
    if (stored && (RADII as readonly string[]).includes(stored)) {
      return stored as Radius
    }
    return cfg.defaults.radius
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
      resolved: ResolvedMode,
    ) => {
      document.documentElement.setAttribute("data-mode", resolved)
      document.documentElement.setAttribute("data-surface-style", style)
      document.documentElement.setAttribute("data-background-style", bgStyle)
      const tokens = generateTokens({
        accentColor: accent,
        surfaceColor: surfColor,
        surfaceStyle: style,
        backgroundStyle: bgStyle,
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
      setModeState(settings.mode)
      setResolvedMode(resolved)
      setDensityState(settings.density ?? cfg.defaults.density)
      setElevationState(settings.elevation ?? cfg.defaults.elevation)
      setButtonElevationState(
        settings.buttonElevation ?? cfg.defaults.buttonElevation,
      )
      setRadiusState(settings.radius ?? cfg.defaults.radius)

      localStorage.setItem(LS_ACCENT, settings.accentColor)
      localStorage.setItem(LS_SURFACE_COLOR, settings.surfaceColor)
      localStorage.setItem(LS_STYLE, settings.surfaceStyle)
      localStorage.setItem(LS_BG_STYLE, settings.backgroundStyle)
      localStorage.setItem(LS_MODE, settings.mode)
      localStorage.setItem(LS_DENSITY, settings.density ?? cfg.defaults.density)
      localStorage.setItem(
        LS_ELEVATION,
        settings.elevation ?? cfg.defaults.elevation,
      )
      localStorage.setItem(
        LS_BUTTON_ELEVATION,
        settings.buttonElevation ?? cfg.defaults.buttonElevation,
      )
      localStorage.setItem(LS_RADIUS, settings.radius ?? cfg.defaults.radius)

      document.documentElement.setAttribute(
        "data-density",
        settings.density ?? cfg.defaults.density,
      )
      document.documentElement.setAttribute(
        "data-elevation",
        settings.elevation ?? cfg.defaults.elevation,
      )
      document.documentElement.setAttribute(
        "data-button-elevation",
        settings.buttonElevation ?? cfg.defaults.buttonElevation,
      )
      document.documentElement.setAttribute(
        "data-radius",
        settings.radius ?? cfg.defaults.radius,
      )

      applyTheme(
        settings.accentColor,
        settings.surfaceColor,
        settings.surfaceStyle,
        settings.backgroundStyle,
        resolved,
      )
    },
    [applyTheme, cfg],
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
      mode,
      density,
      elevation,
      buttonElevation,
      radius,
      ...overrides,
    }),
    [
      accentColor,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      mode,
      density,
      elevation,
      buttonElevation,
      radius,
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
      resolvedMode,
    ],
  )

  const setBackgroundStyle = useCallback(
    (bgStyle: BackgroundStyle) => {
      setBackgroundStyleState(bgStyle)
      localStorage.setItem(LS_BG_STYLE, bgStyle)
      applyTheme(accentColor, surfaceColor, surfaceStyle, bgStyle, resolvedMode)
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
    ],
  )

  const setDensity = useCallback(
    (d: Density) => {
      setDensityState(d)
      localStorage.setItem(LS_DENSITY, d)
      document.documentElement.setAttribute("data-density", d)
      const settings = buildSettings({ density: d })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [buildSettings, notifyChange, debouncedSave],
  )

  const setElevation = useCallback(
    (e: Elevation) => {
      setElevationState(e)
      localStorage.setItem(LS_ELEVATION, e)
      document.documentElement.setAttribute("data-elevation", e)
      const settings = buildSettings({ elevation: e })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [buildSettings, notifyChange, debouncedSave],
  )

  const setButtonElevation = useCallback(
    (e: Elevation) => {
      setButtonElevationState(e)
      localStorage.setItem(LS_BUTTON_ELEVATION, e)
      document.documentElement.setAttribute("data-button-elevation", e)
      const settings = buildSettings({ buttonElevation: e })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [buildSettings, notifyChange, debouncedSave],
  )

  const setRadius = useCallback(
    (r: Radius) => {
      setRadiusState(r)
      localStorage.setItem(LS_RADIUS, r)
      document.documentElement.setAttribute("data-radius", r)
      const settings = buildSettings({ radius: r })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [buildSettings, notifyChange, debouncedSave],
  )

  useEffect(() => {
    applyTheme(
      accentColor,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      resolvedMode,
    )
  }, [
    applyTheme,
    accentColor,
    surfaceColor,
    surfaceStyle,
    backgroundStyle,
    resolvedMode,
  ])

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density)
    document.documentElement.setAttribute("data-elevation", elevation)
    document.documentElement.setAttribute(
      "data-button-elevation",
      buttonElevation,
    )
    document.documentElement.setAttribute("data-radius", radius)
  }, [density, elevation, buttonElevation, radius])

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
      mode,
      density,
      elevation,
      buttonElevation,
      radius,
      resolvedMode,
      config: cfg,
      syncStatus,
      setAccentColor,
      setSurfaceColor,
      setSurfaceStyle,
      setBackgroundStyle,
      setMode,
      setDensity,
      setElevation,
      setButtonElevation,
      setRadius,
    }),
    [
      accentColor,
      surfaceColor,
      surfaceStyle,
      backgroundStyle,
      mode,
      density,
      elevation,
      buttonElevation,
      radius,
      resolvedMode,
      cfg,
      syncStatus,
      setAccentColor,
      setSurfaceColor,
      setSurfaceStyle,
      setBackgroundStyle,
      setMode,
      setDensity,
      setElevation,
      setButtonElevation,
      setRadius,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
