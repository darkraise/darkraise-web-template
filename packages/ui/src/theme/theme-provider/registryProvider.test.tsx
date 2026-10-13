import { act, render, renderHook } from "@testing-library/react"
import { StrictMode, memo, type ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider } from "./ThemeProvider"
import { useTheme } from "@theme/useTheme"
import {
  TOKEN_CACHE_STORAGE_KEY,
  cacheInputKeys,
  readTokenCache,
} from "@theme/axes/tokenCache"
import { buildPrerenderScript } from "@theme/axes/prerender"
import { compileThemeCss } from "@theme/config/compile"
import { resolveRegistry } from "@theme/config/registry"
import { LEGACY_MARKER_KEY, LEGACY_REVISION } from "@theme/axes/legacy"
import { PRESET_NAMES } from "@theme/styles/builtin/presets"
import { themeConfig, type ThemeConfig } from "@theme/themeConfig"
import { SHELL_STYLE_STORAGE_KEY, useLayoutStore } from "@layout/layoutStore"
import type { ThemePersistenceAdapter, ThemeSettings } from "@theme/types"

const root = document.documentElement

function mockColorScheme(dark = false) {
  const listeners = new Set<() => void>()
  let current = dark
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      get matches() {
        return current
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) =>
        listeners.delete(listener),
    })),
  )
  return {
    setDark(next: boolean) {
      current = next
      for (const listener of listeners) listener()
    },
  }
}

// The pre-render script is the token cache's real consumer, so it checks the
// cache id instead of a second call to the function that built it.
function runPrerender() {
  new Function(buildPrerenderScript())()
}

function cacheWrites(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.filter(([key]) => key === TOKEN_CACHE_STORAGE_KEY)
    .length
}

const wrap = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

