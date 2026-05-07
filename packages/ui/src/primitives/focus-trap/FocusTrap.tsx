import * as React from "react"
import { useFocusTrap, type UseFocusTrapOptions } from "./useFocusTrap"

export interface FocusTrapProps
  extends
    UseFocusTrapOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, "ref"> {
  children: React.ReactNode
}

export function FocusTrap({
  children,
  loop,
  disabled,
  initialFocus,
  restoreFocus,
  ...rest
}: FocusTrapProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  useFocusTrap(ref, { loop, disabled, initialFocus, restoreFocus })
  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  )
}
