"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import { composeRefs } from "@primitives/slot"
import "./scroll-area.css"

type Orientation = "vertical" | "horizontal"

interface ScrollAreaContextValue {
  viewportRef: React.RefObject<HTMLDivElement | null>
  rootRef: React.RefObject<HTMLDivElement | null>
  /** Bumps when viewport metrics change so scrollbars re-render. */
  metricsNonce: number
  bumpMetrics: () => void
  setViewport: (node: HTMLDivElement | null) => void
}

const ScrollAreaContext = React.createContext<ScrollAreaContextValue | null>(
  null,
)

function useScrollAreaContext(consumer: string): ScrollAreaContextValue {
  const ctx = React.useContext(ScrollAreaContext)
  if (!ctx) throw new Error(`${consumer} must be used within <ScrollArea>`)
  return ctx
}

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "auto" | "always" | "scroll" | "hover"
  scrollHideDelay?: number
  dir?: "ltr" | "rtl"
  ref?: React.Ref<HTMLDivElement>
}

function ScrollArea({ className, children, ref, ...rest }: ScrollAreaProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const [metricsNonce, setMetricsNonce] = React.useState(0)
  const bumpMetrics = React.useCallback(() => {
    setMetricsNonce((n) => n + 1)
  }, [])
  const setViewport = React.useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node
  }, [])

  const ctx = React.useMemo<ScrollAreaContextValue>(
    () => ({ viewportRef, rootRef, metricsNonce, bumpMetrics, setViewport }),
    [metricsNonce, bumpMetrics, setViewport],
  )

  return (
    <ScrollAreaContext.Provider value={ctx}>
      <div
        ref={composeRefs(rootRef, ref)}
        className={cn("dr-scroll-area", className)}
        {...rest}
      >
        <ScrollAreaViewport>{children}</ScrollAreaViewport>
        <ScrollBar orientation="vertical" />
        <ScrollAreaCorner />
      </div>
    </ScrollAreaContext.Provider>
  )
}

interface ScrollAreaViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

const VIEWPORT_HIDE_NATIVE_SCROLLBAR_STYLE: React.CSSProperties = {
  scrollbarWidth: "none",
  // -ms-overflow-style is needed for legacy Edge; not part of typings.
  msOverflowStyle: "none",
} as React.CSSProperties

function ScrollAreaViewport({
  className,
  children,
  ref,
  onScroll,
  style,
  ...rest
}: ScrollAreaViewportProps) {
  const ctx = useScrollAreaContext("ScrollAreaViewport")
  const localRef = React.useRef<HTMLDivElement | null>(null)
  const setViewport = ctx.setViewport
  const setNode = React.useCallback(
    (node: HTMLDivElement | null) => {
      localRef.current = node
      setViewport(node)
    },
    [setViewport],
  )

  const bumpMetrics = ctx.bumpMetrics
  React.useEffect(() => {
    const node = localRef.current
    if (!node) return
    if (typeof ResizeObserver === "undefined") {
      // SSR / jsdom: fall back to a one-shot bump on mount.
      bumpMetrics()
      return
    }
    const ro = new ResizeObserver(() => bumpMetrics())
    ro.observe(node)
    if (node.firstElementChild instanceof Element) {
      ro.observe(node.firstElementChild)
    }
    return () => ro.disconnect()
  }, [bumpMetrics])

  return (
    <div
      ref={composeRefs(setNode as React.RefCallback<HTMLDivElement>, ref)}
      data-darkraise-scroll-viewport=""
      className={cn("h-full w-full overflow-auto rounded-[inherit]", className)}
      style={{ ...VIEWPORT_HIDE_NATIVE_SCROLLBAR_STYLE, ...style }}
      onScroll={(event) => {
        onScroll?.(event)
        bumpMetrics()
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: Orientation
  ref?: React.Ref<HTMLDivElement>
}

function ScrollBar({
  className,
  orientation = "vertical",
  ref,
  ...rest
}: ScrollBarProps) {
  const ctx = useScrollAreaContext("ScrollAreaScrollbar")
  const trackRef = React.useRef<HTMLDivElement | null>(null)

  const metrics = React.useMemo(() => {
    const node = ctx.viewportRef.current
    if (!node) return null
    const isVert = orientation === "vertical"
    const client = isVert ? node.clientHeight : node.clientWidth
    const scroll = isVert ? node.scrollHeight : node.scrollWidth
    if (scroll <= client) return null
    const ratio = client / scroll
    const thumbSize = Math.max(20, Math.round(client * ratio))
    const trackSize = client
    const scrollOffset = isVert ? node.scrollTop : node.scrollLeft
    const maxScroll = scroll - client
    const thumbOffset =
      maxScroll > 0
        ? Math.round((scrollOffset / maxScroll) * (trackSize - thumbSize))
        : 0
    return { thumbSize, thumbOffset, trackSize, maxScroll, isVert }
    // metricsNonce is part of the dependency list so this recomputes on viewport
    // resize and scroll events emitted from the Viewport element.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.metricsNonce, orientation, ctx.viewportRef])

  const onThumbPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const node = ctx.viewportRef.current
    if (!node || !metrics) return
    event.preventDefault()
    const isVert = metrics.isVert
    const startCoord = isVert ? event.clientY : event.clientX
    const startScroll = isVert ? node.scrollTop : node.scrollLeft
    const trackSize = metrics.trackSize - metrics.thumbSize
    if (trackSize <= 0) return
    const ratio = metrics.maxScroll / trackSize
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
    const onMove = (e: PointerEvent) => {
      const delta = (isVert ? e.clientY : e.clientX) - startCoord
      const next = startScroll + delta * ratio
      if (isVert) node.scrollTop = next
      else node.scrollLeft = next
    }
    const onUp = (e: PointerEvent) => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      ;(e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  if (!metrics) return null

  return (
    <div
      ref={composeRefs(trackRef, ref)}
      data-orientation={orientation}
      className={cn("dr-scroll-bar", className)}
      {...rest}
    >
      <div
        className="dr-scroll-thumb"
        style={{
          [metrics.isVert ? "height" : "width"]: metrics.thumbSize,
          transform: metrics.isVert
            ? `translateY(${metrics.thumbOffset}px)`
            : `translateX(${metrics.thumbOffset}px)`,
        }}
        onPointerDown={onThumbPointerDown}
      />
    </div>
  )
}

const ScrollAreaScrollbar = ScrollBar

interface ScrollAreaThumbProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function ScrollAreaThumb({ className, ref, ...rest }: ScrollAreaThumbProps) {
  return (
    <div ref={ref} className={cn("dr-scroll-thumb", className)} {...rest} />
  )
}

interface ScrollAreaCornerProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function ScrollAreaCorner({ className, ref, ...rest }: ScrollAreaCornerProps) {
  return <div ref={ref} className={cn(className)} {...rest} />
}

export {
  ScrollArea,
  ScrollAreaViewport,
  ScrollBar,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
}
