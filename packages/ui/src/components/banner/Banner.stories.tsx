import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Banner } from "@components/banner"
import { Button } from "@components/button"

const meta: Meta<typeof Banner> = {
  title: "UI/Banner",
  component: Banner,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Banner>

export const Default: Story = {
  render: () => <Banner>System maintenance scheduled for tonight.</Banner>,
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Banner variant="default">Default banner</Banner>
      <Banner variant="info">Heads up — a new release is available.</Banner>
      <Banner variant="success">Your changes were saved successfully.</Banner>
      <Banner variant="warning">
        Storage is running low — clear unused files soon.
      </Banner>
      <Banner variant="destructive">
        Failed to sync. Check your connection and retry.
      </Banner>
    </div>
  ),
}

export const Dismissible: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true)
      if (!open) {
        return (
          <Button variant="outline" onClick={() => setOpen(true)}>
            Show banner
          </Button>
        )
      }
      return (
        <Banner variant="info" dismissible onDismiss={() => setOpen(false)}>
          Click the close button to dismiss this banner.
        </Banner>
      )
    }
    return <Demo />
  },
}
