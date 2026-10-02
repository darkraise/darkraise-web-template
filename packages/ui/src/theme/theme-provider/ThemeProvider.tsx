import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  GlowLevel,
  Mode,
  ResolvedMode,
  ThemeContextValue,
  ThemePersistenceAdapter,
  ThemeSettings,
  ThemeSyncStatus,
} from "@theme/types"
import {
  generateTokens,
  resolveAccentScale,
  resolveNeutralScale,
} from "@theme/engine/generateTokens"
import {
  presets,
  PRESET_NAMES,
  type PresetName,
  type ThemePreset,
} from "@theme/presets"
import { ThemeContext } from "@theme/themeContext"
import { themeConfig, type ThemeConfig } from "@theme/themeConfig"
import { useDebouncedCallback } from "@hooks/useDebouncedCallback"
import {
  AXES,
  AXIS_KEYS,
  isAxisValue,
  type AxisKey,
  type AxisSetters,
  type AxisValue,
  type AxisValues,
} from "@theme/axes/registry"
import {
  completePresetAxisValues,
  presetAxisStorageKey,
  readPresetAxisValues,
  readStoredAxes,
  sanitizeSettings,
  type PresetAxisValues,
} from "@theme/axes/settings"
import {
  cacheInputKeys,
  tokenCacheId,
  writeTokenCache,
} from "@theme/axes/tokenCache"
import { migrateGlassPresetKeys } from "./migrateGlassPresetKeys"
import { migrateCanvasTintKey } from "./migrateCanvasTintKey"
import { migratePresetGlowAxes } from "./migratePresetGlowAxes"
import { neutraliseIfHidden } from "./neutralisedAxes"

declare const process: { env: { NODE_ENV?: string } }

const isBrowser = typeof window !== "undefined"

// localStorage access guarded for SSR (window undefined) and for runtime
// failures (private-browsing, quota exceeded, security errors). Reads return
// null when storage is unavailable so the consumer falls back to the
// configured default; writes silently no-op so the in-memory state still
// updates for the current session.
function storage(): Storage | null {
  if (!isBrowser) return null
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function readStorage(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    storage()?.setItem(key, value)
  } catch {
    // ignore
  }
}

