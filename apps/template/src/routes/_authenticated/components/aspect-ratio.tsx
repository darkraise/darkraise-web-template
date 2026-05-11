import { createFileRoute } from "@tanstack/react-router"
import { AspectRatio } from "darkraise-ui/components/aspect-ratio"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/aspect-ratio")(
  {
    component: AspectRatioPage,
  },
)

function AspectRatioPage() {
  return (
    <ShowcasePage
      title="Aspect Ratio"
      description="Constrain a child to a specific width-to-height ratio. The ratio holds at any container width via a padding-bottom percentage trick."
    >
      <ShowcaseExample
        title="16:9 container"
        code={`<div className="w-64">
  <AspectRatio ratio={16 / 9}>
    <div className="h-full w-full rounded-md bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
      <span className="text-sm text-muted-foreground">16 / 9</span>
    </div>
  </AspectRatio>
</div>`}
      >
        <div className="w-64">
          <AspectRatio ratio={16 / 9}>
            <div className="from-primary/30 to-primary/5 flex h-full w-full items-center justify-center rounded-md bg-gradient-to-br">
              <span className="text-muted-foreground text-sm">16 / 9</span>
            </div>
          </AspectRatio>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Square (1:1)"
        code={`<div className="w-48">
  <AspectRatio ratio={1}>
    <div className="h-full w-full rounded-md bg-muted flex items-center justify-center">
      <span className="text-sm text-muted-foreground">1 / 1</span>
    </div>
  </AspectRatio>
</div>`}
      >
        <div className="w-48">
          <AspectRatio ratio={1}>
            <div className="bg-muted flex h-full w-full items-center justify-center rounded-md">
              <span className="text-muted-foreground text-sm">1 / 1</span>
            </div>
          </AspectRatio>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Portrait (9:16)"
        code={`<div className="w-40">
  <AspectRatio ratio={9 / 16}>
    <div className="h-full w-full rounded-md bg-gradient-to-b from-primary/20 to-primary/5 flex items-center justify-center">
      <span className="text-sm text-muted-foreground">9 / 16</span>
    </div>
  </AspectRatio>
</div>`}
      >
        <div className="w-40">
          <AspectRatio ratio={9 / 16}>
            <div className="from-primary/20 to-primary/5 flex h-full w-full items-center justify-center rounded-md bg-gradient-to-b">
              <span className="text-muted-foreground text-sm">9 / 16</span>
            </div>
          </AspectRatio>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
