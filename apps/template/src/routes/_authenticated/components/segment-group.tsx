import { createFileRoute } from "@tanstack/react-router"
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
} from "darkraise-ui/components/segment-group"
import type {
  SegmentGroupColor,
  SegmentGroupOrientation,
  SegmentGroupVariant,
} from "darkraise-ui/components/segment-group"
import { CalendarDays, Grid3x3, Layers, List } from "lucide-react"
import { useState } from "react"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/segment-group",
)({
  component: SegmentGroupPage,
})

const SEGMENT_VARIANTS = allOf<SegmentGroupVariant>()("default", "outline")
const SEGMENT_COLORS = allOf<SegmentGroupColor>()("default", "accent")
const SEGMENT_ORIENTATIONS = allOf<SegmentGroupOrientation>()(
  "horizontal",
  "vertical",
)

// `color="accent"` retints neutral chrome to the brand hue, so it only
// has somewhere to go on the default variant. The outline variant draws
// its ring and its checked label in the primary colour already.
const ACCENT_AWARE_VARIANTS = new Set<SegmentGroupVariant>(["default"])

function SegmentGroupMatrixCell({
  variant,
  color,
  orientation,
}: {
  variant: SegmentGroupVariant
  color: SegmentGroupColor
  orientation: SegmentGroupOrientation
}) {
  const redundant = color === "accent" && !ACCENT_AWARE_VARIANTS.has(variant)

  return (
    <div className="space-y-2">
      <SegmentGroup
        variant={variant}
        color={color}
        orientation={orientation}
        defaultValue="week"
      >
        <SegmentGroupIndicator />
        <SegmentGroupItem value="day">Day</SegmentGroupItem>
        <SegmentGroupItem value="week">Week</SegmentGroupItem>
        <SegmentGroupItem value="month">Month</SegmentGroupItem>
      </SegmentGroup>
      {redundant ? (
        <p className="text-muted-foreground/70 max-w-[22rem] text-[length:var(--text-2xs)]">
          Identical to the default colour — the outline variant already draws
          its ring and checked label in the primary hue.
        </p>
      ) : null}
    </div>
  )
}

function SegmentGroupMatrix() {
  return (
    <div className="space-y-8">
      {SEGMENT_ORIENTATIONS.map((orientation) => (
        <div key={orientation} className="space-y-3">
          <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
            {orientation}
          </p>
          <VariantMatrix
            rows={{ label: "variant", values: SEGMENT_VARIANTS }}
            cols={{ label: "color", values: SEGMENT_COLORS }}
            render={(variant, color) => (
              <SegmentGroupMatrixCell
                variant={variant}
                color={color}
                orientation={orientation}
              />
            )}
          />
        </div>
      ))}
    </div>
  )
}

function SegmentGroupPage() {
  const [range, setRange] = useState("week")
  const [layout, setLayout] = useState("list")
  const [view, setView] = useState("calendar")
  const [density, setDensity] = useState("comfortable")

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

      <ShowcaseExample
        title="Outline variant"
        code={`<SegmentGroup
  variant="outline"
  value={density}
  onValueChange={setDensity}
>
  <SegmentGroupIndicator />
  <SegmentGroupItem value="compact">Compact</SegmentGroupItem>
  <SegmentGroupItem value="comfortable">Comfortable</SegmentGroupItem>
  <SegmentGroupItem value="spacious">Spacious</SegmentGroupItem>
</SegmentGroup>`}
      >
        <SegmentGroup
          variant="outline"
          value={density}
          onValueChange={setDensity}
        >
          <SegmentGroupIndicator />
          <SegmentGroupItem value="compact">Compact</SegmentGroupItem>
          <SegmentGroupItem value="comfortable">Comfortable</SegmentGroupItem>
          <SegmentGroupItem value="spacious">Spacious</SegmentGroupItem>
        </SegmentGroup>
      </ShowcaseExample>

      <ShowcaseExample
        title="Variant × colour × orientation matrix"
        code={`// One representative cell: every variant x color combination renders
// above, once per orientation.
<SegmentGroup
  variant="default"
  color="accent"
  orientation="horizontal"
  defaultValue="week"
>
  <SegmentGroupIndicator />
  <SegmentGroupItem value="day">Day</SegmentGroupItem>
  <SegmentGroupItem value="week">Week</SegmentGroupItem>
  <SegmentGroupItem value="month">Month</SegmentGroupItem>
</SegmentGroup>`}
      >
        <SegmentGroupMatrix />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
