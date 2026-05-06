import * as React from "react"
import QRCode from "react-qr-code"

import { cn } from "../../lib/utils"
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
  return (
    <span className={cn("dr-qr-code-frame", className)} {...props}>
      <QRCode
        value={value}
        level={level}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
      />
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
