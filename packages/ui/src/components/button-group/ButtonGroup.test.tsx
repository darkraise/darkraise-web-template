import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Button } from "@components/button"
import { ButtonGroup } from "./ButtonGroup"

describe("ButtonGroup", () => {
  it("wraps children in a group with role='group'", () => {
    render(
      <ButtonGroup aria-label="Text alignment">
        <Button>Left</Button>
        <Button>Center</Button>
        <Button>Right</Button>
      </ButtonGroup>,
    )
    expect(
      screen.getByRole("group", { name: "Text alignment" }),
    ).toBeInTheDocument()
  })

  it("supports vertical orientation via data attribute", () => {
    render(
      <ButtonGroup orientation="vertical" data-testid="g">
        <Button>A</Button>
      </ButtonGroup>,
    )
    expect(screen.getByTestId("g")).toHaveAttribute(
      "data-orientation",
      "vertical",
    )
  })
})
