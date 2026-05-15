import { createFileRoute } from "@tanstack/react-router"
import {
  Anchor,
  Bird,
  Boxes,
  Briefcase,
  Building2,
  Cherry,
  Coffee,
  Cpu,
  Flame,
  Globe2,
  Quote,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react"
import { Marquee } from "darkraise-ui/components/marquee"
import { Avatar, AvatarFallback } from "darkraise-ui/components/avatar"
import { Card, CardContent } from "darkraise-ui/components/card"
import { Badge } from "darkraise-ui/components/badge"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/marquee")({
  component: MarqueePage,
})

const BRANDS = ["Acme", "Globex", "Initech", "Umbrella", "Stark", "Wayne"]

const LOGO_BRANDS = [
  { name: "Acme", Icon: Boxes },
  { name: "Globex", Icon: Globe2 },
  { name: "Initech", Icon: Cpu },
  { name: "Umbrella", Icon: Briefcase },
  { name: "Stark", Icon: Zap },
  { name: "Wayne", Icon: Building2 },
  { name: "Cyberdyne", Icon: Flame },
  { name: "Soylent", Icon: Cherry },
  { name: "Tyrell", Icon: Sparkles },
  { name: "Hooli", Icon: Anchor },
  { name: "Pied Piper", Icon: Bird },
  { name: "Aperture", Icon: Coffee },
] as const

const TESTIMONIALS = [
  {
    quote: "Cut our onboarding from a week to an afternoon.",
    name: "Maya Okafor",
    role: "Staff Engineer, Northwind",
    initials: "MO",
  },
  {
    quote: "Honestly the best dev experience we've shipped on this year.",
    name: "Jin Park",
    role: "VP Eng, Lumen",
    initials: "JP",
  },
  {
    quote: "Replaced four internal libs and nobody on the team complained.",
    name: "Priya Raghavan",
    role: "Tech Lead, Vertex",
    initials: "PR",
  },
  {
    quote: "The theme system alone paid for itself the first sprint.",
    name: "Daniel Reyes",
    role: "Design Engineer, Orbit",
    initials: "DR",
  },
  {
    quote: "We deleted three feature flags after the migration. Cleaner code.",
    name: "Sofia Lindqvist",
    role: "Principal, Echo",
    initials: "SL",
  },
] as const

const TICKERS = [
  { symbol: "ACME", price: "184.22", delta: 1.84, up: true },
  { symbol: "GLBX", price: "92.10", delta: -0.42, up: false },
  { symbol: "INIT", price: "37.55", delta: 0.91, up: true },
  { symbol: "UMBR", price: "212.40", delta: -2.13, up: false },
  { symbol: "STRK", price: "1,418.06", delta: 24.7, up: true },
  { symbol: "WAYN", price: "76.88", delta: 0.05, up: true },
  { symbol: "CYBR", price: "9.42", delta: -0.18, up: false },
  { symbol: "TYRL", price: "311.27", delta: 5.62, up: true },
] as const

// Tailwind arbitrary mask — fades both horizontal edges of the marquee so
// items appear to enter and leave smoothly instead of cutting off at the
// container edge. Reusable across the richer demos below.
const FADE_EDGES =
  "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"

