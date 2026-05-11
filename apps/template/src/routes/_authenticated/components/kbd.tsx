import { createFileRoute } from "@tanstack/react-router"
import { Kbd } from "darkraise-ui/components/kbd"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/kbd")({
  component: KbdPage,
})

function KbdPage() {
  return (
    <ShowcasePage
      title="Kbd"
      description="Inline keyboard key indicator. Use to label shortcuts in help text, command palettes, and onboarding copy."
    >
      <ShowcaseExample
        title="Single keys"
        code={`<div className="flex flex-wrap items-center gap-2 text-sm">
  <Kbd>⌘K</Kbd>
  <Kbd>Esc</Kbd>
  <Kbd>Enter</Kbd>
</div>`}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Kbd>⌘K</Kbd>
          <Kbd>Esc</Kbd>
          <Kbd>Enter</Kbd>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Combos inside body text"
        code={`<div className="text-muted-foreground flex flex-col gap-2 text-sm">
  <p>
    Press <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to open the command palette.
  </p>
  <p>
    Use <Kbd>Shift</Kbd> + <Kbd>?</Kbd> to view the keyboard shortcuts.
  </p>
</div>`}
      >
        <div className="text-muted-foreground flex flex-col gap-2 text-sm">
          <p>
            Press <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to open the command palette.
          </p>
          <p>
            Use <Kbd>Shift</Kbd> + <Kbd>?</Kbd> to view the keyboard shortcuts.
          </p>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
