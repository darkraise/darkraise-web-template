import { createFileRoute } from "@tanstack/react-router"
import { Spinner } from "darkraise-ui/components/spinner"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/spinner")({
  component: SpinnerPage,
})

function SpinnerPage() {
  return (
    <ShowcasePage
      title="Spinner"
      description="Indeterminate loading indicator. Three sizes and three variants — pick by surface contrast."
    >
      <ShowcaseExample
        title="Sizes"
        code={`<div className="flex items-center gap-6">
  <Spinner size="sm" />
  <Spinner size="md" />
  <Spinner size="lg" />
</div>`}
      >
        <div className="flex items-center gap-6">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Variants"
        code={`<div className="flex items-center gap-6">
  <Spinner variant="default" />
  <Spinner variant="primary" />
  <Spinner variant="muted" />
</div>`}
      >
        <div className="flex items-center gap-6">
          <Spinner variant="default" />
          <Spinner variant="primary" />
          <Spinner variant="muted" />
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
