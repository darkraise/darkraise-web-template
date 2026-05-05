import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"
import "./overlay-primitives.css"

export function OverlayCloseButton({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Close className={cn("dr-overlay-close-btn", className)}>
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  )
}
