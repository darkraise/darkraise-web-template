/**
 * Common axes that are forced back to their configured default while the
 * active preset hides them, rather than merely being hidden from the switcher.
 *
 * This is deliberately a short explicit list and not "every axis in
 * `hiddenCommonAxes`". `presets/types.ts` documents that a hidden common axis
 * still has its state and data attribute applied, so components reading it
 * outside the preset's own CSS keep working — Sci-fi relies on that today for
 * `elevation`, `buttonElevation` and `radius`. Narrowing that contract for
 * every preset is out of scope; these two axes opt in by name.
 *
 * Why they need it: `accentIntensity` and `surfaceIntensity` are Default-preset
 * controls, and Glass and Sci-fi reinterpret the same surfaces through their
 * own recipes. Hiding alone would leave a stored `calm` silently applying under
 * Glass with no control to change it back. The stored value is untouched, so
 * switching back to Default restores the user's choice.
 */
export const NEUTRALISED_WHEN_HIDDEN: ReadonlySet<string> = new Set([
  "accentIntensity",
  "surfaceIntensity",
])

/** Resolves an axis value to the preset-appropriate one. */
export function neutraliseIfHidden<T extends string>(
  axisName: string,
  value: T,
  fallback: T,
  hiddenCommonAxes: readonly string[] | undefined,
): T {
  if (!NEUTRALISED_WHEN_HIDDEN.has(axisName)) return value
  return hiddenCommonAxes?.includes(axisName) ? fallback : value
}
