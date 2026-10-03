import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  Mode,
  ResolvedMode,
  ThemeContextValue,
  ThemePersistenceAdapter,
  ThemeSettings,
  ThemeSyncStatus,
} from "@theme/types"
import { SHELL_STYLES, type ShellStyle } from "@theme/types"
import { useLayoutStore } from "@layout/layoutStore"
import {
  generateTokens,
  resolveAccentScale,
  resolveNeutralScale,
} from "@theme/engine/generateTokens"
import { STYLES } from "@theme/styles"
import { GLASS_TOKEN_KEYS, glassTokens } from "@theme/styles/glass/glassTokens"
import { ThemeContext } from "@theme/themeContext"
import {
  resolveDefaults,
  themeConfig,
  type ThemeConfig,
} from "@theme/themeConfig"
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
  THEME_PAYLOAD_VERSION,
  readStoredAxes,
  sanitizeSettings,
} from "@theme/axes/settings"
import { tokenCacheId, writeTokenCache } from "@theme/axes/tokenCache"
import { migratePayload, migrateStorage } from "@theme/axes/legacy"

declare const process: { env: { NODE_ENV?: string } }

const isBrowser = typeof window !== "undefined"

const SAVE_TIMEOUT_MS = 15_000

// Resolves false on a rejection or once the timeout aborts the save, so the
// queue moves on either way.
function saveWithTimeout(
  adapter: ThemePersistenceAdapter,
  payload: ThemeSettings,
): Promise<boolean> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => {
      controller.abort()
      resolve(false)
    }, SAVE_TIMEOUT_MS)
  })
  const saved = Promise.resolve()
    .then(() => adapter.save(payload, { signal: controller.signal }))
    .then(
      () => true,
      () => false,
    )
  return Promise.race([saved, timedOut]).finally(() => clearTimeout(timer))
}

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

// Initial settings come from the migrated map, not from storage, so storage
// that reads but refuses writes still paints migrated values. Such a browser
// migrates again on every load, because its marker never lands.
function readMigratedInputs(): Map<string, string> {
  const store = storage()
  return store ? migrateStorage(store) : new Map()
}

// Migrates before anything else reads theme storage. When the pre-render
// script has already run, the marker is set and this finds nothing to do.
if (isBrowser) readMigratedInputs()

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
 * The value each axis paints with: the user's own, else the active style's
 * default for it, else the config's. An axis the user never set stays absent
 * from `stored`, which is what lets a style default apply to it.
 */
function effectiveSettings(
  stored: Partial<AxisValues>,
  defaults: AxisValues,
): AxisValues {
  const style = stored.style ?? defaults.style
  const styleDefaults: Partial<Record<AxisKey, string>> = STYLES[style].defaults
  const out = {} as Record<AxisKey, string>
  for (const key of AXIS_KEYS) {
    out[key] = stored[key] ?? styleDefaults[key] ?? defaults[key]
  }
  return out as AxisValues
}

/**
 * Stamps every attribute axis except mode, whose attribute holds the resolved
 * mode and is written by applyTheme.
 */
function applyAttributes(settings: AxisValues) {
  const root = document.documentElement
  for (const key of AXIS_KEYS) {
    const attribute = AXES[key].attribute
    if (!attribute || key === "mode") continue
    root.setAttribute(attribute, settings[key])
  }
}

const setterName = (key: AxisKey) =>
  `set${key.charAt(0).toUpperCase()}${key.slice(1)}`

/**
 * 6.x payloads carried shell style, which the layout store now owns. One
 * seeds a browser that has none, so a synced user keeps their shell style on
 * a new device; a style already chosen here wins.
 */