function removeStorage(key: string): void {
  try {
    storage()?.removeItem(key)
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

function readCacheInputs(): Map<string, string> {
  const out = new Map<string, string>()
  for (const key of cacheInputKeys()) {
    const value = readStorage(key)
    if (value !== null) out.set(key, value)
  }
  return out
}

// One-time stored-key migrations. The pure, testable helpers live beside this
// file; run them once at module load, guarded for SSR (no window) and runtime
// storage failures (private-browsing / quota / security). Worst case on
// failure: the user gets default settings on first load.
if (isBrowser) {
  try {
    migrateGlassPresetKeys(globalThis.localStorage)
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

/**
 * The value each axis paints with: the user's own, else the active preset's
 * default for it, else the config's. An axis the user never set stays absent
 * from `stored`, which is what lets a preset default apply to it.
 */
function effectiveSettings(
  stored: Partial<AxisValues>,
  defaults: AxisValues,
): AxisValues {
  const preset = stored.preset ?? defaults.preset
  const presetDefaults = (presets[preset]?.commonAxisDefaults ?? {}) as Partial<
    Record<AxisKey, string>
  >
  const out = {} as Record<AxisKey, string>
  for (const key of AXIS_KEYS) {
    out[key] = stored[key] ?? presetDefaults[key] ?? defaults[key]
  }
  return out as AxisValues
}

/**
 * Stamps every attribute axis except mode, whose attribute holds the resolved
 * mode and is written by applyTheme.
 */
function applyAttributes(settings: AxisValues, defaults: AxisValues) {
  const root = document.documentElement
  const hidden = presets[settings.preset].hiddenCommonAxes
  for (const key of AXIS_KEYS) {
    const attribute = AXES[key].attribute
    if (!attribute || key === "mode") continue
    root.setAttribute(
      attribute,
      neutraliseIfHidden(key, settings[key], defaults[key], hidden),
    )
  }
}

const setterName = (key: AxisKey) =>
  `set${key.charAt(0).toUpperCase()}${key.slice(1)}`

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
  // An inline `config` prop is a new object on every parent render; keying the
  // defaults on their content stops each of those renders from repainting.
  const defaultsKey = JSON.stringify(cfg.defaults)
  const defaults = useMemo(
    () => JSON.parse(defaultsKey) as ThemeConfig["defaults"],
    [defaultsKey],
  )

  // One storage read at mount. knownRef then mirrors every write this provider
  // makes, and the token-cache id is built from it rather than read back, so a
  // write that failed silently cannot label new tokens with the old id.
  const [initial] = useState(() => {
    const known = readCacheInputs()
    const read = (key: string) => known.get(key) ?? null
    return {
      known,
      stored: readStoredAxes(read),
      presetAxisValues: readPresetAxisValues(read),
    }
  })
  const knownRef = useRef(new Map(initial.known))
  const [stored, setStoredState] = useState<Partial<AxisValues>>(initial.stored)
  const [presetAxisValues, setPresetAxisValuesState] =
    useState<PresetAxisValues>(initial.presetAxisValues)
  const settings = useMemo(
    () => effectiveSettings(stored, defaults),
    [stored, defaults],
  )
  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(() =>
    resolveMode(effectiveSettings(initial.stored, defaults).mode),
  )
  const [syncStatus, setSyncStatus] = useState<ThemeSyncStatus>("idle")

  // Setters can run several times inside one React batch; reading the latest
  // values from refs keeps each call from overwriting the one before it.
  const storedRef = useRef(stored)
  const presetAxisValuesRef = useRef(presetAxisValues)
  const resolvedRef = useRef(resolvedMode)

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const persistenceRef = useRef(persistence)
  useEffect(() => {
    persistenceRef.current = persistence
  })

  const hasUserChanged = useRef(false)

  const persist = useCallback((key: string, value: string | undefined) => {
    if (value === undefined) {
      knownRef.current.delete(key)
      removeStorage(key)
    } else {
      knownRef.current.set(key, value)
      writeStorage(key, value)
    }
  }, [])

  const applyTheme = useCallback(
    (
      current: AxisValues,
      resolved: ResolvedMode,
      axisValues: PresetAxisValues,
      cacheId: string,
    ) => {
      const presetName = current.preset as PresetName
      const activePreset = presets[presetName]
      const root = document.documentElement

      root.setAttribute("data-mode", resolved)
      root.setAttribute("data-preset", presetName)
      root.setAttribute("data-background-style", current.backgroundStyle)

      type AnyPreset = {
        axes: Record<string, unknown>
        ownedTokenKeys?: readonly string[]
      }
      const presetsAny = presets as Record<string, AnyPreset>

      for (const otherName of PRESET_NAMES) {
        if (otherName === presetName) continue
        for (const axisName of Object.keys(presetsAny[otherName]?.axes ?? {})) {
          root.removeAttribute(`data-${otherName}-${axisName}`)
        }
      }
      for (const axisName of Object.keys(activePreset.axes)) {
        root.setAttribute(
          `data-${presetName}-${axisName}`,
          axisValues[presetName]?.[axisName] ?? "",
        )
      }

      const commonTokens = generateTokens({
        accentColor: current.accentColor,
        surfaceColor: current.surfaceColor,
        preset: presetName,
        backgroundStyle: current.backgroundStyle,
        mode: resolved,
        contrast: current.contrast,
        darkAccentChroma: current.darkAccentChroma,
        tintWithAccent: current.tintWithAccent === "on",
        backgroundIntensity: current.backgroundIntensity,
      })

      let presetTokens: Record<string, string> = {}
      if (activePreset.generateTokens) {
        presetTokens = activePreset.generateTokens(
          {
            accentColor: current.accentColor,
            surfaceColor: current.surfaceColor,
            backgroundStyle: current.backgroundStyle,
            mode: resolved,
            accent: resolveAccentScale(
              current.accentColor,
              current.surfaceColor,
            ),
            surface: resolveNeutralScale(current.surfaceColor),
            neutral: resolveNeutralScale(current.surfaceColor),
            outerGlow: current.outerGlow as GlowLevel,
            innerGlow: current.innerGlow as GlowLevel,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (axisValues[presetName] ?? {}) as any,
        )
      }

      const otherOwnedKeys = PRESET_NAMES.filter(
        (n) => n !== presetName,
      ).flatMap((n) => presetsAny[n]?.ownedTokenKeys ?? [])
      const mergedTokens = { ...commonTokens, ...presetTokens }
      applyTokens(
        mergedTokens,
        otherOwnedKeys.filter((k) => !(k in mergedTokens)),
      )

      const store = storage()
      if (store) writeTokenCache(store, cacheId, mergedTokens)
    },
    [],
  )

  // commit paints synchronously so a setter's change lands in the same frame;
  // the effect then sees the same inputs and must not paint or cache again.
  const paintedRef = useRef("")
  const paint = useCallback(
    (
      current: AxisValues,
      resolved: ResolvedMode,
      axisValues: PresetAxisValues,
    ) => {
      const cacheId = tokenCacheId(
        (key) => knownRef.current.get(key) ?? null,
        resolved,
      )
      const signature = JSON.stringify([
        current,
        resolved,
        axisValues,
        defaults,
        cacheId,
      ])
      if (signature === paintedRef.current) return
      paintedRef.current = signature
      applyAttributes(current, defaults)
      applyTheme(current, resolved, axisValues, cacheId)
    },
    [applyTheme, defaults],
  )

  const commit = useCallback(
    (
      nextStored: Partial<AxisValues>,
      nextAxisValues: PresetAxisValues,
      resolved: ResolvedMode,
    ) => {
      storedRef.current = nextStored
      presetAxisValuesRef.current = nextAxisValues
      resolvedRef.current = resolved
      setStoredState(nextStored)
      setPresetAxisValuesState(nextAxisValues)
      setResolvedMode(resolved)
      paint(effectiveSettings(nextStored, defaults), resolved, nextAxisValues)
    },
    [paint, defaults],
  )

  const debouncedSave = useDebouncedCallback(
    (next: ThemeSettings) => {
      if (!persistenceRef.current) return
      setSyncStatus("saving")
      persistenceRef.current.save(next).then(
        () => setSyncStatus("idle"),
        () => setSyncStatus("error"),
      )
    },
    [persistence, persistenceDebounce],
    persistenceDebounce,
  )

  const announce = useCallback(() => {
    const next: ThemeSettings = {
      ...storedRef.current,
      presetAxisValues: presetAxisValuesRef.current,
    }
    onChangeRef.current?.(next)
    hasUserChanged.current = true
    debouncedSave(next)
  }, [debouncedSave])

  const setAxis = useCallback(
    <K extends AxisKey>(key: K, value: AxisValue<K>) => {
      if (!isAxisValue(key, value)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[ThemeProvider] "${String(value)}" is not a valid ${key} (expected one of: ${AXES[key].values.join(", ")}).`,
          )
        }
        return
      }
      persist(AXES[key].storageKey, value)
      const resolved =
        key === "mode" ? resolveMode(value as Mode) : resolvedRef.current
      commit(
        { ...storedRef.current, [key]: value },
        presetAxisValuesRef.current,
        resolved,
      )
      announce()
    },
    [commit, announce, persist],
  )

  const setPresetAxis = useCallback(
    (axisName: string, value: string) => {
      const presetName = effectiveSettings(storedRef.current, defaults)
        .preset as PresetName
      const axisDef = (
        presets[presetName].axes as Record<
          string,
          { values: readonly string[] }
        >
      )[axisName]
      if (!axisDef) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[ThemeProvider] setPresetAxis: axis "${axisName}" is not defined on the active preset "${presetName}".`,
          )
        }
        return
      }
      if (!axisDef.values.includes(value)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[ThemeProvider] setPresetAxis: value "${value}" is not valid for axis "${axisName}" on preset "${presetName}" (expected one of: ${axisDef.values.join(", ")}).`,
          )
        }
        return
      }
      const current = presetAxisValuesRef.current
      const next = {
        ...current,
        [presetName]: { ...current[presetName], [axisName]: value },
      }
      persist(presetAxisStorageKey(presetName, axisName), value)
      commit(storedRef.current, next, resolvedRef.current)
      announce()
    },
    [commit, announce, defaults, persist],
  )

  const applySettings = useCallback(
    (input: ThemeSettings) => {
      const { presetAxisValues: incoming, ...axes } = sanitizeSettings(input)
      const nextStored = axes as Partial<AxisValues>
      for (const key of AXIS_KEYS) {
        persist(AXES[key].storageKey, nextStored[key])
      }
      const nextAxisValues = incoming
        ? completePresetAxisValues({
            ...presetAxisValuesRef.current,
            ...incoming,
          })
        : presetAxisValuesRef.current
      for (const [presetName, values] of Object.entries(nextAxisValues)) {
        for (const [axisName, value] of Object.entries(values)) {
          persist(presetAxisStorageKey(presetName, axisName), value)
        }
      }
      const resolved = resolveMode(effectiveSettings(nextStored, defaults).mode)
      commit(nextStored, nextAxisValues, resolved)
    },
    [commit, defaults, persist],
  )

  // Fast Refresh and StrictMode re-run effects while keeping refs; without
  // this reset the new run would match the old signature and skip its paint.
  useEffect(
    () => () => {
      paintedRef.current = ""
    },
    [],
  )

  useEffect(() => {
    paint(settings, resolvedMode, presetAxisValues)
  }, [settings, resolvedMode, presetAxisValues, paint])

  useEffect(() => {
    if (settings.mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const resolved = getSystemMode()
      resolvedRef.current = resolved
      setResolvedMode(resolved)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [settings.mode])

  // Load theme from persistence adapter on mount
  useEffect(() => {
    if (!persistenceRef.current) return

    let cancelled = false
    setSyncStatus("loading")

    persistenceRef.current.load().then(
      (loaded) => {
        if (cancelled) return
        if (loaded && !hasUserChanged.current) {
          applySettings(loaded)
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

  const setters = useMemo(() => {
    const out: Record<string, (value: string) => void> = {}
    for (const key of AXIS_KEYS) {
      out[setterName(key)] = (value) => setAxis(key, value as never)
    }
    return out as unknown as AxisSetters
  }, [setAxis])

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...settings,
      resolvedMode,
      config: cfg,
      syncStatus,
      activePreset: presets[settings.preset] as ThemePreset,
      presetAxisValues,
      setAxis,
      setPresetAxis,
      ...setters,
    }),
    [
      settings,
      resolvedMode,
      cfg,
      syncStatus,
      presetAxisValues,
      setAxis,
      setPresetAxis,
      setters,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
