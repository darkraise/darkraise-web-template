import { describe, expect, it } from "vitest"
import { composite, contrastRatio } from "@theme/engine/oklch"
import {
  generateTokens,
  type ChromeTone,
  type GenerateTokensInput,
} from "@theme/engine/generateTokens"
import { ACCENT_COLORS, SURFACE_COLORS } from "@theme/types"

const base: GenerateTokensInput = {
  accentColor: "blue",
  surfaceColor: "zinc",
  frosted: false,
  backgroundStyle: "solid",
  mode: "light",
  contrast: "standard",
  darkAccentChroma: "standard",
  tintWithAccent: false,
}

const MODES = ["light", "dark"] as const
const TONES = ["page", "raised", "inverse", "accent"] as const
const TONED = ["inverse", "accent"] as const
const TEXT = 4.5
const MARK = 3

const RAIL_TIERS = [
  "--sidebar-foreground",
  "--sidebar-foreground-hover",
  "--sidebar-foreground-muted",
  "--sidebar-border",
  "--sidebar-hover-bg",
  "--sidebar-active-bg",
] as const

/** The rail tier each bar tier mirrors. */
const BAR_TIERS = {
  "--bar-foreground": "--sidebar-foreground",
  "--bar-foreground-hover": "--sidebar-foreground-hover",
  "--bar-foreground-muted": "--sidebar-foreground-muted",
  "--bar-border": "--sidebar-border",
  "--bar-hover-bg": "--sidebar-hover-bg",
  "--bar-active-bg": "--sidebar-active-bg",
} as const

/** `H S% L%` or `H S% L% / a` → the colour and the alpha it paints at. */
function split(value: string): [string, number] {
  const [colour, alpha] = value.split("/").map((part) => part.trim())
  return [colour as string, alpha === undefined ? 1 : parseFloat(alpha)]
}

const combos = SURFACE_COLORS.flatMap((surfaceColor) =>
  MODES.map((mode) => [`${surfaceColor} ${mode}`, surfaceColor, mode] as const),
)

/** Every rail and bar pairing in which at least one region is toned. */
const PAIRS = TONES.flatMap((railTone) =>
  TONES.map((barTone) => [railTone, barTone] as const),
).filter(([rail, bar]) => rail !== "page" || bar !== "page")

