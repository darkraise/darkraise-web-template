import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { DateInput } from "./DateInput"

describe("DateInput", () => {
  it("renders three spinbutton segments", () => {
    render(<DateInput aria-label="dob" />)
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3)
  })

  it("displays a controlled date in YMD format by default", () => {
    render(
      <DateInput
        value={new Date(2024, 5, 9)}
        onValueChange={() => {}}
        aria-label="dob"
      />,
    )
    const [year, month, day] = screen.getAllByRole(
      "spinbutton",
    ) as HTMLInputElement[]
    expect(year.value).toBe("2024")
    expect(month.value).toBe("06")
    expect(day.value).toBe("09")
  })

  it("ArrowUp on year increments by 1, ArrowDown decrements", async () => {
    const onValueChange = vi.fn()
    function Wrapper() {
      const [d, setD] = React.useState<Date | null>(new Date(2024, 0, 1))
      return (
        <DateInput
          value={d}
          onValueChange={(next) => {
            setD(next)
            onValueChange(next)
          }}
          aria-label="dob"
        />
      )
    }
    render(<Wrapper />)
    const [year] = screen.getAllByRole("spinbutton") as HTMLInputElement[]
    year.focus()
    await userEvent.keyboard("{ArrowUp}")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2025, 0, 1))
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2023, 0, 1))
  })

  it("typing in a segment updates the value when complete", async () => {
    const onValueChange = vi.fn()
    function Wrapper() {
      const [d, setD] = React.useState<Date | null>(null)
      return (
        <DateInput
          value={d}
          onValueChange={(next) => {
            setD(next)
            onValueChange(next)
          }}
          aria-label="dob"
        />
      )
    }
    render(<Wrapper />)
    const [year, month, day] = screen.getAllByRole(
      "spinbutton",
    ) as HTMLInputElement[]
    year.focus()
    await userEvent.keyboard("2024")
    await userEvent.tab()
    await userEvent.keyboard("12")
    await userEvent.tab()
    await userEvent.keyboard("31")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2024, 11, 31))
    expect(year.value).toBe("2024")
    expect(month.value).toBe("12")
    expect(day.value).toBe("31")
  })

  it("Backspace clears the segment", async () => {
    render(
      <DateInput
        value={new Date(2024, 5, 9)}
        onValueChange={() => {}}
        aria-label="dob"
      />,
    )
    const [year] = screen.getAllByRole("spinbutton") as HTMLInputElement[]
    year.focus()
    await userEvent.keyboard("{Backspace}")
    expect(year.value).toBe("")
  })

  it("disabled prevents focus and ignores keys", () => {
    render(<DateInput disabled aria-label="dob" />)
    const inputs = screen.getAllByRole("spinbutton")
    inputs.forEach((i) => expect(i).toBeDisabled())
  })
})
