import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// The buttonStyle and iconButton signatures restyle buttons from the root
// attribute. jsdom computes no cascade, so the source rules are what this
// asserts; e2e 61 checks what Chromium paints.

const BUTTON = join("src", "components", "button", "button.css")

interface Rule {
  selectors: string[]
  wrappers: string[]
  body: string
}

function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

const RULES: Rule[] = cssRules(
  stripCssComments(readFileSync(BUTTON, "utf8")),
).map((rule) => ({
  selectors: rule.selector
    .split(/,(?![^(]*\))/)
    .map(normalise)
    .filter(Boolean),
  wrappers: rule.wrappers,
  body: normalise(rule.body),
}))

function bodyOf(
  selector: string,
  wrappers: string[] = ["@layer components"],
): string {
  const bodies = RULES.filter(
    (rule) =>
      rule.selectors.includes(selector) &&
      rule.wrappers.join(" | ") === wrappers.join(" | "),
  ).map((rule) => rule.body)
  if (bodies.length === 0) {
    throw new Error(`no rule ${selector} inside ${wrappers.join(" | ")}`)
  }
  return bodies.join(" ")
}

/** The last compound selector: the element the rule styles. */
function subject(selector: string): string {
  let depth = 0
  let start = 0
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i] as string
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    else if (depth === 0 && /[\s>+~]/.test(ch)) start = i + 1
  }
  return selector.slice(start)
}

const selectorsNaming = (attribute: string) =>
  RULES.flatMap((rule) =>
    rule.selectors
      .filter((selector) => selector.includes(`[${attribute}=`))
      .map((selector) => ({ selector, rule })),
  )

const ENABLED = ':not(:disabled):not([aria-disabled="true"])'
const HOVER = ["@layer components", "@media (hover: hover)"]
const at = (style: string, variant: string) =>
  `[data-button-style="${style}"] .dr-btn[data-variant="${variant}"]`
const dark = (style: string, variant: string) =>
  `[data-mode="dark"][data-button-style="${style}"] .dr-btn[data-variant="${variant}"]`

describe("button anatomy signatures", () => {
  it.each(["key", "soft", "glass"])("draws buttonStyle %s", (value) => {
    expect(
      RULES.some((rule) =>
        rule.selectors.some((s) =>
          s.includes(`[data-button-style="${value}"]`),
        ),
      ),
    ).toBe(true)
  })

  it("draws iconButton round", () => {
    expect(
      RULES.some((rule) =>
        rule.selectors.some((s) => s.includes('[data-icon-button="round"]')),
      ),
    ).toBe(true)
  })

  it("names no kit default value", () => {
    const all = RULES.flatMap((rule) => rule.selectors)
    expect(
      all.filter((s) => s.includes('[data-button-style="solid"]')),
    ).toEqual([])
    expect(
      all.filter((s) => s.includes('[data-icon-button="square"]')),
    ).toEqual([])
  })

  it("restyles only default, destructive, secondary and outline under buttonStyle", () => {
    const found = selectorsNaming("data-button-style")
    expect(found.length).toBeGreaterThan(0)
    for (const { selector } of found) {
      expect(subject(selector), selector).toMatch(
        /^\.dr-btn\[data-variant="(default|destructive|secondary|outline)"\]/,
      )
    }
  })

  it("changes only the radius of icon-size buttons under iconButton, below any compound rule", () => {
    const found = selectorsNaming("data-icon-button")
    expect(found.map(({ selector }) => selector)).toEqual([
      ':where([data-icon-button="round"]) .dr-btn[data-size="icon"]',
    ])
    expect(found[0]?.rule.body).toBe("border-radius: var(--radius-pill);")
  })

  it("hovers inside @media (hover: hover) and presses only enabled buttons", () => {
    const found = selectorsNaming("data-button-style")
    const hovers = found.filter(({ selector }) => selector.includes(":hover"))
    const presses = found.filter(({ selector }) => selector.includes(":active"))
    expect(hovers.length).toBeGreaterThan(0)
    expect(presses.length).toBeGreaterThan(0)
    for (const { selector, rule } of hovers) {
      expect(rule.wrappers, selector).toEqual(HOVER)
      expect(selector).toContain(`${ENABLED}:hover`)
    }
    for (const { selector } of presses) {
      expect(selector).toContain(`${ENABLED}:active`)
    }
  })

  it("transitions transform, so a key press can move the face", () => {
    expect(bodyOf(".dr-btn")).toContain(
      "transition-[background-image,background-color,border-color,color,text-decoration-color,box-shadow,transform]",
    )
  })
})

