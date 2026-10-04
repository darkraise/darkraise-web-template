import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

/** The utilities a rule applies, from its first `@apply`. */
function appliedBy(path: string, selector: string): string[] {
  const css = readFileSync(path, "utf8").replace(/\s+/g, " ")
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const body = css.match(new RegExp(`${escaped} \\{ @apply ([^;]*);`))?.[1]
  if (body === undefined) throw new Error(`no @apply for ${selector}`)
  return body.split(" ")
}

describe("calendar edge", () => {
  // The glass utility draws no border in any style, so a standalone
  // calendar draws its own edge, as Card does.
  it.each([".dr-calendar", ".dr-calendar-grid-container"])(
    "%s draws a border",
    (selector) => {
      expect(
        appliedBy("src/components/calendar/calendar.css", selector),
      ).toContain("border")
    },
  )

  // The date picker's popover already draws the edge around its calendar.
  it("draws none on the date picker's calendar", () => {
    expect(
      appliedBy(
        "src/components/date-picker/date-picker.css",
        ".dr-date-picker-calendar",
      ),
    ).toContain("border-0")
  })
})
