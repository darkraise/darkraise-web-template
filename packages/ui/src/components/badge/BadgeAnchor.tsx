import * as React from "react"

import { cn } from "@lib/utils"
import { Badge, type BadgeSize, type BadgeVariant } from "./Badge"
import "./badge.css"

export type BadgeAnchorPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

export interface BadgeAnchorProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "content"
> {
  /** Content rendered inside the indicator (text / number / icon). Ignored when `dot` is true. */
  content?: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  /** Corner where the indicator anchors to the wrapped element. */
  position?: BadgeAnchorPosition
  /** Pixel offset applied on top of the corner anchor. Useful for visually fine-tuning over irregular icons. */
  offset?: { x?: number; y?: number }
  /** Auto-hide the indicator without unmounting (so the surrounding layout stays stable). */
  hidden?: boolean
  /** Render a small dot instead of a content badge. Position semantics unchanged. */
  dot?: boolean
  /** Additional className for the inner indicator (rare; prefer `className` for the wrapper). */
  indicatorClassName?: string
  /** ARIA label for screen readers describing the indicator (e.g. "4 unread notifications"). */
  "aria-label"?: string
  children?: React.ReactNode
}

function BadgeAnchor({
  className,
  indicatorClassName,
  content,
  variant = "default",
  size = "md",
  position = "top-right",
  offset,
  hidden = false,
  dot = false,
  children,
  "aria-label": ariaLabel,
  ...rest
}: BadgeAnchorProps) {
  const offsetStyle = React.useMemo<React.CSSProperties | undefined>(() => {
    if (!offset) return undefined
    return {
      "--badge-anchor-offset-x": `${offset.x ?? 0}px`,
      "--badge-anchor-offset-y": `${offset.y ?? 0}px`,
    } as React.CSSProperties
  }, [offset])

  return (
    <span className={cn("dr-badge-anchor", className)} {...rest}>
      {children}
      {dot ? (
        <span
          className={cn("dr-badge-anchor-dot", indicatorClassName)}
          data-position={position}
          data-variant={variant}
          data-hidden={hidden ? "true" : undefined}
          style={offsetStyle}
          role={ariaLabel ? "status" : undefined}
          aria-label={ariaLabel}
          aria-hidden={ariaLabel ? undefined : true}
        />
      ) : (
        <Badge
          variant={variant}
          size={size}
          className={cn(
            "dr-badge-anchor-indicator",
            hidden && "dr-badge-anchor-indicator--hidden",
            indicatorClassName,
          )}
          data-position={position}
          style={offsetStyle}
          role={ariaLabel ? "status" : undefined}
          aria-label={ariaLabel}
          aria-hidden={ariaLabel ? undefined : true}
        >
          {content}
        </Badge>
      )}
    </span>
  )
}

export { BadgeAnchor }
