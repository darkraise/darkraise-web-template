import { useControllableState, useEvent, useId } from "@primitives/state"

export type PopoverSide = "top" | "right" | "bottom" | "left"
export type PopoverAlign = "start" | "center" | "end"

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

export function placementFromSideAlign(
  side: PopoverSide,
  align: PopoverAlign,
): import("@floating-ui/react").Placement {
  const alignSuffix = align === "center" ? "" : `-${align}`
  return `${side}${alignSuffix}` as import("@floating-ui/react").Placement
}
