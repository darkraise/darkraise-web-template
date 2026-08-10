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
import type {
  TimelineItemSide,
  TimelineItemStatus,
  TimelineVariant,
} from "darkraise-ui/components/timeline"
import { Check, Package, Truck } from "lucide-react"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/timeline")({
  component: TimelinePage,
})

const TIMELINE_VARIANTS = allOf<TimelineVariant>()("default", "alternating")
const TIMELINE_SIDES = allOf<TimelineItemSide>()("start", "end")
const TIMELINE_STATUSES = allOf<TimelineItemStatus>()(
  "complete",
  "current",
  "upcoming",
)

// `side` overrides the alternating placement; the default variant never
// alternates, so it ignores the prop entirely.
const SIDE_AWARE_VARIANTS = new Set<TimelineVariant>(["alternating"])

const TIMELINE_STATUS_LABEL: Record<TimelineItemStatus, string> = {
  complete: "Completed",
  current: "In progress",
  upcoming: "Not started",
}

function TimelineSideMatrixCell({
  variant,
  side,
}: {
  variant: TimelineVariant
  side: TimelineItemSide
}) {
  const redundant = !SIDE_AWARE_VARIANTS.has(variant)

  return (
    <div className="w-56 space-y-2">
      <Timeline variant={variant}>
        <TimelineItem status="complete" side={side}>
          <TimelineIndicator>
            <Check />
          </TimelineIndicator>
          <TimelineContent>
            <TimelineTitle>Order placed</TimelineTitle>
            <TimelineDescription>2 items, paid by card</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
      {redundant ? (
        <p className="text-muted-foreground/70 text-[length:var(--text-2xs)]">
          Ignored by the default variant — side only takes effect when
          alternating.
        </p>
      ) : null}
    </div>
  )
}

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

      <ShowcaseExample
        title="Variant x side"
        code={`// One representative cell: every variant x side combination renders above.
<Timeline variant="alternating">
  <TimelineItem status="complete" side="end">
    <TimelineIndicator>
      <Check />
    </TimelineIndicator>
    <TimelineContent>
      <TimelineTitle>Order placed</TimelineTitle>
      <TimelineDescription>2 items, paid by card</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
</Timeline>`}
      >
        <VariantMatrix
          rows={{ label: "variant", values: TIMELINE_VARIANTS }}
          cols={{ label: "side", values: TIMELINE_SIDES }}
          render={(variant, side) => (
            <TimelineSideMatrixCell variant={variant} side={side} />
          )}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Status"
        code={`// One representative cell: every status renders above.
<Timeline>
  <TimelineItem status="current">
    <TimelineIndicator />
    <TimelineContent>
      <TimelineTitle>In progress</TimelineTitle>
    </TimelineContent>
  </TimelineItem>
</Timeline>`}
      >
        <VariantMatrix
          rows={{ label: "status", values: TIMELINE_STATUSES }}
          render={(status) => (
            <Timeline>
              <TimelineItem status={status}>
                <TimelineIndicator />
                <TimelineContent>
                  <TimelineTitle>{TIMELINE_STATUS_LABEL[status]}</TimelineTitle>
                </TimelineContent>
              </TimelineItem>
            </Timeline>
          )}
        />
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
