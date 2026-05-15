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

  it("strips non-digits by default (numeric-only)", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Basic onChange={onChange} />)
    const input = screen.getByRole("textbox", { name: "One-time password" })
    await user.click(input)
    await user.type(input, "1a2b3")
    // Letters get filtered out — onChange's final value is the digits only.
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0]
    expect(lastCall).toBe("123")
  })

  it("allows letters when pattern is overridden", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <InputOTP
        maxLength={4}
        pattern="A-Za-z0-9"
        onChange={onChange}
        aria-label="One-time password"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>,
    )
    const input = screen.getByRole("textbox", { name: "One-time password" })
    await user.click(input)
    await user.paste("aB1")
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0]
    expect(lastCall).toBe("aB1")
  })
})

describe('InputOtp variant="separate"', () => {
  function Separate({
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
        variant="separate"
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

  it("renders one input per slot and no overlay input", () => {
    render(<Separate />)
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    expect(slots).toHaveLength(4)
    expect(slots[0].tagName).toBe("INPUT")
    // No shared "One-time password" overlay input in this variant.
    expect(
      screen.queryByRole("textbox", { name: "One-time password" }),
    ).toBeNull()
  })

  it("typing fills the focused slot and advances to the next", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Separate onChange={onChange} />)
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    await user.click(slots[0])
    await user.keyboard("1")
    expect(onChange).toHaveBeenCalledWith("1")
    expect(document.activeElement).toBe(slots[1])
    await user.keyboard("2")
    expect(onChange).toHaveBeenCalledWith("12")
    expect(document.activeElement).toBe(slots[2])
  })

  it("backspace on an empty slot focuses and clears the previous slot", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Separate value="12" onChange={onChange} />)
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    // Slot 2 (index 2) is empty in value="12".
    await user.click(slots[2])
    await user.keyboard("{Backspace}")
    expect(onChange).toHaveBeenCalledWith("1")
    expect(document.activeElement).toBe(slots[1])
  })

  it("arrow keys move focus between slots", async () => {
    const user = userEvent.setup()
    render(<Separate value="1234" />)
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    await user.click(slots[2])
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(slots[1])
    await user.keyboard("{ArrowRight}{ArrowRight}")
    expect(document.activeElement).toBe(slots[3])
    await user.keyboard("{Home}")
    expect(document.activeElement).toBe(slots[0])
    await user.keyboard("{End}")
    expect(document.activeElement).toBe(slots[3])
  })

  it("paste fans out across slots starting at the focused one", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onComplete = vi.fn()
    render(<Separate onChange={onChange} onComplete={onComplete} />)
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    await user.click(slots[0])
    await user.paste("9876")
    expect(onChange).toHaveBeenLastCalledWith("9876")
    expect(onComplete).toHaveBeenCalledWith("9876")
  })

  it("controlled value populates each slot's input", () => {
    render(<Separate value="AB" />)
    const slots = screen.getAllByRole("textbox", {
      name: /character/i,
    }) as HTMLInputElement[]
    expect(slots[0].value).toBe("A")
    expect(slots[1].value).toBe("B")
    expect(slots[2].value).toBe("")
    expect(slots[3].value).toBe("")
  })

  it("disabled separate inputs are disabled", () => {
    render(<Separate disabled />)
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    for (const slot of slots) expect(slot).toBeDisabled()
  })

  it("focusing any slot in an empty OTP redirects focus to the first slot", async () => {
    const user = userEvent.setup()
    render(<Separate />)
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    // Click slot 3 — value is empty, focus should bounce back to slot 0.
    await user.click(slots[2])
    expect(document.activeElement).toBe(slots[0])
    // Slot 0 stays focused on its own focus events (no infinite redirect).
    expect(document.activeElement).toBe(slots[0])
  })

  it("does not redirect focus when the OTP already has a value", async () => {
    const user = userEvent.setup()
    render(<Separate value="12" />)
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    await user.click(slots[2])
    expect(document.activeElement).toBe(slots[2])
  })

  it("strips non-digits by default in the separate variant", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Separate onChange={onChange} />)
    const slots = screen.getAllByRole("textbox", { name: /character/i })
    await user.click(slots[0])
    // Pasting a mixed string fans out, dropping the letter.
    await user.paste("1a2")
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0]
    expect(lastCall).toBe("12")
  })
})
