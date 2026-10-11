import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider } from "./ThemeProvider"
import { useTheme } from "@theme/useTheme"
import { buildPrerenderScript } from "@theme/axes/prerender"
import {
  SIGNATURES,
  STAMPED_SIGNATURES,
  signatureAttribute,
} from "@theme/config/signatures"
import { themeConfig, type ThemeConfig } from "@theme/themeConfig"
import { BUILTIN_STYLES, STYLE_NAMES } from "@theme/styles"

const root = document.documentElement

const config: ThemeConfig = {
  ...themeConfig,
  styles: {
    plain: { label: "Plain" },
    ledger: {
      label: "Ledger",
      extends: "plain",
      signatures: { cardFooter: "inset", tableHead: "ruled" },
    },
    "ledger-ink": {
      label: "Ledger ink",
      extends: "ledger",
      signatures: { tableHead: "seam", avatarShape: "square" },
    },
  },
  presets: {
    night: {
      label: "Night",
      style: "ledger-ink",
      signatures: { bannerMark: "lamp", tableHead: "plain" },
    },
  },
}

const wrap =
  (own: ThemeConfig = config) =>
  ({ children }: { children: ReactNode }) => (
    <ThemeProvider config={own}>{children}</ThemeProvider>
  )

function stamps(): Record<string, string | null> {
  return Object.fromEntries(
    STAMPED_SIGNATURES.map((key) => [
      signatureAttribute(key),
      root.getAttribute(signatureAttribute(key)),
    ]),
  )
}

const DEFAULT_STAMPS = Object.fromEntries(
  STAMPED_SIGNATURES.map((key) => [
    signatureAttribute(key),
    SIGNATURES[key].default,
  ]),
)

beforeEach(() => {
  localStorage.clear()
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
  root.style.cssText = ""
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("ThemeProvider signature stamps", () => {
  it("stamps each built-in style's own signatures over the kit defaults", () => {
    for (const style of STYLE_NAMES) {
      const { unmount } = renderHook(() => useTheme(), {
        wrapper: wrap({ ...themeConfig, defaults: { style } }),
      })
      const own = Object.fromEntries(
        STAMPED_SIGNATURES.filter(
          (key) => BUILTIN_STYLES[style].signatures?.[key] !== undefined,
        ).map((key) => [
          signatureAttribute(key),
          BUILTIN_STYLES[style].signatures?.[key],
        ]),
      )
      expect(stamps(), style).toEqual({ ...DEFAULT_STAMPS, ...own })
      unmount()
    }
  })

  it("stamps every signature at its kit default under a style that sets none", () => {
    renderHook(() => useTheme(), {
      wrapper: wrap({ ...config, defaults: { style: "plain" } }),
    })
    expect(stamps()).toEqual(DEFAULT_STAMPS)
  })

  it("stamps a style's signatures over its parent's and a preset's over both", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap() })
    act(() => result.current.setStyle("ledger-ink"))
    expect(stamps()).toEqual({
      ...DEFAULT_STAMPS,
      "data-card-footer": "inset",
      "data-table-head": "seam",
      "data-avatar-shape": "square",
    })

    act(() => result.current.setPreset("night"))
    expect(stamps()).toEqual({
      ...DEFAULT_STAMPS,
      "data-card-footer": "inset",
      "data-table-head": "plain",
      "data-avatar-shape": "square",
      "data-banner-mark": "lamp",
    })

    act(() => result.current.setStyle("plain"))
    expect(stamps()).toEqual(DEFAULT_STAMPS)
  })
})

describe("pre-render script signature stamps", () => {
  it.each([
    ["no stored style", {}],
    ["a stored consumer style", { "theme-style": "ledger" }],
    [
      "a stored preset of the stored style",
      { "theme-style": "ledger-ink", "theme-preset": "night" },
    ],
    [
      "a stored preset of another style",
      { "theme-style": "ledger", "theme-preset": "night" },
    ],
  ])("stamps what the provider stamps with %s", (_, stored) => {
    for (const [key, value] of Object.entries(stored)) {
      localStorage.setItem(key, value)
    }
    new Function(buildPrerenderScript(config))()
    const before = stamps()
    for (const name of root.getAttributeNames()) root.removeAttribute(name)

    renderHook(() => useTheme(), { wrapper: wrap() })
    expect(before).toEqual(stamps())
    expect(Object.values(before)).not.toContain(null)
  })

  it("takes the config's default style and preset", () => {
    new Function(
      buildPrerenderScript({
        ...config,
        defaults: { style: "ledger-ink", preset: "night" },
      }),
    )()
    expect(root.getAttribute("data-banner-mark")).toBe("lamp")
    expect(root.getAttribute("data-table-head")).toBe("plain")
    expect(root.getAttribute("data-card-footer")).toBe("inset")
  })
})
