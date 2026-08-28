import { Wrench } from "lucide-react"
import { ErrorLayout } from "@errors/error-layout"
import { useUiLabels } from "@labels"

export function MaintenancePage() {
  const labels = useUiLabels()

  return (
    <ErrorLayout
      icon={
        <Wrench
          className="size-[var(--icon-size-3xl)]"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      }
      title={labels.errors.maintenanceTitle}
      description={labels.errors.maintenanceDescription}
    />
  )
}
