import type { ColumnDef, Table } from "@tanstack/react-table"

/**
 * Fixed-height windowing. Cells are clipped to the declared height so wrapped
 * content cannot invalidate scroll offsets. Choose a height that fits the
 * controls and text in each row, or use pagination for variable-height content.
 */
export interface DataTableVirtualization {
  rowHeight: number
  height: number
  /** Rows rendered beyond each edge of the viewport. Defaults to 8. */
  overscan?: number
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  searchKey?: string
  searchPlaceholder?: string
  /** Column ids to offer as multi-select value filters. */
  facets?: string[]
  /** Window long lists instead of paginating them. */
  virtualize?: DataTableVirtualization
}

export interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey?: string
  searchPlaceholder?: string
  facets?: string[]
}

export interface DataTablePaginationProps<TData> {
  table: Table<TData>
}
