import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "@components/input"
import { Label } from "@components/label"

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Label>

export const Basic: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="label-name">Name</Label>
      <Input id="label-name" placeholder="John Doe" />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="label-name-disabled" data-disabled="">
        Name (disabled)
      </Label>
      <Input id="label-name-disabled" placeholder="John Doe" disabled />
    </div>
  ),
}
