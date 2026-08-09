import { createFileRoute } from "@tanstack/react-router"
import { Spinner } from "darkraise-ui/components/spinner"
import type {
  SpinnerSize,
  SpinnerVariant,
} from "darkraise-ui/components/spinner"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/spinner")({
  component: SpinnerPage,
})

const SPINNER_VARIANTS = allOf<SpinnerVariant>()("default", "primary", "muted")
const SPINNER_SIZES = allOf<SpinnerSize>()("sm", "md", "lg")

function SpinnerPage() {
  return (
    <ShowcasePage
      title="Spinner"
      description="Indeterminate loading indicator. Three sizes and three variants — pick by surface contrast."
    >
      <ShowcaseExample
        title="Variant x size"
        code={`// One representative cell: every variant x size combination renders above.
<Spinner variant="primary" size="lg" />`}
      >
        <VariantMatrix
          rows={{ label: "variant", values: SPINNER_VARIANTS }}
          cols={{ label: "size", values: SPINNER_SIZES }}
          render={(variant, size) => <Spinner variant={variant} size={size} />}
        />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
