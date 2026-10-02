import type { BackgroundIntensity, ResolvedMode } from "@theme/types"
import { composite } from "@theme/engine/oklch"

/**
 * How much of the surface colour's hue the page canvas may carry, as a maximum
 * saturation percentage. A cap rather than a multiplier so one step means the
 * same thing for every surface colour: `slate` starts at 84% saturation while
 * every tinted option is already damped to ~30% by `tintScale`, so a multiplier
 * would leave slate visibly blue at the same setting that neutralises the rest.
 * `null` means uncapped — the palette's own value, which is what preserving the
 * pre-axis appearance requires.
 */
export const CANVAS_SATURATION_CAP: Record<BackgroundIntensity, number | null> =
  {
    neutral: 0,
    subtle: 8,
    balanced: 16,
    vivid: null,
    intense: null,
  }

/** `--canvas-blob-scale` per step: how loud the gradient canvas's blobs paint. */
export const CANVAS_BLOB_SCALE: Record<BackgroundIntensity, number> = {
  neutral: 0.25,
  subtle: 0.5,
  balanced: 1,
  vivid: 1.5,
  intense: 2,
}

/**
 * The loudest point of the gradient canvas, as the share of the surface hue
 * composited over the page: the ink layer's top stop, plus per unit of blob
 * scale the peak of the loudest single blob in any gradient pattern. Read off
 * the body's blob recipes in theme.css, which field-edge.test.ts checks.
 */
export const CANVAS_PEAK_SHARE: Record<
  ResolvedMode,
  { ink: number; blobs: number }
> = {
  light: { ink: 0.04, blobs: 0.22 },
  dark: { ink: 0.07, blobs: 0.18 },
}

/**
 * The page where a gradient canvas is loudest. Under `solid` the page is
 * `background` itself and nothing needs listing.
 */
export function gradientCanvasPeak(
  background: string,
  surfaceHue: string,
  mode: ResolvedMode,
  intensity: BackgroundIntensity,
): string {
  const { ink, blobs } = CANVAS_PEAK_SHARE[mode]
  const share = Math.min(1, ink + blobs * CANVAS_BLOB_SCALE[intensity])
  return composite(background, surfaceHue, share)
}

/**
 * How much more surface hue the dark content strip is solved against than the
 * canvas model predicts. Measured 2026-10-02 at 1440px, blue on slate at
 * balanced: the model gave 0.0189 luminance where Chromium painted 0.021, so a
 * field edge solved to 3:1 rendered 2.92:1. Another 4% of the hue over the
 * modelled peak covered slate and violet at balanced and intense.
 */
const STRIP_DARK_EXTRA = 0.04

/**
 * The loudest point of the content strip: the canvas layers the default
 * preset repaints over the top of `main[data-content]` (theme.css,
 * `--content-gradient-overlay`), where the body canvas behind it renders flat.
 */
export function contentStripGround(
  background: string,
  surfaceHue: string,
  mode: ResolvedMode,
  intensity: BackgroundIntensity,
): string {
  const peak = gradientCanvasPeak(background, surfaceHue, mode, intensity)
  return mode === "dark" ? composite(peak, surfaceHue, STRIP_DARK_EXTRA) : peak
}

/** Clamps an `H S% L%` triplet's saturation. Hue and lightness pass through. */
export function capCanvasSaturation(hsl: string, cap: number | null): string {
  if (cap === null) return hsl
  const [h, s, l] = hsl.split(" ")
  const saturation = Math.min(parseFloat(s ?? "0"), cap)
  return `${h} ${saturation.toFixed(0)}% ${l}`
}