beforeEach(() => {
  localStorage.clear()
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
  root.style.cssText = ""
  mockColorScheme()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("ThemeProvider on the axis registry", () => {
  it("writes nothing to storage until the user sets an axis", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(localStorage.getItem("theme-density")).toBeNull()
    expect(localStorage.getItem("theme-accent")).toBeNull()
  })

  it("persists only the axis the user set", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setDensity("spacious"))
    expect(localStorage.getItem("theme-density")).toBe("spacious")
    expect(localStorage.getItem("theme-radius")).toBeNull()
  })

  it("stamps data-accent and data-surface", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    expect(root.getAttribute("data-accent")).toBe("blue")
    expect(root.getAttribute("data-surface")).toBe("zinc")
    act(() => result.current.setAccentColor("violet"))
    expect(root.getAttribute("data-accent")).toBe("violet")
  })

  it("keeps every change when several setters run in one batch", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => {
      result.current.setDensity("compact")
      result.current.setRadius("pill")
      result.current.setAxis("fontSize", "large")
    })
    expect(result.current.density).toBe("compact")
    expect(result.current.radius).toBe("pill")
    expect(result.current.fontSize).toBe("large")
  })

  it("ignores an invalid value", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setAxis("density", "huge" as never))
    expect(result.current.density).toBe("cozy")
    expect(localStorage.getItem("theme-density")).toBeNull()
    warn.mockRestore()
  })

  it("caches the painted tokens where the pre-render script finds them", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setAccentColor("rose"))
    const painted = root.style.getPropertyValue("--primary")
    expect(painted).not.toBe("")
    expect(readTokenCache(localStorage)?.tokens["--primary"]).toBe(painted)
    root.style.cssText = ""
    runPrerender()
    expect(root.style.getPropertyValue("--primary")).toBe(painted)
  })

  it("sanitises a synced payload and drops the removed preset axis values", async () => {
    vi.useFakeTimers()
    const adapter: ThemePersistenceAdapter = {
      load: vi.fn(() =>
        Promise.resolve({
          accentColor: "rose",
          mode: "sepia",
          glassBlur: "high",
          presetAxisValues: { scifi: { glow: "high" } },
        } as never),
      ),
      save: vi.fn(() => Promise.resolve()),
    }
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ThemeProvider persistence={adapter} persistenceDebounce={50}>
          {children}
        </ThemeProvider>
      ),
    })
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(result.current.accentColor).toBe("rose")
    expect(result.current.mode).toBe("system")
    expect(localStorage.getItem("mode")).toBeNull()
    expect(result.current.glassBlur).toBe("high")
    expect(localStorage.getItem("theme-glass-blur")).toBe("high")
    act(() => result.current.setDensity("compact"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    const calls = (adapter.save as ReturnType<typeof vi.fn>).mock.calls
    const saved = calls[calls.length - 1]?.[0]
    expect(saved).toEqual({
      accentColor: "rose",
      glassBlur: "high",
      density: "compact",
      version: 7,
    })
  })

  it("repaints and re-caches when the system colour scheme changes", () => {
    const scheme = mockColorScheme(false)
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(root.getAttribute("data-mode")).toBe("light")
    const light = root.style.getPropertyValue("--background")
    act(() => scheme.setDark(true))
    expect(root.getAttribute("data-mode")).toBe("dark")
    const dark = root.style.getPropertyValue("--background")
    expect(dark).not.toBe(light)
    root.style.cssText = ""
    runPrerender()
    expect(root.style.getPropertyValue("--background")).toBe(dark)
  })

  it("paints and caches once per setter call", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    const setItem = vi.spyOn(Storage.prototype, "setItem")
    act(() => result.current.setAccentColor("rose"))
    expect(cacheWrites(setItem)).toBe(1)
  })

  it("does not repaint when an inline config re-renders unchanged", () => {
    const { rerender } = renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ThemeProvider
          config={{ ...themeConfig, defaults: { ...themeConfig.defaults } }}
        >
          {children}
        </ThemeProvider>
      ),
    })
    const setItem = vi.spyOn(Storage.prototype, "setItem")
    rerender()
    expect(cacheWrites(setItem)).toBe(0)
  })

  it("does not re-render consumers when an inline config re-renders unchanged", () => {
    const rendered = vi.fn()
    const Consumer = memo(function Consumer() {
      useTheme()
      rendered()
      return null
    })
    function Parent() {
      return (
        <ThemeProvider
          config={{ ...themeConfig, defaults: { ...themeConfig.defaults } }}
        >
          <Consumer />
        </ThemeProvider>
      )
    }
    const { rerender } = render(<Parent />)
    const mounted = rendered.mock.calls.length
    rerender(<Parent />)
    expect(rendered).toHaveBeenCalledTimes(mounted)
  })

  it("keeps every axis setter across setting changes and an equal inline config", () => {
    function InlineConfig({ children }: { children: ReactNode }) {
      return (
        <ThemeProvider
          config={{ ...themeConfig, defaults: { ...themeConfig.defaults } }}
        >
          {children}
        </ThemeProvider>
      )
    }
    const { result, rerender } = renderHook(() => useTheme(), {
      wrapper: InlineConfig,
    })
    const setterKeys = Object.keys(result.current).filter(
      (key) => /^set[A-Z]/.test(key) && key !== "setAxis",
    ) as Array<keyof typeof result.current>
    const before = setterKeys.map((key) => result.current[key])
    expect(setterKeys).toContain("setDensity")

    act(() => result.current.setDensity("compact"))
    rerender()

    expect(result.current.density).toBe("compact")
    setterKeys.forEach((key, i) => {
      expect(result.current[key], key).toBe(before[i])
    })
  })

  it("reads each stored key once at mount", () => {
    localStorage.setItem("mode", "dark")
    const inputs = new Set(cacheInputKeys())
    const getItem = vi.spyOn(Storage.prototype, "getItem")
    renderHook(() => useTheme(), { wrapper: wrap })
    const reads = getItem.mock.calls
      .map(([key]) => key)
      .filter((key) => inputs.has(key))
    expect(reads.length).toBeGreaterThan(0)
    expect(reads).toHaveLength(new Set(reads).size)
  })

  it("repaints when effects re-run on the same instance", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem")
    render(
      <StrictMode>
        <ThemeProvider>{null}</ThemeProvider>
      </StrictMode>,
    )
    expect(cacheWrites(setItem)).toBe(2)
  })

  it("does not label new tokens with the old id when a write fails", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    const setItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === "theme-accent") {
        throw new DOMException("full", "QuotaExceededError")
      }
      setItem.call(this, key, value)
    })
    act(() => result.current.setAccentColor("rose"))
    expect(localStorage.getItem("theme-accent")).toBeNull()
    expect(readTokenCache(localStorage)?.tokens["--primary"]).toBe(
      root.style.getPropertyValue("--primary"),
    )
    root.style.cssText = ""
    runPrerender()
    expect(root.style.getPropertyValue("--primary")).toBe("")
  })
})

