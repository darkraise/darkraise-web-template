import * as React from "react"
import { cn } from "@lib/utils"
import { getTabbables } from "@primitives/focus-trap"
import "./marquee.css"

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Time in milliseconds for one full scroll loop. Larger values scroll slower. Default 18000. */
  duration?: number
  /** Pause animation on hover. */
  pauseOnHover?: boolean
  /** Reverse direction. */
  reverse?: boolean
}

interface MarqueeLayout {
  copies: number
  step: number
}

function Marquee({
  className,
  duration = 18000,
  pauseOnHover = false,
  reverse = false,
  children,
  style,
  ...rest
}: MarqueeProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const groupRef = React.useRef<HTMLDivElement>(null)
  const [layout, setLayout] = React.useState<MarqueeLayout | null>(null)

  React.useEffect(() => {
    const root = rootRef.current
    const track = trackRef.current
    const group = groupRef.current
    if (!root || !track || !group) return
    // The track moves by one step per loop, so the copies must still cover
    // the container when it has moved a whole step: one copy beyond
    // ceil(container / step).
    // Computed width is layout size. A bounding rect reports the size after
    // transforms, so inside an overlay that scales while it opens it would
    // write a scaled step that nothing corrects afterwards.
    const layoutWidth = (element: Element) =>
      parseFloat(window.getComputedStyle(element).width) || 0
    const measure = () => {
      const container = layoutWidth(root)
      const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0
      const step = layoutWidth(group) + gap
      if (container <= 0 || step <= gap) return
      const copies = Math.max(2, Math.ceil(container / step) + 1)
      setLayout((current) =>
        current?.copies === copies && current.step === step
          ? current
          : { copies, step },
      )
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    observer.observe(group)
    return () => observer.disconnect()
  }, [])

  // aria-hidden leaves a copy's links and buttons in the tab order, and inert
  // would also block clicks on them. The copies render `children`, so each
  // render can bring new focusable content: this runs after every render.
  React.useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    for (const copy of Array.from(track.children).slice(1)) {
      for (const element of getTabbables(copy as HTMLElement)) {
        element.setAttribute("tabindex", "-1")
      }
    }
  })

  const copies = layout?.copies ?? 2

  return (
    <div
      ref={rootRef}
      data-pause-on-hover={pauseOnHover ? "true" : undefined}
      data-reverse={reverse ? "true" : undefined}
      style={
        {
          ...style,
          "--marquee-duration": `${duration}ms`,
          ...(layout ? { "--marquee-step": `${layout.step}px` } : {}),
        } as React.CSSProperties
      }
      className={cn("dr-marquee", className)}
      {...rest}
    >
      <div ref={trackRef} className="dr-marquee-track">
        {Array.from({ length: copies }, (_, index) => (
          <div
            key={index}
            ref={index === 0 ? groupRef : undefined}
            className="dr-marquee-group"
            aria-hidden={index === 0 ? undefined : "true"}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Marquee }
