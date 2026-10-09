import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { GLASS_BLURS, GLASS_OPACITIES } from "@theme/types"
import { stripCssComments } from "../../../test/strip-css-comments"

// jsdom never parses CSS, so the stylesheet text is what this asserts. The
// fog alphas and edge speculars are pinned value by value: nothing else
// checks the opacity tables.
const GLASS = readFileSync("src/theme/styles/glass/glass.css", "utf8")
const THEME = readFileSync("src/styles/theme.css", "utf8")

interface Rule {
  selector: string
  body: string
}

/** Prettier wraps long values inside ( … ); undo that. */
function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

/** Innermost rules; the media query wrapper is transparent. */
const RULES: Rule[] = [
  ...stripCssComments(GLASS).matchAll(/([^{}]+)\{([^{}]*)\}/g),
].map((match) => ({
  selector: normalise(match[1] as string),
  body: normalise(match[2] as string),
}))

/** The value `name` takes in the rule whose selector is exactly `selector`. */
function valueOf(selector: string, name: string): string {
  const rule = RULES.find((r) => r.selector === selector)
  if (!rule) throw new Error(`no rule ${selector}`)
  const after = rule.body.split(`${name}:`)[1]
  if (after === undefined) throw new Error(`${selector} sets no ${name}`)
  return (after.split(";")[0] as string).trim()
}

const GLASS_ROOT = '[data-style="glass"]'
const MODES = ["light", "dark"] as const

const TINT = {
  light: "color-mix(in oklab, hsl(var(--primary-8)) 24%, white)",
  dark: "color-mix(in oklab, hsl(var(--primary-8)) 40%, hsl(var(--neutral-1)))",
} as const

const FOG_ALPHA = {
  light: {
    subtle: [70, 80, 85, 90, 94, 98],
    medium: [55, 65, 72, 82, 90, 96],
    strong: [30, 40, 48, 58, 70, 82],
  },
  dark: {
    subtle: [7, 12, 17, 24, 32, 50],
    medium: [4, 7, 10, 14, 20, 38],
    strong: [2, 4, 6, 9, 13, 24],
  },
} as const

/** Top and side alphas of --glass-inset, then of --glass-inset-strong. */
const INSET = {
  light: {
    subtle: ["0.75", "0.45", "0.94", "0.56"],
    medium: ["0.6", "0.36", "0.75", "0.45"],
    strong: ["0.4", "0.24", "0.5", "0.3"],
  },
  dark: {
    subtle: ["0.18", "0.11", "0.22", "0.13"],
    medium: ["0.14", "0.08", "0.18", "0.11"],
    strong: ["0.08", "0.05", "0.1", "0.06"],
  },
} as const

const specular = (top: string, side: string) =>
  `inset 0 1px 0 rgba(255, 255, 255, ${top}), inset 1px 0 0 rgba(255, 255, 255, ${side})`

const MODE_OPACITY = MODES.flatMap((mode) =>
  GLASS_OPACITIES.map((opacity) => [mode, opacity] as const),
)

describe("glass fog and specular", () => {
  it.each(MODE_OPACITY)(
    "tints the %s fog at %s opacity from the mark step",
    (mode, opacity) => {
      const selector = `[data-mode="${mode}"]${GLASS_ROOT}[data-glass-opacity="${opacity}"]`
      FOG_ALPHA[mode][opacity].forEach((alpha, i) => {
        expect(valueOf(selector, `--glass-fog-${i + 1}`)).toBe(
          `color-mix(in oklab, ${TINT[mode]} ${alpha}%, transparent)`,
        )
      })
    },
  )

  it.each(MODE_OPACITY)("lights the %s edge at %s opacity", (mode, opacity) => {
    const selector = `[data-mode="${mode}"]${GLASS_ROOT}[data-glass-opacity="${opacity}"]`
    const [top, side, strongTop, strongSide] = INSET[mode][opacity]
    expect(valueOf(selector, "--glass-inset")).toBe(specular(top, side))
    expect(valueOf(selector, "--glass-inset-strong")).toBe(
      specular(strongTop, strongSide),
    )
  })
})

