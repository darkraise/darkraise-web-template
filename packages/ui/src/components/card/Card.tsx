import * as React from "react"

import { cn } from "@lib/utils"
import "./card.css"

import { resolveCardElevation, type CardElevation } from "./card-elevation"

export type { CardElevation }
export type CardBorder = "default" | "none" | "strong" | "accent"
export type CardIntensity = "default" | "none" | "soft" | "strong"

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
  /** Draw full-width rules between the header, content, and footer. */
  divided?: boolean
  /** Outer border treatment. `"default"` leaves the theme/preset border alone. */
  border?: CardBorder
  /**
   * How strongly the card's surface separates from the page behind it.
   *
   * - `"none"`: no fill, so the card takes the page background.
   * - `"default"`: the theme/preset card fill, untouched.
   * - `"soft"` / `"strong"`: a neutral wash over that fill. The wash reads
   *   `--foreground`, so it darkens a light card and lightens a dark one —
   *   both steps read as more separation in either mode.
   */
  intensity?: CardIntensity
  ref?: React.Ref<HTMLDivElement>
}

function Card({
  className,
  elevation = false,
  divided,
  border,
  intensity,
  ref,
  ...props
}: CardProps) {
  const value = resolveCardElevation(elevation)
  return (
    <div
      ref={ref}
      data-elevation={value}
      data-divided={divided ? "true" : undefined}
      data-border={border && border !== "default" ? border : undefined}
      data-intensity={
        intensity && intensity !== "default" ? intensity : undefined
      }
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
