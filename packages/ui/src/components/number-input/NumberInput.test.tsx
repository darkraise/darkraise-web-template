import * as React from "react"
import { fireEvent, render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrementTrigger,
  NumberInputField,
  NumberInputIncrementTrigger,
  NumberInputLabel,
} from "./NumberInput"

function renderBasic(
  props: Partial<React.ComponentProps<typeof NumberInput>> = {},
) {
  return render(
    <NumberInput defaultValue={5} min={0} max={100} step={1} {...props}>
      <NumberInputLabel>Quantity</NumberInputLabel>
      <NumberInputControl>
        <NumberInputField aria-label="quantity" placeholder="0" />
        <NumberInputIncrementTrigger />
        <NumberInputDecrementTrigger />
      </NumberInputControl>
    </NumberInput>,
  )
}

describe("NumberInput", () => {
  it("renders the initial value formatted into the field", () => {
    renderBasic({ defaultValue: 42 })
    const input = screen.getByLabelText("quantity") as HTMLInputElement
    expect(input.value).toBe("42")
  })

  it("increments by step when the increment trigger is clicked", async () => {
    const user = userEvent.setup()
    renderBasic({ defaultValue: 5, step: 1 })
    await user.click(screen.getByRole("button", { name: "Increment" }))
    const input = screen.getByLabelText("quantity") as HTMLInputElement
    expect(input.value).toBe("6")
  })

  it("decrements by step when the decrement trigger is clicked", async () => {
    const user = userEvent.setup()
    renderBasic({ defaultValue: 5, step: 1 })
    await user.click(screen.getByRole("button", { name: "Decrement" }))
    const input = screen.getByLabelText("quantity") as HTMLInputElement
    expect(input.value).toBe("4")
  })

  it("steps up and down with ArrowUp / ArrowDown", async () => {
    const user = userEvent.setup()
    renderBasic({ defaultValue: 10, step: 1 })
    const input = screen.getByLabelText("quantity") as HTMLInputElement
    input.focus()
    await user.keyboard("{ArrowUp}")
    expect(input.value).toBe("11")
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(input.value).toBe("9")
  })

  it("multiplies the step by 10 when Shift is held", async () => {
    const user = userEvent.setup()
    renderBasic({ defaultValue: 0, step: 1, max: 1000 })
    const input = screen.getByLabelText("quantity") as HTMLInputElement
    input.focus()
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}")
    expect(input.value).toBe("10")
  })

  it("clamps out-of-range values on blur", async () => {
    const user = userEvent.setup()
    renderBasic({ defaultValue: 1, min: 0, max: 100 })
    const input = screen.getByLabelText("quantity") as HTMLInputElement
    await user.click(input)
    await user.clear(input)
    await user.type(input, "999")
    // Out-of-range allowed while typing.
    expect(input.value).toBe("999")
    await user.tab()
    expect(input.value).toBe("100")
  })

  it("blocks all interactions when disabled", async () => {
    const user = userEvent.setup()
    renderBasic({ defaultValue: 5, disabled: true })
    const input = screen.getByLabelText("quantity") as HTMLInputElement
    expect(input).toBeDisabled()
    const inc = screen.getByRole("button", { name: "Increment" })
    const dec = screen.getByRole("button", { name: "Decrement" })
    expect(inc).toBeDisabled()
    expect(dec).toBeDisabled()
    await user.click(inc)
    expect(input.value).toBe("5")
  })

  it("formats with Intl.NumberFormat currency options", () => {
    render(
      <NumberInput
        defaultValue={1234.5}
        formatOptions={{ style: "currency", currency: "USD" }}
        locale="en-US"
      >
        <NumberInputControl>
          <NumberInputField aria-label="price" />
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputControl>
      </NumberInput>,
    )
    const input = screen.getByLabelText("price") as HTMLInputElement
    expect(input.value).toMatch(/\$1,234\.50/)
  })

  describe("press-and-hold", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it("repeats step while increment trigger is held", () => {
      render(
        <NumberInput defaultValue={0} min={0} max={100} step={1}>
          <NumberInputControl>
            <NumberInputField aria-label="quantity" />
            <NumberInputIncrementTrigger />
            <NumberInputDecrementTrigger />
          </NumberInputControl>
        </NumberInput>,
      )
      const input = screen.getByLabelText("quantity") as HTMLInputElement
      const inc = screen.getByRole("button", { name: "Increment" })

      act(() => {
        fireEvent.pointerDown(inc, { pointerId: 1 })
      })
      // Initial click increments immediately.
      expect(input.value).toBe("1")
      // After 400ms delay, interval starts at 100ms.
      act(() => {
        vi.advanceTimersByTime(400)
      })
      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(input.value).toBe("2")
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(input.value).toBe("5")
      act(() => {
        fireEvent.pointerUp(inc, { pointerId: 1 })
      })
      // After release, timer is cleared.
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(input.value).toBe("5")
    })
  })
})
