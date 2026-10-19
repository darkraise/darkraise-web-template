import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"

import { UiI18nProvider } from "../../i18n"
import { vi as vietnamese } from "../../locales/vi"

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerInput,
  ColorPickerLabel,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerSwatchItem,
  ColorPickerTrigger,
  type ColorPickerValueChangeDetails,
} from "./ColorPicker"

interface HarnessProps {
  initial?: string
  disabled?: boolean
  open?: boolean
  defaultOpen?: boolean
  onChange?: (details: ColorPickerValueChangeDetails) => void
  closeOnSelect?: boolean
  controlled?: boolean
}

function Harness({
  initial = "#3b82f6",
  disabled,
  open,
  defaultOpen,
  onChange,
  closeOnSelect,
  controlled = true,
}: HarnessProps) {
  const [value, setValue] = React.useState(initial)
  const handleChange = (d: ColorPickerValueChangeDetails) => {
    if (controlled) setValue(d.value)
    onChange?.(d)
  }
  return (
    <ColorPicker
      value={controlled ? value : undefined}
      defaultValue={controlled ? undefined : initial}
      onValueChange={handleChange}
      disabled={disabled}
      open={open}
      defaultOpen={defaultOpen}
      closeOnSelect={closeOnSelect}
    >
      <ColorPickerLabel>Brand color</ColorPickerLabel>
      <ColorPickerControl>
        <ColorPickerSwatch />
        <ColorPickerInput />
        <ColorPickerTrigger>open</ColorPickerTrigger>
      </ColorPickerControl>
      <ColorPickerContent>
        <ColorPickerArea />
        <ColorPickerSwatchGroup>
          <ColorPickerSwatchItem value="#ef4444" />
          <ColorPickerSwatchItem value="#10b981" />
          <ColorPickerSwatchItem value="#3b82f6" />
        </ColorPickerSwatchGroup>
      </ColorPickerContent>
    </ColorPicker>
  )
}

describe("ColorPicker", () => {
  it("renders the swatch as a named colour preview, not a button", () => {
    render(<Harness initial="#3b82f6" />)
    const swatch = screen.getByRole("img", { name: "Current color #3b82f6" })
    expect(swatch.style.backgroundColor).toBe("rgb(59, 130, 246)")
    expect(swatch).not.toHaveAttribute("aria-haspopup")
    expect(swatch).not.toHaveAttribute("tabindex")
    expect(screen.getAllByRole("button")).toEqual([
      screen.getByRole("button", { name: "Open color picker" }),
    ])
  })

  it("opens only from the trigger, and the swatch shares no trigger id", async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)
    const ids = Array.from(container.querySelectorAll("[id]"), (el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
    await user.click(screen.getByRole("img", { name: /current color/i }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("names the swatch in the active locale", () => {
    render(
      <UiI18nProvider locale="vi" locales={[vietnamese]}>
        <Harness initial="#3b82f6" />
      </UiI18nProvider>,
    )
    expect(
      screen.getByRole("img", { name: "Màu hiện tại #3b82f6" }),
    ).toBeInTheDocument()
  })

  it("trigger click opens the popover", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole("button", { name: "Open color picker" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await user.click(trigger)
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toBeInTheDocument()
  })

  it("picking a swatch group item updates value", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Harness onChange={spy} defaultOpen />)
    const item = await screen.findByRole("button", {
      name: /select color #ef4444/i,
    })
    await user.click(item)
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last?.value).toBe("#ef4444")
  })

  it("input change sets value when valid hex on blur", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Harness onChange={spy} />)
    const input = screen.getByLabelText("Brand color") as HTMLInputElement
    await user.clear(input)
    await user.type(input, "#10b981")
    expect(spy).not.toHaveBeenCalled()
    await user.tab()
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last?.value).toBe("#10b981")
  })

  it("invalid hex on blur reverts to last good value", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Harness initial="#3b82f6" onChange={spy} />)
    const input = screen.getByLabelText("Brand color") as HTMLInputElement
    await user.clear(input)
    await user.type(input, "not-a-color")
    await user.tab()
    expect(spy).not.toHaveBeenCalled()
    expect(input.value).toBe("#3b82f6")
  })

  it("disabled prevents trigger from opening", async () => {
    const user = userEvent.setup()
    render(<Harness disabled />)
    const trigger = screen.getByRole("button", { name: "Open color picker" })
    expect(trigger).toBeDisabled()
    await user.click(trigger)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("controlled open prop is honored", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Harness open={false} />)
    const trigger = screen.getByRole("button", { name: "Open color picker" })
    await user.click(trigger)
    expect(screen.queryByRole("dialog")).toBeNull()
    rerender(<Harness open />)
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("reverts empty input on blur to the last valid value", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Harness initial="#3b82f6" onChange={spy} />)
    const input = screen.getByLabelText("Brand color") as HTMLInputElement
    await user.clear(input)
    await user.tab()
    expect(spy).not.toHaveBeenCalled()
    expect(input.value).toBe("#3b82f6")
  })

  it("expands 3-digit hex to 6-digit on input blur", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Harness onChange={spy} />)
    const input = screen.getByLabelText("Brand color") as HTMLInputElement
    await user.clear(input)
    await user.type(input, "#abc")
    await user.tab()
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last?.value).toBe("#aabbcc")
  })
})

