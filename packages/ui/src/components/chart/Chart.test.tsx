import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { ChartContainer } from "@components/chart"

const CONFIG = { revenue: { label: "Revenue", color: "hsl(217 91% 60%)" } }

describe("ChartContainer accessibility", () => {
  it("is an unlabelled graphic with no description, as before", () => {
    render(
      <ChartContainer config={CONFIG}>
        <svg />
      </ChartContainer>,
    )
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("announces the insight when given one", () => {
    render(
      <ChartContainer
        config={CONFIG}
        description="Revenue rose 40% over the last six months"
      >
        <svg />
      </ChartContainer>,
    )
    // A chart is a picture of data with no text alternative of its own, and
    // recharts exposes the values only through a hover tooltip.
    expect(
      screen.getByRole("img", {
        description: "Revenue rose 40% over the last six months",
      }),
    ).toBeInTheDocument()
  })

  it("marks itself busy and shows a placeholder while loading", () => {
    const { container } = render(
      <ChartContainer config={CONFIG} loading>
        <svg />
      </ChartContainer>,
    )
    expect(container.querySelector("[data-slot=chart]")).toHaveAttribute(
      "aria-busy",
      "true",
    )
    expect(container.querySelector(".dr-chart-placeholder")).toBeInTheDocument()
  })

  it("says there is nothing rather than drawing an empty axis frame", () => {
    render(
      <ChartContainer config={CONFIG} empty>
        <svg />
      </ChartContainer>,
    )
    expect(screen.getByText("No data to show")).toBeInTheDocument()
  })

  it("takes custom empty content", () => {
    render(
      <ChartContainer config={CONFIG} empty emptyContent="Pick a date range">
        <svg />
      </ChartContainer>,
    )
    expect(screen.getByText("Pick a date range")).toBeInTheDocument()
  })
})
