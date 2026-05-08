import type { Meta, StoryObj } from "@storybook/react-vite"
import { Kbd } from "@components/kbd"

const meta: Meta<typeof Kbd> = {
  title: "UI/Kbd",
  component: Kbd,
  tags: ["autodocs"],
  args: {
    children: "⌘K",
  },
}

export default meta
type Story = StoryObj<typeof Kbd>

export const Default: Story = {}

export const Combos: Story = {
  render: () => (
    <p className="text-foreground inline-flex items-center gap-2 text-sm">
      Press <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to open the command palette.
    </p>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Kbd size="sm">Esc</Kbd>
      <Kbd size="md">Esc</Kbd>
      <Kbd size="lg">Esc</Kbd>
    </div>
  ),
}
