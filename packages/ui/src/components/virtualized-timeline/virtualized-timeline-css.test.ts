import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

const CSS = readFileSync(
  "src/components/virtualized-timeline/virtualized-timeline.css",
  "utf8",
).replace(/\s+/g, " ")

function body(selector: string): string {
  const start = CSS.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`no ${selector} rule`)
  return CSS.slice(start, CSS.indexOf("}", start))
}

describe("timeline rail ticks", () => {
  it("centres each tick on its offset with the mark at the rail's edge", () => {
    const tick = body(".dr-virtualized-timeline-scrubber-tick")
    expect(tick).toContain("-translate-y-1/2")
    expect(tick).toContain("flex-row-reverse")
  })

  it("mirrors the mark column to the left edge on a left-hand rail", () => {
    const tick = body(
      '.dr-virtualized-timeline[data-scrubber-side="left"] .dr-virtualized-timeline-scrubber-tick',
    )
    expect(tick).toContain("left-0")
    expect(tick).toMatch(/\bflex-row(?!-reverse)/)
  })
})

describe("timeline bucket header", () => {
  it("spaces its checkbox, toggle and label", () => {
    expect(body(".dr-virtualized-timeline-bucket-header")).toContain("gap-2")
  })

  it("paints an opaque fill with no backdrop", () => {
    const header = body(".dr-virtualized-timeline-bucket-header")
    expect(header).not.toMatch(/backdrop/)
    expect(header).not.toMatch(/bg-background\/\d+/)
    expect(header.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")")).toContain(
      "background: linear-gradient(var(--card-lift-tint, transparent), var(--card-lift-tint, transparent)), var(--timeline-header-bg);",
    )
  })

  // An elevated dark card lifts its face with an inset overlay; the opaque
  // header paints the same overlay so it does not read as a darker band.
  it("publishes each card's lift for the header to paint", () => {
    const card = readFileSync("src/components/card/card.css", "utf8")
    const rule = (selector: string) => {
      const start = card.indexOf(`${selector} {`)
      return card.slice(start, card.indexOf("}", start))
    }
    expect(rule(".dr-card")).toContain("--card-lift-tint: transparent;")
    expect(rule('.dr-card[data-card-elevation="auto"]')).toContain(
      "--card-lift-tint: var(--elevation-current-lift-tint);",
    )
    for (const level of ["low", "medium", "high"]) {
      expect(rule(`.dr-card[data-card-elevation="${level}"]`)).toContain(
        `--card-lift-tint: var(--elevation-lift-tint-${level});`,
      )
    }
  })

  it("matches the page, or the card it sits in", () => {
    expect(body(".dr-virtualized-timeline")).toContain(
      "--timeline-header-bg: hsl(var(--background));",
    )
    expect(body(".dr-card .dr-virtualized-timeline")).toContain(
      "--timeline-header-bg: var(--surface-card-fill-opaque);",
    )
  })
})
