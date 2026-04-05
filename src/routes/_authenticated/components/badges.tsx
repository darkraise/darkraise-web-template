import { createFileRoute } from "@tanstack/react-router"
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/core/layout"
import { Badge } from "@/core/components/ui/badge"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/badges")({
  component: BadgesPage,
})

function BadgesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Badges" },
        ]}
        title="Badges"
        description="Compact inline labels for status, categories, and counts."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Variants"
          code={`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`}
        >
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="With icons"
          code={`<Badge variant="default">
  <CheckCircle className="mr-1 h-3 w-3" /> Active
</Badge>
<Badge variant="secondary">
  <Clock className="mr-1 h-3 w-3" /> Pending
</Badge>
<Badge variant="destructive">
  <XCircle className="mr-1 h-3 w-3" /> Failed
</Badge>
<Badge variant="outline">
  <AlertTriangle className="mr-1 h-3 w-3" /> Warning
</Badge>`}
        >
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">
              <CheckCircle className="mr-1 h-3 w-3" />
              Active
            </Badge>
            <Badge variant="secondary">
              <Clock className="mr-1 h-3 w-3" />
              Pending
            </Badge>
            <Badge variant="destructive">
              <XCircle className="mr-1 h-3 w-3" />
              Failed
            </Badge>
            <Badge variant="outline">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Warning
            </Badge>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Numeric count badges"
          code={`<span className="relative inline-flex">
  <span>Notifications</span>
  <Badge className="ml-2">12</Badge>
</span>
<Badge variant="destructive">99+</Badge>
<Badge variant="outline">0</Badge>`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-sm">
              Notifications
              <Badge>12</Badge>
            </span>
            <span className="flex items-center gap-2 text-sm">
              Errors
              <Badge variant="destructive">99+</Badge>
            </span>
            <span className="flex items-center gap-2 text-sm">
              Unread
              <Badge variant="outline">0</Badge>
            </span>
            <span className="flex items-center gap-2 text-sm">
              Drafts
              <Badge variant="secondary">3</Badge>
            </span>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="In context — order status"
          code={`// Status badges used inline within list or table rows
<Badge variant="default">Delivered</Badge>
<Badge variant="secondary">Processing</Badge>
<Badge variant="outline">Draft</Badge>
<Badge variant="destructive">Cancelled</Badge>`}
        >
          <div className="space-y-3">
            {[
              { label: "Order #1042", status: "Delivered", variant: "default" },
              {
                label: "Order #1043",
                status: "Processing",
                variant: "secondary",
              },
              { label: "Order #1044", status: "Draft", variant: "outline" },
              {
                label: "Order #1045",
                status: "Cancelled",
                variant: "destructive",
              },
            ].map(({ label, status, variant }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <Badge
                  variant={
                    variant as
                      | "default"
                      | "secondary"
                      | "outline"
                      | "destructive"
                  }
                >
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}
