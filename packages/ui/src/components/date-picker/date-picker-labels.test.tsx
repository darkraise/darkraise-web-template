import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { UiLabelsProvider } from "@labels"
import { DatePicker, DatePickerTrigger } from "./DatePicker"

describe("DatePicker trigger label", () => {
  it("uses the English default with no provider mounted", () => {
    render(
      <DatePicker>
        <DatePickerTrigger />
      </DatePicker>,
    )
    expect(
      screen.getByRole("button", { name: "Open date picker" }),
    ).toBeInTheDocument()
  })

  it("takes the localized default from the provider", () => {
    render(
      <UiLabelsProvider value={{ datePicker: { trigger: "Mở lịch" } }}>
        <DatePicker>
          <DatePickerTrigger />
        </DatePicker>
      </UiLabelsProvider>,
    )
    expect(screen.getByRole("button", { name: "Mở lịch" })).toBeInTheDocument()
  })

  it("keeps an explicit aria-label ahead of the provider", () => {
    render(
      <UiLabelsProvider value={{ datePicker: { trigger: "Mở lịch" } }}>
        <DatePicker>
          <DatePickerTrigger aria-label="Ngày sinh" />
        </DatePicker>
      </UiLabelsProvider>,
    )
    expect(
      screen.getByRole("button", { name: "Ngày sinh" }),
    ).toBeInTheDocument()
  })
})