function MarqueePage() {
  return (
    <ShowcasePage
      title="Marquee"
      description="Horizontally scrolling row of content. The component duplicates its children so the loop is seamless, and supports pause-on-hover plus reversed direction."
    >
      <ShowcaseExample
        title="Default"
        code={`const BRANDS = ["Acme", "Globex", "Initech", "Umbrella", "Stark", "Wayne"]

<Marquee className="text-muted-foreground text-sm">
  {BRANDS.map((b) => (
    <span key={b} className="mx-6 font-semibold tracking-wide uppercase">
      {b}
    </span>
  ))}
</Marquee>`}
      >
        <Marquee className="text-muted-foreground text-sm">
          {BRANDS.map((b) => (
            <span
              key={b}
              className="mx-6 font-semibold tracking-wide uppercase"
            >
              {b}
            </span>
          ))}
        </Marquee>
      </ShowcaseExample>

      <ShowcaseExample
        title="Pause on hover, reversed"
        code={`<Marquee pauseOnHover reverse className="text-muted-foreground text-sm">
  {BRANDS.map((b) => (
    <span key={b} className="mx-6 font-semibold tracking-wide uppercase">
      {b}
    </span>
  ))}
</Marquee>`}
      >
        <Marquee pauseOnHover reverse className="text-muted-foreground text-sm">
          {BRANDS.map((b) => (
            <span
              key={b}
              className="mx-6 font-semibold tracking-wide uppercase"
            >
              {b}
            </span>
          ))}
        </Marquee>
      </ShowcaseExample>

      <ShowcaseExample
        title="Logo wall with icons and fade edges"
        code={`// A mask-image fade at both edges makes items appear to enter and
// leave smoothly instead of cutting off at the container border. The
// pill chrome is just utility classes — the marquee itself is the
// same component.

const LOGO_BRANDS = [
  { name: "Acme", Icon: Boxes },
  { name: "Globex", Icon: Globe2 },
  // ...etc.
]

<Marquee
  pauseOnHover
  duration={24000}
  className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
>
  {LOGO_BRANDS.map(({ name, Icon }) => (
    <div
      key={name}
      className="bg-card text-card-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm"
    >
      <Icon className="text-muted-foreground size-4" />
      <span className="text-sm font-semibold tracking-wide">{name}</span>
    </div>
  ))}
</Marquee>`}
      >
        <Marquee pauseOnHover duration={24000} className={FADE_EDGES}>
          {LOGO_BRANDS.map(({ name, Icon }) => (
            <div
              key={name}
              className="bg-card text-card-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm"
            >
              <Icon className="text-muted-foreground size-4" />
              <span className="text-sm font-semibold tracking-wide">
                {name}
              </span>
            </div>
          ))}
        </Marquee>
      </ShowcaseExample>

      <ShowcaseExample
        title="Testimonial cards"
        code={`// Wider items + a longer duration = a calmer scroll, perfect for
// content the user might want to read mid-loop. pauseOnHover lets
// them stop on anything that catches their eye.

<Marquee pauseOnHover duration={42000} className={FADE_EDGES}>
  {TESTIMONIALS.map((t) => (
    <Card key={t.name} className="w-80 shrink-0">
      <CardContent className="space-y-3 p-4">
        <Quote className="text-muted-foreground size-4" />
        <p className="text-sm leading-relaxed">{t.quote}</p>
        <div className="flex items-center gap-3 pt-1">
          <Avatar className="size-8">
            <AvatarFallback>{t.initials}</AvatarFallback>
          </Avatar>
          <div className="text-xs">
            <div className="font-medium">{t.name}</div>
            <div className="text-muted-foreground">{t.role}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</Marquee>`}
      >
        <Marquee pauseOnHover duration={42000} className={FADE_EDGES}>
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="w-80 shrink-0">
              <CardContent className="space-y-3 p-4">
                <Quote className="text-muted-foreground size-4" />
                <p className="text-sm leading-relaxed">{t.quote}</p>
                <div className="flex items-center gap-3 pt-1">
                  <Avatar className="size-8">
                    <AvatarFallback>{t.initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </Marquee>
      </ShowcaseExample>

      <ShowcaseExample
        title="Stock ticker"
        code={`// Tighter spacing, monospace prices, and a green/red delta with an
// arrow icon. Speed is intentionally a little quicker than the other
// examples to read as a live feed.

<Marquee duration={20000} className={\`\${FADE_EDGES} font-mono text-sm\`}>
  {TICKERS.map((t) => (
    <div key={t.symbol} className="flex items-center gap-2">
      <span className="font-semibold">{t.symbol}</span>
      <span>{t.price}</span>
      <Badge
        variant={t.up ? "secondary" : "destructive"}
        className="gap-1 px-1.5 py-0 font-mono text-[11px]"
      >
        {t.up ? (
          <TrendingUp className="size-3" />
        ) : (
          <TrendingDown className="size-3" />
        )}
        {t.up ? "+" : ""}
        {t.delta.toFixed(2)}
      </Badge>
    </div>
  ))}
</Marquee>`}
      >
        <Marquee duration={20000} className={`${FADE_EDGES} font-mono text-sm`}>
          {TICKERS.map((t) => (
            <div key={t.symbol} className="flex items-center gap-2">
              <span className="font-semibold">{t.symbol}</span>
              <span>{t.price}</span>
              <Badge
                variant={t.up ? "secondary" : "destructive"}
                className="gap-1 px-1.5 py-0 font-mono text-[11px]"
              >
                {t.up ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {t.up ? "+" : ""}
                {t.delta.toFixed(2)}
              </Badge>
            </div>
          ))}
        </Marquee>
      </ShowcaseExample>

      <ShowcaseExample
        title="Two-row counter-scroll"
        code={`// Two marquees stacked, one reversed, scrolling at slightly different
// speeds. The mismatch keeps adjacent items from staying aligned for
// long, which makes the whole strip feel more alive than a single row.

<div className="space-y-2">
  <Marquee duration={26000} className={FADE_EDGES}>
    {/* row one — same logo pills */}
  </Marquee>
  <Marquee reverse duration={32000} className={FADE_EDGES}>
    {/* row two — same logo pills, scrolled the other way */}
  </Marquee>
</div>`}
      >
        <div className="space-y-2">
          <Marquee duration={26000} className={FADE_EDGES}>
            {LOGO_BRANDS.map(({ name, Icon }) => (
              <div
                key={name}
                className="bg-card text-card-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm"
              >
                <Icon className="text-muted-foreground size-4" />
                <span className="text-sm font-semibold tracking-wide">
                  {name}
                </span>
              </div>
            ))}
          </Marquee>
          <Marquee reverse duration={32000} className={FADE_EDGES}>
            {LOGO_BRANDS.map(({ name, Icon }) => (
              <div
                key={`${name}-reverse`}
                className="bg-card text-card-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm"
              >
                <Icon className="text-muted-foreground size-4" />
                <span className="text-sm font-semibold tracking-wide">
                  {name}
                </span>
              </div>
            ))}
          </Marquee>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
