import { createFileRoute } from "@tanstack/react-router"
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
} from "darkraise-ui/components/timeline"
import { Check, Package, Truck } from "lucide-react"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/timeline")({
  component: TimelinePage,
})

const orderEvents = [
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

const defaultCode = `<Timeline>
  <TimelineItem status="complete">
    <TimelineIndicator><Check /></TimelineIndicator>
    <TimelineConnector />
    <TimelineContent>
      <TimelineTitle>Order placed</TimelineTitle>
      <TimelineDescription>2 items, paid by card</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
</Timeline>`

const metaCode = `<Timeline>
  <TimelineItem status="complete">
    <TimelineMeta>
      <TimelineTime dateTime="2026-07-24T09:41">09:41</TimelineTime>
    </TimelineMeta>
    <TimelineIndicator />
    <TimelineConnector />
    <TimelineContent>
      <TimelineTitle>Order placed</TimelineTitle>
      <TimelineDescription>2 items, paid by card</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
</Timeline>`

const alternatingCode = `<Timeline variant="alternating">
  <TimelineItem status="complete">
    <TimelineIndicator />
    <TimelineConnector />
    <TimelineContent>
      <TimelineTitle>Order placed</TimelineTitle>
      <TimelineDescription>2 items, paid by card</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
</Timeline>`

const dashedCode = `<TimelineConnector variant="dashed" />`

function TimelinePage() {
  return (
    <ShowcasePage
      title="Timeline"
      description="Chronological event rail with status, timestamps, and an alternating layout."
    >
      <ShowcaseExample title="Default" code={defaultCode}>
        <Timeline>
          {orderEvents.map((event) => (
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
      </ShowcaseExample>

      <ShowcaseExample title="With timestamps" code={metaCode}>
        <Timeline>
          {orderEvents.map((event) => (
            <TimelineItem key={event.title} status={event.status}>
              <TimelineMeta>
                <TimelineTime dateTime={event.dateTime}>
                  {event.time}
                </TimelineTime>
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
      </ShowcaseExample>

      <ShowcaseExample title="Alternating" code={alternatingCode}>
        <Timeline variant="alternating">
          {orderEvents.map((event) => (
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
      </ShowcaseExample>

      <ShowcaseExample title="Dashed connectors" code={dashedCode}>
        <Timeline>
          {orderEvents.map((event) => (
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
      </ShowcaseExample>
    </ShowcasePage>
  )
}
