import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Stat, StatLabel, StatValue, StatChange } from "./Stat"

describe("Stat", () => {
  it("renders label, value, and change", () => {
    render(
      <Stat>
        <StatLabel>Revenue</StatLabel>
        <StatValue>$45,231</StatValue>
        <StatChange direction="up">+12.5%</StatChange>
      </Stat>,
    )
    expect(screen.getByText("Revenue")).toBeInTheDocument()
    expect(screen.getByText("$45,231")).toBeInTheDocument()
    const change = screen.getByText("+12.5%")
    expect(change).toHaveAttribute("data-direction", "up")
  })

  it("defaults StatChange direction to flat", () => {
    render(<StatChange>0%</StatChange>)
    expect(screen.getByText("0%")).toHaveAttribute("data-direction", "flat")
  })
})
