import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Slider } from "@components/slider"

const meta: Meta<typeof Slider> = {
  title: "UI/Slider",
  component: Slider,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Slider>

export const Single: Story = {
  render: () => (
    <div className="w-72">
      <Slider defaultValue={[40]} min={0} max={100} step={1} />
    </div>
  ),
}

export const Range: Story = {
  render: () => (
    <div className="w-72">
      <Slider defaultValue={[20, 80]} min={0} max={100} step={1} />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      <Slider defaultValue={[55]} disabled />
    </div>
  ),
}

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState([30])
      return (
        <div className="w-72 space-y-2">
          <Slider value={value} onValueChange={setValue} min={0} max={100} />
          <p className="text-xs">Current: {value[0]}</p>
        </div>
      )
    }
    return <Demo />
  },
}
