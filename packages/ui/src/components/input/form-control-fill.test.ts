import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Form controls are deliberately outside the surface-intensity axis: fields
// should hold still while panels move around them. They therefore must not
// paint through `bg-card`, whose --color-card now carries the wash.
//
// The pinned fill reads `--control-surface`, which is container-relative:
// `--card` on the page canvas, `--surface-sunken` inside a card. Both are
// raw token triplets, so the wash still cannot reach a field.
const CONTROLS = [
  "components/input/input.css",
  "components/textarea/textarea.css",
  "components/number-input/number-input.css",
  "components/tags-input/tags-input.css",
  "components/select/select.css",
  "components/multi-select/multi-select.css",
  "components/date-input/date-input.css",
  "components/input-otp/input-otp.css",
]

describe("form control fills", () => {
  it.each(CONTROLS)("%s does not paint through bg-card", (file) => {
    const css = readFileSync(`src/${file}`, "utf8").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    )
    expect(css).not.toMatch(/@apply[^;]*\bbg-card\b/)
  })

  it.each(CONTROLS)("%s pins an unwashed fill", (file) => {
    const css = readFileSync(`src/${file}`, "utf8").replace(/\s+/g, " ")
    expect(css).toContain(
      "hsl(var(--control-surface) / var(--surface-opacity, 1))",
    )
  })

  it.each([
    ["components/multi-select/multi-select.css", ".dr-multi-select-control"],
    ["components/date-input/date-input.css", ".dr-date-input"],
    ["components/input-otp/input-otp.css", ".dr-input-otp-slot"],
    ["components/input-otp/input-otp.css", ".dr-input-otp-slot-separate"],
  ])("%s → %s paints no page or transparent fill", (file, selector) => {
    const css = readFileSync(`src/${file}`, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
    const rule = new RegExp(
      `[{}] ${selector.replaceAll(".", "\\.")} \\{([^}]*)\\}`,
    ).exec(css)
    expect(rule, `${selector} has no rule`).not.toBeNull()
    expect(rule?.[1]).not.toMatch(/\bbg-(?:background|transparent)\b/)
  })
})

describe("--control-surface rungs", () => {
  const read = (file: string) =>
    readFileSync(`src/${file}`, "utf8").replace(/\s+/g, " ")

  it("defaults to the card rung so canvas-level fields stay legible", () => {
    expect(read("styles/theme.css")).toContain("--control-surface: var(--card)")
  })

  it("recesses inside every raised container a form can live in", () => {
    const css = read("styles/theme.css")
    for (const container of [
      ".dr-dialog-content",
      ".dr-sheet-content",
      ".dr-drawer-content",
      ".dr-popover-content",
      ".dr-floating-panel",
    ]) {
      expect(css).toContain(container)
    }
    // One grouped rule, so the list above and the declaration cannot drift.
    expect(css).toContain(
      ".dr-dialog-content, .dr-sheet-content, .dr-drawer-content, " +
        ".dr-popover-content, .dr-floating-panel { " +
        "--control-surface: var(--control-well); }",
    )
  })

  it("recesses to the axis-chosen well inside a card", () => {
    expect(read("components/card/card.css")).toContain(
      "--control-surface: var(--control-well)",
    )
  })

  it("resolves the well through the controlDepth table", () => {
    const css = read("styles/theme.css")
    expect(css).toContain("--control-well: var(--surface-sunken)")
    for (const [step, token] of [
      ["flush", "var(--card)"],
      ["subtle", "var(--control-well-subtle)"],
      ["recessed", "var(--surface-sunken)"],
      ["deep", "var(--control-well-deep)"],
    ]) {
      expect(css).toContain(
        `[data-control-depth="${step}"] { --control-well: ${token}; }`,
      )
    }
  })
})
