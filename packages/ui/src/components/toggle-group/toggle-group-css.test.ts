import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

/** The utilities a rule applies, from its first `@apply`. */
function appliedBy(selector: string): string[] {
  const css = readFileSync(
    "src/components/toggle-group/toggle-group.css",
    "utf8",
  ).replace(/\s+/g, " ")
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const body = css.match(new RegExp(`${escaped} \\{ @apply ([^;]*);`))?.[1]
  if (body === undefined) throw new Error(`no @apply for ${selector}`)
  return body.split(" ")
}

describe("toggle group layout", () => {
  // A full-width centred row floated the items away from the content edge;
  // a consumer wanting that row adds `w-full justify-center`.
  it("sizes the group to its items", () => {
    const utilities = appliedBy(".dr-toggle-group")
    expect(utilities).toContain("inline-flex")
    expect(utilities).not.toContain("flex")
    expect(utilities).not.toContain("justify-center")
  })
})
