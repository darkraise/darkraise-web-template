import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]}
        title="Settings"
        description="Manage your account settings"
      />
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Settings content goes here.</p>
      </div>
    </>
  )
}
