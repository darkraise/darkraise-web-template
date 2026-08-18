import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// The intensity wash has to survive every preset, and the three obvious CSS
// channels on `.dr-card` are already taken: `background-image` carries the
// glass fog gradient and sci-fi's bracketed corner frame, `box-shadow` carries
// the elevation ladder and neon's glow recipes, and `background-color` comes
// from `bg-card`, whose `--card` is a bare `color-mix()` under glass (so
// `hsl(var(--card) / …)` is already invalid there). `--muted` is out too: four
// presets redefine it as `var(--primary) / 0.0X`. That leaves a `::before`
// overlay tinted from `--foreground`, and these assertions pin that choice
// down. jsdom never parses CSS, so the rules themselves are what this asserts.

interface Rule {
  selector: string
  body: string
}

function intensityRules(): Rule[] {
  const css = readFileSync("src/components/card/card.css", "utf8")
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "")
  return [
    ...withoutComments.matchAll(/([^{}]*\[data-intensity[^{}]*)\{([^{}]*)\}/g),
  ].map((match) => ({
    selector: match[1].replace(/\s+/g, " ").trim(),
    body: match[2].replace(/\s+/g, " ").trim(),
  }))
}

function rulesFor(step: string): Rule[] {
  return intensityRules().filter((rule) =>
    rule.selector.includes(`[data-intensity="${step}"]`),
  )
}

function overlayBody(step: string): string {
  return rulesFor(step)
    .filter((rule) => rule.selector.includes("::before"))
    .map((rule) => rule.body)
    .join(" ")
}

function washAlpha(step: string): number {
  const body = rulesFor(step)
    .map((rule) => rule.body)
    .join(" ")
  const match = body.match(/hsl\(var\(--foreground\) \/ ([\d.]+)\)/)
  if (!match) throw new Error(`no --foreground wash on the ${step} step`)
  return Number(match[1])
}

describe("Card intensity selectors", () => {
  it.each(["none", "soft", "strong"])("styles the %s step", (step) => {
    expect(rulesFor(step).length).toBeGreaterThan(0)
  })

  it("never styles the default step, which owns no attribute", () => {
    expect(rulesFor("default")).toEqual([])
  })

  it.each(["soft", "strong"])(
    "paints the %s wash through a ::before overlay",
    (step) => {
      expect(overlayBody(step)).toContain("hsl(var(--foreground)")
    },
  )

  it.each(["soft", "strong"])(
    "keeps the %s overlay behind content, shaped, and inert",
    (step) => {
      expect(overlayBody(step)).toContain("z-index: -1")
      expect(overlayBody(step)).toContain("border-radius: inherit")
      expect(overlayBody(step)).toContain("pointer-events: none")
    },
  )

  it("positions the card only on the steps that overlay it", () => {
    for (const step of ["soft", "strong"]) {
      const bodies = rulesFor(step).map((rule) => rule.body)
      expect(bodies.some((body) => body.includes("position: relative"))).toBe(
        true,
      )
    }
    expect(
      rulesFor("none")
        .map((rule) => rule.body)
        .join(" "),
    ).not.toContain("position: relative")
  })

  it("leaves the channels the presets already own alone", () => {
    for (const rule of intensityRules()) {
      expect(rule.body).not.toMatch(/background-image/)
      expect(rule.body).not.toMatch(/box-shadow/)
    }
  })

  it("never reads a token a preset redefines with baked-in alpha", () => {
    for (const rule of intensityRules()) {
      expect(rule.body).not.toMatch(/var\(--(card|muted|color-card)\b/)
    }
  })

  it("climbs the ladder monotonically", () => {
    expect(washAlpha("soft")).toBeLessThan(washAlpha("strong"))
  })
})
