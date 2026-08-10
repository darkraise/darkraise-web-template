import { createFileRoute } from "@tanstack/react-router"
import { Bold, Italic, Underline } from "lucide-react"
import { Toggle } from "darkraise-ui/components/toggle"
import { Toolbar, ToolbarSeparator } from "darkraise-ui/components/toolbar"
import type { ToolbarOrientation } from "darkraise-ui/components/toolbar"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/toolbar")({
  component: ToolbarPage,
})

const TOOLBAR_ORIENTATIONS = allOf<ToolbarOrientation>()(
  "horizontal",
  "vertical",
)

function ToolbarPage() {
  return (
    <ShowcasePage
      title="Toolbar"
      description="Compact strip of buttons and toggles with optional separators. Use for editor formatting bars, table-action rows, or inspector controls."
    >
      <ShowcaseExample
        title="Orientation"
        code={`// One representative cell: every orientation renders above.
<Toolbar orientation="vertical">
  <Toggle aria-label="Bold">
    <Bold className="size-4" />
  </Toggle>
  <Toggle aria-label="Italic">
    <Italic className="size-4" />
  </Toggle>
  <ToolbarSeparator orientation="horizontal" />
  <Toggle aria-label="Underline">
    <Underline className="size-4" />
  </Toggle>
</Toolbar>`}
      >
        <VariantMatrix
          rows={{ label: "orientation", values: TOOLBAR_ORIENTATIONS }}
          render={(orientation) => (
            <Toolbar orientation={orientation}>
              <Toggle aria-label="Bold">
                <Bold className="size-4" />
              </Toggle>
              <Toggle aria-label="Italic">
                <Italic className="size-4" />
              </Toggle>
              <ToolbarSeparator
                orientation={
                  orientation === "horizontal" ? "vertical" : "horizontal"
                }
              />
              <Toggle aria-label="Underline">
                <Underline className="size-4" />
              </Toggle>
            </Toolbar>
          )}
        />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
