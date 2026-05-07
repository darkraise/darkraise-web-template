import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@components/input-otp"

function Basic({
  onChange,
  onComplete,
  value,
  disabled,
}: {
  onChange?: (v: string) => void
  onComplete?: (v: string) => void
  value?: string
  disabled?: boolean
} = {}) {
  return (
    <InputOTP
      maxLength={4}
      onChange={onChange}
      onComplete={onComplete}
      value={value}
      disabled={disabled}
      aria-label="One-time password"
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  )
}

describe("InputOtp", () => {
  it("renders a hidden input with aria-label", () => {
    render(<Basic />)
    const input = screen.getByRole("textbox", { name: "One-time password" })
    expect(input).toBeInTheDocument()
  })

  it("renders 4 slot textboxes with aria-labels", () => {
    render(<Basic />)
    // The hidden input plus 4 slot divs with role=textbox
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    expect(slots).toHaveLength(4)
    expect(slots[0]).toHaveAttribute("aria-label", "Character 1")
    expect(slots[3]).toHaveAttribute("aria-label", "Character 4")
  })

  it("typing fills slots and calls onChange", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Basic onChange={onChange} />)
    const input = screen.getByRole("textbox", { name: "One-time password" })
    await user.click(input)
    await user.type(input, "12")
    expect(onChange).toHaveBeenCalledWith("1")
    expect(onChange).toHaveBeenCalledWith("12")
  })

  it("paste fills all slots at once", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Basic onChange={onChange} />)
    const input = screen.getByRole("textbox", { name: "One-time password" })
    await user.click(input)
    await user.paste("5678")
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0]
    expect(lastCall).toBe("5678")
  })

  it("onComplete fires when all slots are filled", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<Basic onComplete={onComplete} />)
    const input = screen.getByRole("textbox", { name: "One-time password" })
    await user.click(input)
    await user.type(input, "1234")
    expect(onComplete).toHaveBeenCalledWith("1234")
  })

  it("controlled value renders characters in slot textboxes", () => {
    render(<Basic value="AB" />)
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    expect(slots[0]).toHaveTextContent("A")
    expect(slots[1]).toHaveTextContent("B")
    expect(slots[2]).toHaveTextContent("")
  })

  it("separator renders with role=separator", () => {
    render(
      <InputOTP maxLength={4} aria-label="OTP">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>,
    )
    const separator = screen.getByRole("separator")
    expect(separator).toBeInTheDocument()
  })

  it("disabled input is disabled", () => {
    render(<Basic disabled />)
    const input = screen.getByRole("textbox", { name: "One-time password" })
    expect(input).toBeDisabled()
  })
})
