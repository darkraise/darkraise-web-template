import { useId } from "react"
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
import { defaultLabels, useUiLabels } from "@labels"

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const labels = useUiLabels()
  const pageSizeLabelId = useId()
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
          {labels.dataTable.rowsSelected(selectedCount, filteredCount)}
        </div>
      )}
      <div className="dr-data-table-pagination-controls">
        <div className="dr-data-table-pagination-page-size">
          <p
            id={pageSizeLabelId}
            className="dr-data-table-pagination-page-info"
          >
            {labels.dataTable.rowsPerPage}
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger
              aria-labelledby={pageSizeLabelId}
              className="dr-data-table-pagination-page-size-trigger"
            >
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
          {labels.dataTable.pageInfo(
            table.getPageCount()
              ? table.getState().pagination.pageIndex + 1
              : 0,
            table.getPageCount(),
          )}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="dr-data-table-pagination-nav-btn"
                onClick={() => table.setPageIndex(0)}
                aria-label={
                  labels.dataTable.firstPage ??
                  defaultLabels.dataTable.firstPage
                }
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft
                  className="size-[var(--icon-size)]"
                  aria-hidden="true"
                />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="dr-data-table-pagination-nav-btn"
                onClick={() => table.previousPage()}
                aria-label={
                  labels.dataTable.previousPage ??
                  defaultLabels.dataTable.previousPage
                }
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft
                  className="size-[var(--icon-size)]"
                  aria-hidden="true"
                />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="dr-data-table-pagination-nav-btn"
                onClick={() => table.nextPage()}
                aria-label={
                  labels.dataTable.nextPage ?? defaultLabels.dataTable.nextPage
                }
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight
                  className="size-[var(--icon-size)]"
                  aria-hidden="true"
                />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="dr-data-table-pagination-nav-btn"
                onClick={() =>
                  table.setPageIndex(Math.max(0, table.getPageCount() - 1))
                }
                disabled={!table.getCanNextPage() || table.getPageCount() === 0}
                aria-label={
                  labels.dataTable.lastPage ?? defaultLabels.dataTable.lastPage
                }
              >
                <ChevronsRight
                  className="size-[var(--icon-size)]"
                  aria-hidden="true"
                />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
