import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@lib/utils"
import "./slider.css"

function Slider({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("dr-slider", className)}
      {...props}
    >
      <SliderPrimitive.Track className="dr-slider-track">
        <SliderPrimitive.Range className="dr-slider-range" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="dr-slider-thumb" />
    </SliderPrimitive.Root>
  )
}
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
