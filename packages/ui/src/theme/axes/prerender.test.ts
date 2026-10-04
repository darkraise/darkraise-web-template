import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ThemeConfig } from "@theme/themeConfig"
import { LEGACY_MARKER_KEY, LEGACY_REVISION } from "./legacy"
import { buildPrerenderScript } from "./prerender"
import { AXES, AXIS_KEYS, type AxisValues } from "./registry"
import {
  TOKEN_CACHE_SCHEMA,
  TOKEN_CACHE_STORAGE_KEY,
  cacheInputKeys,
  tokenCacheId,
  writeTokenCache,
} from "./tokenCache"
import { KIT_VERSION } from "./version"

const root = document.documentElement

function run(defaults: ThemeConfig["defaults"] = {}) {
  new Function(buildPrerenderScript(defaults))()
}

// A current user's choices: the marker says the legacy table already ran.
function storeCurrent(values: Record<string, string>) {
  localStorage.setItem(LEGACY_MARKER_KEY, String(LEGACY_REVISION))
  for (const [key, value] of Object.entries(values)) {
    localStorage.setItem(key, value)
  }
}

function mockMatchMedia(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: dark })),
  )
}

beforeEach(() => {
  localStorage.clear()
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
  root.style.cssText = ""
  mockMatchMedia(false)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("pre-render script", () => {
  it("resolves the stored mode, and system through matchMedia", () => {
    localStorage.setItem("mode", "dark")
    run()
    expect(root.getAttribute("data-mode")).toBe("dark")
    localStorage.setItem("mode", "system")
    mockMatchMedia(true)
    run()
    expect(root.getAttribute("data-mode")).toBe("dark")
  })

  it("treats an invalid stored mode as system", () => {
    localStorage.setItem("mode", "sepia")
    run()
    expect(root.getAttribute("data-mode")).toBe("light")
  })

  it("restores every valid attribute axis and paints the default for an invalid one", () => {
    localStorage.setItem("theme-density", "spacious")
    localStorage.setItem("theme-accent", "violet")
    localStorage.setItem("theme-radius", "huge")
    localStorage.setItem("theme-sidebar-active-bar", "bar")
    run()
    expect(root.getAttribute("data-density")).toBe("spacious")
    expect(root.getAttribute("data-accent")).toBe("violet")
    expect(root.getAttribute("data-radius")).toBe(AXES.radius.default)
    expect(root.hasAttribute("data-sidebar-active-bar")).toBe(false)
  })

  it("restores the stored font before the app runs", () => {
    localStorage.setItem("theme-font", "geist")
    run()
    expect(root.getAttribute("data-font")).toBe("geist")
  })

  it("paints the default font for an unknown stored font", () => {
    localStorage.setItem("theme-font", "comic-sans")
    run()
    expect(root.getAttribute("data-font")).toBe(AXES.font.default)
  })

  it("ignores the stored values of removed axes", () => {
    localStorage.setItem("theme-surface-intensity", "bold")
    localStorage.setItem("theme-control-depth", "deep")
    run()
    expect(root.hasAttribute("data-surface-intensity")).toBe(false)
    expect(root.hasAttribute("data-control-depth")).toBe(false)
  })

  it("restores the glass axes like any attribute axis", () => {
    localStorage.setItem("theme-glass-blur", "high")
    run()
    expect(root.getAttribute("data-glass-blur")).toBe("high")
  })

  it("applies the token cache only when its id matches", () => {
    localStorage.setItem("theme-accent", "rose")
    const read = (k: string) => localStorage.getItem(k)
    writeTokenCache(localStorage, tokenCacheId(read, "light"), {
      "--primary": "1 2% 3%",
    })
    run()
    expect(root.style.getPropertyValue("--primary")).toBe("1 2% 3%")

    root.style.cssText = ""
    writeTokenCache(localStorage, tokenCacheId(read, "dark"), {
      "--primary": "9 9% 9%",
    })
    run()
    expect(root.style.getPropertyValue("--primary")).toBe("")
  })

  it("ignores a token set cached under the id format before the schema", () => {
    localStorage.setItem("theme-accent", "rose")
    const read = (k: string) => localStorage.getItem(k)
    const unversioned = [
      KIT_VERSION,
      "light",
      ...cacheInputKeys().map((k) => read(k) ?? ""),
    ].join("|")
    writeTokenCache(localStorage, unversioned, { "--fog-05": "red" })
    run()
    expect(root.style.getPropertyValue("--fog-05")).toBe("")
  })

  it("survives corrupt storage", () => {
    localStorage.setItem(TOKEN_CACHE_STORAGE_KEY, "{oops")
    expect(() => run()).not.toThrow()
  })

  it("sets the mode from matchMedia when storage access throws", () => {
    mockMatchMedia(true)
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError")
    })
    expect(() => run()).not.toThrow()
    expect(root.getAttribute("data-mode")).toBe("dark")
  })

  it("sets the mode from matchMedia and paints defaults when reading storage throws", () => {
    mockMatchMedia(true)
    localStorage.setItem("theme-accent", "rose")
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError")
    })
    run()
    expect(root.getAttribute("data-mode")).toBe("dark")
    expect(root.getAttribute("data-accent")).toBe(AXES.accentColor.default)
    expect(root.style.cssText).toBe("")
  })

  it("migrates legacy keys before restoring attributes", () => {
    localStorage.setItem("theme-surface-color", "red")
    localStorage.setItem("theme-elevation", "medium")
    run()
    expect(root.getAttribute("data-surface")).toBe("zinc")
    expect(root.getAttribute("data-tint-with-accent")).toBe("on")
    expect(root.getAttribute("data-elevation")).toBe("standard")
    expect(localStorage.getItem("theme-surface-color")).toBe("zinc")
    expect(localStorage.getItem("theme-settings-version")).toBe(
      String(LEGACY_REVISION),
    )
  })

  it("paints migrated attributes when storage refuses writes", () => {
    localStorage.setItem("theme-elevation", "medium")
    const refuse = () => {
      throw new DOMException("full", "QuotaExceededError")
    }
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(refuse)
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(refuse)
    run()
    expect(root.getAttribute("data-elevation")).toBe("standard")
    expect(localStorage.getItem("theme-elevation")).toBe("medium")
    expect(localStorage.getItem("theme-settings-version")).toBeNull()
  })

  it("keeps a legacy key when its target write is refused", () => {
    localStorage.setItem("theme-surface-intensity", "bold")
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError")
    })
    run()
    expect(localStorage.getItem("theme-surface-intensity")).toBe("bold")
    expect(localStorage.getItem("theme-settings-version")).toBeNull()
  })

  it("keeps an accent surface until its tint write lands", () => {
    localStorage.setItem("theme-surface-color", "red")
    const setItem = Storage.prototype.setItem
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(function (this: Storage, key: string, value: string) {
        if (key === "theme-tint-with-accent") {
          throw new DOMException("full", "QuotaExceededError")
        }
        setItem.call(this, key, value)
      })
    run()
    expect(localStorage.getItem("theme-surface-color")).toBe("red")
    expect(localStorage.getItem("theme-settings-version")).toBeNull()

    spy.mockRestore()
    run()
    expect(localStorage.getItem("theme-surface-color")).toBe("zinc")
    expect(localStorage.getItem("theme-tint-with-accent")).toBe("on")
    expect(localStorage.getItem("theme-settings-version")).toBe(
      String(LEGACY_REVISION),
    )
  })

  it("embeds the legacy rules without their payload fields", () => {
    expect(buildPrerenderScript()).not.toContain('"field"')
  })

  it("withholds the marker when a read throws", () => {
    localStorage.setItem("theme-elevation", "medium")
    const getItem = Storage.prototype.getItem
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      if (key === "theme-surface-color") {
        throw new DOMException("denied", "SecurityError")
      }
      return getItem.call(this, key)
    })
    run()
    expect(root.getAttribute("data-elevation")).toBe("standard")
    expect(localStorage.getItem("theme-elevation")).toBe("medium")
    expect(localStorage.getItem("theme-settings-version")).toBeNull()
  })

  it("runs revision 2 on a browser that ran revision 1", () => {
    localStorage.setItem("theme-settings-version", "1")
    localStorage.setItem("theme-preset", "default")
    localStorage.setItem("theme-glass-opacity", "medium")
    localStorage.setItem("theme-glass-blur", "high")
    localStorage.setItem("theme-elevation", "low")
    run()
    expect(localStorage.getItem("theme-preset")).toBe("quiet")
    expect(localStorage.getItem("theme-glass-opacity")).toBeNull()
    expect(localStorage.getItem("theme-glass-blur")).toBe("high")
    expect(localStorage.getItem("theme-elevation")).toBe("low")
    expect(localStorage.getItem("theme-settings-version")).toBe(
      String(LEGACY_REVISION),
    )
    expect(root.getAttribute("data-style")).toBe("quiet")
  })
})

