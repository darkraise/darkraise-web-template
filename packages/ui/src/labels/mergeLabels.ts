import type { DeepPartialLabels, UiLabels } from "./types"

function mergeObjects(base: object, override: object): object {
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue
    const previous = result[key]
    result[key] =
      value !== null &&
      typeof value === "object" &&
      previous !== null &&
      typeof previous === "object"
        ? mergeObjects(previous, value)
        : value
  }
  return result
}

export function mergeLabels<T extends UiLabels>(
  base: T,
  override: DeepPartialLabels<T>,
): T {
  return mergeObjects(base, override) as T
}
