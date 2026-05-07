import type { Meta, StoryObj } from "@storybook/react-vite"

import { ScrollArea } from "@components/scroll-area"

const meta: Meta<typeof ScrollArea> = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof ScrollArea>

const TAGS = Array.from({ length: 50 }, (_, i) => `Tag ${i + 1}`)

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-64 w-72 rounded border">
      <div className="flex flex-col gap-1 p-3 text-sm">
        {TAGS.map((tag) => (
          <div key={tag} className="bg-muted rounded px-2 py-1">
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-72 rounded border">
      <div className="flex gap-2 p-3 text-sm">
        {TAGS.map((tag) => (
          <div
            key={tag}
            className="bg-muted shrink-0 rounded px-3 py-2 whitespace-nowrap"
          >
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}
