import * as React from "react"
import { createPortal } from "react-dom"

export interface PortalProps {
  children: React.ReactNode
  container?: Element | null
}

export function Portal({
  children,
  container,
}: PortalProps): React.ReactElement | null {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null
  const target =
    container ?? (typeof document !== "undefined" ? document.body : null)
  if (!target) return null
  return createPortal(children, target)
}
