import * as React from "react"

import { cn } from "../lib/utils"

function Card({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn("glass bg-card text-card-foreground border", className)}
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
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1 p-4", className)}
      {...props}
    />
  )
}

function CardTitle({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn(
        "text-2xl leading-none font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardContent({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
}

function CardFooter({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center p-4 pt-0", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
