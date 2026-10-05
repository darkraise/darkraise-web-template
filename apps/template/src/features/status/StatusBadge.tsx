import { Badge, type BadgeVariant } from "darkraise-ui/components/badge"
import { useAppTranslation } from "@/i18n/useAppTranslation"
import type { Category, Order, Product } from "@/demo/types"

export type DemoStatus =
  | Order["status"]
  | Product["status"]
  | Category["status"]

// Order statuses read as a progression: grey until acted on, amber while
// processing, blue once shipped, green when delivered. The kit's accent-hue
// variants are solid fills, so none is used here.
export const statusVariant: Record<DemoStatus, BadgeVariant> = {
  pending: "secondary",
  processing: "warning-subtle",
  shipped: "info-subtle",
  delivered: "success-subtle",
  cancelled: "destructive-subtle",
  active: "success-subtle",
  draft: "secondary",
  inactive: "secondary",
  archived: "outline",
}

export function StatusBadge({ status }: { status: DemoStatus }) {
  const t = useAppTranslation()
  return (
    <Badge variant={statusVariant[status]} data-status={status}>
      {t(status)}
    </Badge>
  )
}
