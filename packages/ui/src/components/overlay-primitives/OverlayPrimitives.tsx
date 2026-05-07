import { X } from "lucide-react"

import { cn } from "@lib/utils"
import { DialogClose } from "@components/dialog"
import "./overlay-primitives.css"

export function OverlayCloseButton({ className }: { className?: string }) {
  return (
    <DialogClose className={cn("dr-overlay-close-btn", className)}>
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogClose>
  )
}
