export type CardElevation = "flat" | "low" | "medium" | "high"

export function resolveCardElevation(
  elevation: boolean | CardElevation,
): CardElevation | "auto" | undefined {
  return elevation === true ? "auto" : elevation || undefined
}