describe("generateTokens chrome tone", () => {
  it("paints today's chrome when both tones are page or omitted", () => {
    for (const mode of MODES) {
      for (const frosted of [false, true]) {
        const today = generateTokens({ ...base, mode, frosted })
        expect(
          generateTokens({
            ...base,
            mode,
            frosted,
            railTone: "page",
            barTone: "page",
          }),
        ).toEqual(today)
      }
    }
  })

  it("paints a raised rail and a raised bar on the card", () => {
    for (const mode of MODES) {
      const tokens = generateTokens({
        ...base,
        mode,
        railTone: "raised",
        barTone: "raised",
      })
      expect(tokens["--surface-sidebar"]).toBe(tokens["--card"])
      expect(tokens["--surface-header"]).toBe(tokens["--card"])
    }
  })

  it("changes only the region it tones", () => {
    const page = generateTokens(base)
    const changed = (input: Partial<GenerateTokensInput>) => {
      const toned = generateTokens({ ...base, ...input })
      return Object.keys(toned).filter((key) => page[key] !== toned[key])
    }
    for (const tone of ["raised", ...TONED] as const) {
      for (const key of changed({ railTone: tone })) {
        expect(key, `rail ${tone}`).toMatch(/^--(surface-sidebar|sidebar-)/)
      }
      for (const key of changed({ barTone: tone })) {
        expect(key, `bar ${tone}`).toMatch(/^--(surface-header|bar-)/)
      }
    }
  })

  it("adds the bar tiers only while the bar is toned", () => {
    for (const railTone of TONES) {
      for (const barTone of ["page", "raised"] as const) {
        const tokens = generateTokens({ ...base, railTone, barTone })
        for (const key of Object.keys(BAR_TIERS)) {
          expect(tokens[key], `${railTone}/${barTone} ${key}`).toBeUndefined()
        }
      }
    }
  })

  it("gives a bar in the rail's tone the rail's fill and tiers", () => {
    for (const mode of MODES) {
      for (const tone of TONED) {
        const tokens = generateTokens({
          ...base,
          mode,
          railTone: tone,
          barTone: tone,
        })
        expect(tokens["--surface-header"]).toBe(tokens["--surface-sidebar"])
        for (const [bar, rail] of Object.entries(BAR_TIERS)) {
          expect(tokens[bar], `${mode} ${tone} ${bar}`).toBe(tokens[rail])
        }
      }
    }
  })

  it("solves the bar on its own fill when its tone differs from the rail's", () => {
    for (const mode of MODES) {
      // Admin Bevel: an inverse bar over the page rail.
      const bevel = generateTokens({
        ...base,
        mode,
        railTone: "page",
        barTone: "inverse",
      })
      const page = generateTokens({ ...base, mode })
      expect(bevel["--surface-sidebar"]).toBe(page["--surface-sidebar"])
      for (const tier of RAIL_TIERS) expect(bevel[tier]).toBe(page[tier])
      expect(bevel["--surface-header"]).not.toBe(page["--surface-header"])

      // Red Graphite: an inverse rail beside the page bar.
      const graphite = generateTokens({
        ...base,
        mode,
        railTone: "inverse",
        barTone: "page",
      })
      expect(graphite["--surface-header"]).toBe(page["--surface-header"])
      expect(graphite["--surface-sidebar"]).toBe(bevel["--surface-header"])
      for (const [bar, rail] of Object.entries(BAR_TIERS)) {
        expect(bevel[bar], `${mode} ${bar}`).toBe(graphite[rail])
      }
    }
  })

  it("darkens an inverse region in both modes", () => {
    for (const mode of MODES) {
      const tokens = generateTokens({
        ...base,
        mode,
        railTone: "inverse",
        barTone: "inverse",
      })
      const page = tokens["--background"] as string
      for (const fill of ["--surface-sidebar", "--surface-header"]) {
        // Darker than the page: the ink is the light end in both modes.
        expect(
          contrastRatio(tokens[fill] as string, "0 0% 0%"),
          `${mode} ${fill}`,
        ).toBeLessThan(contrastRatio(page, "0 0% 0%"))
      }
    }
  })

  it.each(combos)(
    "holds both regions' tiers at the text and mark floors (%s)",
    (_name, surfaceColor, mode) => {
      const failures: string[] = []
      for (const accentColor of ACCENT_COLORS) {
        for (const [railTone, barTone] of PAIRS) {
          const tokens = generateTokens({
            ...base,
            accentColor,
            surfaceColor,
            mode,
            railTone,
            barTone,
          })
          const at = (key: string) => tokens[key] as string
          const regions: [string, ChromeTone, string, string][] = [
            ["rail", railTone, "--surface-sidebar", "--sidebar"],
          ]
          if (barTone === "inverse" || barTone === "accent") {
            regions.push(["bar", barTone, "--surface-header", "--bar"])
          }
          for (const [region, tone, fillKey, prefix] of regions) {
            if (tone === "page") continue
            const label = `${railTone}/${barTone} ${accentColor} ${region}`
            const fill = at(fillKey)
            const check = (what: string, ratio: number, floor: number) => {
              if (ratio < floor)
                failures.push(`${label} ${what} ${ratio.toFixed(2)}`)
            }
            const ink = at(`${prefix}-foreground-hover`)
            check("text", contrastRatio(at(`${prefix}-foreground`), fill), TEXT)
            check(
              "muted",
              contrastRatio(at(`${prefix}-foreground-muted`), fill),
              TEXT,
            )
            check("hover text", contrastRatio(ink, fill), TEXT)
            for (const ground of [
              `${prefix}-hover-bg`,
              `${prefix}-active-bg`,
            ]) {
              const [colour, alpha] = split(at(ground))
              check(
                `text on ${ground}`,
                contrastRatio(ink, composite(fill, colour, alpha)),
                TEXT,
              )
            }
            if (tone !== "raised") {
              check("mark", contrastRatio(ink, fill), MARK)
            }
          }
        }
      }
      expect(failures).toEqual([])
    },
  )
})
