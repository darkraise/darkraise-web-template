import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

const RULES = cssRules(
  stripCssComments(
    readFileSync("src/theme/theme-switcher/theme-switcher.css", "utf8"),
  ),
)

describe("theme switcher popover", () => {
  it("caps itself to the room on its side and scrolls its rows", () => {
    const rules = RULES.filter(
      (rule) => rule.selector.trim() === ".dr-theme-switcher-content",
    )
    expect(rules.map((rule) => rule.wrappers)).toEqual([["@layer components"]])
    expect(rules[0]?.body.replace(/\s+/g, " ").trim()).toBe(
      "max-height: var(--popup-available-height, 100dvh); overflow-y: auto; overscroll-behavior: contain;",
    )
  })
})
