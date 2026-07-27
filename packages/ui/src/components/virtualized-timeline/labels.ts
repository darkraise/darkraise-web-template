import type { TimelineBucket, TimelineGranularity } from "./types"

const LABEL_OPTIONS: Record<TimelineGranularity, Intl.DateTimeFormatOptions> = {
  day: { year: "numeric", month: "long", day: "numeric" },
  month: { year: "numeric", month: "long" },
  year: { year: "numeric" },
}

/** `new Date("2026-07-01")` parses as UTC midnight, which lands on the
 *  previous day west of Greenwich. Bucket dates are calendar dates, so a
 *  date-only string is read as local time. */
export function toBucketDate(value: Date | string): Date {
  if (typeof value !== "string") return value
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date(value)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function formatBucketLabel(
  bucket: TimelineBucket<unknown>,
  granularity: TimelineGranularity,
): string {
  if (bucket.label) return bucket.label
  return toBucketDate(bucket.date).toLocaleDateString(
    undefined,
    LABEL_OPTIONS[granularity],
  )
}
