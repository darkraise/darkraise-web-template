import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  comboName,
  finalTokens,
  reachableCombos,
} from "../test/contrast-matrix"

// Fills are solved to a 4.5:1 label at rest, so any hover that moves the fill
// toward its label (a translucent fill letting a light page through, or a wash
// of the label colour) drops it below. Hovers therefore mix toward the fill's
// wash, the end of the lightness range away from the label.

type Rgb = [number, number, number]

const FILLS = {
  "primary-fill": "--primary-foreground",
  "destructive-solid": "--destructive-solid-foreground",
} as const
type Fill = keyof typeof FILLS

/** Hover and press strengths of the filled button state layer. */
const BUTTON_STATE_LAYER = [0.16, 0.28]

/** Strongest stop of the glass badge sheen. */
const GLASS_SHEEN = 0.12

function hslToRgb(triplet: string): Rgb {
  const match = /^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(triplet.trim())
  if (!match)
    throw new Error(`expected an opaque HSL triplet, got "${triplet}"`)
  const h = Number(match[1]) / 360
  const s = Number(match[2]) / 100
  const l = Number(match[3]) / 100
  if (s === 0) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue = (t: number) => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)]
}

/** `color-mix(in srgb, base, top <amount>)`, which is also alpha compositing. */
function mix(base: Rgb, top: Rgb, amount: number): Rgb {
  return base.map(
    (c, i) => c * (1 - amount) + (top[i] as number) * amount,
  ) as Rgb
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: Rgb, b: Rgb): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

function componentStylesheets(): Array<[string, string]> {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return walk(path)
      return entry.name.endsWith(".css") ? [path] : []
    })
  return walk("src/components").map((path) => [
    path,
    readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, ""),
  ])
}

/** Every `color-mix(in srgb, <fill>, <fill>-wash N%)` hover in the kit. */
function washMixes(): Array<{ file: string; fill: Fill; amount: number }> {
  const found: Array<{ file: string; fill: Fill; amount: number }> = []
  for (const [file, css] of componentStylesheets()) {
    for (const hit of css.matchAll(
      /color-mix\(\s*in srgb,\s*hsl\(var\(--(primary-fill|destructive-solid)\)\),\s*hsl\(var\(--\1-wash\)\)\s+(\d+)%\s*\)/g,
    )) {
      found.push({ file, fill: hit[1] as Fill, amount: Number(hit[2]) / 100 })
    }
  }
  return found
}

