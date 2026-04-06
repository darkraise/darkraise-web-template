import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/components/ui/avatar"
import { ShowcaseExample } from "./_components/-showcase-example"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"

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
              <p className="text-muted-foreground text-xs">With image</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/broken-image.jpg" alt="Broken" />
                <AvatarFallback>FB</AvatarFallback>
              </Avatar>
              <p className="text-muted-foreground text-xs">Broken src</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarFallback>NI</AvatarFallback>
              </Avatar>
              <p className="text-muted-foreground text-xs">No image</p>
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
                  className="ring-background h-8 w-8 ring-2"
                >
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ))}
              <div className="bg-muted ring-background flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ring-2">
                +3
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Stacked avatar group — use{" "}
              <code className="font-mono">-space-x-3</code> and{" "}
              <code className="font-mono">ring-2 ring-background</code> on each
              avatar.
            </p>
          </div>
        </ShowcaseExample>
        <ShowcaseExample
          title="Online status dot"
          code={`<div className="relative inline-block">
  <Avatar className="h-10 w-10">
    <AvatarFallback>AC</AvatarFallback>
  </Avatar>
  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
</div>`}
        >
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex flex-col items-center">
              <div className="relative inline-block">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>AC</AvatarFallback>
                </Avatar>
                <span className="ring-background absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500 ring-2" />
              </div>
              <p className="text-muted-foreground mt-1 text-center text-xs">
                Online
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative inline-block">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>BP</AvatarFallback>
                </Avatar>
                <span className="ring-background absolute right-0 bottom-0 h-3 w-3 rounded-full bg-amber-500 ring-2" />
              </div>
              <p className="text-muted-foreground mt-1 text-center text-xs">
                Away
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative inline-block">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>CJ</AvatarFallback>
                </Avatar>
                <span className="ring-background absolute right-0 bottom-0 h-3 w-3 rounded-full bg-gray-400 ring-2" />
              </div>
              <p className="text-muted-foreground mt-1 text-center text-xs">
                Offline
              </p>
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Group with +N overflow"
          code={`<div className="flex items-center">
  <Avatar className="h-10 w-10 ring-2 ring-background">
    <AvatarFallback>AC</AvatarFallback>
  </Avatar>
  <Avatar className="h-10 w-10 -ml-3 ring-2 ring-background">
    <AvatarFallback>BP</AvatarFallback>
  </Avatar>
  {/* …more avatars… */}
  <div className="h-10 w-10 -ml-3 rounded-full bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-background">
    +5
  </div>
</div>`}
        >
          <div className="flex items-center">
            <Avatar className="ring-background h-10 w-10 ring-2">
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
            <Avatar className="ring-background -ml-3 h-10 w-10 ring-2">
              <AvatarFallback>BP</AvatarFallback>
            </Avatar>
            <Avatar className="ring-background -ml-3 h-10 w-10 ring-2">
              <AvatarFallback>CJ</AvatarFallback>
            </Avatar>
            <Avatar className="ring-background -ml-3 h-10 w-10 ring-2">
              <AvatarFallback>DK</AvatarFallback>
            </Avatar>
            <div className="bg-muted ring-background -ml-3 flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium ring-2">
              +5
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Avatar with tooltip"
          code={`<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Avatar className="h-10 w-10">
        <AvatarFallback>AC</AvatarFallback>
      </Avatar>
    </TooltipTrigger>
    <TooltipContent>Alice Chen — Designer</TooltipContent>
  </Tooltip>
</TooltipProvider>`}
        >
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarFallback>AC</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>Alice Chen — Designer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarFallback>BP</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>Bob Park — Developer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarFallback>CJ</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>Carol Jones — Manager</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </ShowcaseExample>
      </div>
    </div>
  )
}
