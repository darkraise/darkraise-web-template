import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"

// The fixed accent-colour badges paint Tailwind palette colours rather than
// theme tokens, so their label contrast is checked against the palette the
// kit resolves. Hover moves one shade away from the label, as the themed
// fills do, instead of turning translucent over the page.

type Rgb = [number, number, number]

const palette = readFileSync(
  createRequire(import.meta.url).resolve("tailwindcss/theme.css"),
  "utf8",
)

/** Linear-light sRGB from a Tailwind `oklch(L% C h)` colour, gamut-clipped. */
function colour(name: string): Rgb {
  if (name === "white") return [1, 1, 1]
  const match = new RegExp(
    `--color-${name}:\\s*oklch\\(([\\d.]+)%\\s+([\\d.]+)\\s+([\\d.]+)\\)`,
  ).exec(palette)
  if (!match) throw new Error(`no palette colour ${name}`)
  const L = Number(match[1]) / 100
  const C = Number(match[2])
  const h = (Number(match[3]) * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.min(1, Math.max(0, c))) as Rgb
}

function contrast(a: Rgb, b: Rgb): number {
  const lum = ([r, g, bl]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * bl
  const [x, y] = [lum(a), lum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const HUES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]

const badgeCss = readFileSync("src/components/badge/badge.css", "utf8")

function variant(hue: string) {
  const body = new RegExp(
    `\\.dr-badge\\[data-variant="${hue}"\\]\\s*\\{([^}]*)\\}`,
  ).exec(badgeCss)?.[1]
  if (!body) throw new Error(`no rule for ${hue}`)
  // Hover lives on its own rule, scoped to a badge that is a link or button.
  const hoverBody = new RegExp(
    `\\.dr-badge:is\\(a, button, \\[role="button"\\]\\)\\[data-variant="${hue}"\\]:hover\\s*\\{([^}]*)\\}`,
  ).exec(badgeCss)?.[1]
  const fill = /(?<![\w:-])bg-([a-z]+-\d+)(?![\w/-])/.exec(body)?.[1]
  const label = /(?<![\w:-])text-(white|[a-z]+-\d+)(?![\w/-])/.exec(body)?.[1]
  const hover = /(?<![\w:-])bg-([a-z]+-\d+)(?![\w/-])/.exec(
    hoverBody ?? "",
  )?.[1]
  return { fill, label, hover }
}

describe("fixed accent-colour badges", () => {
  it("every hue has an opaque fill, a label and an opaque hover shade", () => {
    for (const hue of HUES) {
      const { fill, label, hover } = variant(hue)
      expect(fill, hue).toMatch(new RegExp(`^${hue}-\\d+$`))
      expect(label, hue).toBeDefined()
      expect(hover, hue).toMatch(new RegExp(`^${hue}-\\d+$`))
    }
  })

  it("the label clears 4.5:1 at rest and on hover, and hover moves away from it", () => {
    const failures: string[] = []
    for (const hue of HUES) {
      const { fill, label, hover } = variant(hue)
      if (!fill || !label || !hover) {
        failures.push(`${hue}: unreadable rule`)
        continue
      }
      const text = colour(label)
      const rest = contrast(text, colour(fill))
      const hovered = contrast(text, colour(hover))
      if (rest < 4.5 || hovered < 4.5 || hovered < rest) {
        failures.push(
          `${hue}: ${label} on ${fill} ${rest.toFixed(2)}, on ${hover} ${hovered.toFixed(2)}`,
        )
      }
    }
    expect(failures).toEqual([])
  })
})
