import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  AccentColor,
  BackgroundStyle,
  BackgroundIntensity,
  GradientPattern,
  SurfaceColor,
  Density,
  Elevation,
  SurfaceIntensity,
  Radius,
  FontSize,
  AccentIntensity,
  GlowLevel,
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
  SURFACE_INTENSITIES,
  RADII,
  FONT_SIZES,
  ACCENT_INTENSITIES,
  GLOW_LEVELS,
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
import { migrateGlassPresetKeys } from "./migrateGlassPresetKeys"
import { migrateAccentIntensityKey } from "./migrateAccentIntensityKey"
import { migrateCanvasTintKey } from "./migrateCanvasTintKey"
import { migratePresetGlowAxes } from "./migratePresetGlowAxes"
import { neutraliseIfHidden } from "./neutralisedAxes"

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
const LS_SURFACE_INTENSITY = "theme-surface-intensity"
const LS_RADIUS = "theme-radius"
const LS_FONT_SIZE = "theme-font-size"
const LS_ACCENT_INTENSITY = "theme-accent-intensity"
const LS_OUTER_GLOW = "theme-outer-glow"
const LS_INNER_GLOW = "theme-inner-glow"

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

/** Clamp an already-resolved mode to the preset's `supportedModes`. */
function clampResolvedMode(
  presetName: PresetName,
  resolved: ResolvedMode,
): ResolvedMode {
  const supported = presets[presetName].supportedModes
  if (!supported || supported.includes(resolved)) return resolved
  // Non-empty by convention; TS models it as a plain array.
  return supported[0] ?? "dark"
}

/**
 * Clamp a stored/configured mode to the preset's `supportedModes`. `setPreset`
 * enforces this when the user switches presets, but the boot path reads the
 * mode independently of the preset — without this, a dark-only preset stored
 * or configured alongside `light` paints near-black recipes onto a light rail.
 *
 * `system` is deliberately left alone: it is not a conflicting choice, and
 * rewriting it to a concrete mode would silently discard the user's
 * follow-the-OS preference the moment they visited a dark-only preset. It is
 * clamped at resolve time by `clampResolvedMode` instead.
 */
function clampModeToPreset(presetName: PresetName, mode: Mode): Mode {
  if (mode === "system") return mode
  return clampResolvedMode(presetName, mode)
}

