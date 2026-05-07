import { X } from "lucide-react"

import { cn } from "@lib/utils"
import { DialogClose } from "@components/dialog"
import "./overlay-primitives.css"

interface OverlayCloseButtonProps {
  className?: string
  /** When provided, renders a plain button with this handler instead of DialogClose. */
  onClick?: () => void
}

export function OverlayCloseButton({
  className,
  onClick,
}: OverlayCloseButtonProps) {
  if (onClick) {
    return (
      <button
        type="button"
        aria-label="Close"
        className={cn("dr-overlay-close-btn", className)}
        onClick={onClick}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    )
  }
  return (
    <DialogClose className={cn("dr-overlay-close-btn", className)}>
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogClose>
  )
}
