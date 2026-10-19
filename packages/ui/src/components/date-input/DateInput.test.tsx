import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { UiI18nProvider } from "../../i18n"
import { vi as vietnamese } from "../../locales/vi"
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
    if (!year || !month || !day) throw new Error("date segments missing")
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
    if (!year) throw new Error("year segment missing")
    year.focus()
    await userEvent.keyboard("{ArrowUp}")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2025, 0, 1))
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2023, 0, 1))
  })

  it("typing a full date fills each segment in turn", async () => {
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
    if (!year || !month || !day) throw new Error("date segments missing")
    year.focus()
    await userEvent.keyboard("20261231")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 11, 31))
    expect(year.value).toBe("2026")
    expect(month.value).toBe("12")
    expect(day.value).toBe("31")
    expect(day).toHaveFocus()
  })

  it("Backspace removes one digit and moves back from an empty segment", async () => {
    render(<DateInput defaultValue={new Date(2024, 11, 9)} aria-label="dob" />)
    const [year, month] = screen.getAllByRole(
      "spinbutton",
    ) as HTMLInputElement[]
    if (!year || !month) throw new Error("date segments missing")
    month.focus()
    await userEvent.keyboard("{Backspace}")
    expect(month.value).toBe("1")
    await userEvent.keyboard("{Backspace}")
    expect(month.value).toBe("")
    expect(month).toHaveFocus()
    await userEvent.keyboard("{Backspace}")
    expect(year).toHaveFocus()
    expect(year.value).toBe("2024")
  })

  it("disabled prevents focus and ignores keys", () => {
    render(<DateInput disabled aria-label="dob" />)
    const inputs = screen.getAllByRole("spinbutton")
    inputs.forEach((i) => expect(i).toBeDisabled())
  })

  it("external value=null clears all segments even when parts hold a complete date", async () => {
    function Wrapper() {
      const [d, setD] = React.useState<Date | null>(new Date(2024, 5, 9))
      return (
        <>
          <DateInput value={d} onValueChange={setD} aria-label="dob" />
          <button data-testid="clear" type="button" onClick={() => setD(null)}>
            Clear
          </button>
        </>
      )
    }
    render(<Wrapper />)
    const [year, month, day] = screen.getAllByRole(
      "spinbutton",
    ) as HTMLInputElement[]
    if (!year || !month || !day) throw new Error("date segments missing")
    expect(year.value).toBe("2024")
    expect(month.value).toBe("06")
    expect(day.value).toBe("09")

    await userEvent.click(screen.getByTestId("clear"))

    expect(year.value).toBe("")
    expect(month.value).toBe("")
    expect(day.value).toBe("")
  })

  it.each([
    ["ymd", ["YYYY", "MM", "DD"]],
    ["mdy", ["MM", "DD", "YYYY"]],
    ["dmy", ["DD", "MM", "YYYY"]],
  ] as const)(
    "labels the %s segments with their placeholders",
    (format, expected) => {
      render(<DateInput format={format} aria-label="dob" />)
      const segments = screen.getAllByRole("spinbutton") as HTMLInputElement[]
      expect(segments.map((segment) => segment.placeholder)).toEqual(expected)
    },
  )

  it("follows the locale's segment order with the same placeholders", () => {
    render(
      <UiI18nProvider locale="vi" locales={[vietnamese]}>
        <DateInput aria-label="dob" />
      </UiI18nProvider>,
    )
    const segments = screen.getAllByRole("spinbutton") as HTMLInputElement[]
    expect(segments.map((segment) => segment.placeholder)).toEqual([
      "DD",
      "MM",
      "YYYY",
    ])
  })

  it("marks its root data-disabled only when disabled", () => {
    const { rerender } = render(<DateInput aria-label="dob" />)
    expect(screen.getByRole("group")).not.toHaveAttribute("data-disabled")
    rerender(<DateInput disabled aria-label="dob" />)
    expect(screen.getByRole("group")).toHaveAttribute("data-disabled", "true")
  })

  it("keeps a typed segment when a new value lands in the same render", () => {
    const changes: Array<number | null> = []
    let setOuter: (next: Date | null) => void = () => {}
    function Wrapper() {
      const [d, setD] = React.useState<Date | null>(new Date(2024, 9, 8))
      setOuter = setD
      return (
        <DateInput
          value={d}
          onValueChange={(next) => {
            changes.push(next ? next.getFullYear() : null)
            // A ping-pong between two dates never settles under act; the
            // cap stops it so the assertion can report it.
            if (changes.length < 20) setD(next ?? null)
          }}
          aria-label="dob"
        />
      )
    }
    render(<Wrapper />)
    const [year] = screen.getAllByRole("spinbutton") as HTMLInputElement[]
    if (!year) throw new Error("year segment missing")
    act(() => {
      setOuter(new Date(2025, 9, 8))
      fireEvent.change(year, { target: { value: "2026" } })
    })
    expect(changes).toEqual([2026])
    expect(year.value).toBe("2026")
  })
})