describe("ThemeProvider legacy migration", () => {
  it("paints a 6.x store's migrated values and marks the browser", () => {
    localStorage.setItem("theme-surface-color", "red")
    localStorage.setItem("theme-surface-intensity", "bold")
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    expect(result.current.surfaceColor).toBe("zinc")
    expect(result.current.tintWithAccent).toBe("on")
    expect(result.current.contrast).toBe("high")
    expect(localStorage.getItem("theme-surface-intensity")).toBeNull()
    expect(localStorage.getItem(LEGACY_MARKER_KEY)).toBe(
      String(LEGACY_REVISION),
    )
  })

  it("paints migrated values from memory when storage refuses writes", () => {
    localStorage.setItem("theme-surface-color", "red")
    const refuse = () => {
      throw new DOMException("full", "QuotaExceededError")
    }
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(refuse)
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(refuse)
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    expect(result.current.surfaceColor).toBe("zinc")
    expect(root.getAttribute("data-surface")).toBe("zinc")
    expect(localStorage.getItem("theme-surface-color")).toBe("red")
    expect(localStorage.getItem(LEGACY_MARKER_KEY)).toBeNull()
  })
})

// A remote that keeps whatever was saved last, so a later load sees it.
function memoryAdapter(initial: Record<string, unknown> | null) {
  let remote = initial as ThemeSettings | null
  const adapter = {
    load: vi.fn(() => Promise.resolve(remote)),
    save: vi.fn<ThemePersistenceAdapter["save"]>((next) => {
      remote = next
      return Promise.resolve()
    }),
  }
  return { adapter, remote: () => remote }
}

function synced(
  adapter: ThemePersistenceAdapter,
  onChange?: (settings: ThemeSettings) => void,
) {
  return ({ children }: { children: ReactNode }) => (
    <ThemeProvider
      persistence={adapter}
      persistenceDebounce={50}
      onChange={onChange}
    >
      {children}
    </ThemeProvider>
  )
}

async function settle() {
  await act(async () => {
    await vi.runAllTimersAsync()
  })
}

