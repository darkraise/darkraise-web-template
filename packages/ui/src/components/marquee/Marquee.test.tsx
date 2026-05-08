import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Marquee } from "./Marquee"

describe("Marquee", () => {
  it("clones children twice for seamless looping", () => {
    render(
      <Marquee data-testid="m">
        <span>Hello</span>
      </Marquee>,
    )
    expect(screen.getAllByText("Hello")).toHaveLength(2)
  })

  it("applies pauseOnHover via data attribute", () => {
    render(
      <Marquee pauseOnHover data-testid="m">
        <span>x</span>
      </Marquee>,
    )
    expect(screen.getByTestId("m")).toHaveAttribute(
      "data-pause-on-hover",
      "true",
    )
  })
})
