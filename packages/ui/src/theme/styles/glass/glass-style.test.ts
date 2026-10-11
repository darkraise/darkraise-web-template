import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { GLASS_BLURS, GLASS_OPACITIES } from "@theme/types"
import { cssRules } from "../../../test/css-rules"
import { stripCssComments } from "../../../test/strip-css-comments"

// jsdom never parses CSS, so the compiled stylesheet text is what this
// asserts. The fog alphas and edge speculars are pinned value by value:
// nothing else checks the opacity tables.
const GLASS = readFileSync("src/theme/styles/generated/glass.css", "utf8")
const THEME = readFileSync("src/styles/theme.css", "utf8")

interface Rule {
  /** The `@layer` block the rule sits in. */
  layer: string
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
const RULES: Rule[] = cssRules(stripCssComments(GLASS)).map((rule) => ({
  layer: rule.wrappers[0] ?? "",
  selector: normalise(rule.selector),
  body: normalise(rule.body),
}))

/** The value `name` takes in `layer`'s rule whose selector is exactly `selector`. */
function valueOf(layer: string, selector: string, name: string): string {
  const rule = RULES.find(
    (r) => r.layer === `@layer ${layer}` && r.selector === selector,
  )
  if (!rule) throw new Error(`no rule ${selector} in @layer ${layer}`)
  const after = rule.body.split(`${name}:`)[1]
  if (after === undefined) throw new Error(`${selector} sets no ${name}`)
  return (after.split(";")[0] as string).trim()
}

const GLASS_ROOT = '[data-style="glass"]'
const MODES = ["light", "dark"] as const

/** Glass's selector in one mode, with `rest` appended. */
function inMode(mode: (typeof MODES)[number], rest = ""): string {
  return mode === "light"
    ? `${GLASS_ROOT}:not([data-mode="dark"])${rest}`
    : `[data-mode="dark"]${GLASS_ROOT}${rest}`
}

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
      const selector = inMode(mode, `[data-glass-opacity="${opacity}"]`)
      FOG_ALPHA[mode][opacity].forEach((alpha, i) => {
        expect(valueOf("style.when", selector, `--glass-fog-${i + 1}`)).toBe(
          `color-mix(in oklab, ${TINT[mode]} ${alpha}%, transparent)`,
        )
      })
    },
  )

  it.each(MODE_OPACITY)("lights the %s edge at %s opacity", (mode, opacity) => {
    const selector = inMode(mode, `[data-glass-opacity="${opacity}"]`)
    const [top, side, strongTop, strongSide] = INSET[mode][opacity]
    expect(valueOf("style.when", selector, "--glass-inset")).toBe(
      specular(top, side),
    )
    expect(valueOf("style.when", selector, "--glass-inset-strong")).toBe(
      specular(strongTop, strongSide),
    )
  })
})

/** Whether Glass's rule `selector` in `layer` declares `name` at all. */
function declares(layer: string, selector: string, name: string): boolean {
  return RULES.some(
    (r) =>
      r.layer === `@layer ${layer}` &&
      r.selector === selector &&
      r.body.includes(`${name}:`),
  )
}

