import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@components/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@components/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/select"
import type { DataTablePaginationProps } from "@data-table/types"

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const filteredCount = table.getFilteredRowModel().rows.length
  return (
    <div className="dr-data-table-pagination">
      {/* Only render the selection summary when something is actually
          selected; otherwise the empty "0 of N row(s) selected" string was
          claiming valuable horizontal space and adding screen-reader noise
          on tables without a selection column. aria-live="polite" announces
          subsequent selection changes for AT users. */}
      {selectedCount > 0 && (
        <div className="dr-data-table-pagination-summary" aria-live="polite">
          {selectedCount} of {filteredCount} row(s) selected
        </div>
      )}
      <div className="dr-data-table-pagination-controls">
        <div className="dr-data-table-pagination-page-size">
          <p className="dr-data-table-pagination-page-info">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger className="dr-data-table-pagination-page-size-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="dr-data-table-pagination-page-info">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="dr-data-table-pagination-nav-btn"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="dr-data-table-pagination-nav-btn"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="dr-data-table-pagination-nav-btn"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="dr-data-table-pagination-nav-btn"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
