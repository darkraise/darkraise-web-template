// @vitest-environment node
import { describe, expect, it } from "vitest"
import { buildPrerenderScript } from "../axes/prerender"
import * as entry from "./index"

const CONFIG: entry.ThemeConfig = entry.defineThemeConfig({
  defaults: { style: "ink" },
  switcher: { enabled: true },
  styles: {
    ink: entry.defineStyle({
      label: "Ink",
      extends: "glass",
      tokens: { shared: { cardEdge: "hsl(var(--primary-8))" } },
    }),
  },
  presets: {
    night: entry.definePreset({ label: "Night", style: "ink" }),
  },
})

describe("darkraise-ui/theme-config", () => {
  it("exports the schema helpers, the registry, the compiler and the delivery helpers", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "KIT_FALLBACK",
      "LAYER_STATEMENT",
      "PAINT_TOKENS",
      "SIGNATURES",
      "buildRegistry",
      "buildThemeJsonSchema",
      "canonicalJson",
      "compileThemeCss",
      "definePreset",
      "defineStyle",
      "defineThemeConfig",
      "definitionsHash",
      "fnv1a36",
      "resolveRegistry",
      "signatureAttribute",
      "themePrerenderScript",
      "themeStyleText",
    ])
  })

  it("runs without a DOM", () => {
    expect(typeof document).toBe("undefined")
    expect(typeof window).toBe("undefined")
    const registry = entry.resolveRegistry(CONFIG)
    expect(registry.issues).toEqual([])
    expect(entry.themeStyleText(CONFIG)).toBe(
      entry.compileThemeCss(registry, { include: "consumer" }),
    )
    expect(entry.themeStyleText(CONFIG)).toContain('[data-style="ink"]')
    expect(entry.themePrerenderScript(CONFIG)).toBe(
      buildPrerenderScript(CONFIG),
    )
    expect(entry.buildThemeJsonSchema()).toHaveProperty("definitions")
  })

  it("gives only the layer statement for built-ins alone", () => {
    expect(entry.themeStyleText({})).toBe(`${entry.LAYER_STATEMENT}\n`)
  })
})
