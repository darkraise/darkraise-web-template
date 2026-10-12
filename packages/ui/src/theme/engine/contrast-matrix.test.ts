import { describe, it, expect } from "vitest"
import { AXES } from "@theme/axes/registry"
import { resolveRegistry } from "@theme/config/registry"
import type { DefinableAxes } from "@theme/config/schema"
import {
  generateTokens,
  gradientCanvasPeak,
} from "@theme/engine/generateTokens"
import { composite, contrastRatio } from "@theme/engine/oklch"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { BUILTIN_PRESETS } from "@theme/styles/builtin/presets"
import {
  comboName,
  finalTokens,
  isOpaque,
  presetCombos,
  reachableCombos,
  type ThemeCombo,
} from "../../test/contrast-matrix"

const TEXT = 4.5
const MARK = 3
// The margin primary-fill.test.ts holds the filled button's label to.
const FILL_LABEL = 4.6

const SURFACES = ["--background", "--card", "--popover", "--muted"] as const
const PAGE_AND_CARD = ["--background", "--card"] as const
// The grounds a field sits on outside the chrome.
const FIELD_GROUNDS = [
  "--background",
  "--card",
  "--surface-sunken",
  "--control-well",
] as const

/** `H S% L%` or `H S% L% / a` → the colour and the alpha it paints at. */
function split(value: string): [string, number] {
  const [colour, alpha] = value.split("/").map((part) => part.trim())
  return [colour as string, alpha === undefined ? 1 : parseFloat(alpha)]
}

/**
 * Every floor a preset's own engine inputs can move: the text tiers, the
 * accent and signal as text, mark and fill, the field edge, and the tiers of
 * a toned rail or bar.
 */
function floorFailures(combo: ThemeCombo): string[] {
  const tokens = finalTokens(combo)
  const at = (key: string): string => {
    const value = tokens[key]
    if (value === undefined) throw new Error(`no ${key} in ${comboName(combo)}`)
    return value
  }
  const failures: string[] = []
  const hold = (what: string, a: string, b: string, floor: number) => {
    const ratio = contrastRatio(a, b)
    if (ratio < floor) {
      failures.push(`${what}: ${ratio.toFixed(2)}, under ${floor}`)
    }
  }
  const on = (token: string, grounds: readonly string[], floor: number) => {
    for (const ground of grounds) {
      if (!isOpaque(tokens[ground])) continue
      hold(`${token} on ${ground}`, at(token), at(ground), floor)
    }
  }

  on("--foreground", SURFACES, TEXT)
  on("--muted-foreground", SURFACES, TEXT)
  on("--legend", ["--background", "--card", "--popover"], TEXT)

  on("--primary-text", PAGE_AND_CARD, TEXT)
  on("--primary", ["--background"], MARK)
  on("--primary-foreground", ["--primary-fill"], FILL_LABEL)
  if (combo.mode === "dark") on("--primary-fill", ["--card"], MARK)

  on("--signal-text", PAGE_AND_CARD, TEXT)
  on("--signal-foreground", ["--signal-fill"], TEXT)

  on("--field-edge-color", FIELD_GROUNDS, MARK)
  if (combo.backgroundStyle === "gradient") {
    const peak = gradientCanvasPeak(
      at("--background"),
      surfaceColors[combo.surfaceColor][500],
      combo.mode,
      combo.backgroundIntensity,
    )
    for (const mark of ["--field-edge-color", "--primary", "--ring"]) {
      hold(`${mark} on the canvas peak`, at(mark), peak, MARK)
    }
  }

  const regions = [
    ["rail", combo.railTone, "--surface-sidebar", "--sidebar"],
    ["bar", combo.barTone, "--surface-header", "--bar"],
  ] as const
  for (const [region, tone = "page", fillKey, prefix] of regions) {
    // The bar has tiers of its own only while it is inverse or accent.
    if (tone === "page" || (region === "bar" && tone === "raised")) continue
    const fill = at(fillKey)
    const ink = at(`${prefix}-foreground-hover`)
    hold(`${region} text`, at(`${prefix}-foreground`), fill, TEXT)
    hold(`${region} muted text`, at(`${prefix}-foreground-muted`), fill, TEXT)
    hold(`${region} hover text`, ink, fill, TEXT)
    for (const ground of [`${prefix}-hover-bg`, `${prefix}-active-bg`]) {
      const [colour, alpha] = split(at(ground))
      hold(
        `${region} text on ${ground}`,
        ink,
        composite(fill, colour, alpha),
        TEXT,
      )
    }
  }
  return failures
}