// One-time Glass-preset rename migration (glassmorphism → glass). The pure,
// testable helper lives in ./migrateGlassPresetKeys; run it once at module
// load, guarded for SSR (no window) and runtime storage failures (private-
// browsing / quota / security). Worst case on failure: the user gets default
// settings on first load.
if (isBrowser) {
  try {
    migrateGlassPresetKeys(globalThis.localStorage)
    migrateAccentIntensityKey(globalThis.localStorage)
    migrateCanvasTintKey(globalThis.localStorage)
    migratePresetGlowAxes(globalThis.localStorage)
  } catch {
    // ignore
  }
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

  // Stored as `null` when the user has never set the axis, so the active
  // preset's `commonAxisDefaults` can supply a value. A concrete value here
  // always wins, including when it equals the global default — that is a
  // deliberate choice the user made.
  const [outerGlowRaw, setOuterGlowState] = useState<GlowLevel | null>(() => {
    const stored = readStorage(LS_OUTER_GLOW)
    return stored && (GLOW_LEVELS as readonly string[]).includes(stored)
      ? (stored as GlowLevel)
      : null
  })
  const [innerGlowRaw, setInnerGlowState] = useState<GlowLevel | null>(() => {
    const stored = readStorage(LS_INNER_GLOW)
    return stored && (GLOW_LEVELS as readonly string[]).includes(stored)
      ? (stored as GlowLevel)
      : null
  })

  // A glow axis resolves to the user's value if they set one, else whatever the
  // active preset asks for, else the global default. This is what lets the axes
  // ship at `none` without stripping the glow from Glass and Sci-fi.
  const presetGlowDefaults = presets[preset].commonAxisDefaults
  const outerGlow: GlowLevel =
    outerGlowRaw ??
    (presetGlowDefaults?.outerGlow as GlowLevel | undefined) ??
    cfg.defaults.outerGlow
  const innerGlow: GlowLevel =
    innerGlowRaw ??
    (presetGlowDefaults?.innerGlow as GlowLevel | undefined) ??
    cfg.defaults.innerGlow

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
    return clampModeToPreset(preset, (stored as Mode) || cfg.defaults.mode)
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

  const [surfaceIntensity, setSurfaceIntensityState] =
    useState<SurfaceIntensity>(() => {
      const stored = readStorage(LS_SURFACE_INTENSITY)
      if (
        stored &&
        (SURFACE_INTENSITIES as readonly string[]).includes(stored)
      ) {
        return stored as SurfaceIntensity
      }
      return cfg.defaults.surfaceIntensity
    })

  const [radius, setRadiusState] = useState<Radius>(() => {
    const stored = readStorage(LS_RADIUS)
    if (stored && (RADII as readonly string[]).includes(stored)) {
      return stored as Radius
    }
    return cfg.defaults.radius
  })

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const stored = readStorage(LS_FONT_SIZE)
    if (stored && (FONT_SIZES as readonly string[]).includes(stored)) {
      return stored as FontSize
    }
    return cfg.defaults.fontSize
  })

  const [accentIntensity, setAccentIntensityState] = useState<AccentIntensity>(
    () => {
      const stored = readStorage(LS_ACCENT_INTENSITY)
      if (
        stored &&
        (ACCENT_INTENSITIES as readonly string[]).includes(stored)
      ) {
        return stored as AccentIntensity
      }
      return cfg.defaults.accentIntensity
    },
  )

  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(() =>
    clampResolvedMode(preset, resolveMode(mode)),
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
      vibrancy: AccentIntensity,
      bgIntensity: BackgroundIntensity,
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
        accentIntensity: neutraliseIfHidden(
          "accentIntensity",
          vibrancy,
          cfg.defaults.accentIntensity,
          activePreset.hiddenCommonAxes,
        ),
        backgroundIntensity: bgIntensity,
      })

      // Preset-owned tokens (if the preset declares any cross-axis math).
      let presetTokens: Record<string, string> = {}
      if (activePreset.generateTokens) {
        const accentScale = accentColors[accent]
        const neutralScale =
          surfaceColors.slate as import("@theme/types").ColorScale
        const surfaceScale = resolveSurfaceScale(surfColor, resolved)
        // Resolved here rather than threaded through applyTheme's positional
        // signature: the preset being painted is already an argument, and the
        // glow default depends on it.
        const glowDefaults = activePreset.commonAxisDefaults
        presetTokens = activePreset.generateTokens(
          {
            accentColor: accent,
            surfaceColor: surfColor,
            backgroundStyle: bgStyle,
            mode: resolved,
            accent: accentScale,
            surface: surfaceScale,
            neutral: neutralScale,
            outerGlow:
              outerGlowRaw ??
              (glowDefaults?.outerGlow as GlowLevel | undefined) ??
              cfg.defaults.outerGlow,
            innerGlow:
              innerGlowRaw ??
              (glowDefaults?.innerGlow as GlowLevel | undefined) ??
              cfg.defaults.innerGlow,
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
    [
      cfg.defaults.outerGlow,
      cfg.defaults.innerGlow,
      cfg.defaults.accentIntensity,
      outerGlowRaw,
      innerGlowRaw,
    ],
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
      surfaceIntensity,
      radius,
      fontSize,
      accentIntensity,
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
      surfaceIntensity,
      radius,
      fontSize,
      accentIntensity,
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
      setSurfaceIntensityState(
        settings.surfaceIntensity ?? cfg.defaults.surfaceIntensity,
      )
      setRadiusState(settings.radius ?? cfg.defaults.radius)
      setFontSizeState(settings.fontSize ?? cfg.defaults.fontSize)
      setAccentIntensityState(
        settings.accentIntensity ?? cfg.defaults.accentIntensity,
      )
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
      writeStorage(
        LS_SURFACE_INTENSITY,
        settings.surfaceIntensity ?? cfg.defaults.surfaceIntensity,
      )
      writeStorage(LS_RADIUS, settings.radius ?? cfg.defaults.radius)
      writeStorage(LS_FONT_SIZE, settings.fontSize ?? cfg.defaults.fontSize)
      writeStorage(
        LS_ACCENT_INTENSITY,
        settings.accentIntensity ?? cfg.defaults.accentIntensity,
      )
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
        "data-surface-intensity",
        settings.surfaceIntensity ?? cfg.defaults.surfaceIntensity,
      )
      document.documentElement.setAttribute(
        "data-radius",
        settings.radius ?? cfg.defaults.radius,
      )
      document.documentElement.setAttribute(
        "data-font-size",
        settings.fontSize ?? cfg.defaults.fontSize,
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
        settings.accentIntensity ?? cfg.defaults.accentIntensity,
        newBgIntensity,
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
        accentIntensity,
        backgroundIntensity,
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
      accentIntensity,
      backgroundIntensity,
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
        accentIntensity,
        backgroundIntensity,
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
      accentIntensity,
      backgroundIntensity,
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
        accentIntensity,
        backgroundIntensity,
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
      accentIntensity,
      backgroundIntensity,
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
        accentIntensity,
        backgroundIntensity,
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
      accentIntensity,
      backgroundIntensity,
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
        accentIntensity,
        backgroundIntensity,
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
      accentIntensity,
      backgroundIntensity,
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
      // The axis absorbed canvasTint, so it now drives a token-engine value
      // (the canvas saturation cap) as well as the CSS blob scale. Setting the
      // attribute alone would leave the page colour on the previous step.
      applyTheme(
        accentColor,
        surfaceColor,
        preset,
        backgroundStyle,
        resolvedMode,
        accentIntensity,
        intensity,
        presetAxisValues,
      )
      const settings = buildSettings({ backgroundIntensity: intensity })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [
      applyTheme,
      buildSettings,
      notifyChange,
      debouncedSave,
      accentColor,
      surfaceColor,
      preset,
      backgroundStyle,
      resolvedMode,
      accentIntensity,
      presetAxisValues,
    ],
  )

  const setOuterGlow = useCallback(
    (level: GlowLevel) => {
      setOuterGlowState(level)
      writeStorage(LS_OUTER_GLOW, level)
      document.documentElement.setAttribute("data-outer-glow", level)
      const settings = buildSettings({ outerGlow: level })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [buildSettings, notifyChange, debouncedSave],
  )

  const setInnerGlow = useCallback(
    (level: GlowLevel) => {
      setInnerGlowState(level)
      writeStorage(LS_INNER_GLOW, level)
      document.documentElement.setAttribute("data-inner-glow", level)
      const settings = buildSettings({ innerGlow: level })
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
        accentIntensity,
        backgroundIntensity,
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
      accentIntensity,
      backgroundIntensity,
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

  const setSurfaceIntensity = useCallback(
    (i: SurfaceIntensity) => {
      setSurfaceIntensityState(i)
      writeStorage(LS_SURFACE_INTENSITY, i)
      document.documentElement.setAttribute(
        "data-surface-intensity",
        neutraliseIfHidden(
          "surfaceIntensity",
          i,
          cfg.defaults.surfaceIntensity,
          presets[preset].hiddenCommonAxes,
        ),
      )
      const settings = buildSettings({ surfaceIntensity: i })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [
      buildSettings,
      notifyChange,
      debouncedSave,
      preset,
      cfg.defaults.surfaceIntensity,
    ],
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

  const setFontSize = useCallback(
    (size: FontSize) => {
      setFontSizeState(size)
      writeStorage(LS_FONT_SIZE, size)
      document.documentElement.setAttribute("data-font-size", size)
      const settings = buildSettings({ fontSize: size })
      notifyChange(settings)
      hasUserChanged.current = true
      debouncedSave(settings)
    },
    [buildSettings, notifyChange, debouncedSave],
  )

  const setAccentIntensity = useCallback(
    (vibrancy: AccentIntensity) => {
      setAccentIntensityState(vibrancy)
      writeStorage(LS_ACCENT_INTENSITY, vibrancy)
      const settings = buildSettings({ accentIntensity: vibrancy })
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
      accentIntensity,
      backgroundIntensity,
      presetAxisValues,
    )
  }, [
    applyTheme,
    accentColor,
    surfaceColor,
    preset,
    backgroundStyle,
    resolvedMode,
    accentIntensity,
    backgroundIntensity,
    presetAxisValues,
  ])

  // Mirror the boot-time mode clamp into storage. State was already clamped by
  // the `mode` initializer; without persisting it, the unsupported mode would
  // still be sitting in storage and would come back on the next reload.
  useEffect(() => {
    const requested = (readStorage(LS_MODE) as Mode) || cfg.defaults.mode
    const effective = clampModeToPreset(preset, requested)
    if (effective === requested) return
    writeStorage(LS_MODE, effective)
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[ThemeProvider] Preset "${preset}" requires mode "${effective}"; auto-switched from "${requested}".`,
      )
    }
  }, [preset, cfg.defaults.mode])

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density)
    document.documentElement.setAttribute("data-elevation", elevation)
    document.documentElement.setAttribute(
      "data-button-elevation",
      buttonElevation,
    )
    document.documentElement.setAttribute(
      "data-surface-intensity",
      neutraliseIfHidden(
        "surfaceIntensity",
        surfaceIntensity,
        cfg.defaults.surfaceIntensity,
        presets[preset].hiddenCommonAxes,
      ),
    )
    document.documentElement.setAttribute("data-radius", radius)
    document.documentElement.setAttribute("data-font-size", fontSize)
    document.documentElement.setAttribute(
      "data-background-intensity",
      backgroundIntensity,
    )
    document.documentElement.setAttribute("data-outer-glow", outerGlow)
    document.documentElement.setAttribute("data-inner-glow", innerGlow)
    document.documentElement.setAttribute(
      "data-gradient-pattern",
      gradientPattern,
    )
  }, [
    outerGlow,
    innerGlow,
    preset,
    cfg.defaults.surfaceIntensity,
    density,
    elevation,
    buttonElevation,
    surfaceIntensity,
    radius,
    fontSize,
    backgroundIntensity,
    gradientPattern,
  ])

  useEffect(() => {
    if (mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const resolved = clampResolvedMode(preset, getSystemMode())
      setResolvedMode(resolved)
      applyTheme(
        accentColor,
        surfaceColor,
        preset,
        backgroundStyle,
        resolved,
        accentIntensity,
        backgroundIntensity,
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
    accentIntensity,
    backgroundIntensity,
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
      surfaceIntensity,
      radius,
      fontSize,
      accentIntensity,
      outerGlow,
      innerGlow,
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
      setSurfaceIntensity,
      setRadius,
      setFontSize,
      setAccentIntensity,
      setOuterGlow,
      setInnerGlow,
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
      surfaceIntensity,
      radius,
      fontSize,
      accentIntensity,
      outerGlow,
      innerGlow,
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
      setSurfaceIntensity,
      setRadius,
      setFontSize,
      setAccentIntensity,
      setOuterGlow,
      setInnerGlow,
      setPresetAxis,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
