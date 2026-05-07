import * as React from "react"

import { cn } from "@lib/utils"
import { useProgress } from "./useProgress"
import "./progress.css"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | null
  max?: number
  getValueLabel?: (value: number, max: number) => string
  ref?: React.Ref<HTMLDivElement>
}

function Progress({
  className,
  value: valueProp = null,
  max: maxProp,
  getValueLabel,
  ref,
  ...props
}: ProgressProps) {
  const { rootProps, indicatorProps } = useProgress({
    value: valueProp,
    max: maxProp,
    getValueLabel,
  })

  return (
    <div
      ref={ref}
      className={cn("dr-progress", className)}
      {...rootProps}
      {...props}
    >
      <div className="dr-progress-indicator" {...indicatorProps} />
    </div>
  )
}

export { Progress }
