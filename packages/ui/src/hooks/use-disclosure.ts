import { useCallback, useState } from "react"

export type UseDisclosureReturn = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setOpen: (v: boolean) => void
}

export function useDisclosure(initial = false): UseDisclosureReturn {
  const [isOpen, setOpen] = useState<boolean>(initial)
  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((v) => !v), [])
  return { isOpen, open, close, toggle, setOpen }
}
