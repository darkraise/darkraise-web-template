import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@components/button"
import { Toaster, toast } from "@components/sonner"

const meta: Meta<typeof Toaster> = {
  title: "UI/Sonner (Toast)",
  component: Toaster,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Toaster>

export const Default: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button onClick={() => toast("Saved successfully")}>Show toast</Button>
      <Toaster />
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast.success("It worked!")}>Success</Button>
      <Button onClick={() => toast.error("Something failed")}>Error</Button>
      <Button onClick={() => toast.warning("Take note")}>Warning</Button>
      <Button onClick={() => toast.info("FYI")}>Info</Button>
      <Button
        onClick={() => toast.loading("Working on it…", { duration: 2000 })}
      >
        Loading
      </Button>
      <Toaster />
    </div>
  ),
}

export const WithAction: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button
        onClick={() =>
          toast("File deleted", {
            action: { label: "Undo", onClick: () => toast("Restored") },
          })
        }
      >
        Show with action
      </Button>
      <Toaster />
    </div>
  ),
}
