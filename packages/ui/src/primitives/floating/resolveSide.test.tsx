import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { placementOf, resolveSide, type LogicalSide } from "./resolveSide"

function referenceIn(dir: "ltr" | "rtl"): HTMLElement {
  const { getByTestId } = render(
    <div dir={dir}>
      <button data-testid={`reference-${dir}`} />
    </div>,
  )
  return getByTestId(`reference-${dir}`)
}

describe("resolveSide", () => {
  it.each<[LogicalSide, "ltr" | "rtl", string]>([
    ["start", "ltr", "left"],
    ["end", "ltr", "right"],
    ["start", "rtl", "right"],
    ["end", "rtl", "left"],
    ["top", "rtl", "top"],
    ["bottom", "rtl", "bottom"],
    ["left", "rtl", "left"],
    ["right", "rtl", "right"],
    ["left", "ltr", "left"],
    ["right", "ltr", "right"],
  ])("resolves %s under %s to %s", (side, dir, expected) => {
    expect(resolveSide(side, referenceIn(dir))).toBe(expected)
  })

  it("treats a missing reference as left to right", () => {
    expect(resolveSide("start", null)).toBe("left")
    expect(resolveSide("end", undefined)).toBe("right")
  })
})

describe("placementOf", () => {
  it("joins a side and a non-centre alignment", () => {
    expect(placementOf("bottom", "center")).toBe("bottom")
    expect(placementOf("right", "start")).toBe("right-start")
    expect(placementOf("left", "end")).toBe("left-end")
  })
})
