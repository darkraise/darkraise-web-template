import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card"
import { Badge } from "@/core/components/ui/badge"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/cards")({
  component: CardsPage,
})

function CardsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Cards" },
        ]}
        title="Cards"
        description="Container component with header, content, and footer regions for grouping related information."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Default card"
          code={`<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>A short description of the card content.</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      This is the card body. It can contain any content.
    </p>
  </CardContent>
  <CardFooter>
    <Button size="sm">Action</Button>
  </CardFooter>
</Card>`}
        >
          <div className="max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>
                  A short description of the card content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This is the card body. It can contain any content.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Card with badge"
          code={`<Card>
  <CardHeader>
    <div className="flex items-start justify-between">
      <CardTitle>Product Feature</CardTitle>
      <Badge variant="secondary">New</Badge>
    </div>
    <CardDescription>Released in the latest update.</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">Feature description goes here.</p>
  </CardContent>
  <CardFooter className="gap-2">
    <Button size="sm" variant="outline">Learn more</Button>
    <Button size="sm">Get started</Button>
  </CardFooter>
</Card>`}
        >
          <div className="max-w-sm">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>Product Feature</CardTitle>
                  <Badge variant="secondary">New</Badge>
                </div>
                <CardDescription>
                  Released in the latest update.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Feature description goes here.
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm" variant="outline">
                  Learn more
                </Button>
                <Button size="sm">Get started</Button>
              </CardFooter>
            </Card>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Content-only card (no header or footer)"
          code={`<Card>
  <CardContent className="pt-6">
    <p className="text-sm text-muted-foreground">
      Cards can omit the header and footer when used as a simple container.
    </p>
  </CardContent>
</Card>`}
        >
          <div className="max-w-sm">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Cards can omit the header and footer when used as a simple
                  container.
                </p>
              </CardContent>
            </Card>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Surface elevations"
          code={`// Surface tokens visualize stacking order (sunken → base → raised → overlay)
<div className="rounded-lg bg-surface-sunken p-4 ring-1 ring-border">
  surface-sunken — inset areas, wells
</div>
<div className="rounded-lg bg-surface-base p-4 ring-1 ring-border">
  surface-base — page background
</div>
<div className="rounded-lg bg-surface-raised p-4 ring-1 ring-border">
  surface-raised — cards, panels
</div>
<div className="rounded-lg bg-surface-overlay p-4 ring-1 ring-border">
  surface-overlay — dialogs, popovers
</div>`}
        >
          <div className="space-y-3">
            {[
              {
                token: "bg-surface-sunken",
                label: "surface-sunken",
                desc: "Inset areas, wells",
              },
              {
                token: "bg-surface-base",
                label: "surface-base",
                desc: "Page background",
              },
              {
                token: "bg-surface-raised",
                label: "surface-raised",
                desc: "Cards, panels",
              },
              {
                token: "bg-surface-overlay",
                label: "surface-overlay",
                desc: "Dialogs, popovers",
              },
            ].map(({ token, label, desc }) => (
              <div
                key={token}
                className={`${token} rounded-lg p-4 ring-1 ring-border`}
              >
                <p className="font-mono text-xs font-medium text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}
