import { Inbox } from "lucide-react"
import { useUiLabels } from "@labels"

export function DataTableEmpty() {
  const labels = useUiLabels()
  return (
    <div className="dr-data-table-empty">
      <Inbox className="dr-data-table-empty-icon" aria-hidden="true" />
      <p className="dr-data-table-empty-text">{labels.dataTable.empty}</p>
    </div>
  )
}
