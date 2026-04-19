import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../lib/utils"
import { type ButtonProps, buttonVariants } from "./button"

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
        className={cn("mx-auto flex w-full justify-center", className)}
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
      className={cn("flex flex-row items-center gap-1", className)}
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

  const resolvedClasses = isActive
    ? variant === "filled"
      ? buttonVariants({ variant: "default", size })
      : cn(
          buttonVariants({ variant: "ghost", size }),
          "border border-primary bg-transparent text-primary hover:bg-primary/10 hover:text-primary",
        )
    : buttonVariants({ variant: "ghost", size })

  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={cn(resolvedClasses, className)}
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
      className={cn("gap-1 pl-2.5", className)}
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
      className={cn("gap-1 pr-2.5", className)}
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
      className={cn("flex h-9 w-9 items-center justify-center", className)}
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
