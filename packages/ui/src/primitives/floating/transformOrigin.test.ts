import { describe, expect, it } from "vitest"
import type { Placement } from "@floating-ui/react"
import { transformOrigin, transformOriginFor } from "./transformOrigin"

describe("transformOriginFor", () => {
  it.each<[Placement, boolean, string]>([
    ["bottom", false, "50% 0%"],
    ["bottom-start", false, "0% 0%"],
    ["bottom-start", true, "100% 0%"],
    ["top-end", false, "100% 100%"],
    ["top-end", true, "0% 100%"],
    ["right-start", true, "0% 0%"],
    ["left-end", false, "100% 100%"],
    ["left", false, "100% 50%"],
  ])("%s (rtl %s) scales from %s", (placement, rtl, expected) => {
    expect(transformOriginFor(placement, rtl)).toBe(expected)
  })

  it("follows the arrow along a top or bottom edge", () => {
    expect(
      transformOriginFor("top", false, { x: 10, width: 12, height: 6 }),
    ).toBe("16px 100%")
  })

  it("follows the arrow along a left or right edge", () => {
    expect(
      transformOriginFor("right", false, { y: 20, width: 6, height: 8 }),
    ).toBe("0% 24px")
  })
})

describe("transformOrigin middleware", () => {
  it("writes the origin onto the floating element", async () => {
    const floating = document.createElement("div")
    const middleware = transformOrigin(null)
    const state = {
      placement: "top-start",
      elements: { floating, reference: document.createElement("button") },
      middlewareData: {},
      platform: { isRTL: async () => false },
    } as unknown as Parameters<typeof middleware.fn>[0]
    await middleware.fn(state)
    expect(floating.style.getPropertyValue("--popup-transform-origin")).toBe(
      "0% 100%",
    )
  })
})
