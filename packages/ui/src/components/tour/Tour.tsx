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
  // The selector last looked up, so a step is centred as targetless only once
  // its lookup has run, not on the render before it.
  const [lookedUp, setLookedUp] = React.useState<string | null>(null)
  // The popover sits 12px outside the spotlight ring, aligned with the
  // ring's start edge.
  const floating = useFloating({
    placement: "bottom-start",
    sideOffset: 12 + spotlightPadding,
    alignOffset: -spotlightPadding,
    collisionPadding: 16,
    strategy: "fixed",
    // A targetless step counts as closed, so the next target starts unmeasured
    // instead of reusing the coordinates of the last one.
    open: open && targetEl !== null,
  })
  const setReference = floating.refs.setReference
  React.useLayoutEffect(() => {
    setReference(targetEl)
  }, [targetEl, setReference])
  const popoverRef = React.useRef<HTMLDivElement | null>(null)
  const [popoverEl, setPopoverEl] = React.useState<HTMLDivElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()
  const step = steps[current]

  const reducedMotion = useReducedMotion()

  React.useEffect(() => {
    if (!open || !step) return
    const target = document.querySelector<HTMLElement>(step.targetSelector)
    setLookedUp(step.targetSelector)
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
  // missing is centred in the viewport and has nothing to wait for. Once
  // shown, the popover stays shown until the Tour closes: hiding it again
  // would drop focus and turn the focus trap off, so a step whose target is
  // not measured yet stays centred until it is.
  const positioned = targetEl !== null && floating.isPositioned
  const targetless = targetEl === null && lookedUp === step?.targetSelector
  const [shownOnce, setShownOnce] = React.useState(false)
  const shown = targetless || positioned || shownOnce
  if (open && shown && !shownOnce) setShownOnce(true)
  if (!open && shownOnce) setShownOnce(false)

  // Tour popover is modal in intent — the backdrop blocks pointer events
  // on the page beneath, but without a focus trap a keyboard user can Tab
  // straight out of the popover into the (visually-blocked) page chrome.
  // The trap waits for the popover element, which the in-house `Portal`
  // mounts one effect after `open` turns true, and for it to be shown,
  // since a hidden element cannot take focus.
  useFocusTrap(popoverRef, {
    disabled: !(open && shown && popoverEl),
    initialFocus: popoverRef,
    loop: true,
    restoreFocus: true,
  })

  const composedRef = useComposedRefs<HTMLDivElement>(
    popoverRef,
    setPopoverEl,
    floating.refs.setFloating,
  )

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

  const popoverStyle: React.CSSProperties = {
    ...(positioned || (targetEl && !shown)
      ? {
          position: floating.strategy,
          top: Math.round(floating.y ?? 0),
          left: Math.round(floating.x ?? 0),
        }
      : {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }),
    ...(!shown && { visibility: "hidden" }),
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
