import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Two failure modes that only show up with real content in a real app:
//
//   A URL or session id pasted into a toast, alert, dialog or table cell has
//   no break opportunity, so the surface grows to the width of the string and
//   the page scrolls sideways. Nothing in the kit set `overflow-wrap`.
//
//   A read-only field looked exactly like an editable one, so the only way to
//   discover the difference was to try typing.

const theme = readFileSync("src/styles/theme.css", "utf8")

describe("long-token wrapping", () => {
  const rule =
    /@layer components \{\s*((?:\.[a-z-]+,\s*)+\.[a-z-]+) \{\s*overflow-wrap: anywhere;\s*min-width: 0;/.exec(
      theme,
    )

  it("covers the surfaces that receive arbitrary strings", () => {
    expect(rule, "no overflow-wrap rule in theme.css").not.toBeNull()
    const selectors = rule?.[1] ?? ""
    for (const surface of [
      ".dr-toast-description",
      ".dr-alert-description",
      ".dr-overlay-description",
      ".dr-field-error",
      ".dr-table-cell",
      ".dr-tooltip-content",
    ]) {
      expect(selectors, `${surface} can still overflow`).toContain(surface)
    }
  })

  it("pairs the wrap with min-width so flex rows cannot defeat it", () => {
    // `min-width: auto` on a flex item floors it at its content width, which
    // makes the wrap a no-op exactly where these surfaces live.
    expect(rule?.[0]).toContain("min-width: 0")
  })

  it("does not reach for word-break, which would chop ordinary prose", () => {
    // Comments stripped first: the explanation above the rule names the thing
    // it is avoiding, and matching that would be a false positive.
    const declarations = theme.replace(/\/\*[\s\S]*?\*\//g, "")
    expect(declarations).not.toContain("word-break: break-all")
  })
})

describe("read-only is distinct from disabled", () => {
  it.each([
    ["src/components/input/input.css", ".dr-input"],
    ["src/components/textarea/textarea.css", ".dr-textarea"],
  ])("%s styles :read-only separately", (path, selector) => {
    const css = readFileSync(path, "utf8")
    const rule = new RegExp(
      `${selector.replace(".", "\\.")}:read-only \\{([^}]*)\\}`,
    ).exec(css)
    expect(rule, `${selector}:read-only has no rule`).not.toBeNull()
    const body = rule?.[1] ?? ""
    // The point is that it reads as fixed, not unavailable — so no opacity
    // drop and no not-allowed cursor, which is how disabled is drawn.
    expect(body).not.toMatch(/opacity/)
    expect(body).not.toContain("not-allowed")
    expect(body).toContain("cursor: default")
  })
})
