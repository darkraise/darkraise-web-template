import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

import { cn } from "../../lib/utils"
import "./aspect-ratio.css"

function AspectRatio({
  className,
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return (
    <AspectRatioPrimitive.Root
      className={cn("dr-aspect-ratio", className)}
      {...props}
    />
  )
}

export { AspectRatio }