describe("glass overlays", () => {
  it.each([
    ["subtle", "0.88"],
    ["medium", "0.76"],
    ["strong", "0.62"],
  ] as const)("bases a %s overlay on the popover at %s", (opacity, alpha) => {
    expect(
      valueOf(
        `${GLASS_ROOT}[data-glass-opacity="${opacity}"]`,
        "--surface-overlay-base",
      ),
    ).toBe(`hsl(var(--popover) / ${alpha})`)
  })

  it.each([
    ["light", "--glass-fog-3", "--glass-fog-1", "32px", "2%"],
    ["dark", "--glass-fog-4", "--glass-fog-2", "40px", "28%"],
  ] as const)(
    "frosts the %s overlay with noise, fog and the strong specular",
    (mode, from, to, spread, tint) => {
      const selector = `[data-mode="${mode}"]${GLASS_ROOT}`
      expect(valueOf(selector, "--surface-overlay-layers")).toBe(
        `var(--glass-noise), linear-gradient(135deg, var(${from}), var(${to}))`,
      )
      expect(valueOf(selector, "--overlay-shadow")).toBe(
        `var(--elevation-medium), var(--glass-inset-strong), inset 0 0 ${spread} color-mix(in oklab, hsl(var(--surface-tint)) ${tint}, transparent), var(--glow-outer), var(--glow-inner)`,
      )
    },
  )

  it("blends the noise over the fog and rims overlays with the fog", () => {
    expect(valueOf(GLASS_ROOT, "--surface-overlay-blend-mode")).toBe(
      "overlay, normal",
    )
    expect(valueOf(GLASS_ROOT, "--overlay-border")).toBe("var(--glass-fog-4)")
  })

  it("tints light glass's dropdown shadow and keeps dark's black", () => {
    expect(valueOf(GLASS_ROOT, "--shadow-dropdown")).toBe(
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    )
    expect(
      valueOf(`[data-mode="light"]${GLASS_ROOT}`, "--shadow-dropdown"),
    ).toBe(
      "0 10px 15px -3px rgb(16 24 40 / 0.1), 0 4px 6px -4px rgb(16 24 40 / 0.1)",
    )
  })
})

describe("glass blur", () => {
  const BLUR = {
    none: ["none", "none"],
    low: ["blur(6px) saturate(140%)", "blur(9px) saturate(140%)"],
    medium: ["blur(12px) saturate(140%)", "blur(18px) saturate(140%)"],
    high: ["blur(24px) saturate(140%)", "blur(36px) saturate(140%)"],
  } as const

  it("covers every blur step", () => {
    expect(Object.keys(BLUR)).toEqual([...GLASS_BLURS])
  })

  it.each(GLASS_BLURS)("blurs overlays and chrome at %s", (blur) => {
    const selector = `${GLASS_ROOT}[data-glass-blur="${blur}"]`
    const [overlay, chrome] = BLUR[blur]
    expect(valueOf(selector, "--overlay-backdrop")).toBe(overlay)
    expect(valueOf(selector, "--chrome-backdrop")).toBe(chrome)
  })
})

describe("glass chrome", () => {
  it.each([
    [
      "--chrome-rail-bg",
      "linear-gradient(135deg, var(--glass-fog-5), var(--glass-fog-3))",
    ],
    [
      "--chrome-bar-bg",
      "linear-gradient(180deg, var(--glass-fog-5), var(--glass-fog-3))",
    ],
    ["--chrome-edge", "var(--glass-fog-4)"],
    ["--chrome-shadow", "var(--glass-inset)"],
  ])("sets %s to %s", (name, value) => {
    expect(valueOf(GLASS_ROOT, name)).toBe(value)
  })

  it("shows the canvas behind chrome on a gradient background", () => {
    expect(
      valueOf(
        `${GLASS_ROOT}[data-background-style="gradient"]`,
        "--chrome-canvas",
      ),
    ).toBe(
      "var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-blob-d), var(--canvas-ink)",
    )
  })
})

describe("reduced transparency and more contrast", () => {
  const SELECTOR = `${GLASS_ROOT}[data-mode][data-glass-opacity][data-glass-blur][data-background-style]`

  it("outranks every glass rule from inside the media query", () => {
    expect(normalise(GLASS)).toContain(
      `@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) { ${SELECTOR} {`,
    )
  })

  it.each([
    ["--chrome-rail-bg", "hsl(var(--surface-sidebar))"],
    ["--chrome-bar-bg", "hsl(var(--surface-header))"],
    ["--chrome-edge", "hsl(var(--sidebar-border))"],
    ["--chrome-backdrop", "none"],
    ["--chrome-canvas", "none"],
    ["--surface-overlay-layers", ""],
    ["--surface-overlay-base", "hsl(var(--popover))"],
    ["--surface-overlay-blend-mode", "normal"],
    ["--overlay-border", "hsl(var(--border))"],
    ["--overlay-backdrop", "none"],
  ])("sets %s to %s", (name, value) => {
    expect(valueOf(SELECTOR, name)).toBe(value)
  })
})

describe("base overlay backdrop", () => {
  it("leaves overlays unblurred outside Glass", () => {
    expect(normalise(THEME)).toContain("--overlay-backdrop: none;")
  })

  it("declares the glass noise only in glass.css", () => {
    expect(THEME).not.toContain("--glass-noise")
  })
})
