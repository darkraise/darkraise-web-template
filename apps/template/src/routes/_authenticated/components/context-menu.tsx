import { createFileRoute } from "@tanstack/react-router"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "darkraise-ui/components/context-menu"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/context-menu")(
  {
    component: ContextMenuPage,
  },
)

function ContextMenuPage() {
  return (
    <ShowcasePage
      title="Context Menu"
      description="Right-click anchored menu. Same item primitives as DropdownMenu but triggered by the platform contextmenu event (right-click on desktop, long-press on touch)."
    >
      <ShowcaseExample
        title="Basic actions"
        code={`<ContextMenu>
  <ContextMenuTrigger asChild>
    <div className="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      Right-click here
    </div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Copy</ContextMenuItem>
    <ContextMenuItem>Paste</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>Select All</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem className="text-destructive">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="text-muted-foreground flex min-h-[150px] items-center justify-center rounded-lg border border-dashed text-sm">
              Right-click here
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Copy</ContextMenuItem>
            <ContextMenuItem>Paste</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Select All</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-destructive">
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
