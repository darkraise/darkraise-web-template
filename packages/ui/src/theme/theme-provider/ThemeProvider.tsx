import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  AccentColor,
  BackgroundStyle,
  BackgroundIntensity,
  GradientPattern,
  SurfaceColor,
  Density,
  Elevation,
  Radius,
  Mode,
  ResolvedMode,
  ThemeContextValue,
  ThemePersistenceAdapter,
  ThemeSettings,
  ThemeSyncStatus,
} from "@theme/types"
import {
  SURFACE_COLORS,
  BACKGROUND_INTENSITIES,
  GRADIENT_PATTERNS,
  DENSITIES,
  ELEVATIONS,
  RADII,
} from "@theme/types"
import {
  generateTokens,
  resolveSurfaceScale,
} from "@theme/engine/generateTokens"
import {
  presets,
  PRESET_NAMES,
  type PresetName,
  type ThemePreset,
} from "@theme/presets"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { ThemeContext } from "@theme/themeContext"
import { themeConfig, type ThemeConfig } from "@theme/themeConfig"
import { useDebouncedCallback } from "@hooks/useDebouncedCallback"

declare const process: { env: { NODE_ENV?: string } }

const LS_ACCENT = "theme-accent"
const LS_SURFACE_COLOR = "theme-surface-color"
const LS_PRESET = "theme-preset"
const LS_PRESET_AXIS_PREFIX = (presetName: string, axisName: string) =>
  `theme-${presetName}-${axisName}`
const LS_BG_STYLE = "theme-bg-style"
const LS_BG_INTENSITY = "theme-bg-intensity"
const LS_GRADIENT_PATTERN = "theme-gradient-pattern"
const LS_MODE = "mode"
const LS_DENSITY = "theme-density"
const LS_ELEVATION = "theme-elevation"
const LS_BUTTON_ELEVATION = "theme-button-elevation"
const LS_RADIUS = "theme-radius"

const isBrowser = typeof window !== "undefined"

