import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Button } from "../../../components/button"
import type { Column } from "@tanstack/react-table"

interface ColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
}

export function ColumnHeader<TData, TValue>({
  column,
  title,
}: ColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span>{title}</span>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="dr-data-table-column-header-btn"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="dr-data-table-column-header-icon" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="dr-data-table-column-header-icon" />
      ) : (
        <ArrowUpDown className="dr-data-table-column-header-icon" />
      )}
    </Button>
  )
}
