import type { Meta, StoryObj } from "@storybook/react-vite"
import { Fieldset, FieldsetLegend } from "@components/fieldset"
import { Input } from "@components/input"
import { Label } from "@components/label"
import { Checkbox } from "@components/checkbox"

const meta: Meta<typeof Fieldset> = {
  title: "UI/Fieldset",
  component: Fieldset,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Fieldset>

export const Default: Story = {
  render: () => (
    <Fieldset className="flex max-w-md flex-col gap-3">
      <FieldsetLegend>Account</FieldsetLegend>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fs-default-email">Email</Label>
        <Input
          id="fs-default-email"
          type="email"
          placeholder="you@example.com"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox /> Subscribe to updates
      </label>
    </Fieldset>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Fieldset disabled className="flex max-w-md flex-col gap-3">
      <FieldsetLegend>Account</FieldsetLegend>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fs-disabled-email">Email</Label>
        <Input
          id="fs-disabled-email"
          type="email"
          placeholder="you@example.com"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox /> Subscribe to updates
      </label>
    </Fieldset>
  ),
}

export const WithFormFields: Story = {
  render: () => (
    <form className="flex max-w-lg flex-col gap-6">
      <Fieldset className="flex flex-col gap-4">
        <FieldsetLegend>Personal</FieldsetLegend>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fs-form-first">First name</Label>
            <Input id="fs-form-first" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fs-form-last">Last name</Label>
            <Input id="fs-form-last" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fs-form-email">Email</Label>
          <Input id="fs-form-email" type="email" />
        </div>
      </Fieldset>
      <Fieldset className="flex flex-col gap-3">
        <FieldsetLegend>Preferences</FieldsetLegend>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox defaultChecked /> Email notifications
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox /> SMS notifications
        </label>
      </Fieldset>
    </form>
  ),
}
