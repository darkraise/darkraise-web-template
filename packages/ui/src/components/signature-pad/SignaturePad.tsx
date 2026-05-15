import * as React from "react"
import { cn } from "@lib/utils"
import "./signature-pad.css"

export interface SignaturePadHandle {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: (type?: string, quality?: number) => string
  toBlob: (callback: BlobCallback, type?: string, quality?: number) => void
}

export interface SignaturePadProps extends Omit<
  React.CanvasHTMLAttributes<HTMLCanvasElement>,
  "onChange" | "width" | "height"
> {
  width: number
  height: number
  strokeColor?: string
  strokeWidth?: number
  /** Background fill drawn before the signature; useful for opaque exports. */
  backgroundColor?: string
  onStrokeStart?: () => void
  onStrokeEnd?: () => void
  ref?: React.Ref<SignaturePadHandle>
}

type Point = { x: number; y: number }

function SignaturePad({
  width,
  height,
  strokeColor,
  strokeWidth = 2,
  backgroundColor,
  onStrokeStart,
  onStrokeEnd,
  className,
  ref,
  ...rest
}: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const dirtyRef = React.useRef(false)
  const drawingRef = React.useRef(false)
  const lastPtRef = React.useRef<Point | null>(null)
  const lastMidRef = React.useRef<Point | null>(null)

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null

  const paintBackground = React.useCallback(() => {
    const ctx = getCtx()
    if (!ctx) return
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.clearRect(0, 0, width, height)
    }
  }, [backgroundColor, width, height])

  React.useEffect(() => {
    const node = canvasRef.current
    const ctx = getCtx()
    if (!node || !ctx) return
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
    node.width = Math.round(width * dpr)
    node.height = Math.round(height * dpr)
    node.style.width = `${width}px`
    node.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paintBackground()
  }, [width, height, paintBackground])

  React.useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        paintBackground()
        dirtyRef.current = false
      },
      isEmpty: () => !dirtyRef.current,
      toDataURL: (type, quality) =>
        canvasRef.current?.toDataURL(type, quality) ?? "",
      toBlob: (callback, type, quality) => {
        canvasRef.current?.toBlob(callback, type, quality)
      },
    }),
    [paintBackground],
  )

  const localPoint = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): Point | null => {
    const node = canvasRef.current
    if (!node) return null
    const rect = node.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    return {
      x: (event.clientX - rect.left) * (width / rect.width),
      y: (event.clientY - rect.top) * (height / rect.height),
    }
  }

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = getCtx()
    const node = canvasRef.current
    if (!ctx || !node) return
    const pt = localPoint(event)
    if (!pt) return
    drawingRef.current = true
    lastPtRef.current = pt
    lastMidRef.current = pt
    node.setPointerCapture(event.pointerId)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = strokeColor ?? getComputedStyle(node).color
    onStrokeStart?.()
  }

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = getCtx()
    const pt = localPoint(event)
    const lastPt = lastPtRef.current
    const lastMid = lastMidRef.current
    if (!ctx || !pt || !lastPt || !lastMid) return
    const mid: Point = {
      x: (lastPt.x + pt.x) / 2,
      y: (lastPt.y + pt.y) / 2,
    }
    ctx.beginPath()
    ctx.moveTo(lastMid.x, lastMid.y)
    ctx.quadraticCurveTo(lastPt.x, lastPt.y, mid.x, mid.y)
    ctx.stroke()
    lastPtRef.current = pt
    lastMidRef.current = mid
    dirtyRef.current = true
  }

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const ctx = getCtx()
    const lastPt = lastPtRef.current
    const lastMid = lastMidRef.current
    if (ctx && lastPt && lastMid) {
      ctx.beginPath()
      ctx.moveTo(lastMid.x, lastMid.y)
      ctx.lineTo(lastPt.x, lastPt.y)
      ctx.stroke()
    }
    lastPtRef.current = null
    lastMidRef.current = null
    const node = canvasRef.current
    try {
      node?.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    onStrokeEnd?.()
  }

  return (
    <canvas
      {...rest}
      ref={canvasRef}
      className={cn("dr-signature-pad", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  )
}

export { SignaturePad }
