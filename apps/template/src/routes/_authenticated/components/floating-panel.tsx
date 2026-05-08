import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  FloatingPanel,
  FloatingPanelContent,
  FloatingPanelHeader,
  FloatingPanelResizeHandle,
} from "darkraise-ui/components/floating-panel"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/floating-panel",
)({
  component: FloatingPanelPage,
})

function FloatingPanelPage() {
  const [position, setPosition] = useState({ x: 40, y: 40 })

  return (
    <ShowcasePage
      title="Floating Panel"
      description="An absolutely positioned panel you can drag from its header and resize from a corner handle. Pointer state is internal; positions and sizes can be controlled."
    >
      <ShowcaseExample
        title="Basic floating panel"
        code={`<div className="relative h-80 border rounded-md">
  <FloatingPanel
    defaultPosition={{ x: 50, y: 50 }}
    defaultSize={{ width: 240, height: 160 }}
  >
    <FloatingPanelHeader>Drag me</FloatingPanelHeader>
    <FloatingPanelContent>Some content</FloatingPanelContent>
    <FloatingPanelResizeHandle />
  </FloatingPanel>
</div>`}
      >
        <div className="border-border relative h-80 overflow-hidden rounded-md border">
          <FloatingPanel
            defaultPosition={{ x: 50, y: 50 }}
            defaultSize={{ width: 240, height: 160 }}
          >
            <FloatingPanelHeader>Drag me</FloatingPanelHeader>
            <FloatingPanelContent>
              <p className="text-sm">
                Drag the header to reposition, or pull the corner to resize.
              </p>
            </FloatingPanelContent>
            <FloatingPanelResizeHandle />
          </FloatingPanel>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Controlled position"
        code={`const [position, setPosition] = useState({ x: 40, y: 40 })

<FloatingPanel
  position={position}
  onPositionChange={setPosition}
  defaultSize={{ width: 220, height: 140 }}
>
  <FloatingPanelHeader>Drag me</FloatingPanelHeader>
  <FloatingPanelContent>
    Position: {position.x}, {position.y}
  </FloatingPanelContent>
  <FloatingPanelResizeHandle />
</FloatingPanel>`}
      >
        <div className="space-y-3">
          <div className="border-border relative h-80 overflow-hidden rounded-md border">
            <FloatingPanel
              position={position}
              onPositionChange={setPosition}
              defaultSize={{ width: 220, height: 140 }}
            >
              <FloatingPanelHeader>Drag me</FloatingPanelHeader>
              <FloatingPanelContent>
                <p className="text-sm">
                  Position: {Math.round(position.x)}, {Math.round(position.y)}
                </p>
              </FloatingPanelContent>
              <FloatingPanelResizeHandle />
            </FloatingPanel>
          </div>
          <p className="text-muted-foreground text-xs">
            Current position: x={Math.round(position.x)}, y=
            {Math.round(position.y)}
          </p>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
