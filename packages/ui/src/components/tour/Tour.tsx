import { useUiText } from "../../i18n/useUiText"
import * as React from "react"
import { Button } from "@components/button"
import { useFloating } from "@primitives/floating"
import { Portal } from "@primitives/portal"
import { useFocusTrap } from "@primitives/focus-trap"
import { useComposedRefs } from "@primitives/slot"
import { useId } from "@primitives/state"
import { useReducedMotion } from "@hooks/useReducedMotion"
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
  const uiText = useUiText()

  const [rect, setRect] = React.useState<Rect | null>(null)
  const [targetEl, setTargetEl] = React.useState<HTMLElement | null>(null)
  // The popover sits 12px outside the spotlight ring, aligned with the
  // ring's start edge.
  const floating = useFloating({
    placement: "bottom-start",
    sideOffset: 12 + spotlightPadding,
    alignOffset: -spotlightPadding,
    collisionPadding: 16,
    strategy: "fixed",
  })
  const setReference = floating.refs.setReference
  React.useLayoutEffect(() => {
    setReference(targetEl)
  }, [targetEl, setReference])
  const popoverRef = React.useRef<HTMLDivElement | null>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()
  const step = steps[current]

  // Tour popover is modal in intent — the backdrop blocks pointer events
  // on the page beneath, but without a focus trap a keyboard user can Tab
  // straight out of the popover into the (visually-blocked) page chrome.
  useFocusTrap(popoverRef, {
    disabled: !open,
    loop: true,
    restoreFocus: true,
  })

  const reducedMotion = useReducedMotion()

  React.useEffect(() => {
    if (!open || !step) return
    const target = document.querySelector<HTMLElement>(step.targetSelector)
    if (!target) {
      setRect(null)
      setTargetEl(null)
      return
    }
    setTargetEl(target)
    target.scrollIntoView?.({
      block: "center",
      behavior: reducedMotion ? "auto" : "smooth",
    })
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
  }, [open, step, spotlightPadding, reducedMotion])

  // The popover mounts at the viewport origin before Floating UI measures the
  // target, so it stays hidden until positioned. A step whose target is
  // missing is centred in the viewport and has nothing to wait for.
  const shown = !targetEl || floating.isPositioned

  // Restore focus to the previously-focused element on close.
  React.useEffect(() => {
    if (!open) return
    previousFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null
    return () => {
      previousFocusRef.current?.focus?.()
      previousFocusRef.current = null
    }
  }, [open])

  // Move focus to the popover once it is shown, so keyboard users can reach
  // the controls; a hidden element cannot take focus. The focus is deferred
  // because the in-house `Portal` defers its content mount by one effect
  // tick — the popover ref isn't populated synchronously.
  React.useEffect(() => {
    if (!open || !shown) return
    const id = window.setTimeout(() => {
      popoverRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(id)
  }, [open, shown])

  const composedRef = useComposedRefs(popoverRef, floating.refs.setFloating)

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

  const popoverStyle: React.CSSProperties = targetEl
    ? {
        position: floating.strategy,
        top: Math.round(floating.y ?? 0),
        left: Math.round(floating.x ?? 0),
        ...(!shown && { visibility: "hidden" }),
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
        ref={composedRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={step.description ? descriptionId : undefined}
        tabIndex={-1}
        className="dr-tour-popover"
        style={popoverStyle}
      >
        <h3 id={titleId} className="dr-tour-title">
          {step.title}
        </h3>
        {step.description ? (
          <p id={descriptionId} className="dr-tour-description">
            {step.description}
          </p>
        ) : null}
        <div className="dr-tour-footer">
          <span className="dr-tour-progress">
            {current + 1} / {steps.length}
          </span>
          <div className="dr-tour-actions">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {uiText("Skip")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(current - 1)}
              disabled={current === 0}
            >
              {uiText("Previous")}
            </Button>
            {current === steps.length - 1 ? (
              <Button size="sm" onClick={onClose}>
                {uiText("Done")}
              </Button>
            ) : (
              <Button size="sm" onClick={() => onChange(current + 1)}>
                {uiText("Next")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}

export { Tour }
