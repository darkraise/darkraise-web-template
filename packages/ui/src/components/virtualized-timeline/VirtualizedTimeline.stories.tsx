import type { Meta, StoryObj } from "@storybook/react-vite"

import { VirtualizedTimeline } from "./VirtualizedTimeline"
import type { TimelineBucket } from "./types"

const meta: Meta<typeof VirtualizedTimeline> = {
  title: "UI/VirtualizedTimeline",
  component: VirtualizedTimeline,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof VirtualizedTimeline>

interface Shot {
  id: string
  hue: number
}

/** Seeded, so the stories render identically on every reload and in
 *  visual-regression runs. Walks back one calendar month per bucket; the
 *  Date constructor normalises a negative month into the prior year, so the
 *  sequence stays strictly chronological. */
function makeBuckets(withItems: boolean): TimelineBucket<Shot>[] {
  let seed = 1337
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  return Array.from({ length: 24 }, (_, index) => {
    const date = new Date(2026, 6 - index, 1)
    const count = 20 + Math.floor(next() * 380)
    const id = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    return {
      id,
      date,
      count,
      items: withItems
        ? Array.from({ length: count }, (_, itemIndex) => ({
            id: `${id}-${itemIndex}`,
            hue: (itemIndex * 37) % 360,
          }))
        : undefined,
    }
  })
}

function Tile({ item }: { item: Shot }) {
  return (
    <div
      className="h-full w-full"
      style={{
        background: `linear-gradient(135deg, hsl(${item.hue} 70% 55%), hsl(${(item.hue + 40) % 360} 70% 40%))`,
      }}
    />
  )
}

const inline = makeBuckets(true)
const counted = makeBuckets(false)

function loadBucket(bucket: TimelineBucket<Shot>): Promise<Shot[]> {
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

export const Default: Story = {
  render: () => (
    <VirtualizedTimeline<Shot>
      buckets={inline}
      renderItem={({ item }) => <Tile item={item} />}
      className="h-[32rem]"
    />
  ),
}

export const LazyLoading: Story = {
  render: () => (
    <VirtualizedTimeline<Shot>
      buckets={counted}
      loadBucket={loadBucket}
      renderItem={({ item }) => <Tile item={item} />}
      className="h-[32rem]"
    />
  ),
}

export const Selectable: Story = {
  render: () => (
    <VirtualizedTimeline<Shot>
      buckets={inline}
      selectable
      collapsible
      showJumpToDate
      renderItem={({ item }) => <Tile item={item} />}
      className="h-[32rem]"
    />
  ),
}

/** The escape hatch: a bucket body that is a list of rows, not a tile grid.
 *  `renderBucket` and `getBucketHeight` must agree, so they travel together. */
export const CustomBucketBody: Story = {
  render: () => (
    <VirtualizedTimeline<Shot>
      buckets={inline}
      getBucketHeight={(bucket) => 32 + bucket.count * 28 + 16}
      renderBucket={({ items }) => (
        <ul className="divide-border divide-y">
          {(items ?? []).map((item) => (
            <li key={item.id} className="flex h-7 items-center gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: `hsl(${item.hue} 70% 55%)` }}
              />
              {item.id}
            </li>
          ))}
        </ul>
      )}
      className="h-[32rem]"
    />
  ),
}

export const LeftRail: Story = {
  render: () => (
    <VirtualizedTimeline<Shot>
      buckets={inline}
      scrubberSide="left"
      renderItem={({ item }) => <Tile item={item} />}
      className="h-[32rem]"
    />
  ),
}
