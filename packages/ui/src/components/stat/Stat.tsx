import * as React from "react"
import { cn } from "@lib/utils"
import "./stat.css"

export type StatProps = React.HTMLAttributes<HTMLDivElement>
function Stat({ className, ...rest }: StatProps) {
  return <div className={cn("dr-stat", className)} {...rest} />
}

function StatLabel({
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("dr-stat-label", className)} {...rest} />
}

function StatValue({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dr-stat-value", className)} {...rest} />
}

export type StatChangeDirection = "up" | "down" | "flat"

export interface StatChangeProps extends React.HTMLAttributes<HTMLSpanElement> {
  direction?: StatChangeDirection
}
function StatChange({
  className,
  direction = "flat",
  ...rest
}: StatChangeProps) {
  return (
    <span
      data-direction={direction}
      className={cn("dr-stat-change", className)}
      {...rest}
    />
  )
}

export { Stat, StatLabel, StatValue, StatChange }
