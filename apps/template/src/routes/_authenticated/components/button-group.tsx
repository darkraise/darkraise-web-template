import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
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
    </ShowcasePage>
  )
}