describe("filled hover states", () => {
  const combos = reachableCombos()

  it("no labelled fill hovers by turning translucent", () => {
    const offenders: string[] = []
    for (const [file, css] of componentStylesheets()) {
      for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const body = rule[2] as string
        if (
          !/text-(primary-foreground|destructive-solid-foreground)/.test(body)
        ) {
          continue
        }
        for (const hit of body.matchAll(
          /(?<![\w-])hover:bg-(primary-fill|destructive-solid)\/\d+(?![\w-])/g,
        )) {
          offenders.push(`${hit[0]} in ${file}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it("badge, time-picker and file-upload hovers mix toward the wash", () => {
    const files = new Set(washMixes().map((m) => m.file.replace(/.*\//, "")))
    expect([...files].sort()).toEqual([
      "badge.css",
      "file-upload.css",
      "time-picker.css",
    ])
  })

  it("filled buttons wash toward their fill's wash, not their label", () => {
    const css = readFileSync("src/components/button/button.css", "utf8")
    expect(css).toMatch(
      /\.dr-btn:not\(\[data-variant="link"\]\)\s*\{\s*@apply state-layer;\s*\}/,
    )
    expect(readFileSync("src/styles/theme.css", "utf8")).toMatch(
      /@utility state-layer\s*\{\s*&::before\s*\{[^}]*background:\s*var\(--state-layer-color,\s*currentColor\)/,
    )
    expect(css).toMatch(
      /\.dr-btn\[data-variant="default"\]\s*\{[^}]*--state-layer-color:\s*hsl\(var\(--primary-fill-wash\)\)/,
    )
    expect(css).toMatch(
      /\.dr-btn\[data-variant="destructive"\]\s*\{[^}]*--state-layer-color:\s*hsl\(var\(--destructive-solid-wash\)\)/,
    )
  })

  it("an on toggle and a selected calendar day wash toward the wash", () => {
    const toggle = readFileSync("src/components/toggle/toggle.css", "utf8")
    expect(toggle).toMatch(/\.dr-toggle\s*\{\s*@apply state-layer;\s*\}/)
    expect(toggle).toMatch(
      /\.dr-toggle\[data-variant="default"\]\[data-state="on"\]\s*\{[^}]*--state-layer-color:\s*hsl\(var\(--primary-fill-wash\)\)/,
    )
    const calendar = readFileSync(
      "src/components/calendar/calendar.css",
      "utf8",
    )
    for (const state of [
      "selected-single",
      "range-start",
      "range-end",
      "range-single",
    ]) {
      expect(calendar).toMatch(
        new RegExp(
          `\\[data-${state}="true"\\][^{]*\\{[^}]*--state-layer-color:\\s*hsl\\(var\\(--primary-fill-wash\\)\\)`,
        ),
      )
    }
  })

  it("the glass badge sheen is drawn from the wash", () => {
    const css = readFileSync("src/components/badge/badge.css", "utf8")
    for (const fill of ["primary-fill", "destructive-solid"]) {
      expect(css).toContain(`hsl(var(--${fill}-wash) / ${GLASS_SHEEN})`)
    }
    expect(css).not.toMatch(/hsl\(var\(--(primary|destructive)\) \/ 0\.[24]5\)/)
  })

  // A glass filled button was 55-70% of its fill mixed toward white over the
  // page, which measured 2.57-2.91:1 in light: translucency cannot work on a
  // fill that sits at its label's contrast floor.
  it("glass filled buttons paint an opaque fill under a wash sheen", () => {
    const css = readFileSync("src/components/button/button.css", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
    const glassFilled = [
      ...css.matchAll(
        /\[data-preset="glass"\] \.dr-btn\[data-variant="default"\](?::hover)?, \[data-preset="glass"\] \.dr-btn\[data-variant="destructive"\](?::hover)? \{([^}]*)\}/g,
      ),
    ].map((m) => m[1] as string)
    expect(glassFilled.length).toBeGreaterThan(0)
    for (const body of glassFilled) {
      expect(body).not.toMatch(/background-color:\s*transparent/)
      expect(body).not.toMatch(/background-image:[^;]*rgba\(255, 255, 255/)
    }
    expect(css).toContain(`hsl(var(--primary-fill-wash) / ${GLASS_SHEEN})`)
    expect(css).toContain(`hsl(var(--destructive-solid-wash) / ${GLASS_SHEEN})`)
  })

  it("every hover, press and sheen keeps the label at 4.5:1 and above rest", () => {
    const amounts = new Map<Fill, Set<number>>([
      ["primary-fill", new Set(BUTTON_STATE_LAYER)],
      ["destructive-solid", new Set(BUTTON_STATE_LAYER)],
    ])
    for (const { fill, amount } of washMixes()) amounts.get(fill)?.add(amount)

    const failures: string[] = []
    for (const combo of combos) {
      const tokens = finalTokens(combo)
      for (const [fillName, labelToken] of Object.entries(FILLS) as Array<
        [Fill, string]
      >) {
        const wash = tokens[`--${fillName}-wash`]
        if (wash === undefined) {
          failures.push(`--${fillName}-wash missing in ${comboName(combo)}`)
          continue
        }
        const fill = hslToRgb(tokens[`--${fillName}`] as string)
        const label = hslToRgb(tokens[labelToken] as string)
        const washRgb = hslToRgb(wash)
        const rest = contrast(label, fill)
        const states: Array<[string, Rgb]> = [
          ...(amounts.get(fillName) ?? []),
        ].map((amount) => [`${amount * 100}%`, mix(fill, washRgb, amount)])
        if (combo.preset === "glass") {
          const hovered = mix(fill, washRgb, 0.16)
          states.push(["glass sheen", mix(fill, washRgb, GLASS_SHEEN)])
          states.push([
            "glass sheen on hover",
            mix(hovered, washRgb, GLASS_SHEEN),
          ])
        }
        for (const [state, painted] of states) {
          const ratio = contrast(label, painted)
          if (ratio < 4.5 || ratio < rest) {
            failures.push(
              `${fillName} ${state} ${comboName(combo)}: ${ratio.toFixed(2)} (rest ${rest.toFixed(2)})`,
            )
          }
        }
      }
    }
    expect(failures).toEqual([])
  }, 30_000)
})
