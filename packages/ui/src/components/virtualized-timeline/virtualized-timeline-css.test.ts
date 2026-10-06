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

describe("timeline bucket header", () => {
  it("paints an opaque fill with no backdrop", () => {
    const header = body(".dr-virtualized-timeline-bucket-header")
    expect(header).not.toMatch(/backdrop/)
    expect(header).not.toMatch(/bg-background\/\d+/)
    expect(header).toContain("background-color: var(--timeline-header-bg);")
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
