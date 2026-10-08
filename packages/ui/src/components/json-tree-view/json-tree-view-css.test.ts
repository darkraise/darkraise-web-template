import { expect, it } from "vitest"
import { readFileSync } from "node:fs"

const CSS = readFileSync(
  "src/components/json-tree-view/json-tree-view.css",
  "utf8",
).replace(/\s+/g, " ")

function body(selector: string): string {
  const start = CSS.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`no ${selector} rule`)
  return CSS.slice(start, CSS.indexOf("}", start))
}

// In dark mode the toolbar lifts through its low elevation shadow, so the
// focus ring is drawn over that shadow rather than in place of it.
it("keeps the toolbar lift under its focus ring", () => {
  expect(body(".dr-json-toolbar:focus-within")).toContain(
    "box-shadow: 0 0 0 1px hsl(var(--primary)), var(--card-elevation-low);",
  )
})
