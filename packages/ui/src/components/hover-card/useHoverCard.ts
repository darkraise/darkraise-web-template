import * as React from "react"
import { useControllableState, useEvent, useId } from "@primitives/state"

export interface UseHoverCardOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  openDelay?: number
  closeDelay?: number
}

export interface UseHoverCardReturn {
  open: boolean
  setOpen: (next: boolean) => void
  state: "open" | "closed"
  triggerId: string
  contentId: string
  scheduleOpen: () => void
  scheduleClose: () => void
  cancelSchedule: () => void
}

export function useHoverCard(
  options: UseHoverCardOptions = {},
): UseHoverCardReturn {
  const {
    open: openProp,
    defaultOpen,
    onOpenChange,
    openDelay = 700,
    closeDelay = 300,
  } = options

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const triggerId = useId()
  const contentId = useId()
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelSchedule = useEvent(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  })

  const scheduleOpen = useEvent(() => {
    cancelSchedule()
    if (openDelay <= 0) {
      setOpen(true)
      return
    }
    timerRef.current = setTimeout(() => {
      setOpen(true)
      timerRef.current = null
    }, openDelay)
  })

  const scheduleClose = useEvent(() => {
    cancelSchedule()
    if (closeDelay <= 0) {
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(() => {
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
