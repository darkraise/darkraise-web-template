import { createFileRoute } from "@tanstack/react-router"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "darkraise-ui/components/resizable"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/resizable")({
  component: ResizablePage,
})

function ResizablePage() {
  return (
    <ShowcasePage
      title="Resizable"
      description="Split-panel container with draggable dividers. Each panel takes a defaultSize (percentage) and reflows when the user drags a handle."
    >
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
