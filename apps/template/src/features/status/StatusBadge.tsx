import { Badge } from "darkraise-ui/components/badge"
import { useAppTranslation } from "@/i18n/useAppTranslation"
import { statusVariant, type DemoStatus } from "./statusVariant"

export function StatusBadge({ status }: { status: DemoStatus }) {
  const t = useAppTranslation()
  return (
    <Badge variant={statusVariant[status]} data-status={status}>
      {t(status)}
    </Badge>
  )
}
