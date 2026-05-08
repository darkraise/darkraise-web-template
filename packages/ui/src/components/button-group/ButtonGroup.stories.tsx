import type { Meta, StoryObj } from "@storybook/react-vite"
import { ButtonGroup } from "@components/button-group"
import { Button } from "@components/button"

const meta: Meta<typeof ButtonGroup> = {
  title: "UI/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof ButtonGroup>

export const Horizontal: Story = {
  render: () => (
    <ButtonGroup aria-label="Text alignment">
      <Button>Left</Button>
      <Button>Center</Button>
      <Button>Right</Button>
    </ButtonGroup>
  ),
}

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical" aria-label="Vertical actions">
      <Button>Top</Button>
      <Button>Middle</Button>
      <Button>Bottom</Button>
    </ButtonGroup>
  ),
}

export const MixedVariants: Story = {
  render: () => (
    <ButtonGroup aria-label="Mixed actions">
      <Button variant="default">Save</Button>
      <Button variant="outline">Discard</Button>
      <Button variant="outline">More</Button>
    </ButtonGroup>
  ),
}