describe("contrast matrix support", () => {
  it("enumerates every reachable combination once", () => {
    const combos = reachableCombos()
    expect(combos).toHaveLength(19 * 12 * (3 + 3 * 3) * 2 * 5)
    expect(new Set(combos.map(comboName)).size).toBe(combos.length)
  })

  it("runs frosted chrome at every contrast and chroma step", () => {
    const steps = (frosted: boolean) =>
      new Set(
        reachableCombos()
          .filter((c) => c.frosted === frosted)
          .map((c) => `${c.mode}/${c.contrast}/${c.darkAccentChroma}`),
      )
    expect(steps(true)).toEqual(steps(false))
    expect(steps(true).size).toBe(3 + 3 * 3)
  })

  it("builds each combination's tokens once", () => {
    const [combo] = reachableCombos()
    if (!combo) throw new Error("no reachable combination")
    expect(finalTokens(combo)).toBe(finalTokens({ ...combo }))
  })

  it("paints the page from the combination's background intensity", () => {
    const base = {
      accentColor: "blue",
      surfaceColor: "slate",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
      frosted: false,
    } as const
    expect(
      finalTokens({ ...base, backgroundIntensity: "neutral" })["--background"],
    ).not.toBe(
      finalTokens({ ...base, backgroundIntensity: "intense" })["--background"],
    )
  })

  it("paints the engine's tokens alone when frosted, as the provider does", () => {
    const combo = {
      accentColor: "blue",
      surfaceColor: "slate",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
      backgroundIntensity: "balanced",
    } as const
    const frosted = finalTokens({ ...combo, frosted: true })
    const plain = finalTokens({ ...combo, frosted: false })
    expect(isOpaque(frosted["--muted"])).toBe(true)
    expect(frosted["--muted"]).toBe(plain["--muted"])
  })
})

describe("built-in preset matrix", () => {
  const combos = presetCombos()

  it("holds every built-in preset in both modes, each named apart", () => {
    expect(combos.map((combo) => [combo.preset, combo.mode])).toEqual(
      Object.keys(BUILTIN_PRESETS).flatMap((name) => [
        [name, "light"],
        [name, "dark"],
      ]),
    )
    expect(combos.length).toBeGreaterThan(0)
    const names = [...combos, ...reachableCombos()].map(comboName)
    expect(new Set(names).size).toBe(names.length)
  })

  // What ThemeProvider hands the engine for a user who chose the preset and
  // nothing else, read here from the definitions rather than the resolver.
  it("takes each preset's engine inputs from the registry", () => {
    const registry = resolveRegistry()
    for (const combo of combos) {
      const preset = registry.presets[combo.preset ?? ""]
      const style = registry.styles[preset?.style ?? ""]
      if (!preset || !style) throw new Error(`no preset ${combo.preset}`)
      const axis = <K extends keyof DefinableAxes>(key: K) =>
        preset.axes[key] ?? style.defaults[key] ?? AXES[key].default
      const { railTone, barTone } = registry.signaturesFor(
        style.name,
        preset.name,
      )
      expect(combo).toEqual({
        preset: preset.name,
        mode: combo.mode,
        accentColor: axis("accentColor"),
        surfaceColor: axis("surfaceColor"),
        tintWithAccent: axis("tintWithAccent") === "on",
        signalColor: axis("signalColor"),
        contrast: axis("contrast"),
        darkAccentChroma: axis("darkAccentChroma"),
        backgroundStyle: axis("backgroundStyle"),
        backgroundIntensity: axis("backgroundIntensity"),
        frosted: style.frosted,
        hairlines: style.hairlines,
        railTone,
        barTone,
      })
    }
  })

  it("solves each preset's tokens from every input it carries", () => {
    for (const combo of combos) {
      const { preset, ...inputs } = combo
      expect(finalTokens(combo), preset).toEqual(
        generateTokens({
          backgroundStyle: "solid",
          tintWithAccent: false,
          ...inputs,
        }),
      )
    }
  })

  it.each(combos.map((combo) => [comboName(combo), combo] as const))(
    "holds %s at the text and mark floors",
    (_name, combo) => {
      expect(floorFailures(combo)).toEqual([])
    },
  )
})
