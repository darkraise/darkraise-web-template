import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { cssRules } from "../test/css-rules"
import { stripCssComments } from "../test/strip-css-comments"

// A surface that animates out stays mounted until its exit ends. While it
// does, a press on it must reach whatever it is uncovering, not its own
// buttons or backdrop a second time.

const COMPONENTS = "src/components"

const exiting = readdirSync(COMPONENTS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => {
    const path = `${COMPONENTS}/${entry.name}/${entry.name}.css`
    let css: string
    try {
      css = readFileSync(path, "utf8")
    } catch {
      return []
    }
    return cssRules(stripCssComments(css))
      .filter((rule) => rule.body.includes("data-[state=closed]:animate-out"))
      .map((rule) => ({
        name: `${path} ${rule.selector.replace(/\s+/g, " ").trim()}`,
        body: rule.body,
      }))
  })

describe("closing overlays", () => {
  it("finds the exit-animated surfaces", () => {
    const names = exiting.map((rule) => rule.name).join("\n")
    expect(names).toContain(".dr-overlay-backdrop")
    expect(names).toContain(".dr-dialog-content")
    expect(names).toContain(".dr-popover-content")
    expect(names).toContain(".dr-menu-content")
  })

  it.each(exiting.map((rule) => [rule.name, rule.body]))(
    "%s takes no pointer events while closing",
    (_name, body) => {
      expect(body).toContain("data-[state=closed]:pointer-events-none")
    },
  )
})
