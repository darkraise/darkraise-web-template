import type { AxisKey } from "@theme/axes/registry"

/**
 * Common axes that are forced back to their configured default while the
 * active preset hides them, rather than merely being hidden from the switcher.
 *
 * This is deliberately a short explicit list and not "every axis in
 * `hiddenCommonAxes`". `presets/types.ts` documents that a hidden common axis
 * still has its state and data attribute applied, so components reading it
 * outside the preset's own CSS keep working. An axis opts in by name; the
 * stored value is untouched, so switching back restores the user's choice.
 */
export const NEUTRALISED_WHEN_HIDDEN: readonly AxisKey[] = []

/** Resolves an axis value to the preset-appropriate one. */
export function neutraliseIfHidden<T extends string>(
  axisName: string,
  value: T,
  fallback: T,
  hiddenCommonAxes: readonly string[] | undefined,
): T {
  if (!(NEUTRALISED_WHEN_HIDDEN as readonly string[]).includes(axisName))
    return value
  return hiddenCommonAxes?.includes(axisName) ? fallback : value
}
