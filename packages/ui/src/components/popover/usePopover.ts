import {
  placementOf,
  type LogicalSide,
  type PhysicalSide,
  type PopupAlign,
} from "@primitives/floating"
import { useControllableState, useEvent, useId } from "@primitives/state"

export type PopoverSide = LogicalSide
export type PopoverAlign = PopupAlign

export interface UsePopoverOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

export interface UsePopoverReturn {
  open: boolean
  setOpen: (next: boolean) => void
  toggle: () => void
  state: "open" | "closed"
  modal: boolean
  triggerId: string
  contentId: string
}

export function usePopover(options: UsePopoverOptions = {}): UsePopoverReturn {
  const { open: openProp, defaultOpen, onOpenChange, modal = false } = options

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const triggerId = useId()
  const contentId = useId()

  const toggle = useEvent(() => setOpen(!open))

  return {
    open,
    setOpen,
    toggle,
    state: open ? "open" : "closed",
    modal,
    triggerId,
    contentId,
  }
}

/** The floating-ui placement for a physical side; resolve `start`/`end`
 *  with `resolveSide` first. */
export function placementFromSideAlign(
  side: PhysicalSide,
  align: PopoverAlign,
): import("@floating-ui/react").Placement {
  return placementOf(side, align)
}
