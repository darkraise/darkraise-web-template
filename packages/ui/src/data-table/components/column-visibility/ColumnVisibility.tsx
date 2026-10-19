import { SlidersHorizontal } from "lucide-react"
import { Button } from "@components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
import type { Table } from "@tanstack/react-table"
import { useUiLabels } from "@labels"

interface ColumnVisibilityProps<TData> {
  table: Table<TData>
}

export function ColumnVisibility<TData>({
  table,
}: ColumnVisibilityProps<TData>) {
  const labels = useUiLabels()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="dr-data-table-column-visibility-trigger"
        >
          <SlidersHorizontal
            className="me-2 size-[var(--icon-size)]"
            aria-hidden="true"
          />
          {labels.dataTable.columns}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{labels.dataTable.toggleColumns}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((col) => col.getCanHide())
          .map((col) => {
            const header = col.columnDef.header
            const label =
              col.columnDef.meta?.label ??
              (typeof header === "string" ? header : col.id)
            return (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.getIsVisible()}
                onCheckedChange={(v) => col.toggleVisibility(!!v)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
