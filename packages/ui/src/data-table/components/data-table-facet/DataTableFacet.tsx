import { ListFilter } from "lucide-react"
import { Button } from "@components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
import type { Column } from "@tanstack/react-table"
import { useUiLabels } from "@labels"

interface DataTableFacetProps<TData> {
  column: Column<TData, unknown>
}

export function DataTableFacet<TData>({ column }: DataTableFacetProps<TData>) {
  const labels = useUiLabels()
  const header = column.columnDef.header
  const title = typeof header === "string" ? header : column.id
  const selected = new Set((column.getFilterValue() as string[]) ?? [])
  // Sorted so the option list does not reorder itself as counts change under a
  // filter applied to a different column.
  const values = Array.from(column.getFacetedUniqueValues().entries()).sort(
    (a, b) => String(a[0]).localeCompare(String(b[0])),
  )

  function toggle(value: string, on: boolean) {
    const next = new Set(selected)
    if (on) next.add(value)
    else next.delete(value)
    // Undefined rather than an empty array: an empty filter value still counts
    // as an active filter, which would leave the reset button showing.
    column.setFilterValue(next.size ? Array.from(next) : undefined)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="dr-data-table-facet-trigger"
          aria-label={labels.dataTable.filterBy(title)}
        >
          <ListFilter className="mr-2 size-[var(--icon-size)]" />
          {title}
          {selected.size > 0 && (
            <span className="dr-data-table-facet-count">{selected.size}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>
          {labels.dataTable.filterBy(title)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {values.map(([value, count]) => (
          <DropdownMenuCheckboxItem
            key={String(value)}
            checked={selected.has(String(value))}
            onCheckedChange={(v) => toggle(String(value), !!v)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="dr-data-table-facet-value">{String(value)}</span>
            <span className="dr-data-table-facet-tally">{count}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
