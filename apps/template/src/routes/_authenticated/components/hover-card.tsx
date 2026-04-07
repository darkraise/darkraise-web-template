import { createFileRoute } from "@tanstack/react-router"
import { CalendarDays } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "darkraise-ui/components/avatar"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "darkraise-ui/components/hover-card"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/hover-card")({
  component: HoverCardPage,
})

function HoverCardPage() {
  return (
    <ShowcasePage
      title="Hover Card"
      description="A card that appears when hovering over a trigger element, for non-interactive preview content."
    >
      <ShowcaseExample
        title="User profile hover card"
        code={`<HoverCard>
  <HoverCardTrigger asChild>
    <a href="#" className="text-sm font-medium underline-offset-4 hover:underline">
      @janedoe
    </a>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="flex gap-4">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">@janedoe</h4>
        <p className="text-sm text-muted-foreground">
          Product designer. Building open-source tools.
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          Joined March 2021
        </div>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`}
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <a
              href="#"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              @janedoe
            </a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">@janedoe</h4>
                <p className="text-muted-foreground text-sm">
                  Product designer. Building open-source tools.
                </p>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <CalendarDays className="h-3 w-3" />
                  Joined March 2021
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </ShowcaseExample>

      <ShowcaseExample
        title="Product preview hover card"
        code={`<HoverCard>
  <HoverCardTrigger asChild>
    <a href="#" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
      Pro Plan
    </a>
  </HoverCardTrigger>
  <HoverCardContent className="w-72">
    <div className="space-y-3">
      <div className="h-24 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <span className="text-2xl font-bold text-primary">PRO</span>
      </div>
      <div>
        <h4 className="text-sm font-semibold">Pro Plan</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Unlimited projects, priority support, and advanced analytics.
        </p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">$29</span>
        <span className="text-sm text-muted-foreground">/ month</span>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`}
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <a
              href="#"
              className="text-primary text-sm font-medium underline-offset-4 hover:underline"
            >
              Pro Plan
            </a>
          </HoverCardTrigger>
          <HoverCardContent className="w-72">
            <div className="space-y-3">
              <div className="from-primary/20 to-primary/5 flex h-24 items-center justify-center rounded-md bg-gradient-to-br">
                <span className="text-primary text-2xl font-bold">PRO</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold">Pro Plan</h4>
                <p className="text-muted-foreground mt-1 text-xs">
                  Unlimited projects, priority support, and advanced analytics.
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">$29</span>
                <span className="text-muted-foreground text-sm">/ month</span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
