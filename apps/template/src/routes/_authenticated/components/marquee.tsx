import { createFileRoute } from "@tanstack/react-router"
import { Marquee } from "darkraise-ui/components/marquee"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/marquee")({
  component: MarqueePage,
})

const BRANDS = ["Acme", "Globex", "Initech", "Umbrella", "Stark", "Wayne"]

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
    </ShowcasePage>
  )
}
