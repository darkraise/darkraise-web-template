import { describe, expect, it } from "vitest"
import { GLASS_TRANSPARENCIES } from "../types"
import {
  OVERLAY_ALPHA_FLOOR,
  SURFACE_ALPHA_FLOOR,
  TRANSPARENCY_SCALE,
  effectiveAlpha,
} from "./transparency"

describe("transparency scale", () => {
  it("scales the see-through share by step and leaves Medium as declared", () => {
    expect(
      GLASS_TRANSPARENCIES.map((step) => TRANSPARENCY_SCALE[step]),
    ).toEqual([0.6, 1, 1.5])
  })

  it.each([
    [0.72, "low", 0.832],
    [0.72, "medium", 0.72],
    [0.72, "high", 0.58],
    [0.6, "high", 0.4],
  ] as const)(
    "paints a declared %s at %s as %s",
    (declared, step, expected) => {
      expect(
        effectiveAlpha(declared, TRANSPARENCY_SCALE[step], SURFACE_ALPHA_FLOOR),
      ).toBeCloseTo(expected)
    },
  )

  it("keeps an opaque look opaque at every step", () => {
    for (const step of GLASS_TRANSPARENCIES) {
      expect(
        effectiveAlpha(1, TRANSPARENCY_SCALE[step], SURFACE_ALPHA_FLOOR),
      ).toBe(1)
      expect(
        effectiveAlpha(1, TRANSPARENCY_SCALE[step], OVERLAY_ALPHA_FLOOR),
      ).toBe(1)
    }
  })

  it("stops at the card floor, and at the higher overlay floor", () => {
    expect(effectiveAlpha(0.4, 1.5, SURFACE_ALPHA_FLOOR)).toBe(0.2)
    expect(effectiveAlpha(0.46, 1.5, OVERLAY_ALPHA_FLOOR)).toBe(0.4)
    expect(OVERLAY_ALPHA_FLOOR).toBeGreaterThan(SURFACE_ALPHA_FLOOR)
  })
})
