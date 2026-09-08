import { useUiText } from "../../i18n/useUiText"
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@lib/utils"
import type { ButtonProps } from "@components/button"
import "./pagination.css"

export type PaginationVariant = "filled" | "outlined"

const PaginationContext = React.createContext<{ variant: PaginationVariant }>({
  variant: "filled",
})

function Pagination({
  className,
  variant = "filled",
  ...props
}: React.ComponentProps<"nav"> & { variant?: PaginationVariant }) {
  const uiText = useUiText()

  return (
    <PaginationContext.Provider value={{ variant }}>
      <nav
        role="navigation"
        aria-label={uiText("pagination")}
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
  const uiText = useUiText()

  return (
    <PaginationLink
      aria-label={uiText("Go to previous page")}
      size="default"
      className={cn("dr-pagination-previous", className)}
      {...props}
    >
      <ChevronLeft className="size-[var(--icon-size)]" aria-hidden="true" />
      <span>{uiText("Previous")}</span>
    </PaginationLink>
  )
}
PaginationPrevious.displayName = "PaginationPrevious"

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  const uiText = useUiText()

  return (
    <PaginationLink
      aria-label={uiText("Go to next page")}
      size="default"
      className={cn("dr-pagination-next", className)}
      {...props}
    >
      <span>{uiText("Next")}</span>
      <ChevronRight className="size-[var(--icon-size)]" aria-hidden="true" />
    </PaginationLink>
  )
}
PaginationNext.displayName = "PaginationNext"

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const uiText = useUiText()

  return (
    <span
      aria-hidden
      className={cn("dr-pagination-ellipsis", className)}
      {...props}
    >
      <MoreHorizontal className="size-[var(--icon-size)]" aria-hidden="true" />
      <span className="sr-only">{uiText("More pages")}</span>
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
