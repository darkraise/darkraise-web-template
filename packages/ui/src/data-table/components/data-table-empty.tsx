import { Inbox } from "lucide-react"

export function DataTableEmpty() {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
      <Inbox className="mb-2 h-10 w-10" />
      <p className="text-sm">No results found</p>
    </div>
  )
}
