import type { Meta, StoryObj } from "@storybook/react-vite"
import { Toolbar, ToolbarSeparator } from "@components/toolbar"
import { Button } from "@components/button"
import { Toggle } from "@components/toggle"

const meta: Meta<typeof Toolbar> = {
  title: "UI/Toolbar",
  component: Toolbar,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Toolbar>

export const Default: Story = {
  render: () => (
    <Toolbar aria-label="Formatting">
      <Toggle aria-label="Bold">B</Toggle>
      <Toggle aria-label="Italic">I</Toggle>
      <ToolbarSeparator />
      <Button variant="outline" size="sm">
        Save
      </Button>
    </Toolbar>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Toolbar orientation="vertical" aria-label="Vertical actions">
      <Button variant="outline" size="sm">
        Top
      </Button>
      <ToolbarSeparator orientation="horizontal" />
      <Button variant="outline" size="sm">
        Middle
      </Button>
      <ToolbarSeparator orientation="horizontal" />
      <Button variant="outline" size="sm">
        Bottom
      </Button>
    </Toolbar>
  ),
}

export const WithSeparators: Story = {
  render: () => (
    <Toolbar aria-label="Editor">
      <Toggle aria-label="Bold">B</Toggle>
      <Toggle aria-label="Italic">I</Toggle>
      <Toggle aria-label="Underline">U</Toggle>
      <ToolbarSeparator />
      <Toggle aria-label="Align left">L</Toggle>
      <Toggle aria-label="Align center">C</Toggle>
      <Toggle aria-label="Align right">R</Toggle>
      <ToolbarSeparator />
      <Button variant="outline" size="sm">
        Undo
      </Button>
      <Button variant="outline" size="sm">
        Redo
      </Button>
    </Toolbar>
  ),
}
