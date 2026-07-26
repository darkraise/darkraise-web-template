import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import {
  VirtualizedTimeline,
  type VirtualizedTimelineHandle,
} from "darkraise-ui/components/virtualized-timeline"
import { useRef, useState } from "react"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/virtualized-timeline",
)({
  component: VirtualizedTimelinePage,
})

const timelineCode = `<VirtualizedTimeline
  ref={timelineRef}
  buckets={buckets}
  loadBucket={loadBucket}
  minTileWidth={minTileWidth}
  selectable
  collapsible
  showJumpToDate
  selectedIds={selected}
  onSelectionChange={setSelected}
  renderItem={({ item }) => (
    <div
      className="h-full w-full"
      style={{
        background: \`linear-gradient(135deg, hsl(\${item.hue} 70% 55%), hsl(\${(item.hue + 40) % 360} 70% 40%))\`,
      }}
    />
  )}
  className="h-[32rem]"
/>`

interface Shot {
  id: string
  hue: number
}

/** Seeded so the demo is identical on every reload. Walks back one calendar
 *  month per bucket; the Date constructor normalises a negative month into
 *  the prior year, so the sequence stays strictly chronological (required —
 *  the component warns on unsorted buckets and the scrubber/jump-to-date
 *  math assumes it). */
function makeBuckets() {
  let seed = 1337
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  return Array.from({ length: 24 }, (_, index) => {
    const date = new Date(2026, 6 - index, 1)
    const count = 20 + Math.floor(next() * 380)
    return {
      id: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      date,
      count,
    }
  })
}

const buckets = makeBuckets()
const oldestBucket = buckets.reduce((oldest, bucket) =>
  bucket.date < oldest.date ? bucket : oldest,
)

/** Stands in for a network call: latency makes the skeletons visible. */
function loadBucket(bucket: { id: string; count: number }): Promise<Shot[]> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve(
          Array.from({ length: bucket.count }, (_, index) => ({
            id: `${bucket.id}-${index}`,
            hue: (index * 37) % 360,
          })),
        ),
      350,
    )
  })
}

function VirtualizedTimelinePage() {
  const timelineRef = useRef<VirtualizedTimelineHandle>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [minTileWidth, setMinTileWidth] = useState(140)
  const [narrow, setNarrow] = useState(false)

  return (
    <ShowcasePage
      title="Virtualized Timeline"
      description="Date-bucketed scroller for collections too large to render, with a draggable scrubber, lazy loading, selection, collapse, and jump-to-date."
    >
      <ShowcaseExample title="Photo timeline" code={timelineCode}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {selected.length} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                timelineRef.current?.scrollToBucket(oldestBucket.id, {
                  align: "start",
                })
              }
            >
              Jump to oldest ({oldestBucket.id})
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Tile size:</span>
            {([100, 140, 200] as const).map((width) => (
              <Button
                key={width}
                size="sm"
                variant={minTileWidth === width ? "default" : "outline"}
                onClick={() => setMinTileWidth(width)}
              >
                {width}px
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">
              Container width (resize anchoring):
            </span>
            <Button
              size="sm"
              variant={narrow ? "outline" : "default"}
              onClick={() => setNarrow(false)}
            >
              Full
            </Button>
            <Button
              size="sm"
              variant={narrow ? "default" : "outline"}
              onClick={() => setNarrow(true)}
            >
              Narrow
            </Button>
          </div>
          <div className={narrow ? "max-w-sm" : "w-full"}>
            <VirtualizedTimeline<Shot>
              ref={timelineRef}
              buckets={buckets}
              loadBucket={loadBucket}
              minTileWidth={minTileWidth}
              selectable
              collapsible
              showJumpToDate
              selectedIds={selected}
              onSelectionChange={setSelected}
              renderItem={({ item }) => (
                <div
                  className="h-full w-full"
                  style={{
                    background: `linear-gradient(135deg, hsl(${item.hue} 70% 55%), hsl(${(item.hue + 40) % 360} 70% 40%))`,
                  }}
                />
              )}
              className="h-[32rem]"
            />
          </div>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
