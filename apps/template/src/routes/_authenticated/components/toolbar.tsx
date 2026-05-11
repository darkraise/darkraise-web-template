import { createFileRoute } from "@tanstack/react-router"
import { Bold, Italic, Underline } from "lucide-react"
import { Toggle } from "darkraise-ui/components/toggle"
import { Toolbar, ToolbarSeparator } from "darkraise-ui/components/toolbar"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/toolbar")({
  component: ToolbarPage,
})

function ToolbarPage() {
  return (
    <ShowcasePage
      title="Toolbar"
      description="Compact strip of buttons and toggles with optional separators. Use for editor formatting bars, table-action rows, or inspector controls."
    >
      <ShowcaseExample
        title="Formatting"
        code={`<Toolbar>
  <Toggle aria-label="Bold">
    <Bold className="size-4" />
  </Toggle>
  <Toggle aria-label="Italic">
    <Italic className="size-4" />
  </Toggle>
  <ToolbarSeparator />
  <Toggle aria-label="Underline">
    <Underline className="size-4" />
  </Toggle>
</Toolbar>`}
      >
        <Toolbar>
          <Toggle aria-label="Bold">
            <Bold className="size-4" />
          </Toggle>
          <Toggle aria-label="Italic">
            <Italic className="size-4" />
          </Toggle>
          <ToolbarSeparator />
          <Toggle aria-label="Underline">
            <Underline className="size-4" />
          </Toggle>
        </Toolbar>
      </ShowcaseExample>

      <ShowcaseExample
        title="Vertical"
        code={`<Toolbar orientation="vertical">
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
        </Toolbar>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
