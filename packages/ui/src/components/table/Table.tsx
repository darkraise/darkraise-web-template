import * as React from "react"

import { cn } from "@lib/utils"
import "./table.css"
import { useScrollEdges } from "./useScrollEdges"

/** Inline alignment of a column's header and cells; "end" suits numbers. */
type TableCellAlign = "start" | "center" | "end"

function Table({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableElement> & {
  ref?: React.Ref<HTMLTableElement>
}) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  useScrollEdges(wrapperRef)
  return (
    <div ref={wrapperRef} className="dr-table-wrapper dr-scroll-edges">
      <table ref={ref} className={cn("dr-table", className)} {...props} />
    </div>
  )
}

function TableHeader({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  ref?: React.Ref<HTMLTableSectionElement>
}) {
  return (
    <thead ref={ref} className={cn("dr-table-header", className)} {...props} />
  )
}

function TableBody({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  ref?: React.Ref<HTMLTableSectionElement>
}) {
  return (
    <tbody ref={ref} className={cn("dr-table-body", className)} {...props} />
  )
}

function TableFooter({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  ref?: React.Ref<HTMLTableSectionElement>
}) {
  return (
    <tfoot ref={ref} className={cn("dr-table-footer", className)} {...props} />
  )
}

function TableRow({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & {
  ref?: React.Ref<HTMLTableRowElement>
}) {
  return <tr ref={ref} className={cn("dr-table-row", className)} {...props} />
}

function TableHead({
  className,
  ref,
  align,
  ...props
}: Omit<React.ThHTMLAttributes<HTMLTableCellElement>, "align"> & {
  ref?: React.Ref<HTMLTableCellElement>
  align?: TableCellAlign
}) {
  return (
    <th
      ref={ref}
      // Column is the right default for a header row; a caller putting a
      // header in the first column of a row can pass scope="row" instead.
      scope="col"
      data-align={align}
      className={cn("dr-table-head", className)}
      {...props}
    />
  )
}

function TableCell({
  className,
  ref,
  align,
  ...props
}: Omit<React.TdHTMLAttributes<HTMLTableCellElement>, "align"> & {
  ref?: React.Ref<HTMLTableCellElement>
  align?: TableCellAlign
}) {
  return (
    <td
      ref={ref}
      data-align={align}
      className={cn("dr-table-cell", className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement> & {
  ref?: React.Ref<HTMLTableCaptionElement>
}) {
  return (
    <caption
      ref={ref}
      className={cn("dr-table-caption", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

export type { TableCellAlign }
