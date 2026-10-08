import * as React from "react"

import { cn } from "@lib/utils"
import { useEvent } from "@primitives/state"
import { useUiLabels } from "../../labels/useUiLabels"
import type { QrCodeMatrix } from "./qrEncoder"
import { useQrCode } from "./useQrCode"
import "./qr-code.css"

export type QrCodeLevel = "L" | "M" | "Q" | "H"

export interface QrCodeProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "color" | "onError"
> {
  value: string
  level?: QrCodeLevel
  size?: number
  /** Light modules and the quiet zone. White by default: scanners expect
   *  dark modules on a light ground. */
  bgColor?: string
  fgColor?: string
  /** Quiet zone around the code, in modules (rounded, never negative).
   *  Defaults to 4, the width the QR specification requires for reliable
   *  scanning. */
  margin?: number
  /** Accessible name of the code. Defaults to `labels.qrCode.label`. */
  label?: string
  /** Called once each time the value or level changes to one the encoder
   *  cannot fit (the in-house encoder stops at version 10). */
  onError?: (error: Error) => void
  /** Rendered in place of the code when the value cannot be encoded. */
  fallback?: React.ReactNode
}

interface QrCodeContextValue {
  size: number
  bgColor: string
  fgColor: string
  margin: number
  label: string
  /** Null when the value cannot be encoded. */
  matrix: QrCodeMatrix | null
  fallback: React.ReactNode
}

const QrCodeContext = React.createContext<QrCodeContextValue | null>(null)

function useQrCodeContext(part: string): QrCodeContextValue {
  const ctx = React.useContext(QrCodeContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <QrCode> root component`)
  }
  return ctx
}

const DEFAULT_MARGIN = 4

function QrCode({
  className,
  value,
  level = "M",
  size = 200,
  bgColor = "#fff",
  fgColor = "#000",
  margin = DEFAULT_MARGIN,
  label,
  onError,
  fallback,
  children,
  style,
  ...props
}: QrCodeProps) {
  const labels = useUiLabels().qrCode
  const { matrix, error } = useQrCode({ value, level })
  const reportError = useEvent((next: Error) => onError?.(next))
  // useQrCode memoises on value and level, so a new error object means a
  // new failing value or level: one report each. The ref keeps StrictMode's
  // second effect run from reporting the same error again.
  const reportedRef = React.useRef<Error | null>(null)
  React.useEffect(() => {
    if (!error || reportedRef.current === error) return
    reportedRef.current = error
    reportError(error)
  }, [error, reportError])

  const resolvedLabel = label ?? labels.label
  const quietZone = Number.isFinite(margin)
    ? Math.max(0, Math.round(margin))
    : DEFAULT_MARGIN
  const ctx = React.useMemo<QrCodeContextValue>(
    () => ({
      size,
      bgColor,
      fgColor,
      margin: quietZone,
      label: resolvedLabel,
      matrix,
      fallback,
    }),
    [size, bgColor, fgColor, quietZone, resolvedLabel, matrix, fallback],
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
  const { size, bgColor, fgColor, margin, label, matrix, fallback } =
    useQrCodeContext("QrCodeFrame")

  // Build SVG path for dark modules. We stick to a single rect-per-module path
  // so reading tests can check `path[d]` deltas across value/level changes.
  const path = React.useMemo(() => {
    if (!matrix) return ""
    let d = ""
    for (let y = 0; y < matrix.size; y++) {
      for (let x = 0; x < matrix.size; x++) {
        if (matrix.modules[y]?.[x]) {
          d += `M${x + margin},${y + margin}h1v1h-1z`
        }
      }
    }
    return d
  }, [matrix, margin])

  if (!matrix) {
    return (
      <span
        className={cn("dr-qr-code-frame", className)}
        data-state="error"
        {...props}
      >
        {fallback}
      </span>
    )
  }

  const extent = matrix.size + margin * 2

  return (
    <span className={cn("dr-qr-code-frame", className)} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${extent} ${extent}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        role="img"
        aria-label={label}
      >
        <path d={`M0,0h${extent}v${extent}h-${extent}z`} fill={bgColor} />
        <path d={path} fill={fgColor} />
      </svg>
    </span>
  )
}

export type QrCodeOverlayProps = React.HTMLAttributes<HTMLSpanElement>

function QrCodeOverlay({ className, style, ...props }: QrCodeOverlayProps) {
  const { size, matrix } = useQrCodeContext("QrCodeOverlay")
  if (!matrix) return null
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
