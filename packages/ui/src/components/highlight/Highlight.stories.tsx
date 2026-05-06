import type { Meta, StoryObj } from "@storybook/react-vite"
import { Highlight } from "./Highlight"

const meta: Meta<typeof Highlight> = {
  title: "UI/Highlight",
  component: Highlight,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Highlight>

export const Default: Story = {
  render: () => (
    <p>
      <Highlight
        text="The quick brown fox jumps over the lazy dog"
        query="fox"
      />
    </p>
  ),
}

export const MultiTerm: Story = {
  render: () => (
    <p>
      <Highlight
        text="The quick brown fox jumps over the lazy dog"
        query={["fox", "dog", "quick"]}
      />
    </p>
  ),
}

export const CustomRenderer: Story = {
  render: () => (
    <p>
      <Highlight
        text="Important: do not skip this critical step"
        query={["Important", "critical"]}
        renderMatch={(part, i) => (
          <mark key={i} className="dr-highlight-match-strong">
            {part}
          </mark>
        )}
      />
    </p>
  ),
}
