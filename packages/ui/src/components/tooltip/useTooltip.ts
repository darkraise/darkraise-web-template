import * as React from "react"
import { useControllableState, useEvent, useId } from "@primitives/state"

/**
 * Hover-intent gate before a tooltip appears. Long enough that sweeping the
 * pointer across a toolbar does not pop every label on the way past.
 */
export const TOOLTIP_DEFAULT_DELAY = 400

/**
 * Grace period before a tooltip actually closes.
 *
 * Closing has to be deferred rather than immediate. The content's entry
 * animation starts it a couple of pixels below its resting place, which
 * briefly covers the trigger's top edge; the trigger then fires `pointerleave`
 * even though the pointer has not really left. A synchronous close unmounted
 * the content, dropped the pointer back on the trigger, and the skip-delay
 * window reopened it at once — an endless flicker.
 *
 * The grace period is also what makes hoverable content work at all: the
 * content's own `pointerenter` cancels the pending close as the pointer
 * crosses the gap. With an immediate close there was never anything to cancel.
 */
export const TOOLTIP_DEFAULT_CLOSE_DELAY = 150

export interface UseTooltipOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  skipDelayDuration?: number
  /** Grace period before the tooltip actually closes. */
  closeDelay?: number
  disableHoverableContent?: boolean
  /** Ref to the timestamp (ms) of the last tooltip close in this provider. */
  lastClosedAtRef?: React.RefObject<number>
  notifyClosed?: () => void
}

export interface UseTooltipReturn {
  open: boolean
  setOpen: (next: boolean) => void
  state: "open" | "closed"
  triggerId: string
  contentId: string
  scheduleOpen: () => void
  scheduleClose: () => void
  cancelSchedule: () => void
}

export function useTooltip(options: UseTooltipOptions = {}): UseTooltipReturn {
  const {
    open: openProp,
    defaultOpen,
    onOpenChange,
    delayDuration = TOOLTIP_DEFAULT_DELAY,
    skipDelayDuration = 300,
    closeDelay = TOOLTIP_DEFAULT_CLOSE_DELAY,
    lastClosedAtRef,
    notifyClosed,
  } = options

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const triggerId = useId()
  const contentId = useId()
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const stableNotify = useEvent(() => notifyClosed?.())

  const cancelSchedule = useEvent(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  })

  const scheduleOpen = useEvent(() => {
    cancelSchedule()
    const lastClosed = lastClosedAtRef?.current ?? 0
    const elapsed = Date.now() - lastClosed
    const skip = elapsed < skipDelayDuration
    const delay = skip ? 0 : delayDuration
    if (delay <= 0) {
      setOpen(true)
      return
    }
    timerRef.current = setTimeout(() => {
      setOpen(true)
      timerRef.current = null
    }, delay)
  })

  const scheduleClose = useEvent(() => {
    cancelSchedule()
    if (!open) {
      setOpen(false)
      return
    }
    if (closeDelay <= 0) {
      stableNotify()
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(() => {
      stableNotify()
      setOpen(false)
      timerRef.current = null
    }, closeDelay)
  })

  React.useEffect(() => () => cancelSchedule(), [cancelSchedule])

  return {
    open,
    setOpen,
    state: open ? "open" : "closed",
    triggerId,
    contentId,
    scheduleOpen,
    scheduleClose,
    cancelSchedule,
  }
}
