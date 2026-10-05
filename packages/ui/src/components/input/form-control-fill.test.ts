import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolveFieldTrigger } from "../../test/fieldTrigger"

// Form controls are deliberately outside the `surface` prop: fields
// should hold still while panels move around them. They therefore must not
// paint through `bg-card`, whose --color-card now carries the wash.
//
// The pinned fill reads `--control-surface`, which is container-relative:
// `--card` on the page canvas, `--surface-sunken` inside a card. Both are
// raw token triplets, so the wash still cannot reach a field.
const CONTROLS = [
  ["components/input/input.css", ".dr-input"],
  ["components/textarea/textarea.css", ".dr-textarea"],
  ["components/number-input/number-input.css", ".dr-number-input-control"],
  ["components/tags-input/tags-input.css", ".dr-tags-input-control"],
  ["components/select/select.css", ".dr-select-trigger"],
  ["components/cascade-select/cascade-select.css", ".dr-cascade-trigger"],
  ["components/multi-select/multi-select.css", ".dr-multi-select-control"],
  ["components/date-input/date-input.css", ".dr-date-input"],
  ["components/input-otp/input-otp.css", ".dr-input-otp-slot"],
] as const

describe("form control fills", () => {
  it.each(CONTROLS.map(([file]) => file))(
    "%s does not paint through bg-card",
    (file) => {
      const css = readFileSync(`src/${file}`, "utf8").replace(
        /\/\*[\s\S]*?\*\//g,
        "",
      )
      expect(css).not.toMatch(/@apply[^;]*\bbg-card\b/)
    },
  )

  it.each(CONTROLS)("%s pins an unwashed fill on %s", (file, selector) => {
    const css = readFileSync(`src/${file}`, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
    const rule = new RegExp(
      `[{}] ${selector.replace(/\./g, "\\.")} \\{([^}]*)\\}`,
    ).exec(css)
    expect(rule, `${selector} has no rule`).not.toBeNull()
    expect(resolveFieldTrigger((rule?.[1] ?? "").trim())).toContain(
      "background-color: hsl(var(--control-surface));",
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
      `[{}] ${selector.replace(/\./g, "\\.")} \\{([^}]*)\\}`,
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

  it("recesses to the well inside a card", () => {
    expect(read("components/card/card.css")).toContain(
      "--control-surface: var(--control-well)",
    )
  })

  it("reads the engine's well with no depth rules", () => {
    const css = read("styles/theme.css")
    expect(css).toMatch(/--control-well: [\d.]+ [\d.]+% [\d.]+%;/)
    expect(css).not.toContain("--control-well: var(")
    expect(css).not.toContain("data-control-depth")
  })
})
