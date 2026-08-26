import type { ColumnDef, Table } from "@tanstack/react-table"

/**
 * Fixed-height windowing. The row height is declared rather than measured
 * because every row in this kit is one `density` cell tall, and a declared
 * height keeps the maths deterministic instead of depending on layout that a
 * test environment never performs.
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
