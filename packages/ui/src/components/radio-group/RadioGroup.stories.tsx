import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Label } from "@components/label"
import { RadioGroup, RadioGroupItem } from "@components/radio-group"

const meta: Meta<typeof RadioGroup> = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Basic: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable" className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-default" value="default" />
        <Label htmlFor="r-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-comfortable" value="comfortable" />
        <Label htmlFor="r-comfortable">Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-compact" value="compact" />
        <Label htmlFor="r-compact">Compact</Label>
      </div>
    </RadioGroup>
  ),
}

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="a" disabled className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="rd-a" value="a" />
        <Label htmlFor="rd-a">Option A</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="rd-b" value="b" />
        <Label htmlFor="rd-b">Option B</Label>
      </div>
    </RadioGroup>
  ),
}

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState("yes")
      return (
        <div className="flex flex-col gap-2">
          <RadioGroup
            value={value}
            onValueChange={setValue}
            className="flex gap-3"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="rc-yes" value="yes" />
              <Label htmlFor="rc-yes">Yes</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="rc-no" value="no" />
              <Label htmlFor="rc-no">No</Label>
            </div>
          </RadioGroup>
          <p className="text-xs">Current: {value}</p>
        </div>
      )
    }
    return <Demo />
  },
}
