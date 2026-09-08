import { useUiText } from "../../i18n/useUiText"
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
  const uiText = useUiText()

  if (onClick) {
    return (
      <button
        type="button"
        aria-label={uiText("Close")}
        className={cn("dr-overlay-close-btn", className)}
        onClick={onClick}
      >
        <X className="size-[var(--icon-size)]" aria-hidden="true" />
        <span className="sr-only">{uiText("Close")}</span>
      </button>
    )
  }
  return (
    <DialogClose className={cn("dr-overlay-close-btn", className)}>
      <X className="size-[var(--icon-size)]" aria-hidden="true" />
      <span className="sr-only">{uiText("Close")}</span>
    </DialogClose>
  )
}
