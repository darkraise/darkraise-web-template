import { X } from "lucide-react"
import { Input } from "../../../components/input"
import { Button } from "../../../components/button"
import { ColumnVisibility } from "../column-visibility"
import type { DataTableToolbarProps } from "../../types"

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="dr-data-table-toolbar">
      <div className="dr-data-table-toolbar-filters">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn(searchKey)?.setFilterValue(e.target.value)
            }
            className="dr-data-table-toolbar-search"
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            className="dr-data-table-toolbar-reset"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <ColumnVisibility table={table} />
    </div>
  )
}
