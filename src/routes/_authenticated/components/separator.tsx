import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import { Separator } from "@/core/components/ui/separator"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/separator")({
  component: SeparatorPage,
})

function SeparatorPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Separator" },
        ]}
        title="Separator"
        description="Horizontal and vertical visual dividers for separating content regions."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Horizontal separator"
          code={`<p className="text-sm">Content above</p>
<Separator className="my-3" />
<p className="text-sm">Content below</p>`}
        >
          <div>
            <p className="text-sm">Content above the separator</p>
            <Separator className="my-3" />
            <p className="text-sm">Content below the separator</p>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Vertical separator"
          code={`<div className="flex h-10 items-center gap-4">
  <span className="text-sm">Left</span>
  <Separator orientation="vertical" />
  <span className="text-sm">Right</span>
</div>`}
        >
          <div className="flex h-10 items-center gap-4">
            <span className="text-sm">Left</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Center</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Right</span>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="In a navigation bar"
          code={`<div className="flex items-center gap-3">
  <span className="text-sm font-medium">Dashboard</span>
  <Separator orientation="vertical" className="h-4" />
  <span className="text-sm font-medium">Products</span>
  <Separator orientation="vertical" className="h-4" />
  <span className="text-sm text-muted-foreground">Settings</span>
</div>`}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Dashboard</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium">Products</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium">Analytics</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground">Settings</span>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Separating card sections"
          code={`<div className="space-y-4">
  <div>
    <p className="text-sm font-medium">Section A</p>
    <p className="text-xs text-muted-foreground">First region content.</p>
  </div>
  <Separator />
  <div>
    <p className="text-sm font-medium">Section B</p>
    <p className="text-xs text-muted-foreground">Second region content.</p>
  </div>
  <Separator />
  <div>
    <p className="text-sm font-medium">Section C</p>
    <p className="text-xs text-muted-foreground">Third region content.</p>
  </div>
</div>`}
        >
          <div className="space-y-4">
            {["Section A", "Section B", "Section C"].map((section, i, arr) => (
              <div key={section}>
                <div>
                  <p className="text-sm font-medium">{section}</p>
                  <p className="text-xs text-muted-foreground">
                    Content for {section.toLowerCase()}.
                  </p>
                </div>
                {i < arr.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}
