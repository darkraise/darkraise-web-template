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
            className="mr-2 size-[var(--icon-size)]"
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
            // Prefer the columnDef header when it's a string; fall back to
            // the raw id (often a camelCase field key) only when the header
            // is a render function or unset.
            const header = col.columnDef.header
            const label = typeof header === "string" ? header : col.id
            return (
              <DropdownMenuCheckboxItem
                key={col.id}
                className="capitalize"
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
