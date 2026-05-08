import * as React from "react"
import { Button } from "@components/button"
import { Portal } from "@primitives/portal"
import { useId } from "@primitives/state"
import { cn } from "@lib/utils"
import "./tour.css"

export interface TourStep {
  targetSelector: string
  title: React.ReactNode
  description?: React.ReactNode
}

export interface TourProps {
  open: boolean
  steps: TourStep[]
  current: number
  onChange: (next: number) => void
  onClose: () => void
  /** Padding around the target rect for the spotlight hole, in px. Default 8. */
  spotlightPadding?: number
  className?: string
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function Tour({
  open,
  steps,
  current,
  onChange,
  onClose,
  spotlightPadding = 8,
  className,
}: TourProps) {
  const [rect, setRect] = React.useState<Rect | null>(null)
  const titleId = useId()
  const step = steps[current]

  React.useEffect(() => {
    if (!open || !step) return
    const target = document.querySelector<HTMLElement>(step.targetSelector)
    if (!target) {
      setRect(null)
      return
    }
    target.scrollIntoView?.({ block: "center", behavior: "smooth" })
    const update = () => {
      const r = target.getBoundingClientRect()
      setRect({
        top: r.top - spotlightPadding,
        left: r.left - spotlightPadding,
        width: r.width + spotlightPadding * 2,
        height: r.height + spotlightPadding * 2,
      })
    }
    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [open, step, spotlightPadding])

  if (!open || !step) return null

  const clipPath = rect
    ? `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        ${rect.left}px ${rect.top}px,
        ${rect.left}px ${rect.top + rect.height}px,
        ${rect.left + rect.width}px ${rect.top + rect.height}px,
        ${rect.left + rect.width}px ${rect.top}px,
        ${rect.left}px ${rect.top}px
      )`
    : "none"

  const popoverStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: rect.top + rect.height + 12,
        left: rect.left,
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }

  return (
    <Portal>
      <div
        className={cn("dr-tour-backdrop", className)}
        style={{ clipPath, WebkitClipPath: clipPath } as React.CSSProperties}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        className="dr-tour-popover"
        style={popoverStyle}
      >
        <h3 id={titleId} className="dr-tour-title">
          {step.title}
        </h3>
        {step.description ? (
          <p className="dr-tour-description">{step.description}</p>
        ) : null}
        <div className="dr-tour-footer">
          <span className="dr-tour-progress">
            {current + 1} / {steps.length}
          </span>
          <div className="dr-tour-actions">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Skip
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(current - 1)}
              disabled={current === 0}
            >
              Previous
            </Button>
            {current === steps.length - 1 ? (
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            ) : (
              <Button size="sm" onClick={() => onChange(current + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}

export { Tour }
