import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/resizable"

const meta: Meta<typeof ResizablePanelGroup> = {
  title: "UI/Resizable",
  component: ResizablePanelGroup,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof ResizablePanelGroup>

export const Horizontal: Story = {
  render: () => (
    <div className="h-48 w-96 rounded border">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          defaultSize={50}
          className="flex items-center justify-center text-sm"
        >
          Left
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={50}
          className="flex items-center justify-center text-sm"
        >
          Right
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="h-72 w-72 rounded border">
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel
          defaultSize={50}
          className="flex items-center justify-center text-sm"
        >
          Top
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={50}
          className="flex items-center justify-center text-sm"
        >
          Bottom
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
}
