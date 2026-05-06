import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@lib/utils"
import "./breadcrumb.css"

function Breadcrumb({
  ref,
  ...props
}: React.ComponentProps<"nav"> & { separator?: React.ReactNode }) {
  return <nav ref={ref} aria-label="breadcrumb" {...props} />
}

function BreadcrumbList({
  className,
  ref,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol ref={ref} className={cn("dr-breadcrumb-list", className)} {...props} />
  )
}

function BreadcrumbItem({
  className,
  ref,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li ref={ref} className={cn("dr-breadcrumb-item", className)} {...props} />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  ref,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      ref={ref}
      className={cn("dr-breadcrumb-link", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({
  className,
  ref,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("dr-breadcrumb-page", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn("dr-breadcrumb-separator", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn("dr-breadcrumb-ellipsis", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
