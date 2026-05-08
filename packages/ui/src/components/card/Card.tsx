import * as React from "react"

import { cn } from "@lib/utils"
import "./card.css"

export type CardElevation = "flat" | "low" | "medium" | "high"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Apply a drop shadow.
   *
   * - omitted or `false`: no shadow.
   * - `true`: follow the active `data-elevation` theme axis — flat / low /
   *   medium / high all map to the same-named shadow on the card.
   * - `"flat" | "low" | "medium" | "high"`: explicit shadow level that is
   *   immune to the theme axis. The card renders the same shadow whether
   *   the theme is set to flat, low, medium, or high.
   */
  elevation?: boolean | CardElevation
  ref?: React.Ref<HTMLDivElement>
}

function Card({ className, elevation = false, ref, ...props }: CardProps) {
  const value: CardElevation | "auto" | undefined =
    elevation === true ? "auto" : elevation || undefined
  return (
    <div
      ref={ref}
      data-elevation={value}
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
