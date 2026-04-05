import { createFileRoute } from "@tanstack/react-router"
import {
  Mail,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/buttons")({
  component: ButtonsPage,
})

function ButtonsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Buttons" },
        ]}
        title="Buttons"
        description="Interactive trigger elements with multiple visual variants, sizes, and states."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Variants"
          code={`<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`}
        >
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Sizes"
          code={`<Button size="lg">Large</Button>
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="icon"><TrendingUp className="h-4 w-4" /></Button>`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Large</Button>
            <Button size="default">Default</Button>
            <Button size="sm">Small</Button>
            <Button size="icon">
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="With icons"
          code={`<Button><Mail className="mr-2 h-4 w-4" />Email</Button>
<Button variant="outline"><Plus className="mr-2 h-4 w-4" />New Item</Button>
<Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
<Button variant="secondary">Continue<ChevronRight className="ml-2 h-4 w-4" /></Button>`}
        >
          <div className="flex flex-wrap gap-3">
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Button>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="secondary">
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Loading state"
          code={`<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Saving...
</Button>
<Button variant="outline" disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading
</Button>`}
        >
          <div className="flex flex-wrap gap-3">
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </Button>
            <Button variant="outline" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading
            </Button>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Disabled state"
          code={`<Button disabled>Disabled Default</Button>
<Button variant="outline" disabled>Disabled Outline</Button>
<Button variant="destructive" disabled>Disabled Destructive</Button>
<Button variant="secondary" disabled>Disabled Secondary</Button>
<Button variant="ghost" disabled>Disabled Ghost</Button>`}
        >
          <div className="flex flex-wrap gap-3">
            <Button disabled>Disabled Default</Button>
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
            <Button variant="destructive" disabled>
              Disabled Destructive
            </Button>
            <Button variant="secondary" disabled>
              Disabled Secondary
            </Button>
            <Button variant="ghost" disabled>
              Disabled Ghost
            </Button>
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}
