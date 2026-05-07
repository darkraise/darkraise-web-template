import { useControllableState, useEvent, useId } from "@primitives/state"

export type DialogRole = "dialog" | "alertdialog"

export interface UseDialogOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  role?: DialogRole
}

export interface UseDialogReturn {
  open: boolean
  setOpen: (next: boolean) => void
  toggle: () => void
  state: "open" | "closed"
  modal: boolean
  role: DialogRole
  triggerId: string
  contentId: string
  titleId: string
  descriptionId: string
}

export function useDialog(options: UseDialogOptions = {}): UseDialogReturn {
  const {
    open: openProp,
    defaultOpen,
    onOpenChange,
    modal = true,
    role = "dialog",
  } = options

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const triggerId = useId()
  const contentId = useId()
  const titleId = useId()
  const descriptionId = useId()

  const toggle = useEvent(() => setOpen(!open))

  return {
    open,
    setOpen,
    toggle,
    state: open ? "open" : "closed",
    modal,
    role,
    triggerId,
    contentId,
    titleId,
    descriptionId,
  }
}
