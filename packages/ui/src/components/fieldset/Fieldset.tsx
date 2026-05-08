import * as React from "react"
import { cn } from "@lib/utils"
import "./fieldset.css"

export type FieldsetProps = React.FieldsetHTMLAttributes<HTMLFieldSetElement>

function Fieldset({ className, ...rest }: FieldsetProps) {
  return <fieldset className={cn("dr-fieldset", className)} {...rest} />
}

function FieldsetLegend({
  className,
  ...rest
}: React.HTMLAttributes<HTMLLegendElement>) {
  return <legend className={cn("dr-fieldset-legend", className)} {...rest} />
}

export { Fieldset, FieldsetLegend }
