import { Wrench } from "lucide-react"
import { ErrorLayout } from "@errors/error-layout"

export function MaintenancePage() {
  return (
    <ErrorLayout
      icon={
        <Wrench className="size-[var(--icon-size-3xl)]" strokeWidth={1.5} />
      }
      title="Under maintenance"
      description="We're performing scheduled maintenance. We'll be back shortly."
    />
  )
}
