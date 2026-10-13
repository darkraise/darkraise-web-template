import type { GlassTransparency } from "../types"

/**
 * How far each Transparency step moves a glass look's declared Medium alpha:
 * the see-through share, 1 − alpha, is multiplied by the step's scale. Glass
 * writes the scale as `--glass-transparency-scale`, and theme.css derives
 * `--surface-alpha` and `--overlay-alpha` with the same formula and floors.
 */
export const TRANSPARENCY_SCALE: Readonly<Record<GlassTransparency, number>> = {
  low: 0.6,
  medium: 1,
  high: 1.5,
}

/** The lowest card-plane alpha any step paints. */
export const SURFACE_ALPHA_FLOOR = 0.2

/** Higher than the card floor: an overlay covers arbitrary content, not a known ground. */
export const OVERLAY_ALPHA_FLOOR = 0.4

/** The alpha a fill paints at: `declared` scaled by the step's `scale`, never below `floor`. */
export function effectiveAlpha(
  declared: number,
  scale: number,
  floor: number,
): number {
  return Math.max(floor, 1 - (1 - declared) * scale)
}
