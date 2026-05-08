import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Fieldset, FieldsetLegend } from "./Fieldset"

describe("Fieldset", () => {
  it("renders a <fieldset> with a legend", () => {
    render(
      <Fieldset>
        <FieldsetLegend>Account</FieldsetLegend>
        <input aria-label="email" />
      </Fieldset>,
    )
    expect(screen.getByRole("group", { name: "Account" })).toBeInTheDocument()
  })

  it("propagates disabled to descendants", () => {
    render(
      <Fieldset disabled>
        <FieldsetLegend>Group</FieldsetLegend>
        <input aria-label="x" />
      </Fieldset>,
    )
    expect(screen.getByLabelText("x")).toBeDisabled()
  })
})
