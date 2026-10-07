import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import type { ButtonSize, ButtonVariant } from "darkraise-ui/components/button"
import { ButtonGroup } from "darkraise-ui/components/button-group"
import type { ButtonGroupOrientation } from "darkraise-ui/components/button-group"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/button-group")(
  {
    component: ButtonGroupPage,
  },
)

const BUTTON_GROUP_ORIENTATIONS = allOf<ButtonGroupOrientation>()(
  "horizontal",
  "vertical",
)

// A sample of child styles, not every variant: the buttons page carries the
// enforced variant and size matrix.
const CHILD_VARIANTS = [
  "default",
  "secondary",
  "outline",
] as const satisfies readonly ButtonVariant[]

const CHILD_SIZES = [
  "sm",
  "default",
  "lg",
] as const satisfies readonly ButtonSize[]

function ButtonGroupPage() {
  return (
    <ShowcasePage
      title="Button Group"
      description="Visually-joined set of buttons. The group shares a single border and merges the rounded corners so the buttons read as one segmented control."
    >
      <ShowcaseExample
        title="Orientation"
        code={`// One representative cell: every orientation renders above.
<ButtonGroup orientation="vertical">
  <Button variant="outline">Top</Button>
  <Button variant="outline">Middle</Button>
  <Button variant="outline">Bottom</Button>
</ButtonGroup>`}
      >
        <VariantMatrix
          rows={{ label: "orientation", values: BUTTON_GROUP_ORIENTATIONS }}
          render={(orientation) => (
            <ButtonGroup orientation={orientation}>
              <Button variant="outline">
                {orientation === "horizontal" ? "Left" : "Top"}
              </Button>
              <Button variant="outline">
                {orientation === "horizontal" ? "Center" : "Middle"}
              </Button>
              <Button variant="outline">
                {orientation === "horizontal" ? "Right" : "Bottom"}
              </Button>
            </ButtonGroup>
          )}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Child variant x size"
        code={`// One representative cell: every variant x size renders above.
<ButtonGroup>
  <Button variant="secondary" size="sm">Day</Button>
  <Button variant="secondary" size="sm">Week</Button>
  <Button variant="secondary" size="sm">Month</Button>
</ButtonGroup>`}
      >
        <VariantMatrix
          rows={{ label: "variant", values: CHILD_VARIANTS }}
          cols={{ label: "size", values: CHILD_SIZES }}
          render={(variant, size) => (
            <ButtonGroup>
              <Button variant={variant} size={size}>
                Day
              </Button>
              <Button variant={variant} size={size}>
                Week
              </Button>
              <Button variant={variant} size={size}>
                Month
              </Button>
            </ButtonGroup>
          )}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Disabled child"
        code={`<ButtonGroup>
  <Button variant="outline">Draft</Button>
  <Button variant="outline" disabled>
    Review
  </Button>
  <Button variant="outline">Publish</Button>
</ButtonGroup>`}
      >
        <ButtonGroup>
          <Button variant="outline">Draft</Button>
          <Button variant="outline" disabled>
            Review
          </Button>
          <Button variant="outline">Publish</Button>
        </ButtonGroup>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
