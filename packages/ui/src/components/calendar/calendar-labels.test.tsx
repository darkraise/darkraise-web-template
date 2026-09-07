import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { UiLabelsProvider } from "@labels"
import { Calendar } from "./Calendar"

const june = new Date(2024, 5, 1)

const vi = {
  calendar: {
    previousMonth: "Tháng trước",
    nextMonth: "Tháng sau",
    chooseMonth: "Chọn tháng",
    chooseYear: "Chọn năm",
    weekNumber: "Số tuần",
    previousYear: "Năm trước",
    nextYear: "Năm sau",
  },
}

describe("Calendar navigation labels", () => {
  it("uses the English defaults with no provider mounted", () => {
    render(<Calendar defaultMonth={june} showWeekNumber />)
    expect(
      screen.getByRole("button", { name: "Previous month" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Next month" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Week number" }),
    ).toBeInTheDocument()
  })

  it("localizes month navigation and the week-number header", () => {
    render(
      <UiLabelsProvider value={vi}>
        <Calendar defaultMonth={june} showWeekNumber />
      </UiLabelsProvider>,
    )
    expect(
      screen.getByRole("button", { name: "Tháng trước" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Tháng sau" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Số tuần" }),
    ).toBeInTheDocument()
  })

  it("localizes the month and year dropdowns", () => {
    render(
      <UiLabelsProvider value={vi}>
        <Calendar defaultMonth={june} captionLayout="dropdown" />
      </UiLabelsProvider>,
    )
    expect(screen.getByLabelText("Chọn tháng")).toBeInTheDocument()
    expect(screen.getByLabelText("Chọn năm")).toBeInTheDocument()
  })

  it("localizes the year-view navigation reached by switching views", async () => {
    const user = userEvent.setup()
    render(
      <UiLabelsProvider value={vi}>
        <Calendar defaultMonth={june} />
      </UiLabelsProvider>,
    )
    await user.click(screen.getByRole("button", { name: /June 2024/ }))
    expect(
      screen.getByRole("button", { name: "Năm trước" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Năm sau" })).toBeInTheDocument()
  })

  it("names the view-switching captions", async () => {
    const user = userEvent.setup()
    render(<Calendar defaultMonth={june} />)
    const caption = screen.getByRole("button", {
      name: "June 2024, switch to year view",
    })
    await user.click(caption)
    expect(
      screen.getByRole("button", { name: "2024, switch to decade view" }),
    ).toBeInTheDocument()
  })
})