describe("buttonStyle key", () => {
  it("lights the top 35% of a filled face and sets it on a 2px base of the face", () => {
    for (const variant of ["default", "destructive"]) {
      expect(bodyOf(at("key", variant))).toBe(
        "background-image: var(--btn-sheen), linear-gradient(rgb(255 255 255 / 0.18), rgb(255 255 255 / 0) min(35%, 50% - 0.5lh)); box-shadow: var(--btn-edge), 0 var(--btn-key-depth, 2px) 0 color-mix(in oklab, var(--hue), black 30%), 0 3px 6px -1px rgb(0 0 0 / 0.2), var(--glow-outer), var(--glow-inner);",
      )
    }
  })

  it("sets a neutral face on a --border-strong base", () => {
    for (const variant of ["secondary", "outline"]) {
      expect(bodyOf(at("key", variant))).toBe(
        "background-image: var(--btn-neutral-sheen), linear-gradient(rgb(255 255 255 / 0.18), rgb(255 255 255 / 0) min(35%, 50% - 0.5lh)); box-shadow: var(--btn-neutral-edge), 0 var(--btn-key-depth, 2px) 0 hsl(var(--border-strong)), 0 3px 5px -1px rgb(0 0 0 / 0.1), var(--glow-outer), var(--glow-inner);",
      )
    }
  })

  it("presses the face down 1px onto a 1px base", () => {
    for (const variant of ["default", "destructive", "secondary", "outline"]) {
      expect(bodyOf(`${at("key", variant)}${ENABLED}:active`)).toBe(
        "--btn-key-depth: 1px; transform: translateY(1px);",
      )
    }
  })
})

describe("buttonStyle soft", () => {
  it("drops the solid fill, edge and shadow of the filled variants", () => {
    for (const variant of ["default", "destructive"]) {
      expect(bodyOf(at("soft", variant))).toContain(
        "--state-layer-press: 0.16; background-image: none; border-color: transparent; box-shadow: var(--glow-outer), var(--glow-inner);",
      )
    }
  })

  it("tints the default face at step 3 (light) or 4 (dark) under the accent text", () => {
    expect(bodyOf(at("soft", "default"))).toContain(
      "--state-layer-color: currentColor; --btn-hover-layer: 0; background-color: hsl(var(--primary-3)); color: hsl(var(--primary-text));",
    )
    expect(bodyOf(dark("soft", "default"))).toBe(
      "background-color: hsl(var(--primary-4));",
    )
  })

  it("moves the default face one step deeper on hover", () => {
    expect(bodyOf(`${at("soft", "default")}${ENABLED}:hover`, HOVER)).toBe(
      "background-color: hsl(var(--primary-4));",
    )
    expect(bodyOf(`${dark("soft", "default")}${ENABLED}:hover`, HOVER)).toBe(
      "background-color: hsl(var(--primary-5));",
    )
  })

  it("paints destructive on its solved subtle pair, washed toward the page on hover", () => {
    expect(bodyOf(at("soft", "destructive"))).toContain(
      "--state-layer-color: hsl(var(--background)); --btn-hover-layer: var(--state-layer-hover); background-color: hsl(var(--destructive-subtle)); color: hsl(var(--destructive-text));",
    )
  })

  it("sets secondary on the neutral well under the muted label, frosted where a style sets the well fill", () => {
    expect(bodyOf(at("soft", "secondary"))).toBe(
      "background-color: var(--well-fill, hsl(var(--muted))); color: hsl(var(--muted-foreground));",
    )
  })

  it("draws the outline edge in the accent under the accent text", () => {
    expect(bodyOf(at("soft", "outline"))).toBe(
      "border-color: hsl(var(--primary)); color: hsl(var(--primary-text));",
    )
  })
})

describe("buttonStyle glass", () => {
  it("replaces the look's sheen on the filled variants with one in the top 35%", () => {
    for (const variant of ["default", "destructive"]) {
      expect(bodyOf(at("glass", variant))).toBe(
        "background-image: linear-gradient(rgb(255 255 255 / 0.3), rgb(255 255 255 / 0) min(35%, 50% - 0.5lh)); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.4), 0 6px 16px -6px color-mix(in oklab, var(--hue) 70%, transparent), var(--glow-outer), var(--glow-inner);",
      )
    }
  })

  it("frames the neutral capsules in a bright rim and an inset highlight", () => {
    for (const variant of ["secondary", "outline"]) {
      expect(bodyOf(at("glass", variant))).toContain(
        "border-color: rgb(255 255 255 / 0.7); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.6), var(--btn-neutral-shadow), var(--glow-outer), var(--glow-inner);",
      )
      expect(bodyOf(dark("glass", variant))).toBe(
        "border-color: rgb(255 255 255 / 0.14); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08), var(--btn-neutral-shadow), var(--glow-outer), var(--glow-inner);",
      )
    }
  })

  it("restores the neutral edge on the capsules under more contrast", () => {
    const media = ["@layer components", "@media (prefers-contrast: more)"]
    for (const variant of ["secondary", "outline"]) {
      for (const selector of [at("glass", variant), dark("glass", variant)]) {
        expect(bodyOf(selector, media), selector).toBe(
          "border-color: var(--btn-neutral-border, var(--field-edge));",
        )
      }
    }
  })

  it("fills secondary from the card at the surface alpha, and outline from --btn-neutral-fill", () => {
    expect(bodyOf(at("glass", "secondary"))).toContain(
      "background-color: hsl(var(--card) / var(--surface-alpha));",
    )
    expect(bodyOf(at("glass", "outline"))).not.toContain("background")
    expect(bodyOf('.dr-btn[data-variant="outline"]')).toContain(
      "background-color: var(--btn-neutral-fill);",
    )
  })

  it("draws no backdrop filter of its own", () => {
    for (const { rule } of selectorsNaming("data-button-style")) {
      expect(rule.body).not.toContain("backdrop-filter")
    }
  })
})
