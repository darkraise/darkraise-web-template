import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { buildPrerenderScript } from "./prerender"
import {
  TOKEN_CACHE_STORAGE_KEY,
  tokenCacheId,
  writeTokenCache,
} from "./tokenCache"

const root = document.documentElement

function run() {
  new Function(buildPrerenderScript())()
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

  it("restores every valid attribute axis and skips invalid values", () => {
    localStorage.setItem("theme-density", "spacious")
    localStorage.setItem("theme-accent", "violet")
    localStorage.setItem("theme-radius", "huge")
    localStorage.setItem("theme-sidebar-active-bar", "bar")
    run()
    expect(root.getAttribute("data-density")).toBe("spacious")
    expect(root.getAttribute("data-accent")).toBe("violet")
    expect(root.hasAttribute("data-radius")).toBe(false)
    expect(root.hasAttribute("data-sidebar-active-bar")).toBe(false)
  })

  it("restores the stored font before the app runs", () => {
    localStorage.setItem("theme-font", "geist")
    run()
    expect(root.getAttribute("data-font")).toBe("geist")
  })

  it("skips an unknown stored font", () => {
    localStorage.setItem("theme-font", "comic-sans")
    run()
    expect(root.hasAttribute("data-font")).toBe(false)
  })

  it("ignores the stored values of removed axes", () => {
    localStorage.setItem("theme-surface-intensity", "bold")
    localStorage.setItem("theme-control-depth", "deep")
    run()
    expect(root.hasAttribute("data-surface-intensity")).toBe(false)
    expect(root.hasAttribute("data-control-depth")).toBe(false)
  })

  it("restores the active preset's own axes", () => {
    localStorage.setItem("theme-preset", "glass")
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

  it("sets the mode from matchMedia when reading storage throws", () => {
    mockMatchMedia(true)
    localStorage.setItem("theme-accent", "rose")
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError")
    })
    run()
    expect(root.getAttribute("data-mode")).toBe("dark")
    expect(root.hasAttribute("data-accent")).toBe(false)
  })
})
