import type { Meta, StoryObj } from "@storybook/react-vite"
import { Label } from "./label"
import { Switch } from "./switch"

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Switch>

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
      <Switch id="notifications" />
      <Label htmlFor="notifications">Enable notifications</Label>
    </div>
  ),
}

export const WithLabelDisabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="notifications-disabled" disabled />
      <Label htmlFor="notifications-disabled">Enable notifications</Label>
    </div>
  ),
}

export const SwitchGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-8">
        <Label htmlFor="switch-email">Email notifications</Label>
        <Switch id="switch-email" defaultChecked />
      </div>
      <div className="flex items-center justify-between gap-8">
        <Label htmlFor="switch-push">Push notifications</Label>
        <Switch id="switch-push" />
      </div>
      <div className="flex items-center justify-between gap-8">
        <Label htmlFor="switch-sms">SMS notifications</Label>
        <Switch id="switch-sms" disabled />
      </div>
    </div>
  ),
}
