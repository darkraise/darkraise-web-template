import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, RefreshCw, Bell, Heart, Zap } from "lucide-react"
import { Button } from "darkraise-ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "darkraise-ui/components/card"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/animation")({
  component: AnimationPage,
})

function AnimationPage() {
  const [enterKey, setEnterKey] = useState(0)

  return (
    <ShowcasePage
      title="Animation"
      description="Motion utilities for loading states, enter transitions, and attention cues."
    >
      <ShowcaseExample
        title="Spin — continuous rotation for loaders"
        code={`<Loader2 className="h-6 w-6 animate-spin" />

<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading
</Button>`}
      >
        <div className="flex items-center gap-6">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          <RefreshCw className="text-primary h-6 w-6 animate-spin" />
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Pulse — opacity fade for skeleton content"
        code={`<div className="h-4 w-48 animate-pulse rounded bg-foreground/10" />`}
      >
        <div className="space-y-2">
          <div className="bg-foreground/10 h-4 w-48 animate-pulse rounded" />
          <div className="bg-foreground/10 h-4 w-64 animate-pulse rounded" />
          <div className="bg-foreground/10 h-4 w-40 animate-pulse rounded" />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Pulse subtle — custom 2s loop for idle state"
        code={`<Zap className="animate-pulse-subtle text-primary h-6 w-6" />
<span className="animate-pulse-subtle text-muted-foreground text-sm">
  Syncing changes…
</span>`}
      >
        <div className="flex items-center gap-3">
          <Zap className="animate-pulse-subtle text-primary h-6 w-6" />
          <span className="animate-pulse-subtle text-muted-foreground text-sm">
            Syncing changes…
          </span>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Bounce — vertical hop for attention dots"
        code={`<div className="flex items-center gap-2">
  <div className="bg-primary h-3 w-3 animate-bounce rounded-full [animation-delay:-0.3s]" />
  <div className="bg-primary h-3 w-3 animate-bounce rounded-full [animation-delay:-0.15s]" />
  <div className="bg-primary h-3 w-3 animate-bounce rounded-full" />
</div>`}
      >
        <div className="flex items-center gap-2">
          <div className="bg-primary h-3 w-3 animate-bounce rounded-full [animation-delay:-0.3s]" />
          <div className="bg-primary h-3 w-3 animate-bounce rounded-full [animation-delay:-0.15s]" />
          <div className="bg-primary h-3 w-3 animate-bounce rounded-full" />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Ping — radar pulse for live indicators"
        code={`<span className="relative flex h-3 w-3">
  <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
  <span className="bg-primary relative inline-flex h-3 w-3 rounded-full" />
</span>`}
      >
        <div className="flex items-center gap-8">
          <span className="relative flex h-3 w-3">
            <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-primary relative inline-flex h-3 w-3 rounded-full" />
          </span>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-destructive relative inline-flex h-3 w-3 rounded-full" />
            </span>
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Slide — 1.2s horizontal shimmer"
        code={`<div className="bg-foreground/10 relative h-8 w-full overflow-hidden rounded">
  <div className="animate-slide h-full w-1/3 bg-gradient-to-r from-transparent via-foreground/25 to-transparent" />
</div>`}
      >
        <div className="bg-foreground/10 relative h-8 w-full overflow-hidden rounded">
          <div className="animate-slide via-foreground/25 h-full w-1/3 bg-gradient-to-r from-transparent to-transparent" />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Enter animations — fade / zoom / slide-in on mount"
        code={`<Card className="animate-in fade-in-0 duration-500">…</Card>
<Card className="animate-in zoom-in-95 duration-300">…</Card>
<Card className="animate-in slide-in-from-bottom-4 duration-300">…</Card>`}
      >
        <div className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEnterKey((k) => k + 1)}
          >
            Replay
          </Button>
          <div key={enterKey} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card className="animate-in fade-in-0 duration-500">
              <CardHeader className="p-4">
                <CardTitle className="text-sm">fade-in-0</CardTitle>
                <CardDescription>Opacity 0 → 1</CardDescription>
              </CardHeader>
            </Card>
            <Card className="animate-in zoom-in-95 duration-300">
              <CardHeader className="p-4">
                <CardTitle className="text-sm">zoom-in-95</CardTitle>
                <CardDescription>Scale 0.95 → 1</CardDescription>
              </CardHeader>
            </Card>
            <Card className="animate-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="p-4">
                <CardTitle className="text-sm">
                  slide-in-from-bottom-4
                </CardTitle>
                <CardDescription>Y +16px → 0</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Hover transforms — scale, rotate, translate"
        code={`<Button className="transition-transform duration-200 hover:scale-110">
  Scale
</Button>
<Heart className="transition-transform duration-300 hover:rotate-12 hover:scale-125" />
<Button className="transition-transform duration-200 hover:-translate-y-1">
  Lift
</Button>`}
      >
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            className="transition-transform duration-200 hover:scale-110"
          >
            Scale
          </Button>
          <Heart className="text-destructive h-6 w-6 cursor-pointer transition-transform duration-300 hover:scale-125 hover:rotate-12" />
          <Button
            variant="outline"
            className="transition-transform duration-200 hover:-translate-y-1"
          >
            Lift
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Color and opacity transitions"
        code={`<a className="text-muted-foreground hover:text-primary transition-colors duration-200">
  Transition colors
</a>
<span className="transition-opacity duration-200 hover:opacity-50">
  Transition opacity
</span>`}
      >
        <div className="flex items-center gap-8">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200"
          >
            Transition colors
          </a>
          <span className="cursor-pointer text-sm transition-opacity duration-200 hover:opacity-50">
            Transition opacity
          </span>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
