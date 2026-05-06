import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"

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
  it("renders swatch with current color", () => {
    render(<Harness initial="#3b82f6" />)
    const swatch = screen.getByRole("button", {
      name: /current color #3b82f6/i,
    })
    expect(swatch).toBeInTheDocument()
    expect(swatch.style.backgroundColor).toBe("rgb(59, 130, 246)")
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
    const last = spy.mock.calls.at(-1)?.[0]
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
    const last = spy.mock.calls.at(-1)?.[0]
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

  it("expands 3-digit hex to 6-digit on input blur", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Harness onChange={spy} />)
    const input = screen.getByLabelText("Brand color") as HTMLInputElement
    await user.clear(input)
    await user.type(input, "#abc")
    await user.tab()
    const last = spy.mock.calls.at(-1)?.[0]
    expect(last?.value).toBe("#aabbcc")
  })
})
