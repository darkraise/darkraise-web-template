import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "../lib/utils"

export const overlayBackdropClass =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80"

export const overlayHeaderClass =
  "flex flex-col space-y-1.5 text-center sm:text-left"

export const overlayFooterClass =
  "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"

export const overlayDescriptionClass = "text-muted-foreground text-sm"

export function OverlayCloseButton({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Close
      className={cn(
        "ring-offset-background focus:ring-ring text-muted-foreground hover:bg-accent hover:text-foreground absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-md transition-colors focus:ring-1 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none",
        className,
      )}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  )
}
