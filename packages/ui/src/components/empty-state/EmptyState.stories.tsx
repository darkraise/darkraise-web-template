import type { Meta, StoryObj } from "@storybook/react-vite"
import { PackageOpen } from "lucide-react"
import { EmptyState } from "@components/empty-state"
import { Button } from "@components/button"

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    title: "No results",
    description: "Try a different search term.",
  },
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const Default: Story = {}

export const WithIcon: Story = {
  args: {
    icon: <PackageOpen />,
    title: "Nothing here yet",
    description: "Items you create will appear in this list.",
  },
}

export const WithAction: Story = {
  args: {
    title: "No results",
    description: "Try a different search term.",
    action: <Button>Create one</Button>,
  },
}

export const Full: Story = {
  args: {
    icon: <PackageOpen />,
    title: "Your library is empty",
    description:
      "Add a project to get started — you can always import from a template later.",
    action: <Button>Create project</Button>,
  },
}
