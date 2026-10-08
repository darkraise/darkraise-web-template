import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { composite, contrastRatio } from "@theme/engine/oklch"
import { parseRules } from "../../styles/interactive-classes"
import {
  CANVAS_BLOB_SCALE,
  CANVAS_PEAK_SHARE,
  FROSTED_LIFTED_FACE_TINT,
  LIFTED_FACE_TINT,
  generateTokens,
  gradientCanvasPeak,
} from "@theme/engine/generateTokens"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { SurfaceColor } from "@theme/types"
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
  "--control-well",
  "--surface-sidebar",
  "--surface-header",
] as const

// Fields are opaque under every style, so the mark floor applies everywhere.
const FLOOR = 3

describe("--field-edge-color", () => {
  it("clears 3:1 on every ground, frosted or not", () => {
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      const tokens = finalTokens(combo)
      const edge = tokens["--field-edge-color"]
      if (!isOpaque(edge)) {
        failures.push(
          `${comboName(combo)}: edge ${String(edge)} is not an opaque triplet`,
        )
        continue
      }
      for (const ground of GROUNDS) {
        const value = tokens[ground]
        if (!isOpaque(value)) {
          failures.push(`${comboName(combo)}: ${ground} is not opaque`)
          continue
        }
        const ratio = contrastRatio(edge, value)
        if (ratio < FLOOR) {
          failures.push(`${comboName(combo)}: ${ratio.toFixed(2)} on ${ground}`)
        }
      }
    }
    expect(failures).toEqual([])
  }, 30_000)

  it("still clears 3:1 once a browser rounds both colours to 8-bit sRGB", () => {
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      const tokens = finalTokens(combo)
      const edge = tokens["--field-edge-color"]
      if (!isOpaque(edge)) continue
      for (const ground of GROUNDS) {
        const value = tokens[ground]
        if (!isOpaque(value)) continue
        const ratio = renderedContrast(edge, value)
        if (ratio < FLOOR) {
          failures.push(`${comboName(combo)}: ${ratio.toFixed(3)} on ${ground}`)
        }
      }
    }
    expect(failures).toEqual([])
  }, 30_000)
})

