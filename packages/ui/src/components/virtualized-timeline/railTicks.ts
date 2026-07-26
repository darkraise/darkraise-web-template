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
  /** Minimum pixels between rendered labels — one label line box. Default 14. */
  minLabelGap?: number
}

export function buildRailTicks<T>({
  buckets,
  offsets,
  totalSize,
  railHeight,
  showLabels,
  minTickGap = 4,
  minLabelGap = 14,
}: RailTicksArgs<T>): RailTick[] {
  if (buckets.length === 0 || totalSize <= 0 || railHeight <= 0) return []

  const scale = railHeight / totalSize
  let previousYear: number | null = null

  // First pass: identify candidate ticks (all buckets).
  const candidates: RailTick[] = []
  buckets.forEach((bucket, index) => {
    const year = toBucketDate(bucket.date).getFullYear()
    const isYear = previousYear === null || year !== previousYear
    previousYear = year

    const y = (offsets[index] ?? 0) * scale

    candidates.push({
      index,
      bucketId: bucket.id,
      y,
      kind: isYear ? "year" : "sub",
    })
  })

  // Second pass: thin sub ticks that are surrounded by closer ticks.
  const kept = candidates.filter((tick, idx) => {
    if (tick.kind === "year") return true

    const prev = candidates[idx - 1]
    const next = candidates[idx + 1]

    const tooCloseToPrev = prev && tick.y - prev.y < minTickGap
    const tooCloseToNext = next && next.y - tick.y < minTickGap

    return !(tooCloseToPrev && tooCloseToNext)
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
