import { createFileRoute } from "@tanstack/react-router"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "darkraise-ui/components/resizable"
import type { ResizableOrientation } from "darkraise-ui/components/resizable"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/resizable")({
  component: ResizablePage,
})

const RESIZABLE_ORIENTATIONS = allOf<ResizableOrientation>()(
  "horizontal",
  "vertical",
)

function ResizablePage() {
  return (
    <ShowcasePage
      title="Resizable"
      description="Split-panel container with draggable dividers. Each panel takes a defaultSize (percentage) and reflows when the user drags a handle."
    >
      <ShowcaseExample
        title="Orientation"
        code={`// One representative cell: every orientation renders above.
// A resizable panel group fills its container, so each cell gets an
// explicit height (and a width for the vertical stack) to stay usable.
<ResizablePanelGroup orientation="vertical" className="h-72 w-72 rounded-md border">
  <ResizablePanel defaultSize={50}>
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">Top panel</span>
    </div>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={50}>
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">Bottom panel</span>
    </div>
  </ResizablePanel>
</ResizablePanelGroup>`}
      >
        <VariantMatrix
          rows={{ label: "orientation", values: RESIZABLE_ORIENTATIONS }}
          render={(orientation) => (
            <ResizablePanelGroup
              orientation={orientation}
              className={
                orientation === "horizontal"
                  ? "h-40 rounded-md border"
                  : "h-72 w-72 rounded-md border"
              }
            >
              <ResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center p-4">
                  <span className="text-muted-foreground text-sm">
                    {orientation === "horizontal" ? "Left panel" : "Top panel"}
                  </span>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center p-4">
                  <span className="text-muted-foreground text-sm">
                    {orientation === "horizontal"
                      ? "Right panel"
                      : "Bottom panel"}
                  </span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Two-panel horizontal"
        code={`<ResizablePanelGroup orientation="horizontal" className="h-40 rounded-md border">
  <ResizablePanel defaultSize={50}>
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">Left panel</span>
    </div>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={50}>
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">Right panel</span>
    </div>
  </ResizablePanel>
</ResizablePanelGroup>`}
      >
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-40 rounded-md border"
        >
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-muted-foreground text-sm">Left panel</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-muted-foreground text-sm">Right panel</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ShowcaseExample>

      <ShowcaseExample
        title="Three panels with min sizes"
        code={`<ResizablePanelGroup orientation="horizontal" className="h-40 rounded-md border">
  <ResizablePanel defaultSize={20} minSize={15}>
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm">Sidebar</span>
    </div>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={60} minSize={30}>
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm">Main</span>
    </div>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={20} minSize={15}>
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm">Inspector</span>
    </div>
  </ResizablePanel>
</ResizablePanelGroup>`}
      >
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-40 rounded-md border"
        >
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-sm">Sidebar</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-sm">Main</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-sm">Inspector</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
