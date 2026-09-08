import { useEffect, useMemo, useRef, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type FilterFn,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/table"
import { DataTableToolbar } from "@data-table/components/data-table-toolbar"
import { DataTablePagination } from "@data-table/components/data-table-pagination"
import { DataTableSkeleton } from "@data-table/components/data-table-skeleton"
import { DataTableEmpty } from "@data-table/components/data-table-empty"
import type { DataTableProps, DataTableVirtualization } from "@data-table/types"

/**
 * Wraps the table in a scroll container only when windowing is on, so a table
 * without it keeps exactly the markup it had on 6.4.0.
 */
function VirtualViewport({
  virtualize,
  onScrollTop,
  scrollTop,
  onHeaderHeight,
  children,
}: {
  virtualize?: DataTableVirtualization
  onScrollTop: (top: number) => void
  scrollTop: number
  onHeaderHeight: (height: number) => void
  children: React.ReactNode
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const isVirtual = !!virtualize
  useEffect(() => {
    const header = viewportRef.current?.querySelector("thead")
    if (!header) return
    const update = () => onHeaderHeight(header.getBoundingClientRect().height)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(header)
    return () => observer.disconnect()
  }, [isVirtual, onHeaderHeight])
  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = scrollTop
  }, [scrollTop])
  if (!virtualize) return <>{children}</>
  return (
    <div
      ref={viewportRef}
      className="dr-data-table-viewport"
      style={
        {
          height: virtualize.height,
          overflowY: "auto",
          "--data-table-row-height": `${virtualize.rowHeight}px`,
        } as React.CSSProperties
      }
      onScroll={(e) => onScrollTop((e.target as HTMLElement).scrollTop)}
    >
      {children}
    </div>
  )
}

const DEFAULT_OVERSCAN = 8

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  searchKey,
  searchPlaceholder,
  facets,
  virtualize,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [scrollTop, setScrollTop] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)

  const resolvedColumns = useMemo(() => {
    const scalarFacetFilter: FilterFn<TData> = (row, id, values: unknown[]) =>
      values.includes(row.getValue(id))
    if (!facets?.length) return columns
    return columns.map((column) => {
      const id = column.id ?? (column as { accessorKey?: string }).accessorKey
      return id && facets.includes(id) && !column.filterFn
        ? { ...column, filterFn: scalarFacetFilter }
        : column
    })
  }, [columns, facets])

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    ...(virtualize ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  })

  const allRows = table.getRowModel().rows
  const headerGroups = table.getHeaderGroups()
  const effectiveScrollTop = virtualize
    ? Math.min(
        scrollTop,
        Math.max(
          0,
          allRows.length * virtualize.rowHeight +
            headerHeight -
            virtualize.height,
        ),
      )
    : 0
  useEffect(() => {
    if (scrollTop !== effectiveScrollTop) setScrollTop(effectiveScrollTop)
  }, [scrollTop, effectiveScrollTop])

  if (isLoading) return <DataTableSkeleton columnCount={columns.length} />
  const overscan = virtualize?.overscan ?? DEFAULT_OVERSCAN
  const first = virtualize
    ? Math.max(
        0,
        Math.floor(effectiveScrollTop / virtualize.rowHeight) - overscan,
      )
    : 0
  const last = virtualize
    ? Math.min(
        allRows.length,
        Math.ceil(
          (effectiveScrollTop + virtualize.height) / virtualize.rowHeight,
        ) + overscan,
      )
    : allRows.length
  const windowRows = virtualize ? allRows.slice(first, last) : allRows
  const padTop = virtualize ? first * virtualize.rowHeight : 0
  const padBottom = virtualize
    ? (allRows.length - last) * virtualize.rowHeight
    : 0

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        facets={facets}
      />
      <div className="dr-data-table-frame">
        <VirtualViewport
          virtualize={virtualize}
          onScrollTop={setScrollTop}
          scrollTop={effectiveScrollTop}
          onHeaderHeight={setHeaderHeight}
        >
          <Table
            aria-rowcount={
              virtualize
                ? Math.max(1, allRows.length) + headerGroups.length
                : undefined
            }
          >
            <TableHeader>
              {headerGroups.map((headerGroup, index) => (
                <TableRow
                  key={headerGroup.id}
                  aria-rowindex={virtualize ? index + 1 : undefined}
                >
                  {headerGroup.headers.map((header) => {
                    const sortDir = header.column.getIsSorted()
                    // aria-sort communicates the active sort direction to AT
                    // independent of the visual indicator inside ColumnHeader.
                    const ariaSort: React.AriaAttributes["aria-sort"] =
                      sortDir === "asc"
                        ? "ascending"
                        : sortDir === "desc"
                          ? "descending"
                          : header.column.getCanSort()
                            ? "none"
                            : undefined
                    return (
                      <TableHead key={header.id} aria-sort={ariaSort}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {padTop > 0 && (
                <tr
                  className="dr-data-table-virtual-pad"
                  style={{ height: padTop }}
                  aria-hidden="true"
                />
              )}
              {allRows.length ? (
                windowRows.map((row, i) => (
                  <TableRow
                    key={row.id}
                    style={
                      virtualize ? { height: virtualize.rowHeight } : undefined
                    }
                    data-state={row.getIsSelected() && "selected"}
                    aria-rowindex={
                      virtualize
                        ? first + i + headerGroups.length + 1
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {virtualize ? (
                          <div className="dr-data-table-virtual-cell">
                            <div>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          </div>
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow
                  aria-rowindex={
                    virtualize ? headerGroups.length + 1 : undefined
                  }
                >
                  <TableCell colSpan={columns.length}>
                    <DataTableEmpty />
                  </TableCell>
                </TableRow>
              )}
              {padBottom > 0 && (
                <tr
                  className="dr-data-table-virtual-pad"
                  style={{ height: padBottom }}
                  aria-hidden="true"
                />
              )}
            </TableBody>
          </Table>
        </VirtualViewport>
      </div>
      {!virtualize && <DataTablePagination table={table} />}
    </div>
  )
}
