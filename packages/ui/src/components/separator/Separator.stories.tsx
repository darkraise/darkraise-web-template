import type { Meta, StoryObj } from "@storybook/react-vite"

import { Separator } from "@components/separator"

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Separator>

export const Horizontal: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <p className="text-sm">Top</p>
      <Separator />
      <p className="text-sm">Bottom</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-3 text-sm">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  ),
}

export const NonDecorative: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <p className="text-sm">Section A</p>
      <Separator decorative={false} />
      <p className="text-sm">Section B</p>
    </div>
  ),
}
