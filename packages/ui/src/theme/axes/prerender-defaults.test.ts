import { cleanup, render } from "@testing-library/react"
import { createElement } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { STYLE_NAMES, type StyleName } from "@theme/styles"
import { ThemeProvider } from "@theme/theme-provider/ThemeProvider"
import type { ThemeConfig } from "@theme/themeConfig"
import { LEGACY_MARKER_KEY, LEGACY_REVISION } from "./legacy"
import { buildPrerenderScript } from "./prerender"
import { AXES, AXIS_KEYS } from "./registry"
import { TOKEN_CACHE_SCHEMA, readTokenCache } from "./tokenCache"
import { KIT_VERSION } from "./version"

type Defaults = ThemeConfig["defaults"]
type Case = [name: string, stored: Record<string, string>, defaults: Defaults]

const root = document.documentElement

const ATTRIBUTES = AXIS_KEYS.flatMap((key) => AXES[key].attribute ?? []).sort()

// A current user's choices: the marker says the legacy table already ran,
// which would otherwise move a stored glass-on-solid to gradient.
const current = (values: Record<string, string>) => ({
  [LEGACY_MARKER_KEY]: String(LEGACY_REVISION),
  ...values,
})

// The conflicting config defaults are the axes a style sets itself: flat's
// elevation and glass's background style. A stored value beats both.
function cases(style: StyleName): Case[] {
  return [
    ["nothing stored", {}, { style }],
    ["style only", current({ "theme-style": style }), {}],
    [
      "style and conflicting config defaults",
      current({ "theme-style": style }),
      { elevation: "high", backgroundStyle: "solid" },
    ],
    [
      "a user value",
      current({
        "theme-style": style,
        "theme-elevation": "high",
        "theme-bg-style": "solid",
        "theme-glass-opacity": "strong",
      }),
      { elevation: "standard", backgroundStyle: "gradient" },
    ],
    ["config default mode dark", {}, { style, mode: "dark" }],
  ]
}

const MATRIX: Case[] = STYLE_NAMES.flatMap((style) =>
  cases(style).map(
    ([name, stored, defaults]): Case => [`${style}, ${name}`, stored, defaults],
  ),
)

function seed(stored: Record<string, string>) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) {
    localStorage.setItem(key, value)
  }
}

function resetRoot() {
  root.style.cssText = ""
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
}

function stamped(): Record<string, string | null> {
  return Object.fromEntries(
    ATTRIBUTES.map((name) => [name, root.getAttribute(name)]),
  )
}

function runScript(defaults: Defaults) {
  new Function(buildPrerenderScript(defaults))()
}

function renderProvider(defaults: Defaults) {
  render(
    createElement(ThemeProvider, {
      config: { defaults, switcher: { enabled: true } },
      children: null,
    }),
  )
}

beforeEach(resetRoot)

afterEach(() => {
  vi.restoreAllMocks()
  cleanup()
  localStorage.clear()
})

describe("pre-render script and provider under config defaults", () => {
  it.each(MATRIX)("agree on %s", (_, stored, defaults) => {
    seed(stored)
    runScript(defaults)
    expect(root.getAttributeNames().sort()).toEqual(ATTRIBUTES)
    const scripted = stamped()

    resetRoot()
    renderProvider(defaults)
    expect(stamped()).toEqual(scripted)
    const painted = root.style.getPropertyValue("--background")
    expect(painted).not.toBe("")
    const cache = readTokenCache(localStorage)
    expect(cache?.tokens["--background"]).toBe(painted)
    expect(cache?.id.startsWith(`${KIT_VERSION}|${TOKEN_CACHE_SCHEMA}|`)).toBe(
      true,
    )

    // The script applies the cached set only when its id equals the
    // provider's, so a painted token proves the two ids match.
    cleanup()
    resetRoot()
    runScript(defaults)
    expect(root.style.getPropertyValue("--background")).toBe(painted)
  })
})

describe("token cache across a redeploy that changes the config defaults", () => {
  it("is not applied when the style default changed", () => {
    renderProvider({ style: "quiet" })
    const painted = root.style.getPropertyValue("--background")
    expect(painted).not.toBe("")
    const quietId = readTokenCache(localStorage)?.id

    cleanup()
    resetRoot()
    runScript({ style: "glass" })
    expect(root.style.getPropertyValue("--background")).toBe("")

    resetRoot()
    runScript({ style: "quiet" })
    expect(root.style.getPropertyValue("--background")).toBe(painted)

    resetRoot()
    renderProvider({ style: "glass" })
    expect(readTokenCache(localStorage)?.id).not.toBe(quietId)
  })
})

describe("pre-render script and provider with storage blocked", () => {
  it.each(STYLE_NAMES)("agree on config style %s", (style) => {
    const defaults: Defaults = { style, mode: "dark", elevation: "high" }
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError")
    })
    runScript(defaults)
    expect(root.getAttribute("data-mode")).toBe("dark")
    expect(root.getAttributeNames().sort()).toEqual(ATTRIBUTES)
    const scripted = stamped()

    resetRoot()
    renderProvider(defaults)
    expect(stamped()).toEqual(scripted)
  })
})
