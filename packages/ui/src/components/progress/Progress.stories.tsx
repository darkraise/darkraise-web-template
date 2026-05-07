import type { Meta, StoryObj } from "@storybook/react-vite"
import { useEffect, useState } from "react"

import { Progress } from "@components/progress"

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Progress>

export const Static: Story = {
  render: () => (
    <div className="w-72">
      <Progress value={62} />
    </div>
  ),
}

export const Indeterminate: Story = {
  render: () => (
    <div className="w-72">
      <Progress value={null} />
    </div>
  ),
}

export const Animated: Story = {
  render: () => {
    function Demo() {
      const [val, setVal] = useState(13)
      useEffect(() => {
        const id = window.setInterval(() => {
          setVal((v) => (v >= 100 ? 0 : v + 7))
        }, 600)
        return () => window.clearInterval(id)
      }, [])
      return (
        <div className="w-72">
          <Progress value={val} />
        </div>
      )
    }
    return <Demo />
  },
}
