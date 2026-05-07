import * as React from "react"

import { cn } from "@lib/utils"
import { encodeQr } from "./qrEncoder"
import "./qr-code.css"

export type QrCodeLevel = "L" | "M" | "Q" | "H"

export interface QrCodeProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "color"
> {
  value: string
  level?: QrCodeLevel
  size?: number
  bgColor?: string
  fgColor?: string
}

interface QrCodeContextValue {
  value: string
  level: QrCodeLevel
  size: number
  bgColor: string
  fgColor: string
}

const QrCodeContext = React.createContext<QrCodeContextValue | null>(null)

function useQrCodeContext(part: string): QrCodeContextValue {
  const ctx = React.useContext(QrCodeContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <QrCode> root component`)
  }
  return ctx
}

function QrCode({
  className,
  value,
  level = "M",
  size = 200,
  bgColor = "transparent",
  fgColor = "currentColor",
  children,
  style,
  ...props
}: QrCodeProps) {
  const ctx = React.useMemo<QrCodeContextValue>(
    () => ({ value, level, size, bgColor, fgColor }),
    [value, level, size, bgColor, fgColor],
  )

  const hasChildren = React.Children.count(children) > 0

  return (
    <QrCodeContext.Provider value={ctx}>
      <span
        className={cn("dr-qr-code", className)}
        data-level={level}
        style={{ width: size, height: size, ...style }}
        {...props}
      >
        {hasChildren ? children : <QrCodeFrame />}
      </span>
    </QrCodeContext.Provider>
  )
}

export type QrCodeFrameProps = Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
>

function QrCodeFrame({ className, ...props }: QrCodeFrameProps) {
  const { value, level, size, bgColor, fgColor } =
    useQrCodeContext("QrCodeFrame")
  const matrix = React.useMemo(() => {
    try {
      return encodeQr(value, level)
    } catch {
      // value too large for in-house encoder (>v10) — render an empty frame
      return {
        size: 21,
        modules: Array.from({ length: 21 }, () => Array(21).fill(false)),
      }
    }
  }, [value, level])

  // Build SVG path for dark modules. We stick to a single rect-per-module path
  // so reading tests can check `path[d]` deltas across value/level changes.
  const path = React.useMemo(() => {
    let d = ""
    for (let y = 0; y < matrix.size; y++) {
      for (let x = 0; x < matrix.size; x++) {
        if (matrix.modules[y]?.[x]) {
          d += `M${x},${y}h1v1h-1z`
        }
      }
    }
    return d
  }, [matrix])

  const viewBox = `0 0 ${matrix.size} ${matrix.size}`

  return (
    <span className={cn("dr-qr-code-frame", className)} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={size}
        height={size}
        shapeRendering="crispEdges"
      >
        <path
          d={`M0,0h${matrix.size}v${matrix.size}h-${matrix.size}z`}
          fill={bgColor}
        />
        <path d={path} fill={fgColor} />
      </svg>
    </span>
  )
}

export type QrCodeOverlayProps = React.HTMLAttributes<HTMLSpanElement>

function QrCodeOverlay({ className, style, ...props }: QrCodeOverlayProps) {
  const { size } = useQrCodeContext("QrCodeOverlay")
  const overlaySize = Math.round(size * 0.2)
  return (
    <span
      className={cn("dr-qr-code-overlay", className)}
      aria-hidden="true"
      style={{
        ["--dr-qr-overlay-size" as string]: `${overlaySize}px`,
        ...style,
      }}
      {...props}
    />
  )
}

export { QrCode, QrCodeFrame, QrCodeOverlay }