function segments() {
  const [first, second, third] = screen.getAllByRole(
    "spinbutton",
  ) as HTMLInputElement[]
  if (!first || !second || !third) throw new Error("date segments missing")
  return [first, second, third] as const
}

describe("DateInput segment typing", () => {
  it.each([
    ["99", "09", "09"],
    ["13", "01", "3"],
    ["4", "04", ""],
    ["00", "0", ""],
    ["007", "07", ""],
    ["12", "12", ""],
  ])(
    "typing %s into an empty month leaves month %j and day %j",
    async (typed, month, day) => {
      const user = userEvent.setup()
      render(<DateInput aria-label="dob" />)
      const [, monthInput, dayInput] = segments()
      monthInput.focus()
      await user.keyboard(typed)
      expect(monthInput.value).toBe(month)
      expect(dayInput.value).toBe(day)
    },
  )

  it("moves focus to the day once the month completes", async () => {
    const user = userEvent.setup()
    render(<DateInput aria-label="dob" />)
    const [, month, day] = segments()
    month.focus()
    await user.keyboard("0")
    expect(month).toHaveFocus()
    await user.keyboard("0")
    expect(month).toHaveFocus()
    await user.keyboard("4")
    expect(day).toHaveFocus()
  })

  it.each([
    ["5", "05", ""],
    ["32", "03", "02"],
    ["31", "31", ""],
  ])(
    "typing %s into an empty day leaves day %j and month %j",
    async (typed, day, month) => {
      const user = userEvent.setup()
      render(<DateInput format="dmy" aria-label="dob" />)
      const [dayInput, monthInput] = segments()
      dayInput.focus()
      await user.keyboard(typed)
      expect(dayInput.value).toBe(day)
      expect(monthInput.value).toBe(month)
    },
  )

  it("types 99 as month 09 and day 09 in a full entry", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DateInput aria-label="dob" onValueChange={onValueChange} />)
    const [year] = segments()
    year.focus()
    await user.keyboard("202699")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 8, 9))
  })
})

describe("DateInput impossible dates", () => {
  it.each([
    ["20260229", "29 February in a non-leap year"],
    ["20260431", "31 April"],
  ])("keeps %s as typed and flags it (%s)", async (typed) => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onInvalidChange = vi.fn()
    render(
      <DateInput
        aria-label="dob"
        onValueChange={onValueChange}
        onInvalidChange={onInvalidChange}
      />,
    )
    const [year, month, day] = segments()
    year.focus()
    await user.keyboard(typed)
    expect([year.value, month.value, day.value]).toEqual([
      typed.slice(0, 4),
      typed.slice(4, 6),
      typed.slice(6),
    ])
    const group = screen.getByRole("group")
    expect(group).toHaveAttribute("aria-invalid", "true")
    expect(group).toHaveAttribute("data-invalid")
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(onInvalidChange.mock.calls).toEqual([[true]])
  })

  it("clears the flag and commits once the date exists", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onInvalidChange = vi.fn()
    render(
      <DateInput
        aria-label="dob"
        defaultValue={new Date(2026, 1, 20)}
        onValueChange={onValueChange}
        onInvalidChange={onInvalidChange}
      />,
    )
    const [, , day] = segments()
    day.focus()
    await user.keyboard("{Backspace}{Backspace}29")
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    await user.keyboard("{Backspace}{Backspace}28")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 1, 28))
    expect(onInvalidChange.mock.calls).toEqual([[true], [false]])
    const group = screen.getByRole("group")
    expect(group).not.toHaveAttribute("aria-invalid")
    expect(group).not.toHaveAttribute("data-invalid")
  })

  it("keeps a consumer's aria-invalid on a valid date", () => {
    render(
      <DateInput
        aria-label="dob"
        aria-invalid="true"
        defaultValue={new Date(2026, 1, 20)}
      />,
    )
    const group = screen.getByRole("group")
    expect(group).toHaveAttribute("aria-invalid", "true")
    expect(group).not.toHaveAttribute("data-invalid")
  })
})

describe("DateInput carried digit", () => {
  it("leaves the caret after a digit carried into the next segment", async () => {
    const user = userEvent.setup()
    render(<DateInput aria-label="dob" />)
    const [, month, day] = segments()
    month.focus()
    await user.keyboard("13")
    expect(day).toHaveFocus()
    expect([day.selectionStart, day.selectionEnd]).toEqual([1, 1])
    await user.keyboard("1")
    expect([month.value, day.value]).toEqual(["01", "31"])
  })

  it("keeps the caret after a carried digit the day already held", async () => {
    const user = userEvent.setup()
    render(<DateInput aria-label="dob" />)
    const [, month, day] = segments()
    day.focus()
    await user.keyboard("3")
    month.focus()
    await user.keyboard("13")
    expect(day).toHaveFocus()
    expect([day.selectionStart, day.selectionEnd]).toEqual([1, 1])
    await user.keyboard("1")
    expect([month.value, day.value]).toEqual(["01", "31"])
  })
})
