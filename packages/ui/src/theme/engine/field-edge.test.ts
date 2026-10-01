import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { contrastRatio } from "@theme/engine/oklch"
import { parseRules } from "../../styles/interactive-classes"
import {
  applyBorderIntensity,
  CANVAS_BLOB_SCALE,
  CANVAS_PEAK_SHARE,
  generateTokens,
  gradientCanvasPeak,
  isAccentSurface,
} from "@theme/engine/generateTokens"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import {
  BORDER_INTENSITIES,
  type ColorScale,
  type SurfaceColor,
} from "@theme/types"
import {
  comboName,
  finalTokens,
  isOpaque,
  reachableCombos,
  type ThemeCombo,
} from "../../test/contrast-matrix"

// Every ground a field, checkbox, radio or switch can sit on. The edge is
// one value per theme, so it has to hold against all of them at once.
const GROUNDS = [
  "--background",
  "--card",
  "--surface-sunken",
  "--control-well-deep",
  "--surface-sidebar",
  "--surface-header",
] as const

// A glass card is translucent over the gradient canvas, so the rendered ground
// under a field drifts from these opaque values. The margin keeps the rendered
// edge at 3:1 (measured by the template's control-contract e2e spec).
const floorFor = (preset: string) => (preset === "glass" ? 3.5 : 3)

describe("--field-edge-color", () => {
  it("clears 3:1 (3.5:1 under glass) on every ground at every border intensity, and never moves", () => {
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      const base = finalTokens(combo)
      const edge = base["--field-edge-color"]
      if (!isOpaque(edge)) {
        failures.push(
          `${comboName(combo)}: edge ${String(edge)} is not an opaque triplet`,
        )
        continue
      }
      for (const step of BORDER_INTENSITIES) {
        const tokens = applyBorderIntensity(base, step)
        if (tokens["--field-edge-color"] !== edge) {
          failures.push(`${comboName(combo)} ${step}: edge moved`)
        }
        for (const ground of GROUNDS) {
          const value = tokens[ground]
          if (!isOpaque(value)) {
            failures.push(
              `${comboName(combo)} ${step}: ${ground} is not opaque`,
            )
            continue
          }
          const ratio = contrastRatio(edge, value)
          if (ratio < floorFor(combo.preset)) {
            failures.push(
              `${comboName(combo)} ${step}: ${ratio.toFixed(2)} on ${ground}`,
            )
          }
        }
      }
    }
    expect(failures).toEqual([])
  })
})

// `--sf-hue`: the colour the gradient canvas paints over the page.
function surfaceHue(surfaceColor: SurfaceColor): string {
  return isAccentSurface(surfaceColor)
    ? accentColors[surfaceColor][500]
    : (surfaceColors[surfaceColor] as ColorScale)[500]
}

function gradientTokens(combo: ThemeCombo): Record<string, string> {
  return generateTokens({
    accentColor: combo.accentColor,
    surfaceColor: combo.surfaceColor,
    preset: combo.preset,
    backgroundStyle: "gradient",
    mode: combo.mode,
    accentIntensity: combo.accentIntensity,
    backgroundIntensity: combo.backgroundIntensity,
  })
}

describe("--field-edge-color under a gradient canvas", () => {
  it("clears the floor where the canvas is loudest, at every intensity", () => {
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      const tokens = gradientTokens(combo)
      const edge = tokens["--field-edge-color"]
      const page = tokens["--background"]
      if (!isOpaque(edge) || !isOpaque(page)) {
        failures.push(`${comboName(combo)}: edge or page is not opaque`)
        continue
      }
      const peak = gradientCanvasPeak(
        page,
        surfaceHue(combo.surfaceColor),
        combo.mode,
        combo.backgroundIntensity,
      )
      const ratio = contrastRatio(edge, peak)
      if (ratio < floorFor(combo.preset)) {
        failures.push(`${comboName(combo)}: ${ratio.toFixed(2)} on ${peak}`)
      }
    }
    expect(failures).toEqual([])
  })

  // The page under a field in the template's control-contract fixture, as
  // Chromium painted it at 1280px for slate under the intense gradient. The
  // edge solved against the opaque page alone measured 2.63:1 and 2.72:1 here.
  it.each([
    ["light", "215 25% 81%"],
    ["dark", "221 33% 20%"],
  ] as const)(
    "reaches 3:1 on the rendered intense glass page (%s)",
    (mode, page) => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "glass",
        backgroundStyle: "gradient",
        mode,
        accentIntensity: "balanced",
        backgroundIntensity: "intense",
      })
      const edge = tokens["--field-edge-color"] as string
      expect(contrastRatio(edge, page)).toBeGreaterThanOrEqual(3)
    },
  )
})

describe("--field-edge", () => {
  it("wraps the engine triplet for the field family", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8")
    expect(theme).toMatch(/--field-edge:\s*hsl\(var\(--field-edge-color\)\);/)
  })
})

describe("the gradient canvas model against theme.css", () => {
  const rules = parseRules(readFileSync("src/styles/theme.css", "utf8"))

  const declaration = (body: string, name: string): string => {
    const start = body.indexOf(`--canvas-${name}:`)
    if (start < 0) return ""
    const rest = body.slice(start)
    const end = rest.search(/;\s*(--|$)/)
    return end < 0 ? rest : rest.slice(0, end)
  }

  it.each(Object.entries(CANVAS_BLOB_SCALE))(
    "scales the %s step as the stylesheet does",
    (intensity, scale) => {
      const rule = rules.find((r) =>
        r.selectors.includes(`[data-background-intensity="${intensity}"]`),
      )
      expect(rule, `no rule for ${intensity}`).toBeDefined()
      expect(rule?.body).toContain(`--canvas-blob-scale: ${scale};`)
    },
  )

  // Dark is the unqualified canvas: :root and the pattern blocks. Light is
  // every block that names data-mode="light".
  const MODES = [
    ["dark", (selector: string) => !selector.includes("data-mode")],
    ["light", (selector: string) => selector.includes('data-mode="light"')],
  ] as const

  it.each(MODES)(
    "models the %s ink as the stylesheet's top stop",
    (mode, owns) => {
      const stops = rules
        .filter((r) => r.selectors.some(owns))
        .map((r) => declaration(r.body, "ink"))
        .filter(Boolean)
        .map((text) => Number(/var\(--sf-hue\) ([\d.]+)%/.exec(text)?.[1]))
      expect(stops.length).toBeGreaterThan(0)
      for (const stop of stops) {
        expect(stop / 100).toBeCloseTo(CANVAS_PEAK_SHARE[mode].ink, 5)
      }
    },
  )

  it.each(MODES)(
    "covers the loudest single %s blob in any gradient pattern",
    (mode, owns) => {
      const peaks = rules
        .filter((r) => r.selectors.some(owns))
        .flatMap((r) =>
          ["blob-a", "blob-b", "blob-c", "blob-d"].map((name) =>
            Number(
              /calc\(([\d.]+)% \* var\(--canvas-blob-scale\)\)/.exec(
                declaration(r.body, name),
              )?.[1],
            ),
          ),
        )
        .filter((peak) => !Number.isNaN(peak))
      expect(peaks.length).toBeGreaterThan(4)
      expect(Math.max(...peaks) / 100).toBeLessThanOrEqual(
        CANVAS_PEAK_SHARE[mode].blobs,
      )
    },
  )
})
