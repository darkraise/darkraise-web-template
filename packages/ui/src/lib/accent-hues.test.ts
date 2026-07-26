import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { ACCENT_HUES } from "./accent-hues"

const thisDir = dirname(fileURLToPath(import.meta.url))

describe("ACCENT_HUES", () => {
  it("lists the seventeen Tailwind accent hues in ramp order", () => {
    expect(ACCENT_HUES).toHaveLength(17)
    expect(ACCENT_HUES[0]).toBe("red")
    expect(ACCENT_HUES.at(-1)).toBe("rose")
    expect(new Set(ACCENT_HUES).size).toBe(ACCENT_HUES.length)
  })

  // Guards the reason this list is shared at all: a hue in the type with no
  // rule in the CSS is a variant that silently renders unstyled.
  it("every hue has a Badge variant rule", () => {
    const css = readFileSync(
      resolve(thisDir, "../components/badge/badge.css"),
      "utf8",
    )
    for (const hue of ACCENT_HUES) {
      expect(css).toContain(`.dr-badge[data-variant="${hue}"]`)
    }
  })
})
