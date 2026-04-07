import { createFileRoute } from "@tanstack/react-router"
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
import { TrendingUp, Image, MessageCircle, X, Bell } from "lucide-react"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/cards")({
  component: CardsPage,
})

function CardsPage() {
  return (
    <ShowcasePage
      title="Cards"
      description="Container component with header, content, and footer regions for grouping related information."
    >
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
              <p className="text-muted-foreground text-sm">
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
              <CardDescription>Released in the latest update.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
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
              <p className="text-muted-foreground text-sm">
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
              className={`${token} ring-border rounded-lg p-4 ring-1`}
            >
              <p className="text-muted-foreground font-mono text-xs font-medium">
                {label}
              </p>
              <p className="mt-1 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Stat summary card"
        code={`<Card className="max-w-sm">
  <CardHeader>
    <p className="text-xs text-muted-foreground">Total Revenue</p>
    <div className="flex items-center gap-3">
      <span className="text-3xl font-semibold">$45,231</span>
      <Badge className="gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20">
        <TrendingUp className="h-3 w-3" />
        +12.5%
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <svg viewBox="0 0 100 30" className="h-8 w-full">
      <polyline
        points="0,25 15,18 30,22 45,10 60,15 75,8 90,5 100,2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
      />
    </svg>
  </CardContent>
</Card>`}
      >
        <Card className="max-w-sm">
          <CardHeader>
            <p className="text-muted-foreground text-xs">Total Revenue</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-semibold">$45,231</span>
              <Badge className="gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20">
                <TrendingUp className="h-3 w-3" />
                +12.5%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 100 30" className="h-8 w-full">
              <polyline
                points="0,25 15,18 30,22 45,10 60,15 75,8 90,5 100,2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary"
              />
            </svg>
          </CardContent>
        </Card>
      </ShowcaseExample>

      <ShowcaseExample
        title="Media card"
        code={`<Card className="max-w-sm">
  <div className="h-48 rounded-t-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
    <Image className="h-12 w-12 text-muted-foreground" />
  </div>
  <CardHeader>
    <CardTitle>Beautiful Landscape</CardTitle>
    <CardDescription>A stunning view of the mountains at dawn.</CardDescription>
  </CardHeader>
  <CardFooter className="gap-2">
    <Button variant="outline" size="sm">Learn More</Button>
    <Button size="sm">Get Started</Button>
  </CardFooter>
</Card>`}
      >
        <Card className="max-w-sm">
          <div className="from-primary/20 to-primary/5 flex h-48 items-center justify-center rounded-t-lg bg-gradient-to-br">
            <Image className="text-muted-foreground h-12 w-12" />
          </div>
          <CardHeader>
            <CardTitle>Beautiful Landscape</CardTitle>
            <CardDescription>
              A stunning view of the mountains at dawn.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-2">
            <Button variant="outline" size="sm">
              Learn More
            </Button>
            <Button size="sm">Get Started</Button>
          </CardFooter>
        </Card>
      </ShowcaseExample>

      <ShowcaseExample
        title="User profile card"
        code={`<Card className="max-w-sm">
  <CardContent className="flex flex-col items-center gap-3 pt-6">
    <Avatar className="mx-auto h-16 w-16">
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
    <div className="space-y-1 text-center">
      <p className="text-lg font-medium">Jane Doe</p>
      <p className="text-sm text-muted-foreground">Senior Developer</p>
    </div>
    <p className="text-center text-sm text-muted-foreground">
      Passionate about building great products and mentoring engineers.
    </p>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="gap-1.5">
        <MessageCircle className="h-4 w-4" />
        Message
      </Button>
      <Button size="sm">Follow</Button>
    </div>
  </CardContent>
</Card>`}
      >
        <Card className="max-w-sm">
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            <Avatar className="mx-auto h-16 w-16">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center">
              <p className="text-lg font-medium">Jane Doe</p>
              <p className="text-muted-foreground text-sm">Senior Developer</p>
            </div>
            <p className="text-muted-foreground text-center text-sm">
              Passionate about building great products and mentoring engineers.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
              <Button size="sm">Follow</Button>
            </div>
          </CardContent>
        </Card>
      </ShowcaseExample>

      <ShowcaseExample
        title="Notification card"
        code={`<Card>
  <div className="flex items-start gap-4 p-4">
    <div className="rounded-full bg-muted p-2">
      <Bell className="h-4 w-4" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium">New order #1234 received</p>
      <p className="text-xs text-muted-foreground">2 minutes ago</p>
    </div>
    <Button variant="ghost" size="icon">
      <X className="h-4 w-4" />
    </Button>
  </div>
</Card>`}
      >
        <Card className="max-w-sm">
          <div className="flex items-start gap-4 p-4">
            <div className="bg-muted rounded-full p-2">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">New order #1234 received</p>
              <p className="text-muted-foreground text-xs">2 minutes ago</p>
            </div>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
