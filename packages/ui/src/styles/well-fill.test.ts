import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../test/css-rules"
import { stripCssComments } from "../test/strip-css-comments"

// The well fill paints the trough of a tab list, a segment group, a slider
// and a progress bar, and the track of an unchecked switch. Unset, each
// reader falls back to the utility it used before the token existed, so the
// kit default computes the same colour. jsdom computes no cascade, so the
// source rules are what this asserts; e2e 65 compares the computed styles.

const SOURCES = {
  theme: join("src", "styles", "theme.css"),
  tabs: join("src", "components", "tabs", "tabs.css"),
  segment: join("src", "components", "segment-group", "segment-group.css"),
  slider: join("src", "components", "slider", "slider.css"),
  progress: join("src", "components", "progress", "progress.css"),
  switch: join("src", "components", "switch", "switch.css"),
} as const

function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function bodyOf(
  file: keyof typeof SOURCES,
  selector: string,
  wrappers: string[] = ["@layer components"],
): string {
  const bodies = cssRules(stripCssComments(readFileSync(SOURCES[file], "utf8")))
    .filter(
      (rule) =>
        rule.selector
          .split(/,(?![^(]*\))/)
          .map(normalise)
          .includes(selector) &&
        rule.wrappers.join(" | ") === wrappers.join(" | "),
    )
    .map((rule) => normalise(rule.body))
  if (bodies.length === 0) {
    throw new Error(
      `no rule ${selector} in ${file} inside ${wrappers.join(" | ")}`,
    )
  }
  return bodies.join(" ")
}

const READERS = [
  ["tabs", '.dr-tabs-list[data-variant="default"]', "--muted"],
  ["tabs", '.dr-tabs-list[data-variant="outline"]', "--muted"],
  ["segment", ".dr-segment-group", "--muted"],
  ["slider", ".dr-slider-track", "--secondary"],
  ["progress", ".dr-progress", "--secondary"],
  ["switch", '.dr-switch[data-state="unchecked"]', "--input"],
] as const

describe("the well fill", () => {
  it("is unset on the layered :root", () => {
    expect(bodyOf("theme", ":root", ["@layer base"])).toContain(
      "--well-fill: initial;",
    )
  })

  it.each(READERS)(
    "%s %s paints var(--well-fill), falling back to %s",
    (file, selector, fallback) => {
      expect(bodyOf(file, selector)).toContain(
        `background-color: var(--well-fill, hsl(var(${fallback})));`,
      )
    },
  )

  // A utility fill left beside the reader would win or lose by source
  // order and hide the token.
  it.each([
    ["tabs", '.dr-tabs-list[data-variant="default"]'],
    ["tabs", '.dr-tabs-list[data-variant="outline"]'],
    ["segment", ".dr-segment-group"],
    ["slider", ".dr-slider-track"],
    ["progress", ".dr-progress"],
    ["switch", ".dr-switch"],
  ] as const)("%s %s keeps no utility fill", (file, selector) => {
    expect(bodyOf(file, selector)).not.toMatch(/\bbg-(muted|secondary|input)\b/)
  })
})
