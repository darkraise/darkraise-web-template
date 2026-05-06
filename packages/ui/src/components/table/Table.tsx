import * as React from "react"

import { cn } from "@lib/utils"
import "./table.css"

function Table({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableElement> & {
  ref?: React.Ref<HTMLTableElement>
}) {
  return (
    <div className="dr-table-wrapper">
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
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  ref?: React.Ref<HTMLTableCellElement>
}) {
  return <th ref={ref} className={cn("dr-table-head", className)} {...props} />
}

function TableCell({
  className,
  ref,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  ref?: React.Ref<HTMLTableCellElement>
}) {
  return <td ref={ref} className={cn("dr-table-cell", className)} {...props} />
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
