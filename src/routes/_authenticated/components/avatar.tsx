import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/components/ui/avatar"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/avatar")({
  component: AvatarPage,
})

function AvatarPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Avatar" },
        ]}
        title="Avatar"
        description="User profile image with automatic initials fallback when the image is unavailable."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Sizes with initials fallback"
          code={`// AvatarImage loads a photo; AvatarFallback shows when image is missing
<Avatar className="h-16 w-16">
  <AvatarFallback className="text-lg">AJ</AvatarFallback>
</Avatar>
<Avatar className="h-12 w-12">
  <AvatarFallback>BS</AvatarFallback>
</Avatar>
<Avatar className="h-8 w-8">
  <AvatarFallback className="text-xs">CW</AvatarFallback>
</Avatar>
<Avatar className="h-6 w-6">
  <AvatarFallback className="text-[10px]">DX</AvatarFallback>
</Avatar>`}
        >
          <div className="flex flex-wrap items-end gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">AJ</AvatarFallback>
            </Avatar>
            <Avatar className="h-12 w-12">
              <AvatarFallback>BS</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10">
              <AvatarFallback>CW</AvatarFallback>
            </Avatar>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">DX</AvatarFallback>
            </Avatar>
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">EY</AvatarFallback>
            </Avatar>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="With image (falling back to initials on broken src)"
          code={`<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="User" />
  <AvatarFallback>SC</AvatarFallback>
</Avatar>

// Broken image src — AvatarFallback renders instead
<Avatar>
  <AvatarImage src="/broken.jpg" alt="Broken" />
  <AvatarFallback>FB</AvatarFallback>
</Avatar>`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground">With image</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/broken-image.jpg" alt="Broken" />
                <AvatarFallback>FB</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground">Broken src</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarFallback>NI</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground">No image</p>
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Avatar group (stacked)"
          code={`<div className="flex -space-x-3">
  {users.map((user) => (
    <Avatar key={user.initials} className="h-8 w-8 ring-2 ring-background">
      <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
    </Avatar>
  ))}
</div>`}
        >
          <div className="space-y-4">
            <div className="flex -space-x-3">
              {["AJ", "BS", "CW", "DX", "EY"].map((initials) => (
                <Avatar
                  key={initials}
                  className="h-8 w-8 ring-2 ring-background"
                >
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ))}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background">
                +3
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Stacked avatar group — use{" "}
              <code className="font-mono">-space-x-3</code> and{" "}
              <code className="font-mono">ring-2 ring-background</code> on each
              avatar.
            </p>
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}
