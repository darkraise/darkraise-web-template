import * as React from "react"
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
  /**
   * Whether a <DialogDescription> is mounted. The content element can only
   * point `aria-describedby` at the description once one exists — otherwise
   * every dialog without a description carries a dangling IDREF.
   */
  hasDescription: boolean
  registerDescription: (present: boolean) => void
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
  const [descriptionCount, setDescriptionCount] = React.useState(0)
  const registerDescription = React.useCallback((present: boolean) => {
    setDescriptionCount((count) => count + (present ? 1 : -1))
  }, [])

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
    hasDescription: descriptionCount > 0,
    registerDescription,
  }
}
