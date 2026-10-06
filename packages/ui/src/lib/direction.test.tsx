import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { getDirection, inlineArrow } from "./direction"

function Probe({ dir }: { dir?: "ltr" | "rtl" }) {
  return (
    <div dir={dir}>
      <span data-testid="probe">x</span>
    </div>
  )
}

describe("getDirection", () => {
  it("is ltr with no dir anywhere", () => {
    render(<Probe />)
    expect(getDirection(screen.getByTestId("probe"))).toBe("ltr")
  })

  it("inherits rtl from an ancestor", () => {
    render(<Probe dir="rtl" />)
    expect(getDirection(screen.getByTestId("probe"))).toBe("rtl")
  })

  it("is ltr for a missing element", () => {
    expect(getDirection(null)).toBe("ltr")
    expect(getDirection(undefined)).toBe("ltr")
  })
})

describe("inlineArrow", () => {
  it("maps ArrowRight to next and ArrowLeft to prev left-to-right", () => {
    render(<Probe dir="ltr" />)
    const el = screen.getByTestId("probe")
    expect(inlineArrow("ArrowRight", el)).toBe("next")
    expect(inlineArrow("ArrowLeft", el)).toBe("prev")
  })

  it("swaps them right-to-left", () => {
    render(<Probe dir="rtl" />)
    const el = screen.getByTestId("probe")
    expect(inlineArrow("ArrowRight", el)).toBe("prev")
    expect(inlineArrow("ArrowLeft", el)).toBe("next")
  })

  it("ignores every other key", () => {
    render(<Probe dir="rtl" />)
    const el = screen.getByTestId("probe")
    for (const key of ["ArrowUp", "ArrowDown", "Home", "End", "a"]) {
      expect(inlineArrow(key, el)).toBeNull()
    }
  })
})
