import type { Meta, StoryObj } from "@storybook/react-vite"

import { AspectRatio } from "@components/aspect-ratio"

const meta: Meta<typeof AspectRatio> = {
  title: "UI/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof AspectRatio>

export const Square: Story = {
  render: () => (
    <div className="w-64">
      <AspectRatio ratio={1} className="bg-muted rounded-md" />
    </div>
  ),
}

export const Sixteen9: Story = {
  render: () => (
    <div className="w-80">
      <AspectRatio ratio={16 / 9} className="bg-muted rounded-md" />
    </div>
  ),
}

export const ImageContent: Story = {
  render: () => (
    <div className="w-80">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md">
        <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-500" />
      </AspectRatio>
    </div>
  ),
}
