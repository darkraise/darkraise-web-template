import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { GLASS_BLURS, GLASS_TRANSPARENCIES } from "@theme/types"
import { TRANSPARENCY_SCALE } from "@theme/config/transparency"
import { cssRules } from "../../../test/css-rules"
import { stripCssComments } from "../../../test/strip-css-comments"

// jsdom never parses CSS, so the compiled stylesheet text is what this
// asserts.
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

/**
 * The value `name` takes in Glass's `when` rules whose selector is exactly
 * `selector`: each `when` entry compiles to a rule of its own, so one
 * selector can head several rules.
 */
function whenValue(selector: string, name: string): string | undefined {
  for (const rule of RULES) {
    if (rule.layer !== "@layer style.when" || rule.selector !== selector) {
      continue
    }
    const after = rule.body.split(`${name}:`)[1]
    if (after !== undefined) return (after.split(";")[0] as string).trim()
  }
  return undefined
}

const GLASS_ROOT = '[data-style="glass"]'
const MODES = ["light", "dark"] as const

/** Glass's selector in one mode, with `rest` appended. */
function inMode(mode: (typeof MODES)[number], rest = ""): string {
  return mode === "light"
    ? `${GLASS_ROOT}:not([data-mode="dark"])${rest}`
    : `[data-mode="dark"]${GLASS_ROOT}${rest}`
}

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
  it("bases overlays on the popover at the effective overlay alpha", () => {
    expect(valueOf("style.base", GLASS_ROOT, "--surface-overlay-base")).toBe(
      "hsl(var(--popover) / var(--overlay-alpha))",
    )
    expect(valueOf("style.base", GLASS_ROOT, "--overlay-fill-alpha")).toBe(
      "0.6",
    )
    expect(
      RULES.filter(
        (r) =>
          r.layer === "@layer style.when" &&
          r.body.includes("--surface-overlay-base:"),
      ).map((r) => r.selector),
    ).toEqual([])
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

  it("lets dialogs through as popovers are, and rounds them past popovers and cards", () => {
    expect(valueOf("style.base", GLASS_ROOT, "--dialog-fill")).toBe(
      "hsl(var(--popover) / var(--overlay-alpha))",
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

describe("glass transparency", () => {
  it.each(GLASS_TRANSPARENCIES)("scales the declared alphas at %s", (step) => {
    expect(
      whenValue(
        `${GLASS_ROOT}[data-glass-transparency="${step}"]`,
        "--glass-transparency-scale",
      ),
    ).toBe(String(TRANSPARENCY_SCALE[step]))
  })

  it("writes the scale from the transparency steps alone", () => {
    expect(
      RULES.filter((r) => r.body.includes("--glass-transparency-scale:")).map(
        (r) => r.selector,
      ),
    ).toEqual(
      GLASS_TRANSPARENCIES.map(
        (step) => `${GLASS_ROOT}[data-glass-transparency="${step}"]`,
      ),
    )
  })
})

describe("glass cards", () => {
  it("lets the card plane through at its Medium alpha in each mode", () => {
    expect(valueOf("style.base", inMode("light"), "--surface-fill-alpha")).toBe(
      "0.72",
    )
    expect(valueOf("style.mode", inMode("dark"), "--surface-fill-alpha")).toBe(
      "0.66",
    )
  })
})

describe("glass blur", () => {
  /** `--glass-blur`, then `--glass-scrim-blur`, at each step that blurs. */
  const SIZES = {
    low: ["10px", "2px"],
    medium: ["20px", "4px"],
    high: ["32px", "8px"],
  } as const

  it("covers every blur step", () => {
    expect(["none", ...Object.keys(SIZES)]).toEqual([...GLASS_BLURS])
  })

  it("switches every glass backdrop off at none", () => {
    const selector = `${GLASS_ROOT}[data-glass-blur="none"]`
    expect(valueOf("style.when", selector, "--glass-backdrop-off")).toBe("none")
    expect(declares("style.when", selector, "--glass-blur")).toBe(false)
  })

  it.each(Object.entries(SIZES))(
    "sizes the blur and the scrim at %s",
    (blur, [size, scrim]) => {
      const selector = `${GLASS_ROOT}[data-glass-blur="${blur}"]`
      expect(valueOf("style.when", selector, "--glass-blur")).toBe(size)
      expect(valueOf("style.when", selector, "--glass-scrim-blur")).toBe(scrim)
      expect(declares("style.when", selector, "--glass-backdrop-off")).toBe(
        false,
      )
    },
  )

  it.each([
    [
      "--surface-backdrop",
      "var(--glass-backdrop-off, blur(var(--glass-blur)) saturate(180%))",
    ],
    [
      "--overlay-backdrop",
      "var(--glass-backdrop-off, blur(var(--glass-blur)) saturate(180%))",
    ],
    [
      "--scrim-backdrop",
      "var(--glass-backdrop-off, blur(var(--glass-scrim-blur)))",
    ],
  ])("reads the step's size in %s", (name, value) => {
    expect(valueOf("style.base", GLASS_ROOT, name)).toBe(value)
  })

  it("writes no backdrop in a step rule", () => {
    for (const rule of RULES.filter((r) => r.layer === "@layer style.when")) {
      expect(rule.body, rule.selector).not.toMatch(
        /--(?:surface|overlay|scrim|chrome)-backdrop:/,
      )
    }
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

  it("paints no canvas, fog or specular behind Glass's own chrome", () => {
    for (const name of [
      "--chrome-canvas",
      "--chrome-shadow",
      "--chrome-backdrop",
    ]) {
      expect(
        RULES.filter(
          (r) =>
            r.layer !== "@layer style.fallback" &&
            r.layer !== "@layer style.preset" &&
            r.body.includes(`${name}:`),
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
