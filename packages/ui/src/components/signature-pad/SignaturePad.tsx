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
  "onChange"
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

function SignaturePad({
  width,
  height,
  strokeColor = "#000",
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
  const lastPtRef = React.useRef<{ x: number; y: number } | null>(null)

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
    paintBackground()
  }, [paintBackground])

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

  const localPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const node = canvasRef.current
    if (!node) return null
    const rect = node.getBoundingClientRect()
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
    node.setPointerCapture(event.pointerId)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = strokeColor
    ctx.beginPath()
    ctx.moveTo(pt.x, pt.y)
    onStrokeStart?.()
  }

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = getCtx()
    const pt = localPoint(event)
    if (!ctx || !pt) return
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    lastPtRef.current = pt
    dirtyRef.current = true
  }

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
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
      width={width}
      height={height}
      className={cn("dr-signature-pad", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  )
}

export { SignaturePad }