describe("ThemeProvider synced payloads", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useLayoutStore.setState({ shellStyle: null })
  })

  it("migrates an unversioned payload and keeps the axes it lacks", async () => {
    localStorage.setItem("theme-outer-glow", "vivid")
    localStorage.setItem("theme-inner-glow", "subtle")
    localStorage.setItem("theme-density", "spacious")
    const { adapter } = memoryAdapter({
      accentColor: "rose",
      surfaceColor: "red",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      elevation: "low",
      surfaceIntensity: "bold",
      accentIntensity: "intense",
      controlDepth: "deep",
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()
    expect(result.current.accentColor).toBe("rose")
    expect(result.current.surfaceColor).toBe("zinc")
    expect(result.current.tintWithAccent).toBe("on")
    expect(result.current.elevation).toBe("standard")
    expect(result.current.contrast).toBe("high")
    expect(result.current.darkAccentChroma).toBe("vivid")
    expect(result.current.outerGlow).toBe("vivid")
    expect(result.current.innerGlow).toBe("subtle")
    expect(result.current.density).toBe("spacious")
    expect(localStorage.getItem("theme-outer-glow")).toBe("vivid")
    expect(localStorage.getItem("theme-inner-glow")).toBe("subtle")
    expect(localStorage.getItem("theme-density")).toBe("spacious")
    expect(localStorage.getItem("theme-contrast")).toBe("high")
  })

  it("saves an unversioned payload back once, migrated and versioned", async () => {
    const { adapter } = memoryAdapter({
      accentColor: "rose",
      preset: "default",
      surfaceIntensity: "bold",
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()
    expect(adapter.save).toHaveBeenCalledOnce()
    const saved = adapter.save.mock.calls[0]?.[0]
    expect(saved).toEqual(
      expect.objectContaining({
        accentColor: "rose",
        contrast: "high",
        version: 7,
      }),
    )
    expect(saved).not.toHaveProperty("surfaceIntensity")
    expect(result.current.syncStatus).toBe("idle")
  })

  it("applies a 6.x glass payload's style and lifted glass axes", async () => {
    const { adapter } = memoryAdapter({
      accentColor: "rose",
      preset: "glass",
      backgroundStyle: "gradient",
      presetAxisValues: { glass: { opacity: "strong", blur: "medium" } },
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()
    expect(result.current.style).toBe("glass")
    expect(result.current.glassTransparency).toBe("high")
    expect(result.current.glassBlur).toBe("medium")
    expect(localStorage.getItem("theme-style")).toBe("glass")
    expect(localStorage.getItem("theme-glass-opacity")).toBe("high")
    expect(localStorage.getItem("theme-glass-blur")).toBeNull()
    expect(root.getAttribute("data-style")).toBe("glass")
    expect(root.getAttribute("data-glass-transparency")).toBe("high")
    const saved = adapter.save.mock.calls[0]?.[0]
    expect(saved).toEqual(
      expect.objectContaining({
        style: "glass",
        glassTransparency: "high",
        version: 7,
      }),
    )
    expect(saved).not.toHaveProperty("preset")
    expect(saved).not.toHaveProperty("presetAxisValues")
    expect(saved).not.toHaveProperty("glassBlur")
  })

  it("keeps a solid canvas chosen under glass on the next load", async () => {
    const remote = memoryAdapter({
      accentColor: "rose",
      preset: "glass",
      backgroundStyle: "solid",
    })
    const first = renderHook(() => useTheme(), {
      wrapper: synced(remote.adapter),
    })
    await settle()
    expect(first.result.current.style).toBe("glass")
    expect(first.result.current.backgroundStyle).toBe("gradient")
    expect(remote.remote()).toEqual(
      expect.objectContaining({
        style: "glass",
        backgroundStyle: "gradient",
        version: 7,
      }),
    )
    expect(remote.remote()).not.toHaveProperty("preset")

    act(() => first.result.current.setBackgroundStyle("solid"))
    await settle()
    first.unmount()
    expect(remote.remote()).toEqual(
      expect.objectContaining({
        style: "glass",
        backgroundStyle: "solid",
        version: 7,
      }),
    )

    // The remote now holds a versioned payload, so no load migrates it again.
    for (const fresh of [false, true]) {
      if (fresh) localStorage.clear()
      const next = renderHook(() => useTheme(), {
        wrapper: synced(remote.adapter),
      })
      await settle()
      expect(next.result.current.style).toBe("glass")
      expect(next.result.current.backgroundStyle).toBe("solid")
      next.unmount()
    }
  })

  it("moves a 6.x default payload to the quiet style", async () => {
    const { adapter } = memoryAdapter({
      accentColor: "rose",
      preset: "default",
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()
    expect(result.current.style).toBe("quiet")
    expect(localStorage.getItem("theme-style")).toBe("quiet")
    expect(adapter.save.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ style: "quiet", version: 7 }),
    )
  })

  it("keeps the local style when a synced payload names a retired preset", async () => {
    localStorage.setItem("theme-style", "glass")
    const { adapter } = memoryAdapter({
      accentColor: "rose",
      preset: "scifi",
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()
    expect(result.current.style).toBe("glass")
    expect(result.current.accentColor).toBe("rose")
    expect(localStorage.getItem("theme-style")).toBe("glass")
    expect(root.getAttribute("data-style")).toBe("glass")
    expect(adapter.save.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ style: "glass", version: 7 }),
    )
  })

  it("sends a user save only after the upgrade save settles", async () => {
    const resolvers: Array<() => void> = []
    const adapter = {
      load: vi.fn(() =>
        Promise.resolve({
          accentColor: "rose",
          preset: "glass",
          backgroundStyle: "solid",
        } as ThemeSettings),
      ),
      save: vi.fn<(next: ThemeSettings) => Promise<void>>(
        () => new Promise((resolve) => resolvers.push(resolve)),
      ),
    }
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(adapter.save.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ backgroundStyle: "gradient", version: 7 }),
    )

    act(() => result.current.setBackgroundStyle("solid"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(result.current.syncStatus).toBe("saving")

    await act(async () => {
      resolvers[0]?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(adapter.save).toHaveBeenCalledTimes(2)
    expect(adapter.save.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ backgroundStyle: "solid", version: 7 }),
    )
    expect(result.current.syncStatus).toBe("saving")

    await act(async () => {
      resolvers[1]?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.syncStatus).toBe("idle")
  })

  it("reports an upgrade save that fails", async () => {
    const { adapter } = memoryAdapter({ accentColor: "rose" })
    adapter.save.mockImplementation(() => Promise.reject(new Error("offline")))
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(result.current.syncStatus).toBe("error")
    expect(result.current.accentColor).toBe("rose")
  })

  it("unsets the axes a versioned payload lacks and saves nothing", async () => {
    localStorage.setItem("theme-density", "spacious")
    const { adapter } = memoryAdapter({ version: 7, accentColor: "rose" })
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()
    expect(result.current.accentColor).toBe("rose")
    expect(result.current.density).toBe("cozy")
    expect(localStorage.getItem("theme-density")).toBeNull()
    expect(adapter.save).not.toHaveBeenCalled()
  })

  it("stamps the payload version on onChange and save", async () => {
    const onChange = vi.fn()
    const { adapter } = memoryAdapter(null)
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter, onChange),
    })
    await settle()
    act(() => result.current.setDensity("compact"))
    await settle()
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ density: "compact", version: 7 }),
    )
    expect(adapter.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ density: "compact", version: 7 }),
      expect.anything(),
    )
  })

  it("seeds an empty shell style from an unversioned payload", async () => {
    const { adapter } = memoryAdapter({
      accentColor: "rose",
      shellStyle: "island",
    })
    renderHook(() => useTheme(), { wrapper: synced(adapter) })
    await settle()
    expect(useLayoutStore.getState().shellStyle).toBe("island")
    expect(localStorage.getItem(SHELL_STYLE_STORAGE_KEY)).toBe("island")
  })

  it("leaves a stored shell style alone", async () => {
    useLayoutStore.getState().setShellStyle("framed")
    const { adapter } = memoryAdapter({
      accentColor: "rose",
      shellStyle: "island",
    })
    renderHook(() => useTheme(), { wrapper: synced(adapter) })
    await settle()
    expect(useLayoutStore.getState().shellStyle).toBe("framed")
    expect(localStorage.getItem(SHELL_STYLE_STORAGE_KEY)).toBe("framed")
  })

  it.each<[string, Record<string, unknown>]>([
    ["a versioned payload", { version: 7, shellStyle: "island" }],
    ["an unknown style", { accentColor: "rose", shellStyle: "bogus" }],
  ])("ignores shell style in %s", async (_, payload) => {
    const { adapter } = memoryAdapter(payload)
    renderHook(() => useTheme(), { wrapper: synced(adapter) })
    await settle()
    expect(useLayoutStore.getState().shellStyle).toBeNull()
    expect(localStorage.getItem(SHELL_STYLE_STORAGE_KEY)).toBeNull()
  })

  it("moves past a save that never settles and aborts it", async () => {
    const { adapter } = memoryAdapter(null)
    adapter.save.mockImplementationOnce(() => new Promise<void>(() => {}))
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()

    act(() => result.current.setDensity("compact"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).toHaveBeenCalledOnce()

    act(() => result.current.setDensity("spacious"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(result.current.syncStatus).toBe("saving")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(adapter.save.mock.calls[0]?.[1]?.signal.aborted).toBe(true)
    expect(adapter.save).toHaveBeenCalledTimes(2)
    expect(adapter.save.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ density: "spacious" }),
    )
    expect(result.current.syncStatus).toBe("idle")
  })

  it("sends only the newest of the saves waiting behind one in flight", async () => {
    const resolvers: Array<() => void> = []
    const { adapter } = memoryAdapter(null)
    adapter.save.mockImplementation(
      () => new Promise<void>((resolve) => resolvers.push(resolve)),
    )
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()

    for (const accent of ["red", "green", "violet", "pink"] as const) {
      act(() => result.current.setAccentColor(accent))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60)
      })
    }
    expect(adapter.save).toHaveBeenCalledOnce()

    await act(async () => {
      resolvers[0]?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(adapter.save).toHaveBeenCalledTimes(2)
    expect(adapter.save.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ accentColor: "pink" }),
    )
    expect(result.current.syncStatus).toBe("saving")

    await act(async () => {
      resolvers[1]?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(adapter.save).toHaveBeenCalledTimes(2)
    expect(result.current.syncStatus).toBe("idle")
  })

  it("reports a save that times out with nothing waiting", async () => {
    const { adapter } = memoryAdapter(null)
    adapter.save.mockImplementation(() => new Promise<void>(() => {}))
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()

    act(() => result.current.setDensity("compact"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(result.current.syncStatus).toBe("saving")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(adapter.save.mock.calls[0]?.[1]?.signal.aborted).toBe(true)
    expect(result.current.syncStatus).toBe("error")
  })

  it("treats a save that throws synchronously as failed and keeps saving", async () => {
    const { adapter } = memoryAdapter(null)
    adapter.save.mockImplementationOnce(() => {
      throw new Error("sync failure")
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()

    act(() => result.current.setDensity("compact"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(result.current.syncStatus).toBe("error")

    act(() => result.current.setDensity("spacious"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).toHaveBeenCalledTimes(2)
    expect(adapter.save.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ density: "spacious" }),
    )
    expect(result.current.syncStatus).toBe("idle")
  })

  it("clears the timeout of a save that settles in time", async () => {
    const { adapter } = memoryAdapter(null)
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()

    act(() => result.current.setDensity("compact"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(result.current.syncStatus).toBe("idle")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(adapter.save.mock.calls[0]?.[1]?.signal.aborted).toBe(false)
    expect(result.current.syncStatus).toBe("idle")
  })

  it("keeps saving while an edit made during the load waits to save", async () => {
    let finishLoad: (loaded: ThemeSettings | null) => void = () => {}
    const { adapter } = memoryAdapter(null)
    adapter.load.mockImplementation(
      () =>
        new Promise<ThemeSettings | null>((resolve) => {
          finishLoad = resolve
        }),
    )
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    expect(result.current.syncStatus).toBe("loading")

    act(() => result.current.setDensity("compact"))
    expect(result.current.syncStatus).toBe("saving")

    await act(async () => {
      finishLoad(null)
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(adapter.save).not.toHaveBeenCalled()
    expect(result.current.syncStatus).toBe("saving")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(result.current.syncStatus).toBe("idle")
  })

  it("keeps saving when a save settles while the next edit waits to save", async () => {
    const resolvers: Array<() => void> = []
    const { adapter } = memoryAdapter(null)
    adapter.save.mockImplementation(
      () => new Promise<void>((resolve) => resolvers.push(resolve)),
    )
    const { result } = renderHook(() => useTheme(), {
      wrapper: synced(adapter),
    })
    await settle()

    act(() => result.current.setDensity("compact"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).toHaveBeenCalledOnce()

    act(() => result.current.setDensity("spacious"))
    await act(async () => {
      resolvers[0]?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(result.current.syncStatus).toBe("saving")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).toHaveBeenCalledTimes(2)
    expect(result.current.syncStatus).toBe("saving")

    await act(async () => {
      resolvers[1]?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.syncStatus).toBe("idle")
  })

  it("returns to idle when the adapter is removed while an edit waits to save", async () => {
    const { adapter } = memoryAdapter(null)
    let persistence: ThemePersistenceAdapter | undefined = adapter
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider persistence={persistence} persistenceDebounce={50}>
        {children}
      </ThemeProvider>
    )
    const { result, rerender } = renderHook(() => useTheme(), { wrapper })
    await settle()

    act(() => result.current.setDensity("compact"))
    expect(result.current.syncStatus).toBe("saving")

    persistence = undefined
    rerender()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).not.toHaveBeenCalled()
    expect(result.current.syncStatus).toBe("idle")
  })

  it("leaves the status to a save in flight when the adapter is removed", async () => {
    const resolvers: Array<() => void> = []
    const { adapter } = memoryAdapter(null)
    adapter.save.mockImplementation(
      () => new Promise<void>((resolve) => resolvers.push(resolve)),
    )
    let persistence: ThemePersistenceAdapter | undefined = adapter
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider persistence={persistence} persistenceDebounce={50}>
        {children}
      </ThemeProvider>
    )
    const { result, rerender } = renderHook(() => useTheme(), { wrapper })
    await settle()

    act(() => result.current.setDensity("compact"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).toHaveBeenCalledOnce()

    act(() => result.current.setDensity("spacious"))
    persistence = undefined
    rerender()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(result.current.syncStatus).toBe("saving")

    await act(async () => {
      resolvers[0]?.()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.syncStatus).toBe("idle")
  })
})

describe("ThemeProvider theme definitions", () => {
  const config: ThemeConfig = {
    ...themeConfig,
    styles: {
      ink: { label: "Ink", extends: "glass", defaults: { elevation: "flat" } },
      paper: { label: "Paper", extends: "glass", frosted: false },
    },
    presets: {
      night: { label: "Night", style: "ink", axes: { accentColor: "violet" } },
    },
  }

  function withConfig(
    options: {
      defaults?: ThemeConfig["defaults"]
      onChange?: (settings: ThemeSettings) => void
      persistence?: ThemePersistenceAdapter
    } = {},
  ) {
    const own = { ...config, defaults: options.defaults ?? config.defaults }
    return ({ children }: { children: ReactNode }) => (
      <ThemeProvider
        config={own}
        onChange={options.onChange}
        persistence={options.persistence}
        persistenceDebounce={50}
      >
        {children}
      </ThemeProvider>
    )
  }

  const token = (name: string) => root.style.getPropertyValue(name)

  it("accepts, stamps and frosts a consumer style as its definition says", () => {
    localStorage.setItem("mode", "dark")
    const { result } = renderHook(() => useTheme(), { wrapper: withConfig() })
    act(() => result.current.setStyle("ink"))
    expect(result.current.style).toBe("ink")
    expect(root.getAttribute("data-style")).toBe("ink")
    expect(root.getAttribute("data-elevation")).toBe("flat")
    expect(root.getAttribute("data-background-style")).toBe("gradient")
    expect(token("--card")).not.toBe(token("--background"))
    expect(token("--surface-sidebar")).toBe(token("--background"))

    act(() => result.current.setStyle("paper"))
    expect(root.getAttribute("data-style")).toBe("paper")
    expect(token("--surface-sidebar")).toBe(token("--card"))
  })

  it("boots on a stored consumer style or one set as the default", () => {
    localStorage.setItem("theme-style", "ink")
    const stored = renderHook(() => useTheme(), { wrapper: withConfig() })
    expect(stored.result.current.style).toBe("ink")
    stored.unmount()

    localStorage.clear()
    const { result } = renderHook(() => useTheme(), {
      wrapper: withConfig({ defaults: { style: "paper" } }),
    })
    expect(result.current.style).toBe("paper")
    expect(root.getAttribute("data-style")).toBe("paper")
  })

  it.each(["setAxis", "setPreset"] as const)(
    "%s stores the preset and its style",
    (setter) => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: withConfig(),
      })
      act(() => {
        if (setter === "setAxis") result.current.setAxis("preset", "night")
        else result.current.setPreset("night")
      })
      expect(result.current.style).toBe("ink")
      expect(result.current.preset).toBe("night")
      expect(localStorage.getItem("theme-style")).toBe("ink")
      expect(localStorage.getItem("theme-preset")).toBe("night")
      expect(root.getAttribute("data-style")).toBe("ink")
      expect(root.getAttribute("data-preset")).toBe("night")
      expect(root.getAttribute("data-accent")).toBe("violet")
    },
  )

  it("resets the preset to base when the user picks a style", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: withConfig() })
    act(() => result.current.setPreset("night"))
    act(() => result.current.setStyle("glass"))
    expect(result.current.style).toBe("glass")
    expect(result.current.preset).toBe("base")
    expect(localStorage.getItem("theme-style")).toBe("glass")
    expect(localStorage.getItem("theme-preset")).toBe("base")
    expect(root.getAttribute("data-preset")).toBe("base")
    expect(root.getAttribute("data-accent")).toBe("blue")
  })

  it("rejects a preset the config does not define", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { result } = renderHook(() => useTheme(), { wrapper: withConfig() })
    act(() => result.current.setPreset("noon"))
    expect(result.current.preset).toBe("base")
    expect(localStorage.getItem("theme-preset")).toBeNull()
    expect(warn).toHaveBeenCalledWith(
      `[ThemeProvider] "noon" is not a valid preset (expected one of: ${["base", ...PRESET_NAMES, "night"].join(", ")}).`,
    )
  })

  it("carries the preset in onChange and synced payloads", async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const { adapter } = memoryAdapter({
      version: 7,
      style: "ink",
      preset: "night",
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: withConfig({ onChange, persistence: adapter }),
    })
    await settle()
    expect(result.current.style).toBe("ink")
    expect(result.current.preset).toBe("night")
    expect(localStorage.getItem("theme-preset")).toBe("night")

    act(() => result.current.setStyle("paper"))
    expect(onChange).toHaveBeenLastCalledWith({
      style: "paper",
      preset: "base",
      version: 7,
    })
    await settle()
    expect(adapter.save).toHaveBeenLastCalledWith(
      { style: "paper", preset: "base", version: 7 },
      expect.anything(),
    )
  })

  it("repaints when the config redefines the active style", () => {
    localStorage.setItem("mode", "dark")
    localStorage.setItem("theme-style", "ink")
    const tree = (frosted: boolean) => (
      <ThemeProvider
        config={{
          ...config,
          styles: { ink: { label: "Ink", extends: "glass", frosted } },
        }}
      >
        <span />
      </ThemeProvider>
    )
    const { rerender } = render(tree(true))
    expect(token("--surface-sidebar")).toBe(token("--background"))
    rerender(tree(false))
    expect(token("--surface-sidebar")).toBe(token("--card"))
  })

  it("exposes the registry built from the config", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: withConfig() })
    expect(result.current.registry.styles.ink?.lineage).toEqual([
      "ink",
      "glass",
    ])
    expect(result.current.registry.values("preset")).toEqual([
      "base",
      ...PRESET_NAMES,
      "night",
    ])
  })
})

