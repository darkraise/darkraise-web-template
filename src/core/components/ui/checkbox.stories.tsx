import type { Meta, StoryObj } from "@storybook/react-vite"
import { Label } from "./label"
import { Checkbox } from "./checkbox"

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  args: {},
}

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
}

export const WithLabelDisabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms-disabled" disabled />
      <Label htmlFor="terms-disabled">Accept terms and conditions</Label>
    </div>
  ),
}

export const CheckboxGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="option-1" defaultChecked />
        <Label htmlFor="option-1">Option one</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="option-2" />
        <Label htmlFor="option-2">Option two</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="option-3" disabled />
        <Label htmlFor="option-3">Option three (disabled)</Label>
      </div>
    </div>
  ),
}
