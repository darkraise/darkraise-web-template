import { readFileSync } from "node:fs"
import { expect, it } from "vitest"

// Paths resolve from the vitest project root, packages/ui.
const CSS = readFileSync(
  "src/components/locale-switcher/locale-switcher.css",
  "utf8",
).replace(/\s+/g, " ")

it("hides the option name only under a compact trigger's selected icon", () => {
  expect(CSS).toContain(
    "[data-compact-icon] .dr-locale-option-label { @apply sr-only; }",
  )
  expect(CSS).not.toContain("[data-compact] .dr-locale-option-label")
})
