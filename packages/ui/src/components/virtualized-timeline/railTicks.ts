import { toBucketDate } from "./labels"
import type { TimelineBucket } from "./types"

export type RailTickKind = "year" | "sub"

export interface RailTick {
  index: number
  bucketId: string
  /** Pixels from the rail's top edge. */
  y: number
  kind: RailTickKind
  /** Absent when the label was thinned away, or when labels are off. */
  label?: string
}

export interface RailTicksArgs<T> {
  buckets: TimelineBucket<T>[]
  offsets: number[]
  totalSize: number
  railHeight: number
  showLabels: boolean
  /** Minimum pixels between rendered sub ticks. Default 4. */
  minTickGap?: number
  /** Minimum pixels between rendered labels — one label line box. Default 18:
   *  a real browser measured rendered label line boxes at 15-16.5px (the bold
   *  year label is the tallest), so 18 is that measurement plus clearance,
   *  not a guess -- do not shave it back down without re-measuring. */
  minLabelGap?: number
}

/** Build ticks and labels for the scrubber rail. Assumes buckets are chronologically ordered. */
export function buildRailTicks<T>({
  buckets,
  offsets,
  totalSize,
  railHeight,
  showLabels,
  minTickGap = 4,
  minLabelGap = 18,
}: RailTicksArgs<T>): RailTick[] {
  if (buckets.length === 0 || totalSize <= 0 || railHeight <= 0) return []

  const scale = railHeight / totalSize
  const kept: RailTick[] = []
  let previousYear: number | null = null
  let lastTickY = Number.NEGATIVE_INFINITY

  buckets.forEach((bucket, index) => {
    const year = toBucketDate(bucket.date).getFullYear()
    const isYear = previousYear === null || year !== previousYear
    previousYear = year

    const y = (offsets[index] ?? 0) * scale

    // Year ticks are the rail's structure and always survive; only sub ticks
    // thin. Thinning bounds the node count by the rail's height rather than
    // by the collection size, which is what keeps a daily library over
    // several years from emitting thousands of sub-pixel ticks.
    if (!isYear && y - lastTickY < minTickGap) return

    lastTickY = y
    kept.push({
      index,
      bucketId: bucket.id,
      y,
      kind: isYear ? "year" : "sub",
    })
  })

  if (!showLabels) return kept

  const labelledYs: number[] = []
  const clears = (y: number) =>
    labelledYs.every((other) => Math.abs(y - other) >= minLabelGap)

  // Two passes so a year label always wins a collision against a month.
  for (const tick of kept) {
    if (tick.kind !== "year") continue
    if (!clears(tick.y)) continue
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    tick.label = String(toBucketDate(buckets[tick.index]!.date).getFullYear())
    labelledYs.push(tick.y)
  }

  for (const tick of kept) {
    if (tick.kind !== "sub") continue
    if (!clears(tick.y)) continue
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    tick.label = toBucketDate(buckets[tick.index]!.date).toLocaleDateString(
      undefined,
      { month: "short" },
    )
    labelledYs.push(tick.y)
  }

  return kept
}
