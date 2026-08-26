import { X } from "lucide-react"
import { Input } from "@components/input"
import { Button } from "@components/button"
import { ColumnVisibility } from "@data-table/components/column-visibility"
import { DataTableFacet } from "@data-table/components/data-table-facet"
import type { DataTableToolbarProps } from "@data-table/types"
import { useUiLabels } from "@labels"

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder,
  facets,
}: DataTableToolbarProps<TData>) {
  const labels = useUiLabels()
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="dr-data-table-toolbar">
      <div className="dr-data-table-toolbar-filters">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder ?? labels.dataTable.search}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn(searchKey)?.setFilterValue(e.target.value)
            }
            className="dr-data-table-toolbar-search"
          />
        )}
        {facets?.map((id) => {
          const column = table.getColumn(id)
          return column ? <DataTableFacet key={id} column={column} /> : null
        })}
        {isFiltered && (
          <Button
            variant="ghost"
            className="dr-data-table-toolbar-reset"
            onClick={() => table.resetColumnFilters()}
          >
            {labels.dataTable.reset}
            <X className="ml-2 size-[var(--icon-size)]" />
          </Button>
        )}
      </div>
      <ColumnVisibility table={table} />
    </div>
  )
}
