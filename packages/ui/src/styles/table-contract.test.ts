import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { parseRules } from "./interactive-classes"

const TABLE = "src/components/table/table.css"
const DATA_TABLE = "src/data-table/data-table.css"

function body(path: string, selector: string): string {
  const bodies = parseRules(readFileSync(path, "utf8"))
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector} in ${path}`)
  return bodies.join(" ")
}

const ROW_HEIGHT = "height: calc(var(--control-height) + 0.5rem);"

describe("table cells", () => {
  it.each([".dr-table-head", ".dr-table-cell"])(
    "%s uses tabular figures and the row height",
    (selector) => {
      expect(body(TABLE, selector)).toContain("tabular-nums")
      expect(body(TABLE, selector)).toContain(ROW_HEIGHT)
    },
  )

  it("keeps the header text muted and starts it on the inline start", () => {
    const head = body(TABLE, ".dr-table-head")
    expect(head).toContain("text-muted-foreground")
    expect(head).toContain("text-start")
    expect(head).not.toContain("text-left")
  })

  it.each([
    ['.dr-table-cell[data-align="center"]', "center"],
    ['.dr-table-cell[data-align="end"]', "end"],
    ['.dr-table-head[data-align="center"]', "center"],
    ['.dr-table-head[data-align="end"]', "end"],
  ])("%s aligns %s", (selector, value) => {
    expect(body(TABLE, selector)).toContain(`text-align: ${value};`)
  })

  it("lets a virtualized table keep its own row height", () => {
    expect(
      body(DATA_TABLE, ".dr-data-table-viewport .dr-table-cell"),
    ).toContain("height: auto;")
  })
})
