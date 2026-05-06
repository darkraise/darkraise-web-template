import { createFileRoute } from "@tanstack/react-router"
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
} from "darkraise-ui/components/segment-group"
import { CalendarDays, Grid3x3, Layers, List } from "lucide-react"
import { useState } from "react"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/segment-group",
)({
  component: SegmentGroupPage,
})

function SegmentGroupPage() {
  const [range, setRange] = useState("week")
  const [layout, setLayout] = useState("list")
  const [view, setView] = useState("calendar")

  return (
    <ShowcasePage
      title="Segment Group"
      description="iOS-style segmented control with an animated indicator pill that slides between selected items. Built atop the RadioGroup primitive."
    >
      <ShowcaseExample
        title="Date range picker"
        code={`<SegmentGroup value={range} onValueChange={setRange}>
  <SegmentGroupIndicator />
  <SegmentGroupItem value="day">Day</SegmentGroupItem>
  <SegmentGroupItem value="week">Week</SegmentGroupItem>
  <SegmentGroupItem value="month">Month</SegmentGroupItem>
</SegmentGroup>`}
      >
        <SegmentGroup value={range} onValueChange={setRange}>
          <SegmentGroupIndicator />
          <SegmentGroupItem value="day">Day</SegmentGroupItem>
          <SegmentGroupItem value="week">Week</SegmentGroupItem>
          <SegmentGroupItem value="month">Month</SegmentGroupItem>
        </SegmentGroup>
      </ShowcaseExample>

      <ShowcaseExample
        title="Vertical orientation"
        code={`<SegmentGroup
  orientation="vertical"
  value={layout}
  onValueChange={setLayout}
>
  <SegmentGroupIndicator />
  <SegmentGroupItem value="list">List</SegmentGroupItem>
  <SegmentGroupItem value="grid">Grid</SegmentGroupItem>
  <SegmentGroupItem value="kanban">Kanban</SegmentGroupItem>
</SegmentGroup>`}
      >
        <SegmentGroup
          orientation="vertical"
          value={layout}
          onValueChange={setLayout}
        >
          <SegmentGroupIndicator />
          <SegmentGroupItem value="list">List</SegmentGroupItem>
          <SegmentGroupItem value="grid">Grid</SegmentGroupItem>
          <SegmentGroupItem value="kanban">Kanban</SegmentGroupItem>
        </SegmentGroup>
      </ShowcaseExample>

      <ShowcaseExample
        title="With icons"
        code={`<SegmentGroup value={view} onValueChange={setView}>
  <SegmentGroupIndicator />
  <SegmentGroupItem value="calendar">
    <CalendarDays className="mr-2 h-4 w-4" />
    Calendar
  </SegmentGroupItem>
  <SegmentGroupItem value="grid">
    <Grid3x3 className="mr-2 h-4 w-4" />
    Grid
  </SegmentGroupItem>
  <SegmentGroupItem value="layers">
    <Layers className="mr-2 h-4 w-4" />
    Layers
  </SegmentGroupItem>
  <SegmentGroupItem value="list">
    <List className="mr-2 h-4 w-4" />
    List
  </SegmentGroupItem>
</SegmentGroup>`}
      >
        <SegmentGroup value={view} onValueChange={setView}>
          <SegmentGroupIndicator />
          <SegmentGroupItem value="calendar">
            <CalendarDays className="mr-2 h-4 w-4" />
            Calendar
          </SegmentGroupItem>
          <SegmentGroupItem value="grid">
            <Grid3x3 className="mr-2 h-4 w-4" />
            Grid
          </SegmentGroupItem>
          <SegmentGroupItem value="layers">
            <Layers className="mr-2 h-4 w-4" />
            Layers
          </SegmentGroupItem>
          <SegmentGroupItem value="list">
            <List className="mr-2 h-4 w-4" />
            List
          </SegmentGroupItem>
        </SegmentGroup>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
