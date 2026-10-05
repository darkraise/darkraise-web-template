import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { CircleCheck, Info, OctagonX, TriangleAlert } from "lucide-react"
import { Banner } from "darkraise-ui/components/banner"
import type { BannerVariant } from "darkraise-ui/components/banner"
import { Button } from "darkraise-ui/components/button"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/banner")({
  component: BannerPage,
})

const BANNER_VARIANTS = allOf<BannerVariant>()(
  "default",
  "info",
  "success",
  "warning",
  "destructive",
)

const bannerIconByVariant: Record<BannerVariant, React.ElementType> = {
  default: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: OctagonX,
}

function DismissibleBannerExample() {
  const [visible, setVisible] = useState(true)
  return (
    <div className="space-y-3">
      {visible ? (
        <Banner
          variant="info"
          icon={<Info />}
          dismissible
          onDismiss={() => setVisible(false)}
        >
          A new version is available. Refresh to update.
        </Banner>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setVisible(true)}>
          Show banner
        </Button>
      )}
    </div>
  )
}

function BannerPage() {
  return (
    <ShowcasePage
      title="Banner"
      description="Full-width status messages. Five severity variants plus an optional dismissible mode."
    >
      <ShowcaseExample
        title="Variants"
        code={`// One representative cell: every variant renders above.
<Banner variant="warning" icon={<TriangleAlert />}>
  Status message.
</Banner>`}
      >
        <VariantMatrix
          rows={{ label: "variant", values: BANNER_VARIANTS }}
          render={(variant) => {
            const Icon = bannerIconByVariant[variant]
            return (
              <Banner variant={variant} icon={<Icon />}>
                Status message.
              </Banner>
            )
          }}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Dismissible"
        code={`function DismissibleBannerExample() {
  const [visible, setVisible] = useState(true)
  return (
    <div className="space-y-3">
      {visible ? (
        <Banner variant="info" icon={<Info />} dismissible onDismiss={() => setVisible(false)}>
          A new version is available. Refresh to update.
        </Banner>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setVisible(true)}>
          Show banner
        </Button>
      )}
    </div>
  )
}`}
      >
        <DismissibleBannerExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
