import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Button } from "@components/button"
import {
  Popover,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@components/popover"

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Popover>

export const Basic: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">Popover content. Close with Escape.</p>
        <PopoverArrow />
      </PopoverContent>
    </Popover>
  ),
}

export const WithClose: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Show details</Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2">
        <p className="text-sm">Click the button below to dismiss.</p>
        <PopoverClose asChild>
          <Button size="sm" variant="ghost">
            Close
          </Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  ),
}

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen((o) => !o)}>
            External toggle
          </Button>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button>Trigger</Button>
            </PopoverTrigger>
            <PopoverContent>
              <p className="text-sm">Open: {String(open)}</p>
            </PopoverContent>
          </Popover>
        </div>
      )
    }
    return <Demo />
  },
}
