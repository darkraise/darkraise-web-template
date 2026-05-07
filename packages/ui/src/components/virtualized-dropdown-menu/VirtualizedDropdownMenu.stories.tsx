import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@components/button"
import {
  VirtualizedDropdownMenu,
  VirtualizedDropdownMenuContent,
  VirtualizedDropdownMenuItem,
  VirtualizedDropdownMenuTrigger,
} from "@components/virtualized-dropdown-menu"

const meta: Meta<typeof VirtualizedDropdownMenu> = {
  title: "UI/VirtualizedDropdownMenu",
  component: VirtualizedDropdownMenu,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof VirtualizedDropdownMenu>

const ITEMS = Array.from({ length: 1000 }, (_, i) => `Item ${i + 1}`)

export const ManyItems: Story = {
  render: () => (
    <VirtualizedDropdownMenu>
      <VirtualizedDropdownMenuTrigger asChild>
        <Button variant="outline">Open 1k items</Button>
      </VirtualizedDropdownMenuTrigger>
      <VirtualizedDropdownMenuContent
        items={ITEMS}
        estimateSize={32}
        maxHeight={300}
      >
        {(item, { isActive }) => (
          <VirtualizedDropdownMenuItem isActive={isActive}>
            {item}
          </VirtualizedDropdownMenuItem>
        )}
      </VirtualizedDropdownMenuContent>
    </VirtualizedDropdownMenu>
  ),
}