function seedShellStyle(value: unknown) {
  const layout = useLayoutStore.getState()
  if (
    layout.shellStyle === null &&
    (SHELL_STYLES as readonly unknown[]).includes(value)
  ) {
    layout.setShellStyle(value as ShellStyle)
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
  // An inline `config` prop is a new object on every parent render; keying the
  // defaults on its content stops each of those renders from repainting.
  const configKey = JSON.stringify(cfg)
  const defaults = useMemo(
    () => resolveDefaults(JSON.parse(configKey) as ThemeConfig),
    [configKey],
  )

  // One storage read at mount. knownRef then mirrors every write this provider
  // makes, and the token-cache id is built from it rather than read back, so a
  // write that failed silently cannot label new tokens with the old id.
  const [initial] = useState(() => {
    const known = readMigratedInputs()
    const read = (key: string) => known.get(key) ?? null
    return { known, stored: readStoredAxes(read) }
  })
  const knownRef = useRef(new Map(initial.known))
  const [stored, setStoredState] = useState<Partial<AxisValues>>(initial.stored)
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

  // Adapters may settle out of order, so one save runs at a time: otherwise
  // the load's upgrade save could land after the user's newer save. A save
  // asked for meanwhile replaces any waiting one, since every payload is the
  // full settings set.
  const saveRunning = useRef(false)
  const pendingSave = useRef<{
    adapter: ThemePersistenceAdapter
    payload: ThemeSettings
  } | null>(null)
  // True from an edit until its debounced save reaches queueSave, so a save
  // settling in between does not report the sync as finished.
  const saveScheduled = useRef(false)
  const queueSave = useCallback(
    (adapter: ThemePersistenceAdapter, payload: ThemeSettings) => {
      setSyncStatus("saving")
      pendingSave.current = { adapter, payload }
      if (saveRunning.current) return
      saveRunning.current = true
      void (async () => {
        let saved = true
        for (let next = pendingSave.current; next; next = pendingSave.current) {
          pendingSave.current = null
          saved = await saveWithTimeout(next.adapter, next.payload)
        }
        saveRunning.current = false
        if (!saveScheduled.current) setSyncStatus(saved ? "idle" : "error")
      })()
    },
    [],
  )

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
    (current: AxisValues, resolved: ResolvedMode, cacheId: string) => {
      document.documentElement.setAttribute("data-mode", resolved)

      const commonTokens = generateTokens({
        accentColor: current.accentColor,
        surfaceColor: current.surfaceColor,
        style: current.style,
        backgroundStyle: current.backgroundStyle,
        mode: resolved,
        contrast: current.contrast,
        darkAccentChroma: current.darkAccentChroma,
        tintWithAccent: current.tintWithAccent === "on",
        backgroundIntensity: current.backgroundIntensity,
      })

      const glass = current.style === "glass"
      const mergedTokens = glass
        ? {
            ...commonTokens,
            ...glassTokens({
              mode: resolved,
              accent: resolveAccentScale(
                current.accentColor,
                current.surfaceColor,
              ),
              surface: resolveNeutralScale(current.surfaceColor),
              backgroundStyle: current.backgroundStyle,
              outerGlow: current.outerGlow,
              glassOpacity: current.glassOpacity,
            }),
          }
        : commonTokens
      applyTokens(mergedTokens, glass ? [] : GLASS_TOKEN_KEYS)

      const store = storage()
      if (store) writeTokenCache(store, cacheId, mergedTokens)
    },
    [],
  )

  // commit paints synchronously so a setter's change lands in the same frame;
  // the effect then sees the same inputs and must not paint or cache again.
  const paintedRef = useRef("")
  const paint = useCallback(
    (current: AxisValues, resolved: ResolvedMode) => {
      const cacheId = tokenCacheId(
        (key) => knownRef.current.get(key) ?? null,
        resolved,
      )
      const signature = JSON.stringify([current, resolved, defaults, cacheId])
      if (signature === paintedRef.current) return
      paintedRef.current = signature
      applyAttributes(current)
      applyTheme(current, resolved, cacheId)
    },
    [applyTheme, defaults],
  )

  const commit = useCallback(
    (nextStored: Partial<AxisValues>, resolved: ResolvedMode) => {
      storedRef.current = nextStored
      resolvedRef.current = resolved
      setStoredState(nextStored)
      setResolvedMode(resolved)
      paint(effectiveSettings(nextStored, defaults), resolved)
    },
    [paint, defaults],
  )

  const debouncedSave = useDebouncedCallback(
    (next: ThemeSettings) => {
      saveScheduled.current = false
      if (!persistenceRef.current) {
        if (!saveRunning.current) setSyncStatus("idle")
        return
      }
      queueSave(persistenceRef.current, next)
    },
    [persistence, persistenceDebounce, queueSave],
    persistenceDebounce,
  )

  const announce = useCallback(() => {
    const next: ThemeSettings = {
      ...storedRef.current,
      version: THEME_PAYLOAD_VERSION,
    }
    onChangeRef.current?.(next)
    hasUserChanged.current = true
    if (persistenceRef.current) {
      saveScheduled.current = true
      setSyncStatus("saving")
    }
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
      commit({ ...storedRef.current, [key]: value }, resolved)
      announce()
    },
    [commit, announce, persist],
  )

  /**
   * Applies a loaded payload. An unversioned one is from a 6.x kit: it is
   * migrated, and the migrated settings are returned for one upgrade save.
   */
  const applySettings = useCallback(
    (input: ThemeSettings): ThemeSettings | null => {
      const versioned = typeof input.version === "number"
      const source: Record<string, unknown> = versioned
        ? input
        : migratePayload(input as Record<string, unknown>)
      const present = sanitizeSettings(source) as Partial<AxisValues>
      // A 6.x save never sent the glow axes, so an axis missing from an
      // unversioned payload says nothing about the user's choice.
      const nextStored = versioned
        ? present
        : { ...storedRef.current, ...present }
      const written = versioned
        ? AXIS_KEYS
        : (Object.keys(present) as AxisKey[])
      for (const key of written) {
        persist(AXES[key].storageKey, nextStored[key])
      }
      const resolved = resolveMode(effectiveSettings(nextStored, defaults).mode)
      commit(nextStored, resolved)
      if (versioned) return null
      seedShellStyle(source.shellStyle)
      return { ...nextStored, version: THEME_PAYLOAD_VERSION }
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
    paint(settings, resolvedMode)
  }, [settings, resolvedMode, paint])

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
        const upgrade =
          loaded && !hasUserChanged.current ? applySettings(loaded) : null
        const adapter = persistenceRef.current
        if (upgrade && adapter) {
          // Until the remote holds a versioned payload, every load migrates it
          // again, which would turn a solid canvas the user later chose under
          // glass back into a gradient.
          queueSave(adapter, upgrade)
          return
        }
        // After an edit the save path owns the status.
        if (!hasUserChanged.current) setSyncStatus("idle")
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
      setAxis,
      ...setters,
    }),
    [settings, resolvedMode, cfg, syncStatus, setAxis, setters],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
