import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "darkraise-ui/components/card"
import { Badge } from "darkraise-ui/components/badge"
import { Skeleton } from "darkraise-ui/components/skeleton"
import {
  Bell,
  Check,
  Image,
  MessageCircle,
  MoreHorizontal,
  TrendingUp,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback } from "darkraise-ui/components/avatar"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/cards")({
  component: CardsPage,
})

function CardsPage() {
  return (
    <ShowcasePage
      title="Cards"
      description="Container with optional header, content, and footer regions for grouping related information."
    >
      {/* ─── Anatomy ──────────────────────────────────────────────────────── */}

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
        title="Content-only card"
        code={`<Card>
  <CardContent className="pt-6">
    <p className="text-sm text-muted-foreground">
      Cards can omit header and footer when used as a simple container.
    </p>
  </CardContent>
</Card>`}
      >
        <div className="max-w-sm">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">
                Cards can omit header and footer when used as a simple
                container.
              </p>
            </CardContent>
          </Card>
        </div>
      </ShowcaseExample>

      {/* ─── Elevation ────────────────────────────────────────────────────── */}

      <ShowcaseExample
        title="Elevation prop"
        code={`<Card elevation>...</Card>             // follow active theme axis
<Card elevation="flat">...</Card>
<Card elevation="low">...</Card>
<Card elevation="medium">...</Card>
<Card elevation="high">...</Card>

// "auto" (boolean true) tracks the active theme elevation: switching the
// axis to "low" flattens the card's shadow, "high" deepens it. Explicit
// levels override the axis (still go flat under data-elevation="flat").`}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card elevation>
            <CardHeader>
              <CardTitle className="text-base">Auto (theme)</CardTitle>
              <CardDescription>
                Tracks the active elevation axis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Toggle the elevation axis in the theme switcher.
              </p>
            </CardContent>
          </Card>
          {(["low", "medium", "high"] as const).map((level) => (
            <Card key={level} elevation={level}>
              <CardHeader>
                <CardTitle className="text-base capitalize">
                  {level} (explicit)
                </CardTitle>
                <CardDescription>Pinned regardless of axis.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Always uses the {level} shadow.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ShowcaseExample>

      {/* ─── Header patterns ──────────────────────────────────────────────── */}

      <ShowcaseExample
        title="Header with badge"
        code={`<Card>
  <CardHeader>
    <div className="flex items-start justify-between">
      <CardTitle>Product Feature</CardTitle>
      <Badge variant="secondary">New</Badge>
    </div>
    <CardDescription>Released in the latest update.</CardDescription>
  </CardHeader>
  ...
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
        title="Header with action menu"
        code={`<CardHeader className="flex-row items-center justify-between space-y-0">
  <div className="space-y-1">
    <CardTitle>Project Atlas</CardTitle>
    <CardDescription>Updated 2 hours ago</CardDescription>
  </div>
  <Button variant="ghost" size="icon" aria-label="Open menu">
    <MoreHorizontal className="h-4 w-4" />
  </Button>
</CardHeader>`}
      >
        <div className="max-w-sm">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>Project Atlas</CardTitle>
                <CardDescription>Updated 2 hours ago</CardDescription>
              </div>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Migration to v3 schema is 80% complete. Two services pending.
              </p>
            </CardContent>
          </Card>
        </div>
      </ShowcaseExample>

      {/* ─── Real-world patterns ──────────────────────────────────────────── */}

      <ShowcaseExample
        title="Stat summary"
        code={`<Card>
  <CardHeader>
    <p className="text-xs text-muted-foreground">Total Revenue</p>
    <div className="flex items-center gap-3">
      <span className="text-3xl font-semibold">$45,231</span>
      <Badge className="gap-1 bg-success/15 text-success hover:bg-success/25">
        <TrendingUp className="h-3 w-3" />
        +12.5%
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <svg viewBox="0 0 100 30" className="h-8 w-full">
      <polyline points="..." stroke="currentColor" className="text-primary" />
    </svg>
  </CardContent>
</Card>`}
      >
        <Card className="max-w-sm">
          <CardHeader>
            <p className="text-muted-foreground text-xs">Total Revenue</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-semibold">$45,231</span>
              <Badge className="bg-success/15 text-success hover:bg-success/25 gap-1">
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
        title="Pricing tier"
        code={`<Card elevation="medium" className="border-primary">
  <CardHeader>
    <Badge variant="default" className="w-fit">Most popular</Badge>
    <CardTitle className="mt-2">Pro</CardTitle>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-semibold">$29</span>
      <span className="text-muted-foreground text-sm">/ month</span>
    </div>
  </CardHeader>
  <CardContent>
    <ul className="space-y-2 text-sm">
      {features.map(f => (
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{f}</li>
      ))}
    </ul>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Upgrade</Button>
  </CardFooter>
</Card>`}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              name: "Hobby",
              price: "$0",
              tag: undefined,
              features: ["1 project", "Community support", "5 GB storage"],
              cta: "Start free",
              highlighted: false,
            },
            {
              name: "Pro",
              price: "$29",
              tag: "Most popular",
              features: [
                "Unlimited projects",
                "Email + chat support",
                "100 GB storage",
                "Custom domain",
              ],
              cta: "Upgrade",
              highlighted: true,
            },
            {
              name: "Team",
              price: "$99",
              tag: undefined,
              features: [
                "Everything in Pro",
                "SSO + audit logs",
                "Priority support",
                "Unlimited storage",
              ],
              cta: "Contact sales",
              highlighted: false,
            },
          ].map((tier) => (
            <Card
              key={tier.name}
              elevation={tier.highlighted ? "medium" : "low"}
              className={tier.highlighted ? "border-primary" : undefined}
            >
              <CardHeader>
                {tier.tag ? (
                  <Badge variant="default" className="w-fit">
                    {tier.tag}
                  </Badge>
                ) : null}
                <CardTitle className={tier.tag ? "mt-2" : undefined}>
                  {tier.name}
                </CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">{tier.price}</span>
                  <span className="text-muted-foreground text-sm">/ month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="text-success h-4 w-4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                >
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Interactive (clickable) card"
        code={`<Card
  asChild
  className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
  elevation="low"
>
  <a href="/articles/scaling-systems">
    <CardHeader>
      <CardTitle>Scaling distributed systems</CardTitle>
      <CardDescription>10 min read · Engineering blog</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Lessons from running multi-region clusters in production.
      </p>
    </CardContent>
  </a>
</Card>

// Card itself doesn't take asChild, so wrap a clickable element using cursor
// + transition utilities for hover affordance, or render an <a> as a child.`}
      >
        <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              title: "Scaling distributed systems",
              meta: "10 min read · Engineering",
              body: "Lessons from running multi-region clusters in production.",
            },
            {
              title: "Designing motion that respects users",
              meta: "6 min read · Design",
              body: "Reduced-motion principles, easing curves, and timing math.",
            },
          ].map((article) => (
            <Card
              key={article.title}
              elevation="low"
              className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
              role="link"
              tabIndex={0}
            >
              <CardHeader>
                <CardTitle className="text-base">{article.title}</CardTitle>
                <CardDescription>{article.meta}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{article.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Loading state"
        code={`<Card>
  <CardHeader>
    <Skeleton className="h-5 w-1/2" />
    <Skeleton className="h-4 w-2/3" />
  </CardHeader>
  <CardContent className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </CardContent>
</Card>`}
      >
        <div className="max-w-sm">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </ShowcaseExample>

      {/* ─── Media + people ───────────────────────────────────────────────── */}

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
        title="User profile"
        code={`<Card className="max-w-sm">
  <CardContent className="flex flex-col items-center gap-3 pt-6">
    <Avatar className="h-16 w-16"><AvatarFallback>JD</AvatarFallback></Avatar>
    <div className="text-center">
      <p className="text-lg font-medium">Jane Doe</p>
      <p className="text-sm text-muted-foreground">Senior Developer</p>
    </div>
    ...
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
    <Button variant="ghost" size="icon" aria-label="Dismiss">
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
            <Button variant="ghost" size="icon" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
