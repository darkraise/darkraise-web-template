import { hslStringToOklch, oklchToHslString } from "./oklch"

/**
 * The accent-tinted backdrop Soft Glass paints: four soft blobs whose hues
 * turn from the accent's, over a ground that runs from the page colour to a
 * faint tint. theme.css declares the same colours as `--ground-blob-1` …
 * `--ground-blob-4` and `--ground-tint` with relative colour syntax, and
 * groundBlobs.test.ts holds the stylesheet to these constants.
 */

/** Degrees added to the accent hue, for `--ground-blob-1` … `--ground-blob-4`. */
export const GROUND_BLOB_HUES = [0, 60, -120, 30] as const

/** OKLCH lightness and chroma cap of every blob, per mode. */
export const GROUND_BLOB = {
  light: { l: 0.91, c: 0.05 },
  dark: { l: 0.3, c: 0.06 },
} as const

/** The ground's second stop: a tint `hue` degrees from the accent. */
export const GROUND_TINT = {
  hue: 60,
  light: { l: 0.95, c: 0.02 },
  dark: { l: 0.2, c: 0.03 },
} as const

/**
 * Taken off the accent's chroma before the cap. The neutral accent's primary
 * carries up to 0.039 from its neutral ramp and every chromatic accent's at
 * least 0.072, so the neutral accent paints grey blobs and every other
 * accent a tint.
 */
export const GROUND_CHROMA_OFFSET = 0.04

/**
 * The blob and tint colours for an engine `--primary` triplet, as HSL
 * triplets: what the stylesheet paints, for the contrast tests.
 */
export function groundColours(
  primary: string,
  mode: "light" | "dark",
): { blobs: string[]; tint: string } {
  const { C, h } = hslStringToOklch(primary)
  const chroma = Math.max(0, C - GROUND_CHROMA_OFFSET)
  const at = (l: number, cap: number, by: number) =>
    oklchToHslString({
      L: l,
      C: Math.min(cap, chroma),
      h: h + (by * Math.PI) / 180,
    })
  const blob = GROUND_BLOB[mode]
  const tint = GROUND_TINT[mode]
  return {
    blobs: GROUND_BLOB_HUES.map((by) => at(blob.l, blob.c, by)),
    tint: at(tint.l, tint.c, GROUND_TINT.hue),
  }
}