function renderedLuminance(hsl: string): number {
  const [h = 0, s = 0, l = 0] = hsl.match(/[\d.]+/g)?.map(Number) ?? []
  const sat = s / 100
  const light = l / 100
  const chroma = sat * Math.min(light, 1 - light)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const value = light - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    const byte = Math.round(value * 255) / 255
    return byte <= 0.04045 ? byte / 12.92 : ((byte + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4)
}

function renderedContrast(a: string, b: string): number {
  const [hi, lo] = [renderedLuminance(a), renderedLuminance(b)].sort(
    (x, y) => y - x,
  ) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

// `--sf-hue`: the colour the gradient canvas paints over the page.
function surfaceHue(surfaceColor: SurfaceColor): string {
  return surfaceColors[surfaceColor][500]
}

function gradientTokens(combo: ThemeCombo): Record<string, string> {
  return generateTokens({
    accentColor: combo.accentColor,
    surfaceColor: combo.surfaceColor,
    frosted: combo.frosted,
    backgroundStyle: "gradient",
    mode: combo.mode,
    contrast: combo.contrast,
    darkAccentChroma: combo.darkAccentChroma,
    tintWithAccent: false,
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
      if (ratio < FLOOR) {
        failures.push(`${comboName(combo)}: ${ratio.toFixed(2)} on ${peak}`)
      }
    }
    expect(failures).toEqual([])
  }, 30_000)

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
        frosted: true,
        backgroundStyle: "gradient",
        mode,
        contrast: "standard",
        darkAccentChroma: "standard",
        tintWithAccent: false,
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

describe("--field-edge-lifted-color", () => {
  it("clears 3:1 on the brightest lifted face in dark", () => {
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      if (combo.mode !== "dark") continue
      const tokens = finalTokens(combo)
      const edge = tokens["--field-edge-lifted-color"]
      if (!isOpaque(edge)) {
        failures.push(`${comboName(combo)}: edge is not opaque`)
        continue
      }
      const tint = combo.frosted ? FROSTED_LIFTED_FACE_TINT : LIFTED_FACE_TINT
      // A popup's `surface` prop can paint it muted, a step above the card.
      for (const ground of ["--card", "--muted"]) {
        const value = tokens[ground]
        if (!isOpaque(value)) {
          failures.push(`${comboName(combo)}: ${ground} is not opaque`)
          continue
        }
        const face = composite(value, "0 0% 100%", tint)
        const ratio = renderedContrast(edge, face)
        if (ratio < FLOOR) {
          failures.push(
            `${comboName(combo)}: ${ratio.toFixed(3)} on ${ground} ${face}`,
          )
        }
      }
    }
    expect(failures).toEqual([])
  }, 30_000)

  it("matches the plain edge in light, where nothing lifts", () => {
    for (const combo of reachableCombos()) {
      if (combo.mode !== "light") continue
      const tokens = finalTokens(combo)
      expect(tokens["--field-edge-lifted-color"]).toBe(
        tokens["--field-edge-color"],
      )
    }
  }, 30_000)

  it("covers the stylesheet's brightest lift under Tactile's card sheen", () => {
    const tactile = readFileSync("src/theme/styles/tactile/tactile.css", "utf8")
    const alphas = (css: string, pattern: RegExp) =>
      [...css.matchAll(pattern)].map((m) => Number(m[1]))
    // A style file may declare a lift of its own, so every one is read.
    const liftSheets = [
      join("src", "styles", "theme.css"),
      ...readdirSync(join("src", "theme", "styles"), { recursive: true })
        .map(String)
        .filter((file) => file.endsWith(".css"))
        .map((file) => join("src", "theme", "styles", file)),
    ]
    expect(liftSheets).toContain(
      join("src", "theme", "styles", "tactile", "tactile.css"),
    )
    const lift = Math.max(
      ...liftSheets.flatMap((path) =>
        alphas(
          readFileSync(path, "utf8"),
          /--elevation-lift-tint-\w+: rgb\(255 255 255 \/ ([\d.]+)\)/g,
        ),
      ),
    )
    const sheen = Math.max(
      ...alphas(
        tactile.replace(/\s+/g, " "),
        /--card-sheen: linear-gradient\( 180deg, rgb\(255 255 255 \/ ([\d.]+)\)/g,
      ),
    )
    expect(lift).toBeGreaterThan(0)
    expect(sheen).toBeGreaterThan(0)
    expect(1 - (1 - lift) * (1 - sheen)).toBeLessThanOrEqual(LIFTED_FACE_TINT)
  })

  it("is what elevated cards and popups give their fields", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8")
    const card = readFileSync("src/components/card/card.css", "utf8")
    expect(theme).toMatch(
      /--field-edge-lifted:\s*hsl\(var\(--field-edge-lifted-color\)\);/,
    )
    const utility = theme.slice(theme.indexOf("@utility overlay-surface"))
    expect(utility.slice(0, utility.indexOf("}"))).toContain(
      "--field-edge: var(--field-edge-lifted);",
    )
    for (const level of ["auto", "low", "medium", "high"]) {
      const start = card.indexOf(`.dr-card[data-card-elevation="${level}"]`)
      const rule = card.slice(start, card.indexOf("}", start))
      expect(rule, level).toContain("--field-edge: var(--field-edge-lifted);")
    }
  })

  // Any other rule that draws a lifted shadow lightens its face the same way.
  it("is what every other lifted surface gives its fields", () => {
    const lifted =
      /shadow-\[var\(--(?:card-elevation|elevation|shadow)-(?:low|medium|high)\)\]|box-shadow:[^;]*var\(--(?:card-elevation|elevation|shadow)-(?:low|medium|high)\)/
    const missing: string[] = []
    for (const path of componentStylesheets()) {
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!lifted.test(body as string)) continue
        if (/@apply[^;]*\boverlay-surface\b/.test(body as string)) continue
        if (
          (body as string).includes("--field-edge: var(--field-edge-lifted);")
        )
          continue
        missing.push(`${path}: ${(selector as string).trim()}`)
      }
    }
    expect(missing).toEqual([])
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

function componentStylesheets(): string[] {
  return readdirSync("src/components", { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".css"))
    .map((file) => `src/components/${file}`)
}
