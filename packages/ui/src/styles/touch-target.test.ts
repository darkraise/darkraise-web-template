import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// WCAG 2.2 AA puts the floor for a pointer target at 24x24 CSS px. Several
// controls in the kit render well below it with no padding — Checkbox at
// 14-20px, RadioGroupItem the same, Switch 20px tall, the slider thumb 20px,
// carousel dots 8px — so the thing you had to hit was exactly the thing you
// could see.
//
// Rather than growing them (which would move the whole density system), each
// carries `hit-area-24`, a transparent overlay that extends the target and
// leaves the visual size alone.
//
// The scan aggregates by class rather than by rule, because the kit routinely
// declares `cursor-pointer` on a base rule and the size on a separate
// `[data-size]` rule. A per-rule scan sees neither half together and reports
// a clean sweep over controls that are in fact undersized.

const TAILWIND_UNIT_PX = 4
const FLOOR_PX = 24

function everyStylesheet(): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return walk(path)
      return entry.name.endsWith(".css") ? [path] : []
    })
  return ["src/components", "src/layout"].flatMap(walk)
}

interface ClassFacts {
  file: string
  clickable: boolean
  hasHitArea: boolean
  sizes: number[]
}

/** Every `.dr-*` class in the kit, with the facts spread across its rules. */
function collectClassFacts(): Map<string, ClassFacts> {
  const facts = new Map<string, ClassFacts>()
  for (const file of everyStylesheet()) {
    const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selectorText = rule[1]
      const body = rule[2]
      // A preset override (`[data-preset="glass"] .dr-x`) restyles a control
      // rather than declaring a new one; attributing its sizes to the class is
      // still correct, so no special case is needed here.
      for (const match of selectorText.matchAll(/\.dr-[a-z0-9-]+/g)) {
        const className = match[0]
        const entry = facts.get(className) ?? {
          file,
          clickable: false,
          hasHitArea: false,
          sizes: [],
        }
        if (body.includes("cursor-pointer")) entry.clickable = true
        if (body.includes("hit-area-24")) entry.hasHitArea = true
        // Only sizes declared *on* this class count — a size in a rule that
        // also names a descendant belongs to the descendant.
        const declaresOnlyThis = selectorText.split(",").some((part) => {
          const classes = [...part.matchAll(/\.dr-[a-z0-9-]+/g)].map(
            (m) => m[0],
          )
          return classes.length === 1 && classes[0] === className
        })
        if (declaresOnlyThis) {
          for (const size of body.matchAll(/\b(?:h|w|size)-(\d+(?:\.5)?)\b/g)) {
            entry.sizes.push(Number(size[1]))
          }
        }
        facts.set(className, entry)
      }
    }
  }
  return facts
}

describe("pointer targets", () => {
  it("has no clickable class sized under 24px without a hit area", () => {
    const offenders: string[] = []
    for (const [className, entry] of collectClassFacts()) {
      if (!entry.clickable || entry.hasHitArea) continue
      const undersized = entry.sizes.filter(
        (s) => s * TAILWIND_UNIT_PX < FLOOR_PX,
      )
      if (undersized.length === 0) continue
      offenders.push(
        `${className} (${Math.min(...undersized) * TAILWIND_UNIT_PX}px) in ${entry.file}`,
      )
    }
    expect(offenders.sort()).toEqual([])
  })

  it("actually sees a control that loses its hit area", () => {
    // The first version of this scan matched size and `cursor-pointer` within
    // a single rule and so was blind to exactly the controls it was written
    // for. This pins the aggregation that fixed it.
    const facts = collectClassFacts()
    const checkbox = facts.get(".dr-checkbox")
    expect(checkbox?.clickable, ".dr-checkbox should read as clickable").toBe(
      true,
    )
    expect(checkbox?.hasHitArea, ".dr-checkbox should carry the hit area").toBe(
      true,
    )
    expect(
      checkbox?.sizes.some((s) => s * TAILWIND_UNIT_PX < FLOOR_PX),
      ".dr-checkbox sizes should be visible to the scan",
    ).toBe(true)
  })

  it("defines the hit-area-24 utility it relies on", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8")
    const utility = /@utility hit-area-24 \{([\s\S]*?)\n\}/.exec(theme)
    expect(utility, "hit-area-24 is missing from theme.css").not.toBeNull()
    const body = utility?.[1] ?? ""
    expect(body).toContain("position: relative")
    expect(body).toMatch(/width:\s*max\(100%,\s*24px\)/)
    expect(body).toMatch(/height:\s*max\(100%,\s*24px\)/)
  })

  it("spaces carousel dots so their expanded targets do not overlap", () => {
    // 8px dots with a 24px target need >=16px between them, or neighbouring
    // targets intersect and the expansion makes taps ambiguous instead of
    // easier.
    const css = readFileSync("src/components/carousel/carousel.css", "utf8")
    const group = /\.dr-carousel-indicator-group \{\s*@apply ([^;]+);/.exec(css)
    expect(group).not.toBeNull()
    expect(group?.[1]).toMatch(/\bgap-4\b/)
  })
})
