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

describe("sortable column header", () => {
  const HEADER = ".dr-btn.dr-data-table-column-header-btn[data-size]"

  it("starts its label on the cell's text edge and inherits the head colour", () => {
    const rule = body(DATA_TABLE, HEADER)
    expect(rule).toContain("margin-inline-start: calc(-1 * var(--btn-px-sm));")
    expect(rule).toContain("color: inherit;")
    expect(rule).not.toContain("-ml-3")
  })

  it("moves to the end edge in an end-aligned column", () => {
    const rule = body(DATA_TABLE, `.dr-table-head[data-align="end"] ${HEADER}`)
    expect(rule).toContain("margin-inline-start: 0;")
    expect(rule).toContain("margin-inline-end: calc(-1 * var(--btn-px-sm));")
  })

  it("carries no glow of its own", () => {
    const rule = body(DATA_TABLE, HEADER)
    expect(rule).toContain("--glow-outer: 0 0 transparent;")
    expect(rule).toContain("--glow-inner: 0 0 transparent;")
  })

  it("sits flush in a centred column", () => {
    expect(
      body(DATA_TABLE, `.dr-table-head[data-align="center"] ${HEADER}`),
    ).toContain("margin-inline-start: 0;")
  })

  it("puts its icon on the inline-end side", () => {
    expect(body(DATA_TABLE, ".dr-data-table-column-header-icon")).toContain(
      "ms-2",
    )
  })
})

describe("virtualized cells", () => {
  it.each([
    ["center", "center"],
    ["end", "flex-end"],
  ])("align the %s column through the flex row", (align, value) => {
    expect(
      body(
        DATA_TABLE,
        `.dr-table-cell[data-align="${align}"] .dr-data-table-virtual-cell`,
      ),
    ).toContain(`justify-content: ${value};`)
  })
})
