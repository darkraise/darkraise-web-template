import type { Meta, StoryObj } from "@storybook/react-vite"
import { Bold, Italic } from "lucide-react"
import { useState } from "react"

import { Toggle } from "@components/toggle"

const meta: Meta<typeof Toggle> = {
  title: "UI/Toggle",
  component: Toggle,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Toggle>

export const Default: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold">
      <Bold className="size-4" />
    </Toggle>
  ),
}

export const Outline: Story = {
  render: () => (
    <Toggle variant="outline" aria-label="Toggle italic">
      <Italic className="size-4" />
    </Toggle>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Toggle disabled aria-label="Disabled toggle">
      <Bold className="size-4" />
    </Toggle>
  ),
}

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [pressed, setPressed] = useState(false)
      return (
        <div className="flex items-center gap-2">
          <Toggle
            pressed={pressed}
            onPressedChange={setPressed}
            aria-label="Toggle bold"
          >
            <Bold className="size-4" />
          </Toggle>
          <span className="text-xs">{pressed ? "on" : "off"}</span>
        </div>
      )
    }
    return <Demo />
  },
}