describe("ThemeProvider consumer stylesheet", () => {
  const sheets = () =>
    Array.from(document.querySelectorAll("style[data-darkraise-theme]"))

  const withStyles = (cardEdge: string): ThemeConfig => ({
    ...themeConfig,
    styles: {
      ink: { label: "Ink", extends: "glass", tokens: { shared: { cardEdge } } },
    },
  })

  const tree = (config: ThemeConfig, nonce?: string) => (
    <ThemeProvider config={config} nonce={nonce}>
      <span />
    </ThemeProvider>
  )

  beforeEach(() => {
    for (const sheet of sheets()) sheet.remove()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("injects the config's compiled styles once", () => {
    const config = withStyles("red")
    const registry = resolveRegistry(config)
    const { rerender } = render(<StrictMode>{tree(config)}</StrictMode>)
    expect(sheets()).toHaveLength(1)
    const [sheet] = sheets()
    expect(sheet?.getAttribute("data-darkraise-theme")).toBe(registry.hash)
    expect(sheet?.textContent).toBe(
      compileThemeCss(registry, { include: "consumer" }),
    )
    expect(sheet?.hasAttribute("nonce")).toBe(false)

    rerender(<StrictMode>{tree({ ...config })}</StrictMode>)
    expect(sheets()).toHaveLength(1)
    expect(sheets()[0]).toBe(sheet)
  })

  it("replaces the stylesheet when the definitions change", () => {
    const { rerender } = render(tree(withStyles("red")))
    rerender(tree(withStyles("blue")))
    const registry = resolveRegistry(withStyles("blue"))
    expect(sheets()).toHaveLength(1)
    expect(sheets()[0]?.getAttribute("data-darkraise-theme")).toBe(
      registry.hash,
    )
    expect(sheets()[0]?.textContent).toContain("--card-edge: blue;")
  })

  it("keeps the plugin's stylesheet for the same definitions", () => {
    const config = withStyles("red")
    const injected = document.createElement("style")
    injected.setAttribute("data-darkraise-theme", resolveRegistry(config).hash)
    injected.textContent = "/* from the plugin */"
    document.head.append(injected)
    render(tree(config))
    expect(sheets()).toHaveLength(1)
    expect(sheets()[0]).toBe(injected)
    expect(injected.textContent).toBe("/* from the plugin */")
  })

  it("replaces a stylesheet built from other definitions", () => {
    const stale = document.createElement("style")
    stale.setAttribute("data-darkraise-theme", "stale")
    document.head.append(stale)
    render(tree(withStyles("red")))
    expect(sheets()).toHaveLength(1)
    expect(stale.isConnected).toBe(false)
  })

  it("injects nothing with only the built-in styles", () => {
    render(tree(themeConfig))
    expect(sheets()).toEqual([])
  })

  it("puts the nonce on the stylesheet", () => {
    render(tree(withStyles("red"), "r4nd"))
    expect(sheets()[0]?.getAttribute("nonce")).toBe("r4nd")
  })

  it("warns about each definition issue once per config content", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const config = (): ThemeConfig => ({
      ...themeConfig,
      styles: {
        dusk: {
          label: "Dusk",
          tokens: { shared: { cardEdge: "var(--primary-8)" } },
        },
        dawn: { label: "Dawn", extends: "noon" },
      },
    })
    const { rerender, unmount } = render(
      <StrictMode>{tree(config())}</StrictMode>,
    )
    rerender(<StrictMode>{tree(config())}</StrictMode>)
    unmount()
    render(tree(config()))
    expect(warn.mock.calls).toEqual([
      [
        '[ThemeProvider] themeConfig.styles.dawn.extends: "noon" is not a style. The definition is ignored.',
      ],
      [
        "[ThemeProvider] themeConfig.styles.dusk.tokens.shared.cardEdge: var(--primary-8) is an HSL channel triplet; write hsl(var(--primary-8)).",
      ],
    ])
  })

  it("stays silent about definition issues in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      tree({
        ...themeConfig,
        styles: { morn: { label: "Morn", extends: "noon" } },
      }),
    )
    expect(warn).not.toHaveBeenCalled()
  })
})
