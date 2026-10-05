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
    // A disabled field matches :read-only too; it keeps the disabled look.
    const rule = new RegExp(
      `${selector.replace(".", "\\.")}:read-only:not\\(:disabled\\) \\{([^}]*)\\}`,
    ).exec(css)
    expect(
      rule,
      `${selector}:read-only:not(:disabled) has no rule`,
    ).not.toBeNull()
    const body = rule?.[1] ?? ""
    // The point is that it reads as fixed, not unavailable — so no opacity
    // drop and no not-allowed cursor, which is how disabled is drawn.
    expect(body).not.toMatch(/opacity/)
    expect(body).not.toContain("not-allowed")
    expect(body).toContain("cursor: default")
  })

  it("reads a read-only Editable as fixed, unless it is also disabled", () => {
    const css = readFileSync("src/components/editable/editable.css", "utf8")
    // Disabled wins when both are set, so the read-only rule excludes it.
    const rule =
      /\.dr-editable\[data-readonly="true"\]:not\(\[data-disabled="true"\]\)\s+\.dr-editable-preview \{([^}]*)\}/.exec(
        css,
      )
    expect(
      rule,
      "no read-only Editable rule that excludes disabled",
    ).not.toBeNull()
    const body = rule?.[1] ?? ""
    expect(body).not.toMatch(/opacity/)
    expect(body).not.toContain("not-allowed")
    expect(body).toMatch(/(?<![\w-])cursor-default(?![\w-])/)
  })

  it("keeps a read-only rating group's default cursor off a disabled one", () => {
    const css = readFileSync(
      "src/components/rating-group/rating-group.css",
      "utf8",
    )
    // The read-only group rule outranks the item's own disabled rule, so
    // without the exclusion a disabled read-only group lost not-allowed.
    const rules = [
      ...css.matchAll(
        /\.dr-rating-group\[data-readonly="true"\]([^{]*)\.dr-rating-group-item[^{]*\{/g,
      ),
    ]
    expect(rules.length, "no read-only rating group rule").toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule[1]).toContain(':not([data-disabled="true"])')
    }
  })

  it("keeps the read-only treatment off a disabled input", () => {
    // A disabled input also matches :read-only, which gave it the default
    // cursor and the muted fill.
    const css = readFileSync("src/components/input/input.css", "utf8")
    expect(css).toContain(".dr-input:read-only:not(:disabled) {")
    expect(css).not.toMatch(/\.dr-input:read-only \{/)
  })
})
