import type { PerspectiveCorners, Point } from "./types"

interface SourceRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Solve for the 6 affine coefficients that map three source points to
 * three destination points. Returns null when the source triangle is
 * degenerate (zero area). Layout: [a, b, c, d, e, f] where the canvas
 * setTransform call expects (a, b, c, d, e, f) producing
 * (x', y') = (a*x + c*y + e, b*x + d*y + f).
 */
export function computeAffine(
  s0: Point,
  s1: Point,
  s2: Point,
  d0: Point,
  d1: Point,
  d2: Point,
): [number, number, number, number, number, number] | null {
  const det = (s0.x - s2.x) * (s1.y - s2.y) - (s1.x - s2.x) * (s0.y - s2.y)
  if (Math.abs(det) < 1e-9) return null

  const a =
    ((d0.x - d2.x) * (s1.y - s2.y) - (d1.x - d2.x) * (s0.y - s2.y)) / det
  const c =
    ((s0.x - s2.x) * (d1.x - d2.x) - (s1.x - s2.x) * (d0.x - d2.x)) / det
  const e = d2.x - a * s2.x - c * s2.y

  const b =
    ((d0.y - d2.y) * (s1.y - s2.y) - (d1.y - d2.y) * (s0.y - s2.y)) / det
  const d =
    ((s0.x - s2.x) * (d1.y - d2.y) - (s1.x - s2.x) * (d0.y - d2.y)) / det
  const f = d2.y - b * s2.x - d * s2.y

  return [a, b, c, d, e, f]
}

/**
 * Warp the supplied source image so its rectangular `sourceRect` fits the
 * destination quad (`corners`). Splits the destination quad into two
 * triangles along the TL→BR diagonal and applies an affine transform per
 * triangle. Visible seams may appear along the diagonal at extreme
 * corrections; for moderate use this is acceptable.
 */
export function drawPerspectiveQuad(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceRect: SourceRect,
  corners: PerspectiveCorners,
): void {
  const sTL = { x: sourceRect.x, y: sourceRect.y }
  const sTR = { x: sourceRect.x + sourceRect.width, y: sourceRect.y }
  const sBR = {
    x: sourceRect.x + sourceRect.width,
    y: sourceRect.y + sourceRect.height,
  }
  const sBL = { x: sourceRect.x, y: sourceRect.y + sourceRect.height }

  drawWarpedTriangle(
    ctx,
    source,
    sTL,
    sTR,
    sBR,
    corners.topLeft,
    corners.topRight,
    corners.bottomRight,
  )
  drawWarpedTriangle(
    ctx,
    source,
    sTL,
    sBR,
    sBL,
    corners.topLeft,
    corners.bottomRight,
    corners.bottomLeft,
  )
}

function drawWarpedTriangle(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  s0: Point,
  s1: Point,
  s2: Point,
  d0: Point,
  d1: Point,
  d2: Point,
): void {
  const aff = computeAffine(s0, s1, s2, d0, d1, d2)
  if (!aff) return
  ctx.save()
  // Clip to the destination triangle so the affine-warped source only
  // shows inside it.
  ctx.beginPath()
  ctx.moveTo(d0.x, d0.y)
  ctx.lineTo(d1.x, d1.y)
  ctx.lineTo(d2.x, d2.y)
  ctx.closePath()
  ctx.clip()
  // Apply the affine transform. Note: setTransform replaces (does not
  // multiply) the current transform, which is what we want — drawImage
  // below uses native source coordinates.
  ctx.setTransform(aff[0], aff[1], aff[2], aff[3], aff[4], aff[5])
  // Draw the entire image; pixels outside the destination triangle get
  // discarded by the clip.
  if ((source as HTMLImageElement).naturalWidth !== undefined) {
    const img = source as HTMLImageElement
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight)
  } else if ((source as ImageBitmap).width !== undefined) {
    const bmp = source as ImageBitmap
    ctx.drawImage(bmp, 0, 0, bmp.width, bmp.height)
  } else {
    ctx.drawImage(source, 0, 0)
  }
  ctx.restore()
}
