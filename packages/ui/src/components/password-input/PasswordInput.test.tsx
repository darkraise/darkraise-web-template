import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  PasswordInput,
  PasswordInputControl,
  PasswordInputField,
  PasswordInputIndicator,
  PasswordInputLabel,
  PasswordInputVisibilityTrigger,
} from "./PasswordInput"

function renderBasic(
  props: Partial<React.ComponentProps<typeof PasswordInput>> = {},
) {
  return render(
    <PasswordInput {...props}>
      <PasswordInputLabel>Password</PasswordInputLabel>
      <PasswordInputControl>
        <PasswordInputField
          aria-label="password"
          placeholder="Enter password"
        />
        <PasswordInputVisibilityTrigger>
          <PasswordInputIndicator
            visible={<span>shown</span>}
            hidden={<span>hidden</span>}
          />
        </PasswordInputVisibilityTrigger>
      </PasswordInputControl>
    </PasswordInput>,
  )
}

describe("PasswordInput", () => {
  it("renders the field as type=password initially", () => {
    renderBasic()
    const input = screen.getByLabelText("password") as HTMLInputElement
    expect(input.type).toBe("password")
  })

  it("flips the field to type=text when the trigger is clicked", async () => {
    const user = userEvent.setup()
    renderBasic()
    const input = screen.getByLabelText("password") as HTMLInputElement
    const trigger = screen.getByRole("button", { name: "Show password" })

    await user.click(trigger)

    expect(input.type).toBe("text")
  })

  it("flips the field back to type=password on a second click", async () => {
    const user = userEvent.setup()
    renderBasic()
    const input = screen.getByLabelText("password") as HTMLInputElement

    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(input.type).toBe("text")

    await user.click(screen.getByRole("button", { name: "Hide password" }))
    expect(input.type).toBe("password")
  })

  it("respects the controlled visible prop from the parent", async () => {
    function Controlled() {
      const [visible, setVisible] = React.useState(false)
      return (
        <>
          <button type="button" onClick={() => setVisible((v) => !v)}>
            external-toggle
          </button>
          <PasswordInput
            visible={visible}
            onVisibilityChange={(d) => setVisible(d.visible)}
          >
            <PasswordInputControl>
              <PasswordInputField aria-label="password" />
              <PasswordInputVisibilityTrigger>
                <PasswordInputIndicator
                  visible={<span>shown</span>}
                  hidden={<span>hidden</span>}
                />
              </PasswordInputVisibilityTrigger>
            </PasswordInputControl>
          </PasswordInput>
        </>
      )
    }

    const user = userEvent.setup()
    render(<Controlled />)

    const input = screen.getByLabelText("password") as HTMLInputElement
    expect(input.type).toBe("password")

    await user.click(screen.getByRole("button", { name: "external-toggle" }))
    expect(input.type).toBe("text")

    await user.click(screen.getByRole("button", { name: "external-toggle" }))
    expect(input.type).toBe("password")
  })

  it("updates aria-label on the trigger to reflect current state", async () => {
    const user = userEvent.setup()
    renderBasic()

    const trigger = screen.getByRole("button", { name: "Show password" })
    expect(trigger).toHaveAttribute("aria-label", "Show password")
    expect(trigger).toHaveAttribute("aria-pressed", "false")

    await user.click(trigger)

    const flipped = screen.getByRole("button", { name: "Hide password" })
    expect(flipped).toHaveAttribute("aria-label", "Hide password")
    expect(flipped).toHaveAttribute("aria-pressed", "true")
  })

  it("allows consumers to override the trigger aria-label", () => {
    render(
      <PasswordInput>
        <PasswordInputControl>
          <PasswordInputField aria-label="password" />
          <PasswordInputVisibilityTrigger aria-label="toggle">
            <PasswordInputIndicator
              visible={<span>shown</span>}
              hidden={<span>hidden</span>}
            />
          </PasswordInputVisibilityTrigger>
        </PasswordInputControl>
      </PasswordInput>,
    )
    expect(screen.getByRole("button", { name: "toggle" })).toBeInTheDocument()
  })
})
