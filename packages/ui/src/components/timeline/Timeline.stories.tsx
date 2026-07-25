import type { Meta, StoryObj } from "@storybook/react-vite"
import { Check, Package, Truck } from "lucide-react"
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineMeta,
  TimelineTime,
  TimelineTitle,
} from "./Timeline"

const meta: Meta<typeof Timeline> = {
  title: "UI/Timeline",
  component: Timeline,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Timeline>

const events = [
  {
    title: "Order placed",
    description: "2 items, paid by card",
    time: "09:41",
    dateTime: "2026-07-24T09:41",
    status: "complete" as const,
    icon: Check,
  },
  {
    title: "Packed",
    description: "Leaving the Rotterdam warehouse",
    time: "11:02",
    dateTime: "2026-07-24T11:02",
    status: "current" as const,
    icon: Package,
  },
  {
    title: "Out for delivery",
    description: "Expected before 18:00",
    time: "—",
    dateTime: "2026-07-25",
    status: "upcoming" as const,
    icon: Truck,
  },
]

export const Default: Story = {
  render: () => (
    <Timeline>
      {events.map((event) => (
        <TimelineItem key={event.title} status={event.status}>
          <TimelineIndicator>
            <event.icon />
          </TimelineIndicator>
          <TimelineConnector />
          <TimelineContent>
            <TimelineTitle>{event.title}</TimelineTitle>
            <TimelineDescription>{event.description}</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  ),
}

export const WithMeta: Story = {
  render: () => (
    <Timeline>
      {events.map((event) => (
        <TimelineItem key={event.title} status={event.status}>
          <TimelineMeta>
            <TimelineTime dateTime={event.dateTime}>{event.time}</TimelineTime>
          </TimelineMeta>
          <TimelineIndicator />
          <TimelineConnector />
          <TimelineContent>
            <TimelineTitle>{event.title}</TimelineTitle>
            <TimelineDescription>{event.description}</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  ),
}

export const Alternating: Story = {
  render: () => (
    <Timeline variant="alternating">
      {events.map((event) => (
        <TimelineItem key={event.title} status={event.status}>
          <TimelineIndicator />
          <TimelineConnector />
          <TimelineContent>
            <TimelineTitle>{event.title}</TimelineTitle>
            <TimelineDescription>{event.description}</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  ),
}

export const DashedConnectors: Story = {
  render: () => (
    <Timeline>
      {events.map((event) => (
        <TimelineItem key={event.title} status={event.status}>
          <TimelineIndicator />
          <TimelineConnector
            variant={event.status === "complete" ? "solid" : "dashed"}
          />
          <TimelineContent>
            <TimelineTitle>{event.title}</TimelineTitle>
            <TimelineDescription>{event.description}</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  ),
}
