import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "darkraise-ui/components/card"
import { Input } from "darkraise-ui/components/input"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/accent-surfaces",
)({
  component: AccentSurfacesPage,
})

type SurfaceDemoProps = {
  variant: string
  title: string
  description: string
}

function SurfaceDemo({ variant, title, description }: SurfaceDemoProps) {
  return (
    <div className={`dr-surface ${variant} rounded-lg p-6`}>
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Type inside a tinted surface" />
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AccentSurfacesPage() {
  return (
    <ShowcasePage
      title="Accent Surfaces"
      description="Local tinted regions built from color-mix. Each surface re-emits the fog ramp, borders, and glow tokens so nested primitives inherit the accent automatically."
    >
      <ShowcaseExample
        title="Brand"
        code={`<div className="dr-surface dr-surface-brand rounded-lg p-6">
  <Card>...</Card>
</div>`}
      >
        <SurfaceDemo
          variant="dr-surface-brand"
          title="Brand surface"
          description="Violet-led accent with cyan and lighter violet blobs."
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Cyan"
        code={`<div className="dr-surface dr-surface-cyan rounded-lg p-6">
  <Card>...</Card>
</div>`}
      >
        <SurfaceDemo
          variant="dr-surface-cyan"
          title="Cyan surface"
          description="Cyan-led accent blending into blue and lighter cyan."
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Success"
        code={`<div className="dr-surface dr-surface-success rounded-lg p-6">
  <Card>...</Card>
</div>`}
      >
        <SurfaceDemo
          variant="dr-surface-success"
          title="Success surface"
          description="Emerald-led accent for positive states and confirmations."
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Warning"
        code={`<div className="dr-surface dr-surface-warning rounded-lg p-6">
  <Card>...</Card>
</div>`}
      >
        <SurfaceDemo
          variant="dr-surface-warning"
          title="Warning surface"
          description="Amber-led accent for caution and pending states."
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Danger"
        code={`<div className="dr-surface dr-surface-danger rounded-lg p-6">
  <Card>...</Card>
</div>`}
      >
        <SurfaceDemo
          variant="dr-surface-danger"
          title="Danger surface"
          description="Red-led accent for destructive or failure states."
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Info"
        code={`<div className="dr-surface dr-surface-info rounded-lg p-6">
  <Card>...</Card>
</div>`}
      >
        <SurfaceDemo
          variant="dr-surface-info"
          title="Info surface"
          description="Blue-led accent for neutral information and tips."
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Flat variant"
        code={`<div className="dr-surface dr-surface-success dr-surface--flat rounded-lg p-6">
  <p>Flat status banner — keeps tokens, skips gradient + grain.</p>
  <Button variant="outline">Dismiss</Button>
</div>`}
      >
        <div className="dr-surface dr-surface-success dr-surface--flat flex items-center justify-between gap-4 rounded-lg p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Deployment completed successfully
            </p>
            <p className="text-muted-foreground text-xs">
              Flat surface keeps the tinted tokens but skips the radial gradient
              and noise overlay.
            </p>
          </div>
          <Button variant="outline">Dismiss</Button>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
