import type { AnnotationStroke, Point } from "./types"

/**
 * Render a single annotation stroke into the supplied 2D context. Used by
 * both the live canvas overlay and the export pipeline so the rasterised
 * output matches the preview exactly.
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: AnnotationStroke,
): void {
  if (stroke.points.length === 0) return
  ctx.save()
  ctx.strokeStyle = stroke.color
  ctx.fillStyle = stroke.color
  ctx.lineWidth = stroke.width
  ctx.globalAlpha = stroke.opacity
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  switch (stroke.kind) {
    case "pen":
    case "highlighter":
      drawSmoothLine(ctx, stroke.points)
      break
    case "arrow":
      drawArrow(ctx, stroke.points, stroke.width)
      break
    case "rectangle":
      drawRectangle(ctx, stroke.points)
      break
    case "circle":
      drawEllipse(ctx, stroke.points)
      break
    case "text":
      drawText(ctx, stroke)
      break
  }
  ctx.restore()
}

function drawSmoothLine(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) {
    // A single click renders as a dot so the user gets visible feedback
    // before pulling.
    const p = points[0]
    if (!p) return
    ctx.beginPath()
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  // Quadratic smoothing: anchor each control point at the actual sample
  // and route through midpoints between consecutive samples. This avoids
  // the kinks a naïve lineTo chain produces on hand-drawn input.
  const first = points[0]
  if (!first) return
  ctx.beginPath()
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < points.length - 1; i += 1) {
    const a = points[i]
    const b = points[i + 1]
    if (!a || !b) continue
    const cx = (a.x + b.x) / 2
    const cy = (a.y + b.y) / 2
    ctx.quadraticCurveTo(a.x, a.y, cx, cy)
  }
  const last = points[points.length - 1]
  if (!last) return
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  width: number,
): void {
  const start = points[0]
  const end = points[points.length - 1]
  if (!start || !end) return
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.stroke()
  // Arrowhead: an isoceles triangle whose tip is at `end` and whose base
  // sits on a line perpendicular to the segment direction. Head length
  // scales with stroke width so thicker lines get proportional heads.
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const headLength = Math.max(width * 3, 10)
  const tipAngle = Math.PI / 6
  ctx.beginPath()
  ctx.moveTo(end.x, end.y)
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - tipAngle),
    end.y - headLength * Math.sin(angle - tipAngle),
  )
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + tipAngle),
    end.y - headLength * Math.sin(angle + tipAngle),
  )
  ctx.closePath()
  ctx.fill()
}

function drawRectangle(ctx: CanvasRenderingContext2D, points: Point[]): void {
  const start = points[0]
  const end = points[points.length - 1]
  if (!start || !end) return
  // Use the bounding rectangle of start and end so the user can drag in
  // any direction (top-right→bottom-left etc.) and still get a positive
  // width/height rect.
  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  const w = Math.abs(start.x - end.x)
  const h = Math.abs(start.y - end.y)
  ctx.strokeRect(x, y, w, h)
}

function drawEllipse(ctx: CanvasRenderingContext2D, points: Point[]): void {
  const start = points[0]
  const end = points[points.length - 1]
  if (!start || !end) return
  const cx = (start.x + end.x) / 2
  const cy = (start.y + end.y) / 2
  const rx = Math.abs(start.x - end.x) / 2
  const ry = Math.abs(start.y - end.y) / 2
  if (rx === 0 || ry === 0) return
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()
}

function drawText(
  ctx: CanvasRenderingContext2D,
  stroke: AnnotationStroke,
): void {
  if (!stroke.text) return
  const p = stroke.points[0]
  if (!p) return
  // Font size scales with stroke width so the toolbar's width slider also
  // controls text size. Floor at 12px so text remains legible regardless
  // of the slider's lower bound.
  const fontSize = Math.max(stroke.width * 4, 12)
  ctx.font = `${fontSize}px system-ui, sans-serif`
  ctx.textBaseline = "top"
  ctx.fillText(stroke.text, p.x, p.y)
}
