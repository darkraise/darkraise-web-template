import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@components/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@components/hover-card"

const meta: Meta<typeof HoverCard> = {
  title: "UI/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof HoverCard>

export const Basic: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@darkraise</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold">@darkraise</h4>
          <p className="text-muted-foreground text-sm">
            Component playground for the in-house design system.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

export const WithDelay: Story = {
  render: () => (
    <HoverCard openDelay={400} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Button variant="outline">Hover with delay</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-sm">Opens after 400ms hover.</p>
      </HoverCardContent>
    </HoverCard>
  ),
}
