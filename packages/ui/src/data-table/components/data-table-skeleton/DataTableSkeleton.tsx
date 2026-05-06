import { Skeleton } from "../../../components/skeleton"

interface DataTableSkeletonProps {
  columnCount: number
  rowCount?: number
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 5,
}: DataTableSkeletonProps) {
  return (
    <div className="dr-data-table-skeleton">
      <div className="dr-data-table-skeleton-toolbar">
        <Skeleton className="dr-data-table-skeleton-toolbar-search" />
        <Skeleton className="dr-data-table-skeleton-toolbar-action" />
      </div>
      <div className="dr-data-table-skeleton-frame">
        <div className="dr-data-table-skeleton-row">
          <div className="dr-data-table-skeleton-row-cells">
            {Array.from({ length: columnCount }).map((_, i) => (
              <Skeleton key={i} className="dr-data-table-skeleton-cell" />
            ))}
          </div>
        </div>
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="dr-data-table-skeleton-row">
            <div className="dr-data-table-skeleton-row-cells">
              {Array.from({ length: columnCount }).map((_, j) => (
                <Skeleton key={j} className="dr-data-table-skeleton-cell" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
