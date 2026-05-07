import { useControllableState, useEvent } from "@primitives/state"

export interface UseCollapsibleOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

export interface UseCollapsibleReturn {
  open: boolean
  setOpen: (next: boolean) => void
  toggle: () => void
  state: "open" | "closed"
  disabled: boolean
}

export function useCollapsible(
  options: UseCollapsibleOptions,
): UseCollapsibleReturn {
  const {
    open: openProp,
    defaultOpen,
    onOpenChange,
    disabled = false,
  } = options

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const toggle = useEvent(() => {
    if (disabled) return
    setOpen(!open)
  })

  return {
    open,
    setOpen,
    toggle,
    state: open ? "open" : "closed",
    disabled,
  }
}