describe("pre-render script defaults", () => {
  it("paints every attribute axis at its registry default when nothing is stored", () => {
    run()
    for (const key of AXIS_KEYS) {
      const attribute = AXES[key].attribute
      if (!attribute || key === "mode") continue
      expect(root.getAttribute(attribute), key).toBe(AXES[key].default)
    }
  })

  it("resolves an unstored mode from the config default", () => {
    run({ mode: "dark" })
    expect(root.getAttribute("data-mode")).toBe("dark")
    storeCurrent({ mode: "light" })
    run({ mode: "dark" })
    expect(root.getAttribute("data-mode")).toBe("light")
  })

  it("paints the config defaults when storage access throws", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError")
    })
    expect(() =>
      run({ mode: "dark", style: "flat", accentColor: "rose" }),
    ).not.toThrow()
    expect(root.getAttribute("data-mode")).toBe("dark")
    expect(root.getAttribute("data-style")).toBe("flat")
    expect(root.getAttribute("data-elevation")).toBe("flat")
    expect(root.getAttribute("data-accent")).toBe("rose")
    expect(root.getAttribute("data-radius")).toBe(AXES.radius.default)
    expect(root.style.cssText).toBe("")
  })

  it("takes the style from the config default when none is stored", () => {
    run({ style: "glass" })
    expect(root.getAttribute("data-style")).toBe("glass")
    expect(root.getAttribute("data-background-style")).toBe("gradient")
  })

  it("lets a style default beat a config default", () => {
    storeCurrent({ "theme-preset": "flat" })
    run({ elevation: "high" })
    expect(root.getAttribute("data-elevation")).toBe("flat")
    storeCurrent({ "theme-preset": "tactile" })
    run({ elevation: "high" })
    expect(root.getAttribute("data-elevation")).toBe("high")
  })

  it("lets a stored value beat the style default", () => {
    storeCurrent({ "theme-preset": "glass", "theme-bg-style": "solid" })
    run()
    expect(root.getAttribute("data-background-style")).toBe("solid")
  })

  it("still migrates an unmarked glass user on a solid canvas", () => {
    localStorage.setItem("theme-preset", "glass")
    localStorage.setItem("theme-bg-style", "solid")
    run()
    expect(root.getAttribute("data-background-style")).toBe("gradient")
    expect(localStorage.getItem("theme-bg-style")).toBe("gradient")
  })

  it("ignores a config default that is not a value of its axis", () => {
    run({ radius: "huge", mode: "sepia" } as unknown as ThemeConfig["defaults"])
    expect(root.getAttribute("data-radius")).toBe(AXES.radius.default)
    expect(root.getAttribute("data-mode")).toBe("light")
  })

  it("finds the cache the provider wrote under a config default mode", () => {
    const read = (k: string) => localStorage.getItem(k)
    const defaults = Object.fromEntries(
      AXIS_KEYS.map((key) => [key, AXES[key].default]),
    ) as AxisValues
    writeTokenCache(
      localStorage,
      tokenCacheId(read, "dark", { ...defaults, mode: "dark" }),
      { "--primary": "1 2% 3%" },
    )
    run({ mode: "dark" })
    expect(root.style.getPropertyValue("--primary")).toBe("1 2% 3%")
  })

  it("misses a cache written under an older schema", () => {
    const read = (k: string) => localStorage.getItem(k)
    const id = tokenCacheId(read, "light")
    const prefix = `${KIT_VERSION}|${TOKEN_CACHE_SCHEMA}|`
    expect(id.startsWith(`${prefix}light|`)).toBe(true)
    writeTokenCache(
      localStorage,
      id.replace(prefix, `${KIT_VERSION}|${TOKEN_CACHE_SCHEMA - 1}|`),
      { "--primary": "1 2% 3%" },
    )
    run()
    expect(root.style.getPropertyValue("--primary")).toBe("")
  })
})
