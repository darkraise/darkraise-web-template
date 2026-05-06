import { Inbox } from "lucide-react"

export function DataTableEmpty() {
  return (
    <div className="dr-data-table-empty">
      <Inbox className="dr-data-table-empty-icon" />
      <p className="dr-data-table-empty-text">No results found</p>
    </div>
  )
}
