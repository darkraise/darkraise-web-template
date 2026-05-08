import * as React from "react"

import { cn } from "@lib/utils"
import "./card.css"

export type CardElevation = "low" | "medium" | "high"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Apply a drop shadow that respects the active `data-elevation` theme axis.
   * `true` is shorthand for `"medium"`. Pass `"low"`, `"medium"`, or `"high"`
   * for explicit intent. The actual shadow strength comes from
   * `--elevation-{low|medium|high}`, so when the user picks a flatter
   * elevation theme the card flattens with the rest of the surface.
   */
  elevated?: boolean | CardElevation
  ref?: React.Ref<HTMLDivElement>
}

function Card({ className, elevated = false, ref, ...props }: CardProps) {
  const level: CardElevation | undefined =
    elevated === true ? "medium" : elevated || undefined
  return (
    <div
      ref={ref}
      data-elevated={level}
      className={cn("dr-card", className)}
      {...props}
    />
  )
}

function CardHeader({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={cn("dr-card-header", className)} {...props} />
  )
}

function CardTitle({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn("dr-card-title", className)} {...props} />
}

function CardDescription({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn("dr-card-description", className)}
      {...props}
    />
  )
}

function CardContent({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={cn("dr-card-content", className)} {...props} />
  )
}

function CardFooter({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={cn("dr-card-footer", className)} {...props} />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
