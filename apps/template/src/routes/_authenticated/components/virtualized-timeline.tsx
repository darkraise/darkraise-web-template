import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import { toast } from "darkraise-ui/components/sonner"
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
  buckets={buckets}                 // { id, date, count }[]
  loadBucket={(bucket) => fetchItems(bucket.id)}
  minTileWidth={140}
  selectable
  collapsible
  showJumpToDate
  selectedIds={selected}
  onSelectionChange={setSelected}
  renderItem={({ item }) => <Tile item={item} />}
  className="h-[32rem]"
/>`

interface Shot {
  id: string
  hue: number
}

/** Seeded so the demo is identical on every reload. */
function makeBuckets() {
  let seed = 1337
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  return Array.from({ length: 24 }, (_, index) => {
    const month = 6 - (index % 12)
    const year = 2026 - Math.floor(index / 12)
    const date = new Date(year, month < 0 ? month + 12 : month, 1)
    const count = 20 + Math.floor(next() * 380)
    return {
      id: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      date,
      count,
    }
  })
}

const buckets = makeBuckets()

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
            {([100, 140, 200] as const).map((width) => (
              <Button
                key={width}
                size="sm"
                variant={minTileWidth === width ? "default" : "outline"}
                onClick={() => setMinTileWidth(width)}
              >
                {width}px tiles
              </Button>
            ))}
          </div>
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
            onItemClick={(item) => toast.info(`Opened ${item.id}`)}
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
      </ShowcaseExample>
    </ShowcasePage>
  )
}