describe("glass overlays", () => {
  it.each([
    ["subtle", "0.88"],
    ["medium", "0.8"],
    ["strong", "0.62"],
  ] as const)("bases a %s overlay on the popover at %s", (opacity, alpha) => {
    expect(
      valueOf(
        "style.when",
        `${GLASS_ROOT}[data-glass-opacity="${opacity}"]`,
        "--surface-overlay-base",
      ),
    ).toBe(`hsl(var(--popover) / ${alpha})`)
  })

  it("paints no fog or noise layers over the overlay colour", () => {
    for (const name of [
      "--surface-overlay-layers",
      "--surface-overlay-blend-mode",
      "--overlay-shadow",
    ]) {
      expect(declares("style.base", GLASS_ROOT, name), name).toBe(false)
      expect(declares("style.base", inMode("light"), name), name).toBe(false)
      expect(declares("style.mode", inMode("dark"), name), name).toBe(false)
    }
  })

  it("rims overlays with a hairline of the ink", () => {
    expect(valueOf("style.base", GLASS_ROOT, "--overlay-border")).toBe(
      "hsl(var(--foreground) / 0.08)",
    )
  })

  it("drops a long soft shadow under menus, deeper in dark", () => {
    expect(valueOf("style.base", inMode("light"), "--shadow-dropdown")).toBe(
      "0 10px 30px -10px rgb(0 0 0 / 0.25)",
    )
    expect(valueOf("style.mode", inMode("dark"), "--shadow-dropdown")).toBe(
      "0 10px 30px -10px rgb(0 0 0 / 0.6)",
    )
  })

  it("keeps dialogs opaque and rounds them past popovers and cards", () => {
    expect(valueOf("style.base", GLASS_ROOT, "--dialog-fill")).toBe(
      "hsl(var(--popover))",
    )
    expect(valueOf("style.base", GLASS_ROOT, "--overlay-radius")).toBe(
      "calc(var(--radius) * 1.25)",
    )
    expect(valueOf("style.base", GLASS_ROOT, "--card-radius")).toBe(
      "calc(var(--radius) * 1.5)",
    )
    expect(valueOf("style.base", GLASS_ROOT, "--dialog-radius")).toBe(
      "calc(var(--radius) * 1.75)",
    )
  })
})

describe("glass blur", () => {
  const BLUR = {
    none: ["none", "none"],
    low: ["blur(10px) saturate(160%)", "blur(2px)"],
    medium: ["blur(20px) saturate(180%)", "blur(4px)"],
    high: ["blur(32px) saturate(180%)", "blur(8px)"],
  } as const

  it("covers every blur step", () => {
    expect(Object.keys(BLUR)).toEqual([...GLASS_BLURS])
  })

  it.each(GLASS_BLURS)("blurs overlays and the scrim at %s", (blur) => {
    const selector = `${GLASS_ROOT}[data-glass-blur="${blur}"]`
    const [overlay, scrim] = BLUR[blur]
    expect(valueOf("style.when", selector, "--overlay-backdrop")).toBe(overlay)
    expect(valueOf("style.when", selector, "--scrim-backdrop")).toBe(scrim)
    expect(declares("style.when", selector, "--chrome-backdrop")).toBe(false)
  })
})

describe("glass chrome", () => {
  it("veils the bar and docks a solid rail", () => {
    expect(valueOf("style.base", inMode("light"), "--chrome-rail-bg")).toBe(
      "hsl(var(--background))",
    )
    expect(valueOf("style.mode", inMode("dark"), "--chrome-rail-bg")).toBe(
      "hsl(var(--card))",
    )
    expect(valueOf("style.base", GLASS_ROOT, "--chrome-bar-bg")).toBe(
      "hsl(var(--surface-header))",
    )
    expect(valueOf("style.base", GLASS_ROOT, "--chrome-edge")).toBe(
      "hsl(var(--sidebar-border))",
    )
  })

  it("paints no canvas, fog or specular behind the chrome", () => {
    for (const name of [
      "--chrome-canvas",
      "--chrome-shadow",
      "--chrome-backdrop",
    ]) {
      expect(
        RULES.filter(
          (r) =>
            r.layer !== "@layer style.fallback" && r.body.includes(`${name}:`),
        ).map((r) => r.selector),
        name,
      ).toEqual([])
    }
  })
})

describe("reduced transparency and more contrast", () => {
  it("outranks every glass rule from inside @layer style.fallback", () => {
    expect(normalise(GLASS)).toContain(
      `@layer style.fallback { @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) { ${GLASS_ROOT} {`,
    )
  })

  it.each([
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
    expect(valueOf("style.fallback", GLASS_ROOT, name)).toBe(value)
  })
})

describe("base overlay backdrop", () => {
  it("leaves overlays unblurred outside Glass", () => {
    expect(normalise(THEME)).toContain("--overlay-backdrop: none;")
  })

  it("declares the glass noise only in the glass rules", () => {
    expect(THEME).not.toContain("--glass-noise")
  })
})
