import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import type { PresetDefinition } from "@theme/config/schema"
import { BUILTIN_STYLES } from "@theme/styles"
import type { ThemeConfig } from "@theme/themeConfig"
import { LEGACY_MARKER_KEY, LEGACY_REVISION } from "./legacy"
import { buildPrerenderScript } from "./prerender"
import { AXES, AXIS_KEYS, type AxisValues } from "./registry"
import {
  BUILTIN_STYLES_HASH,
  builtinsHash,
  tokenCacheId,
  writeTokenCache,
} from "./tokenCache"

// The kit's own preset record, replaced for this file so the script, the
// registry and the cache id are read with built-in presets in place.
const PRESETS = vi.hoisted(
  (): Record<string, PresetDefinition> => ({
    dusk: {
      label: "Dusk",
      style: "glass",
      axes: { accentColor: "violet", radius: "pill" },
      signatures: { cardFooter: "inset", navSelection: "pill" },
      shellStyle: "inset",
    },
    dawn: { label: "Dawn", style: "quiet", axes: { radius: "sharp" } },
  }),
)

vi.mock("@theme/styles/builtin/presets", () => ({ BUILTIN_PRESETS: PRESETS }))

const root = document.documentElement

function run(defaults: ThemeConfig["defaults"] = {}) {
  new Function(buildPrerenderScript({ defaults }))()
}

// A current user's choices: the marker says the legacy table already ran.
function storeCurrent(values: Record<string, string>) {
  localStorage.setItem(LEGACY_MARKER_KEY, String(LEGACY_REVISION))
  for (const [key, value] of Object.entries(values)) {
    localStorage.setItem(key, value)
  }
}

beforeEach(() => {
  localStorage.clear()
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
  root.style.cssText = ""
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("pre-render script with built-in presets", () => {
  it("reads the replaced record through the registry", () => {
    const registry = resolveRegistry()
    expect(registry.issues).toEqual([])
    expect(registry.values("preset")).toEqual(["base", "dusk", "dawn"])
    expect(registry.presets.dusk?.builtIn).toBe(true)
  })

  it("carries each built-in preset's style, axes and stamped signatures", () => {
    const script = buildPrerenderScript()
    expect(script).toContain(
      `P=${JSON.stringify({
        dusk: [
          "glass",
          { accentColor: "violet", radius: "pill" },
          { cardFooter: "inset" },
        ],
        dawn: ["quiet", { radius: "sharp" }, {}],
      })},`,
    )
  })

  it("stamps a stored built-in preset, its axes and its signatures", () => {
    storeCurrent({ "theme-style": "glass", "theme-preset": "dusk" })
    run()
    expect(root.getAttribute("data-style")).toBe("glass")
    expect(root.getAttribute("data-preset")).toBe("dusk")
    expect(root.getAttribute("data-accent")).toBe("violet")
    expect(root.getAttribute("data-radius")).toBe("pill")
    expect(root.getAttribute("data-card-footer")).toBe("inset")
    // The style's own default still fills what the preset leaves unset.
    expect(root.getAttribute("data-background-style")).toBe("gradient")
  })

  it("takes a built-in preset from the config defaults", () => {
    run({ style: "glass", preset: "dusk" })
    expect(root.getAttribute("data-preset")).toBe("dusk")
    expect(root.getAttribute("data-accent")).toBe("violet")
  })

  it("drops a stored built-in preset of another style", () => {
    storeCurrent({ "theme-style": "quiet", "theme-preset": "dusk" })
    run()
    expect(root.getAttribute("data-preset")).toBe("base")
    expect(root.getAttribute("data-accent")).toBe(AXES.accentColor.default)
    expect(root.getAttribute("data-card-footer")).toBe("plain")
  })

  it("lets a user value beat the built-in preset", () => {
    storeCurrent({
      "theme-style": "glass",
      "theme-preset": "dusk",
      "theme-radius": "subtle",
    })
    run()
    expect(root.getAttribute("data-radius")).toBe("subtle")
  })

  it("finds the cache the provider wrote, whose id covers the built-in presets", () => {
    const read = (k: string) => localStorage.getItem(k)
    const defaults = Object.fromEntries(
      AXIS_KEYS.map((key) => [key, AXES[key].default]),
    ) as AxisValues
    storeCurrent({ "theme-style": "glass", "theme-preset": "dusk" })
    const id = tokenCacheId(read, "light", defaults)
    expect(BUILTIN_STYLES_HASH).toBe(builtinsHash(BUILTIN_STYLES, PRESETS))
    expect(id.split("|")[3]).toBe(BUILTIN_STYLES_HASH)
    writeTokenCache(localStorage, id, { "--primary": "1 2% 3%" })
    run()
    expect(root.style.getPropertyValue("--primary")).toBe("1 2% 3%")

    // A set cached before the presets existed has another id.
    root.style.cssText = ""
    const stale = id.split("|")
    stale[3] = builtinsHash(BUILTIN_STYLES, {})
    expect(stale[3]).not.toBe(BUILTIN_STYLES_HASH)
    writeTokenCache(localStorage, stale.join("|"), { "--primary": "1 2% 3%" })
    run()
    expect(root.style.getPropertyValue("--primary")).toBe("")
  })
})
