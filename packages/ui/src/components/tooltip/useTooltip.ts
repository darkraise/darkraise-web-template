import * as React from "react"
import { useControllableState, useEvent, useId } from "@primitives/state"

export interface UseTooltipOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  skipDelayDuration?: number
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
    delayDuration = 700,
    skipDelayDuration = 300,
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
    if (open) stableNotify()
    setOpen(false)
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
