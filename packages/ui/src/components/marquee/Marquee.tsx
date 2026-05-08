import * as React from "react"
import { cn } from "@lib/utils"
import "./marquee.css"

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation duration in ms. Default 18 000. */
  speed?: number
  /** Pause animation on hover. */
  pauseOnHover?: boolean
  /** Reverse direction. */
  reverse?: boolean
}

function Marquee({
  className,
  speed = 18000,
  pauseOnHover = false,
  reverse = false,
  children,
  style,
  ...rest
}: MarqueeProps) {
  return (
    <div
      data-pause-on-hover={pauseOnHover ? "true" : undefined}
      data-reverse={reverse ? "true" : undefined}
      style={
        { ...style, "--marquee-duration": `${speed}ms` } as React.CSSProperties
      }
      className={cn("dr-marquee", className)}
      {...rest}
    >
      <div className="dr-marquee-track">
        <div className="dr-marquee-group">{children}</div>
        <div className="dr-marquee-group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}

export { Marquee }
