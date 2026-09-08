import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { UiI18nProvider } from "./index"
import { vi as vietnamese } from "../locales/vi"
import { NumberInput, NumberInputField } from "../components/number-input"
import { DatePicker, DatePickerInput } from "../components/date-picker"
import { Portal } from "../primitives/portal"
import { PaginationNext } from "../components/pagination"
import { Spinner } from "../components/spinner"
import { DateInput } from "../components/date-input"
import { ImageEditor, ImageEditorPreset } from "../components/image-editor"

describe("localized component behavior", () => {
  it("applies provider number defaults and lets component options override them", () => {
    const view = (formatOptions?: Intl.NumberFormatOptions) => (
      <UiI18nProvider
        locale="vi"
        locales={[vietnamese]}
        formats={{
          number: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        }}
      >
        <NumberInput value={1.5} formatOptions={formatOptions}>
          <NumberInputField aria-label="Amount" />
        </NumberInput>
      </UiI18nProvider>
    )
    const { rerender } = render(view())
    expect(screen.getByLabelText("Amount")).toHaveValue("1,50")
    rerender(view({ minimumFractionDigits: 3, maximumFractionDigits: 3 }))
    expect(screen.getByLabelText("Amount")).toHaveValue("1,500")
  })
  it("preserves consumer preset labels even when they match a translated default", () => {
    render(
      <UiI18nProvider locale="vi" locales={[vietnamese]}>
        <ImageEditor
          presets={[{ id: "custom", label: "Original", filters: {} }]}
        >
          <ImageEditorPreset preset="custom" />
        </ImageEditor>
      </UiI18nProvider>,
    )
    expect(screen.getByRole("button", { name: "Original" })).toBeVisible()
  })
  it("translates control text and accessible defaults while preserving explicit labels", () => {
    render(
      <UiI18nProvider locale="vi" locales={[vietnamese]}>
        <PaginationNext href="#next" />
        <Spinner />
        <PaginationNext href="#custom" aria-label="Custom next" />
      </UiI18nProvider>,
    )
    expect(
      screen.getByRole("link", { name: "Đến trang sau" }),
    ).toHaveTextContent("Tiếp")
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải")
    expect(screen.getByRole("link", { name: "Custom next" })).toBeVisible()
  })
  it("derives Gregorian date segments from locale while preserving explicit order", () => {
    const { rerender } = render(
      <UiI18nProvider locale="vi" locales={[vietnamese]}>
        <DateInput defaultValue={new Date(2026, 8, 8)} />
      </UiI18nProvider>,
    )
    expect(
      screen
        .getAllByRole("spinbutton")
        .map((input) => input.getAttribute("data-segment")),
    ).toEqual(["day", "month", "year"])
    rerender(
      <UiI18nProvider locale="vi" locales={[vietnamese]}>
        <DateInput format="ymd" defaultValue={new Date(2026, 8, 8)} />
      </UiI18nProvider>,
    )
    expect(
      screen
        .getAllByRole("spinbutton")
        .map((input) => input.getAttribute("data-segment")),
    ).toEqual(["year", "month", "day"])
  })
  it("changes number display without changing its value", () => {
    const changed = vi.fn()
    const view = (locale: string) => (
      <UiI18nProvider locale={locale} locales={[vietnamese]}>
        <NumberInput value={1234.5} onValueChange={changed}>
          <NumberInputField aria-label="Amount" />
        </NumberInput>
      </UiI18nProvider>
    )
    const { rerender } = render(view("en"))
    expect(screen.getByLabelText("Amount")).toHaveValue("1,234.5")
    rerender(view("vi"))
    expect(screen.getByLabelText("Amount")).toHaveValue("1.234,5")
    expect(changed).not.toHaveBeenCalled()
  })
  it("keeps a numeric draft's parse convention across a locale change", () => {
    const changed = vi.fn()
    const view = (locale: string) => (
      <UiI18nProvider locale={locale} locales={[vietnamese]}>
        <NumberInput defaultValue={0} onValueChange={changed}>
          <NumberInputField aria-label="Amount" />
        </NumberInput>
      </UiI18nProvider>
    )
    const { rerender } = render(view("en"))
    const input = screen.getByLabelText("Amount")
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "1.5" } })
    rerender(view("vi"))
    expect(input).toHaveValue("1.5")
    fireEvent.blur(input)
    expect(changed.mock.lastCall?.[0].valueAsNumber).toBe(1.5)
    expect(input).toHaveValue("1,5")
  })
  it("localizes selected calendar dates without introducing a timezone shift", () => {
    render(
      <UiI18nProvider
        locale="vi"
        locales={[vietnamese]}
        formats={{ timeZone: "America/Los_Angeles" }}
      >
        <DatePicker value={new Date(2026, 8, 8)}>
          <DatePickerInput aria-label="Date" />
        </DatePicker>
      </UiI18nProvider>,
    )
    expect(screen.getByLabelText("Date")).toHaveValue("8 thg 9, 2026")
  })
  it.each(["ltr", "rtl"] as const)(
    "passes language and %s direction into a portalled subtree",
    (dir) => {
      render(
        <UiI18nProvider locale="vi" locales={[vietnamese]} dir={dir}>
          <Portal>
            <button>Portal action</button>
          </Portal>
        </UiI18nProvider>,
      )
      expect(screen.getByRole("button").closest("[lang]")).toHaveAttribute(
        "lang",
        "vi",
      )
      expect(screen.getByRole("button").closest("[dir]")).toHaveAttribute(
        "dir",
        dir,
      )
    },
  )
})