// localStorage access guarded for SSR (window undefined) and for runtime
// failures (private-browsing, quota exceeded, security errors). Reads return
// null when storage is unavailable so the consumer falls back to the
// configured default; writes silently no-op so the in-memory state still
// updates for the current session.
function readStorage(key: string): string | null {
  if (!isBrowser) return null
  try {
    return globalThis.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  if (!isBrowser) return
  try {
    globalThis.localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function getSystemMode(): ResolvedMode {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function resolveMode(mode: Mode): ResolvedMode {
  return mode === "system" ? getSystemMode() : mode
}

function applyTokens(
  tokens: Record<string, string>,
  keysToClear: readonly string[],
) {
  const style = document.documentElement.style
  for (const key of keysToClear) {
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

  const cfgDefaultPreset = cfg.defaults.preset

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const stored = readStorage(LS_ACCENT)
    return (stored as AccentColor) || cfg.defaults.accentColor
  })

  const [surfaceColor, setSurfaceColorState] = useState<SurfaceColor>(() => {
    const stored = readStorage(LS_SURFACE_COLOR)
    if (stored && (SURFACE_COLORS as readonly string[]).includes(stored)) {
      return stored as SurfaceColor
    }
    return cfg.defaults.surfaceColor
  })

  const [preset, setPresetState] = useState<PresetName>(() => {
    const stored = readStorage(LS_PRESET)
    if (stored && (PRESET_NAMES as readonly string[]).includes(stored)) {
      return stored as PresetName
    }
    return cfgDefaultPreset
  })

  const [presetAxisValues, setPresetAxisValuesState] = useState<
    Record<string, Record<string, string>>
  >(() => {
    const result: Record<string, Record<string, string>> = {}
    for (const [presetName, p] of Object.entries(presets)) {
      const axes: Record<string, string> = {}
      for (const [axisName, axisDef] of Object.entries(p.axes)) {
        const stored = readStorage(LS_PRESET_AXIS_PREFIX(presetName, axisName))
        const valid = (axisDef.values as readonly string[]).includes(
          stored ?? "",
        )
        axes[axisName] = valid ? (stored as string) : axisDef.default
      }
      result[presetName] = axes
    }
    return result
  })

  const [backgroundStyle, setBackgroundStyleState] = useState<BackgroundStyle>(
    () => {
      const stored = readStorage(LS_BG_STYLE)
      return (stored as BackgroundStyle) || cfg.defaults.backgroundStyle
    },
  )

  const [backgroundIntensity, setBackgroundIntensityState] =
    useState<BackgroundIntensity>(() => {
      const stored = readStorage(LS_BG_INTENSITY)
      if (
        stored &&
        (BACKGROUND_INTENSITIES as readonly string[]).includes(stored)
      ) {
        return stored as BackgroundIntensity
      }
      return cfg.defaults.backgroundIntensity
    })

  const [gradientPattern, setGradientPatternState] = useState<GradientPattern>(
    () => {
      const stored = readStorage(LS_GRADIENT_PATTERN)
      if (stored && (GRADIENT_PATTERNS as readonly string[]).includes(stored)) {
        return stored as GradientPattern
      }
      return cfg.defaults.gradientPattern
    },
  )

  const [mode, setModeState] = useState<Mode>(() => {
    const stored = readStorage(LS_MODE)
    return (stored as Mode) || cfg.defaults.mode
  })

  const [density, setDensityState] = useState<Density>(() => {
    const stored = readStorage(LS_DENSITY)
    if (stored && (DENSITIES as readonly string[]).includes(stored)) {
      return stored as Density
    }
    return cfg.defaults.density
  })

  const [elevation, setElevationState] = useState<Elevation>(() => {
    const stored = readStorage(LS_ELEVATION)
    if (stored && (ELEVATIONS as readonly string[]).includes(stored)) {
      return stored as Elevation
    }
    return cfg.defaults.elevation
  })

  const [buttonElevation, setButtonElevationState] = useState<Elevation>(() => {
    const stored = readStorage(LS_BUTTON_ELEVATION)
    if (stored && (ELEVATIONS as readonly string[]).includes(stored)) {
      return stored as Elevation
    }
    return cfg.defaults.buttonElevation
  })

  const [radius, setRadiusState] = useState<Radius>(() => {
    const stored = readStorage(LS_RADIUS)
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
      presetName: PresetName,
      bgStyle: BackgroundStyle,
      resolved: ResolvedMode,
      axisValues: Record<string, Record<string, string>>,
    ) => {
      const activePreset = presets[presetName]

      document.documentElement.setAttribute("data-mode", resolved)
      document.documentElement.setAttribute("data-preset", presetName)
      document.documentElement.setAttribute("data-background-style", bgStyle)

      type AnyPreset = {
        axes: Record<string, unknown>
        ownedTokenKeys?: readonly string[]
      }
      const presetsAny = presets as Record<string, AnyPreset>

      // Clear all preset-axis attributes that don't belong to the active preset.
      for (const otherName of PRESET_NAMES) {
        if (otherName === presetName) continue
        for (const axisName of Object.keys(presetsAny[otherName]?.axes ?? {})) {
          document.documentElement.removeAttribute(
            `data-${otherName}-${axisName}`,
          )
        }
      }
      // Write active preset's axis attributes.
      for (const axisName of Object.keys(activePreset.axes)) {
        document.documentElement.setAttribute(
          `data-${presetName}-${axisName}`,
          axisValues[presetName]?.[axisName] ?? "",
        )
      }

      // Common-axis tokens.
      const commonTokens = generateTokens({
        accentColor: accent,
        surfaceColor: surfColor,
        preset: presetName,
        backgroundStyle: bgStyle,
        mode: resolved,
      })

      // Preset-owned tokens (if the preset declares any cross-axis math).
      let presetTokens: Record<string, string> = {}
      if (activePreset.generateTokens) {
        const accentScale = accentColors[accent]
        const neutralScale =
          surfaceColors.slate as import("@theme/types").ColorScale
        const surfaceScale = resolveSurfaceScale(surfColor, resolved)
        presetTokens = activePreset.generateTokens(
          {
            accentColor: accent,
            surfaceColor: surfColor,
            backgroundStyle: bgStyle,
            mode: resolved,
            accent: accentScale,
            surface: surfaceScale,
            neutral: neutralScale,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (axisValues[presetName] ?? {}) as any,
        )
      }

      // Keys to clear: every ownedTokenKey from every OTHER preset.
      const otherOwnedKeys = PRESET_NAMES.filter(
        (n) => n !== presetName,
      ).flatMap((n) => presetsAny[n]?.ownedTokenKeys ?? [])
      const mergedTokens = { ...commonTokens, ...presetTokens }
      applyTokens(
        mergedTokens,
        otherOwnedKeys.filter((k) => !(k in mergedTokens)),
      )
    },
    [],
  )

  const buildSettings = useCallback(
    (overrides: Partial<ThemeSettings> = {}): ThemeSettings => ({
      accentColor,
      surfaceColor,
      preset,
      backgroundStyle,
      backgroundIntensity,
      gradientPattern,
      mode,
      density,
      elevation,
      buttonElevation,
      radius,
      presetAxisValues,
      ...overrides,
    }),
    [
      accentColor,
      surfaceColor,
      preset,
      backgroundStyle,
      backgroundIntensity,
      gradientPattern,
      mode,
      density,
      elevation,
      buttonElevation,
      radius,
      presetAxisValues,
    ],
  )

  const applySettings = useCallback(
    (settings: ThemeSettings) => {
      const resolved = resolveMode(settings.mode)
      const rawPreset = (settings.preset ?? cfgDefaultPreset) as string
      const newPreset = (
        (PRESET_NAMES as readonly string[]).includes(rawPreset)
          ? rawPreset
          : cfgDefaultPreset
      ) as PresetName
      const newAxisValues = settings.presetAxisValues ?? presetAxisValues

      const newBgIntensity =
        settings.backgroundIntensity ?? cfg.defaults.backgroundIntensity
      const newGradientPattern =
        settings.gradientPattern ?? cfg.defaults.gradientPattern

      setAccentColorState(settings.accentColor)
      setSurfaceColorState(settings.surfaceColor)
      setPresetState(newPreset)
      setBackgroundStyleState(settings.backgroundStyle)
      setBackgroundIntensityState(newBgIntensity)
      setGradientPatternState(newGradientPattern)
      setModeState(settings.mode)
      setResolvedMode(resolved)
      setDensityState(settings.density ?? cfg.defaults.density)
      setElevationState(settings.elevation ?? cfg.defaults.elevation)
      setButtonElevationState(
        settings.buttonElevation ?? cfg.defaults.buttonElevation,
      )
      setRadiusState(settings.radius ?? cfg.defaults.radius)
      setPresetAxisValuesState(newAxisValues)

      writeStorage(LS_ACCENT, settings.accentColor)
      writeStorage(LS_SURFACE_COLOR, settings.surfaceColor)
      writeStorage(LS_PRESET, newPreset)
      writeStorage(LS_BG_STYLE, settings.backgroundStyle)
      writeStorage(LS_BG_INTENSITY, newBgIntensity)
      writeStorage(LS_GRADIENT_PATTERN, newGradientPattern)
      writeStorage(LS_MODE, settings.mode)
      writeStorage(LS_DENSITY, settings.density ?? cfg.defaults.density)
      writeStorage(LS_ELEVATION, settings.elevation ?? cfg.defaults.elevation)
      writeStorage(
        LS_BUTTON_ELEVATION,
        settings.buttonElevation ?? cfg.defaults.buttonElevation,
      )
      writeStorage(LS_RADIUS, settings.radius ?? cfg.defaults.radius)
      for (const [presetName, axes] of Object.entries(newAxisValues)) {
        for (const [axisName, value] of Object.entries(axes)) {
          writeStorage(LS_PRESET_AXIS_PREFIX(presetName, axisName), value)
        }
      }

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
      document.documentElement.setAttribute(
        "data-background-intensity",
        newBgIntensity,
      )
      document.documentElement.setAttribute(
        "data-gradient-pattern",
        newGradientPattern,
      )

      applyTheme(
        settings.accentColor,
        settings.surfaceColor,
        newPreset,
        settings.backgroundStyle,
        resolved,
        newAxisValues,
      )
    },
    [applyTheme, cfg, cfgDefaultPreset, presetAxisValues],
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
    [persistence, persistenceDebounce],
    persistenceDebounce,
  )

  const setAccentColor = useCallback(
    (color: AccentColor) => {
      setAccentColorState(color)
      writeStorage(LS_ACCENT, color)
      applyTheme(
        color,
        surfaceColor,
        preset,
        backgroundStyle,
        resolvedMode,
        presetAxisValues,
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
      preset,
      backgroundStyle,
      resolvedMode,
      presetAxisValues,
    ],
  )

  const setSurfaceColor = useCallback(
    (color: SurfaceColor) => {
      setSurfaceColorState(color)
      writeStorage(LS_SURFACE_COLOR, color)
      applyTheme(
        accentColor,
        color,
        preset,
        backgroundStyle,
        resolvedMode,
        presetAxisValues,
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
      preset,
      backgroundStyle,
      resolvedMode,
      presetAxisValues,
    ],
  )

  const setPreset = useCallback(
    (p: PresetName) => {
      const target = presets[p]
      // supportedModes enforcement: if the target preset doesn't work
      // in the current resolved mode (e.g. Neon needs dark), force-
      // switch mode to the preset's first supported value. The mode
      // change is committed alongside the preset change so applyTheme
      // sees both at once and the user gets one paint, not two.
      let nextResolvedMode = resolvedMode
      let nextMode = mode
      if (
        target.supportedModes &&
        !target.supportedModes.includes(resolvedMode)
      ) {
        // Nullish coalescing for type-safety; supportedModes is a non-
        // empty tuple by convention but TS doesn't model that, and an
        // empty array would degenerate to "no enforcement" anyway.
        const forced = target.supportedModes[0] ?? "dark"
        nextResolvedMode = forced
        nextMode = forced
        setResolvedMode(forced)
        setModeState(forced)
        writeStorage(LS_MODE, forced)
        document.documentElement.setAttribute("data-mode", forced)
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[ThemeProvider] Preset "${p}" requires mode "${forced}"; auto-switched from "${resolvedMode}".`,
          )
        }
      }

      setPresetState(p)
      writeStorage(LS_PRESET, p)
      applyTheme(
        accentColor,
        surfaceColor,
        p,
        backgroundStyle,
        nextResolvedMode,
        presetAxisValues,
      )
      const settings = buildSettings({ preset: p, mode: nextMode })
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
      mode,
      presetAxisValues,
    ],
  )

  const setPresetAxis = useCallback(
    (axisName: string, value: string) => {
      const activePreset = presets[preset]
      const axisDef = (
        activePreset.axes as Record<string, { values: readonly string[] }>
      )[axisName]
      if (!axisDef) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[ThemeProvider] setPresetAxis: axis "${axisName}" is not defined on the active preset "${preset}".`,
          )
        }
        return
      }
      if (!axisDef.values.includes(value)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[ThemeProvider] setPresetAxis: value "${value}" is not valid for axis "${axisName}" on preset "${preset}" (expected one of: ${axisDef.values.join(", ")}).`,
          )
        }
        return
      }
      // Pure computation of the next state.
      const next = {
        ...presetAxisValues,
        [preset]: { ...presetAxisValues[preset], [axisName]: value },
      }

      // State update — no updater function, no side effects in it.
      setPresetAxisValuesState(next)

      // Side effects after.
      writeStorage(LS_PRESET_AXIS_PREFIX(preset, axisName), value)
      applyTheme(
        accentColor,
        surfaceColor,
        preset,
        backgroundStyle,
        resolvedMode,
        next,
      )
      const settings = buildSettings({ presetAxisValues: next })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [
      preset,
      presetAxisValues,
      accentColor,
      surfaceColor,
      backgroundStyle,
      resolvedMode,
      applyTheme,
      notifyChange,
      buildSettings,
      debouncedSave,
    ],
  )

  const setBackgroundStyle = useCallback(
    (bgStyle: BackgroundStyle) => {
      setBackgroundStyleState(bgStyle)
      writeStorage(LS_BG_STYLE, bgStyle)
      applyTheme(
        accentColor,
        surfaceColor,
        preset,
        bgStyle,
        resolvedMode,
        presetAxisValues,
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
      preset,
      resolvedMode,
      presetAxisValues,
    ],
  )

  const setBackgroundIntensity = useCallback(
    (intensity: BackgroundIntensity) => {
      setBackgroundIntensityState(intensity)
      writeStorage(LS_BG_INTENSITY, intensity)
      document.documentElement.setAttribute(
        "data-background-intensity",
        intensity,
      )
      const settings = buildSettings({ backgroundIntensity: intensity })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [buildSettings, notifyChange, debouncedSave],
  )

  const setGradientPattern = useCallback(
    (pattern: GradientPattern) => {
      setGradientPatternState(pattern)
      writeStorage(LS_GRADIENT_PATTERN, pattern)
      document.documentElement.setAttribute("data-gradient-pattern", pattern)
      const settings = buildSettings({ gradientPattern: pattern })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [buildSettings, notifyChange, debouncedSave],
  )

  const setMode = useCallback(
    (m: Mode) => {
      const resolved = resolveMode(m)
      // Inverse supportedModes enforcement: if the new mode isn't
      // supported by the current preset, fall back to the default
      // preset (which has no supportedModes constraint). Otherwise an
      // active Neon would silently break the moment a user picks light.
      const activePreset = presets[preset]
      let nextPreset = preset
      if (
        activePreset.supportedModes &&
        !activePreset.supportedModes.includes(resolved)
      ) {
        nextPreset = "default" as PresetName
        setPresetState(nextPreset)
        writeStorage(LS_PRESET, nextPreset)
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[ThemeProvider] Mode "${resolved}" isn't supported by preset "${preset}"; auto-reset to "default" preset.`,
          )
        }
      }

      setModeState(m)
      setResolvedMode(resolved)
      writeStorage(LS_MODE, m)
      applyTheme(
        accentColor,
        surfaceColor,
        nextPreset,
        backgroundStyle,
        resolved,
        presetAxisValues,
      )
      const settings = buildSettings({ mode: m, preset: nextPreset })
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
      preset,
      backgroundStyle,
      presetAxisValues,
    ],
  )

  const setDensity = useCallback(
    (d: Density) => {
      setDensityState(d)
      writeStorage(LS_DENSITY, d)
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
      writeStorage(LS_ELEVATION, e)
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
      writeStorage(LS_BUTTON_ELEVATION, e)
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
      writeStorage(LS_RADIUS, r)
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
      preset,
      backgroundStyle,
      resolvedMode,
      presetAxisValues,
    )
  }, [
    applyTheme,
    accentColor,
    surfaceColor,
    preset,
    backgroundStyle,
    resolvedMode,
    presetAxisValues,
  ])

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density)
    document.documentElement.setAttribute("data-elevation", elevation)
    document.documentElement.setAttribute(
      "data-button-elevation",
      buttonElevation,
    )
    document.documentElement.setAttribute("data-radius", radius)
    document.documentElement.setAttribute(
      "data-background-intensity",
      backgroundIntensity,
    )
    document.documentElement.setAttribute(
      "data-gradient-pattern",
      gradientPattern,
    )
  }, [
    density,
    elevation,
    buttonElevation,
    radius,
    backgroundIntensity,
    gradientPattern,
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
        preset,
        backgroundStyle,
        resolved,
        presetAxisValues,
      )
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [
    mode,
    accentColor,
    surfaceColor,
    preset,
    backgroundStyle,
    presetAxisValues,
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
      preset,
      backgroundStyle,
      backgroundIntensity,
      gradientPattern,
      mode,
      density,
      elevation,
      buttonElevation,
      radius,
      resolvedMode,
      config: cfg,
      syncStatus,
      activePreset: presets[preset] as ThemePreset,
      presetAxisValues,
      setAccentColor,
      setSurfaceColor,
      setPreset,
      setBackgroundStyle,
      setBackgroundIntensity,
      setGradientPattern,
      setMode,
      setDensity,
      setElevation,
      setButtonElevation,
      setRadius,
      setPresetAxis,
    }),
    [
      accentColor,
      surfaceColor,
      preset,
      backgroundStyle,
      backgroundIntensity,
      gradientPattern,
      mode,
      density,
      elevation,
      buttonElevation,
      radius,
      resolvedMode,
      cfg,
      syncStatus,
      presetAxisValues,
      setAccentColor,
      setSurfaceColor,
      setPreset,
      setBackgroundStyle,
      setBackgroundIntensity,
      setGradientPattern,
      setMode,
      setDensity,
      setElevation,
      setButtonElevation,
      setRadius,
      setPresetAxis,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
