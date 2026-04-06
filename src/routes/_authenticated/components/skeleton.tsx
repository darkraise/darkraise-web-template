import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import { Skeleton } from "@/core/components/ui/skeleton"
import { Card, CardContent } from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/skeleton")({
  component: SkeletonPage,
})

function SkeletonPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Skeleton" },
        ]}
        title="Skeleton"
        description="Animated loading placeholders that mimic the shape of the content they replace."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Basic shapes"
          code={`// Match the shape of the content you're loading
<Skeleton className="h-4 w-48" />           // single text line
<Skeleton className="h-4 w-32" />           // shorter text line
<Skeleton className="h-12 w-12 rounded-full" />  // avatar circle
<Skeleton className="h-32 w-full rounded-lg" />  // card/image block`}
        >
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Profile card skeleton"
          code={`<div className="flex items-center gap-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-48" />
    <Skeleton className="h-4 w-32" />
  </div>
</div>`}
        >
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Paragraph skeleton"
          code={`<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
  <Skeleton className="h-4 w-4/6" />
  <Skeleton className="h-4 w-3/6" />
</div>`}
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-3/6" />
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Card with image skeleton"
          code={`<div className="space-y-4">
  <Skeleton className="h-48 w-full rounded-lg" />
  <div className="space-y-2">
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </div>
  <Skeleton className="h-9 w-24 rounded-md" />
</div>`}
        >
          <div className="max-w-sm space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="List skeleton"
          code={`{Array.from({ length: 4 }).map((_, i) => (
  <div key={i} className="flex items-center gap-3 py-2">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1 space-y-1">
      <Skeleton className="h-3.5 w-2/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
    <Skeleton className="h-3.5 w-16 rounded-full" />
  </div>
))}`}
        >
          <div className="divide-border divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
                <Skeleton className="h-3.5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Data-table skeleton"
          code={`<Card>
  <CardContent className="p-0">
    <div className="flex items-center gap-2 p-4">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-9 w-24" />
    </div>
    <Separator />
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
    <Separator />
    <div className="flex items-center justify-between px-4 py-3">
      <Skeleton className="h-4 w-32" />
      <div className="flex gap-1">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  </CardContent>
</Card>`}
        >
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center gap-2 p-4">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-9 w-24" />
              </div>
              <Separator />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </ShowcaseExample>

        <ShowcaseExample
          title="Dashboard skeleton"
          code={`<div className="space-y-4">
  <div className="grid grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-24 rounded-lg" />
    ))}
  </div>
  <div className="grid grid-cols-2 gap-4">
    {Array.from({ length: 2 }).map((_, i) => (
      <Skeleton key={i} className="h-64 rounded-lg" />
    ))}
  </div>
  <div className="grid grid-cols-3 gap-4">
    <Skeleton className="col-span-2 h-40 rounded-lg" />
    <Skeleton className="h-40 rounded-lg" />
  </div>
</div>`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="col-span-2 h-40 rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
            </div>
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}
