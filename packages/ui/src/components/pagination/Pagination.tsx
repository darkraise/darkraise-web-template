import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"
import type { ButtonProps } from "../button"
import "./pagination.css"

type PaginationVariant = "filled" | "outlined"

const PaginationContext = React.createContext<{ variant: PaginationVariant }>({
  variant: "filled",
})

function Pagination({
  className,
  variant = "filled",
  ...props
}: React.ComponentProps<"nav"> & { variant?: PaginationVariant }) {
  return (
    <PaginationContext.Provider value={{ variant }}>
      <nav
        role="navigation"
        aria-label="pagination"
        className={cn("dr-pagination", className)}
        {...props}
      />
    </PaginationContext.Provider>
  )
}
Pagination.displayName = "Pagination"

function PaginationContent({
  className,
  ref,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      ref={ref}
      className={cn("dr-pagination-content", className)}
      {...props}
    />
  )
}
PaginationContent.displayName = "PaginationContent"

function PaginationItem({
  className,
  ref,
  ...props
}: React.ComponentProps<"li">) {
  return <li ref={ref} className={cn("", className)} {...props} />
}
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  const { variant } = React.useContext(PaginationContext)
  const isOutlinedActive = isActive && variant === "outlined"

  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={cn("dr-btn", "dr-pagination-link", className)}
      data-variant={isActive && variant === "filled" ? "default" : "ghost"}
      data-size={size}
      data-active={isOutlinedActive ? "true" : undefined}
      {...props}
    />
  )
}
PaginationLink.displayName = "PaginationLink"

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("dr-pagination-previous", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </PaginationLink>
  )
}
PaginationPrevious.displayName = "PaginationPrevious"

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("dr-pagination-next", className)}
      {...props}
    >
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  )
}
PaginationNext.displayName = "PaginationNext"

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("dr-pagination-ellipsis", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