describe("ColorPicker disabled area", () => {
  it("shows the not-allowed cursor on both planes", () => {
    render(<Harness disabled open />)
    expect(
      screen.getByRole("slider", { name: "Saturation and brightness" }),
    ).toHaveStyle({ cursor: "not-allowed" })
    expect(screen.getByRole("slider", { name: "Hue" })).toHaveStyle({
      cursor: "not-allowed",
    })
  })
})

// The open popover focuses its content in a microtask; wait for that before
// moving focus to a control inside it.
async function focusInPicker(element: HTMLElement) {
  await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus())
  element.focus()
}

describe("ColorPicker hue slider", () => {
  it("runs 0 to 359 with Home, End and page steps and no wrapping", async () => {
    const user = userEvent.setup()
    render(<Harness initial="#ff0000" defaultOpen />)
    const hue = screen.getByRole("slider", { name: "Hue" })
    expect(hue).toHaveAttribute("aria-valuemin", "0")
    expect(hue).toHaveAttribute("aria-valuemax", "359")
    await focusInPicker(hue)
    await user.keyboard("{ArrowLeft}")
    expect(hue).toHaveAttribute("aria-valuenow", "0")
    await user.keyboard("{PageUp}")
    expect(hue).toHaveAttribute("aria-valuenow", "36")
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}")
    expect(hue).toHaveAttribute("aria-valuenow", "46")
    await user.keyboard("{PageDown}{ArrowDown}")
    expect(hue).toHaveAttribute("aria-valuenow", "9")
    await user.keyboard("{End}")
    expect(hue).toHaveAttribute("aria-valuenow", "359")
    await user.keyboard("{ArrowRight}")
    expect(hue).toHaveAttribute("aria-valuenow", "359")
    await user.keyboard("{Home}")
    expect(hue).toHaveAttribute("aria-valuenow", "0")
  })

  it("moves on a grey and keeps its hue when the value turns grey", async () => {
    const user = userEvent.setup()
    render(<Harness initial="#808080" open />)
    const hue = () => screen.getByRole("slider", { name: "Hue" })
    await focusInPicker(hue())
    await user.keyboard("{PageUp}{ArrowRight}")
    expect(hue()).toHaveAttribute("aria-valuenow", "37")
    const input = screen.getByLabelText("Brand color")
    await user.clear(input)
    await user.type(input, "#ffffff{Enter}")
    expect(hue()).toHaveAttribute("aria-valuenow", "37")
    await user.clear(input)
    await user.type(input, "#0000ff{Enter}")
    expect(hue()).toHaveAttribute("aria-valuenow", "240")
  })

  it("keeps a grey's hue when the popover closes and reopens", async () => {
    const user = userEvent.setup()
    render(<Harness initial="#808080" defaultOpen />)
    await focusInPicker(screen.getByRole("slider", { name: "Hue" }))
    await user.keyboard("{End}")
    const trigger = screen.getByRole("button", { name: "Open color picker" })
    await user.click(trigger)
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await user.click(trigger)
    expect(screen.getByRole("slider", { name: "Hue" })).toHaveAttribute(
      "aria-valuenow",
      "359",
    )
  })
})

describe("ColorPicker saturation area", () => {
  it("is a 2D slider that reports saturation and brightness", async () => {
    const user = userEvent.setup()
    render(<Harness initial="#ff0000" defaultOpen />)
    const area = screen.getByRole("slider", {
      name: "Saturation and brightness",
    })
    expect(area).toHaveAttribute("aria-roledescription", "2D slider")
    expect(area).toHaveAttribute(
      "aria-valuetext",
      "Saturation 100%, Brightness 100%",
    )
    await focusInPicker(area)
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}{ArrowDown}")
    expect(area).toHaveAttribute(
      "aria-valuetext",
      "Saturation 90%, Brightness 99%",
    )
  })

  it("marks every picker control aria-disabled when disabled", () => {
    render(<Harness disabled open />)
    const controls = [
      screen.getByLabelText("Brand color"),
      screen.getByRole("button", { name: "Open color picker" }),
      screen.getByRole("slider", { name: "Saturation and brightness" }),
      screen.getByRole("slider", { name: "Hue" }),
      ...screen.getAllByRole("button", { name: /select color/i }),
    ]
    for (const control of controls) {
      expect(control).toHaveAttribute("aria-disabled", "true")
    }
  })
})
