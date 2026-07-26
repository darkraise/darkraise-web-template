import { describe, expect, it } from "vitest"

import { ACCENT_HUES } from "./accent-hues"

describe("ACCENT_HUES", () => {
  it("lists the seventeen Tailwind accent hues in ramp order", () => {
    expect(ACCENT_HUES).toHaveLength(17)
    expect(ACCENT_HUES[0]).toBe("red")
    expect(ACCENT_HUES.at(-1)).toBe("rose")
    expect(new Set(ACCENT_HUES).size).toBe(ACCENT_HUES.length)
  })
})
