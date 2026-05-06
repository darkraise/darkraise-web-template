import type { Meta, StoryObj } from "@storybook/react-vite"
import { Eye, EyeOff } from "lucide-react"
import * as React from "react"
import {
  PasswordInput,
  PasswordInputControl,
  PasswordInputField,
  PasswordInputIndicator,
  PasswordInputLabel,
  PasswordInputVisibilityTrigger,
} from "./PasswordInput"

const meta: Meta<typeof PasswordInput> = {
  title: "UI/PasswordInput",
  component: PasswordInput,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof PasswordInput>

export const Default: Story = {
  render: () => (
    <PasswordInput>
      <PasswordInputLabel>Password</PasswordInputLabel>
      <PasswordInputControl>
        <PasswordInputField placeholder="Enter password" />
        <PasswordInputVisibilityTrigger>
          <PasswordInputIndicator visible={<EyeOff />} hidden={<Eye />} />
        </PasswordInputVisibilityTrigger>
      </PasswordInputControl>
    </PasswordInput>
  ),
}

function strengthLabel(value: string): "weak" | "fair" | "strong" {
  if (value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value)) {
    return "strong"
  }
  if (value.length >= 8) return "fair"
  return "weak"
}

export const WithStrengthMeter: Story = {
  render: () => {
    const [value, setValue] = React.useState("")
    const strength = strengthLabel(value)
    return (
      <PasswordInput>
        <PasswordInputLabel>Choose a password</PasswordInputLabel>
        <PasswordInputControl>
          <PasswordInputField
            placeholder="At least 8 characters"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <PasswordInputVisibilityTrigger>
            <PasswordInputIndicator visible={<EyeOff />} hidden={<Eye />} />
          </PasswordInputVisibilityTrigger>
        </PasswordInputControl>
        <div
          aria-live="polite"
          data-strength={strength}
          className="text-muted-foreground text-xs"
        >
          Strength: {strength}
        </div>
      </PasswordInput>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <PasswordInput>
      <PasswordInputLabel>Password</PasswordInputLabel>
      <PasswordInputControl>
        <PasswordInputField
          placeholder="Disabled"
          defaultValue="hunter2"
          disabled
        />
        <PasswordInputVisibilityTrigger disabled>
          <PasswordInputIndicator visible={<EyeOff />} hidden={<Eye />} />
        </PasswordInputVisibilityTrigger>
      </PasswordInputControl>
    </PasswordInput>
  ),
}
