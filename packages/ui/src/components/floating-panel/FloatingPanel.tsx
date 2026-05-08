import * as React from "react"
import { cn } from "@lib/utils"
import {
  useFloatingPanel,
  type UseFloatingPanelOptions,
} from "./useFloatingPanel"
import "./floating-panel.css"

interface FloatingPanelContextValue {
  beginDrag: (event: PointerEvent) => void
  beginResize: (event: PointerEvent) => void
}

const Ctx = React.createContext<FloatingPanelContextValue | null>(null)
function useCtx(consumer: string) {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error(`${consumer} must be inside <FloatingPanel>`)
  return ctx
}

export interface FloatingPanelProps
  extends
    UseFloatingPanelOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof UseFloatingPanelOptions> {}

function FloatingPanel({
  className,
  position,
  defaultPosition,
  onPositionChange,
  size,
  defaultSize,
  onSizeChange,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  style,
  children,
  ...rest
}: FloatingPanelProps) {
  const machine = useFloatingPanel({
    position,
    defaultPosition,
    onPositionChange,
    size,
    defaultSize,
    onSizeChange,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
  })

  const ctxValue = React.useMemo(
    () => ({ beginDrag: machine.beginDrag, beginResize: machine.beginResize }),
    [machine.beginDrag, machine.beginResize],
  )

  return (
    <Ctx.Provider value={ctxValue}>
      <div
        className={cn("dr-floating-panel", className)}
        style={{
          ...style,
          left: machine.position.x,
          top: machine.position.y,
          width: machine.size.width,
          height: machine.size.height,
        }}
        {...rest}
      >
        {children}
      </div>
    </Ctx.Provider>
  )
}

function FloatingPanelHeader({
  className,
  onPointerDown,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = useCtx("FloatingPanelHeader")
  return (
    <div
      className={cn("dr-floating-panel-header", className)}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.defaultPrevented) return
        ctx.beginDrag(event.nativeEvent)
      }}
      {...rest}
    />
  )
}

function FloatingPanelContent({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("dr-floating-panel-content", className)} {...rest} />
  )
}

function FloatingPanelResizeHandle({
  className,
  onPointerDown,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = useCtx("FloatingPanelResizeHandle")
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn("dr-floating-panel-resize", className)}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.defaultPrevented) return
        ctx.beginResize(event.nativeEvent)
      }}
      {...rest}
    />
  )
}

export {
  FloatingPanel,
  FloatingPanelHeader,
  FloatingPanelContent,
  FloatingPanelResizeHandle,
}
