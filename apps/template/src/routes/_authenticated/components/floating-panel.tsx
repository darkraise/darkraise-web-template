import { useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  FloatingPanel,
  FloatingPanelCloseTrigger,
  FloatingPanelContent,
  FloatingPanelDragHandle,
  FloatingPanelHeader,
  FloatingPanelMaximizeTrigger,
  FloatingPanelMinimizeTrigger,
  FloatingPanelPinTrigger,
  FloatingPanelResizeHandle,
  FloatingPanelTitle,
} from "darkraise-ui/components/floating-panel"
import { Button } from "darkraise-ui/components/button"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/floating-panel",
)({
  component: FloatingPanelPage,
})

function FloatingPanelPage() {
  const [position, setPosition] = useState({ x: 40, y: 40 })
  const [open, setOpen] = useState(true)
  // Track open global panels by id so the user can stack several of them at
  // once. Each click of the trigger button appends a new id; closing a panel
  // (× button or programmatic onOpenChange(false)) removes it from the list.
  const [globalPanelIds, setGlobalPanelIds] = useState<number[]>([])
  const nextGlobalIdRef = useRef(1)
  const openGlobalPanel = () => {
    setGlobalPanelIds((prev) => [...prev, nextGlobalIdRef.current++])
  }
  const closeGlobalPanel = (id: number) => {
    setGlobalPanelIds((prev) => prev.filter((i) => i !== id))
  }

  return (
    <ShowcasePage
      title="Floating Panel"
      description="An absolutely positioned panel you can drag from its header and resize from a corner handle. Optional drag handle, title, minimize / maximize / close triggers compose into a familiar window-chrome layout."
    >
      <ShowcaseExample
        title="With chrome (drag handle, title, triggers)"
        code={`<FloatingPanel
  defaultPosition={{ x: 50, y: 50 }}
  defaultSize={{ width: 320, height: 220 }}
>
  <FloatingPanelHeader>
    <FloatingPanelDragHandle />
    <FloatingPanelTitle>Floating Panel</FloatingPanelTitle>
    <FloatingPanelMinimizeTrigger />
    <FloatingPanelMaximizeTrigger />
    <FloatingPanelCloseTrigger />
  </FloatingPanelHeader>
  <FloatingPanelContent>Drag me around</FloatingPanelContent>
  <FloatingPanelResizeHandle />
</FloatingPanel>`}
      >
        <div className="border-border relative h-96 overflow-hidden rounded-md border">
          {open ? (
            <FloatingPanel
              defaultPosition={{ x: 60, y: 50 }}
              defaultSize={{ width: 320, height: 220 }}
              open={open}
              onOpenChange={setOpen}
            >
              <FloatingPanelHeader>
                <FloatingPanelDragHandle />
                <FloatingPanelTitle>Floating Panel</FloatingPanelTitle>
                <FloatingPanelMinimizeTrigger />
                <FloatingPanelMaximizeTrigger />
                <FloatingPanelCloseTrigger />
              </FloatingPanelHeader>
              <FloatingPanelContent>
                <p className="text-sm">Drag me around</p>
              </FloatingPanelContent>
              <FloatingPanelResizeHandle />
            </FloatingPanel>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button variant="outline" onClick={() => setOpen(true)}>
                Re-open panel
              </Button>
            </div>
          )}
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Scope: local (parent-bound)"
        code={`// scope="local" (default): position: absolute — anchors to the
// nearest positioned ancestor. Use inside cards / panels / workspace
// cells. Maximise fills that ancestor.

<div className="relative h-72 overflow-hidden rounded-md border">
  <FloatingPanel scope="local" defaultPosition={{ x: 30, y: 30 }}>
    ...
  </FloatingPanel>
</div>`}
      >
        <div className="border-border relative h-72 overflow-hidden rounded-md border">
          <FloatingPanel
            defaultPosition={{ x: 30, y: 30 }}
            defaultSize={{ width: 220, height: 140 }}
            scope="local"
          >
            <FloatingPanelHeader>
              <FloatingPanelTitle>Local panel</FloatingPanelTitle>
              <FloatingPanelMinimizeTrigger />
              <FloatingPanelMaximizeTrigger />
            </FloatingPanelHeader>
            <FloatingPanelContent>
              <p className="text-muted-foreground text-xs">
                Confined to this card. Maximise fills the card.
              </p>
            </FloatingPanelContent>
            <FloatingPanelResizeHandle />
          </FloatingPanel>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Scope: global (viewport-bound, multi-instance)"
        code={`// scope="global": position: fixed — anchors to the viewport.
// Stays put while the page scrolls. Maximise fills the viewport. The
// component is fully multi-instance: keep an array of ids and render
// one <FloatingPanel> per id. Each instance manages its own
// position / size / minimised / maximised state, and the activation
// counter automatically stacks the most recently opened or clicked
// one on top.

const [ids, setIds] = useState<number[]>([])
const nextId = useRef(1)

<>
  <Button onClick={() => setIds((p) => [...p, nextId.current++])}>
    Open another global panel
  </Button>
  {ids.map((id) => (
    <FloatingPanel
      key={id}
      scope="global"
      defaultPosition={{ x: 80 + id * 32, y: 120 + id * 32 }}
      onOpenChange={(o) =>
        !o && setIds((p) => p.filter((i) => i !== id))
      }
    >
      ...
    </FloatingPanel>
  ))}
</>`}
      >
        <div className="space-y-2">
          <Button variant="outline" onClick={openGlobalPanel}>
            Open another global panel
          </Button>
          <p className="text-muted-foreground text-xs">
            Each click adds a new global panel. They cascade from the opening
            corner so you can see them stack, and clicking any older panel
            brings it back to the front.
            {globalPanelIds.length > 0 ? (
              <>
                {" "}
                Currently open: <strong>{globalPanelIds.length}</strong>.
              </>
            ) : null}
          </p>
          {globalPanelIds.map((id) => (
            <FloatingPanel
              key={id}
              scope="global"
              defaultPosition={{ x: 80 + id * 32, y: 120 + id * 32 }}
              defaultSize={{ width: 320, height: 220 }}
              onOpenChange={(o) => {
                if (!o) closeGlobalPanel(id)
              }}
            >
              <FloatingPanelHeader>
                <FloatingPanelDragHandle />
                <FloatingPanelTitle>Global panel #{id}</FloatingPanelTitle>
                <FloatingPanelMinimizeTrigger />
                <FloatingPanelMaximizeTrigger />
                <FloatingPanelCloseTrigger />
              </FloatingPanelHeader>
              <FloatingPanelContent>
                <p className="text-sm">
                  Drag me anywhere — I&apos;m anchored to the viewport, not this
                  demo card. Open another to see them cascade.
                </p>
              </FloatingPanelContent>
              <FloatingPanelResizeHandle />
            </FloatingPanel>
          ))}
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Header-only (minimal)"
        code={`<FloatingPanel
  defaultPosition={{ x: 50, y: 50 }}
  defaultSize={{ width: 240, height: 160 }}
>
  <FloatingPanelHeader>Drag me</FloatingPanelHeader>
  <FloatingPanelContent>Some content</FloatingPanelContent>
  <FloatingPanelResizeHandle />
</FloatingPanel>`}
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

      <ShowcaseExample
        title="Pin in place"
        code={`{/* Clicking the pin icon locks the panel at its current
   location and hides the resize handle. The drag handle dims and the
   header cursor reverts to the default arrow so it's clear the panel
   can't be moved. Click pin again to unpin. */}
<FloatingPanel
  defaultPosition={{ x: 40, y: 40 }}
  defaultSize={{ width: 240, height: 160 }}
>
  <FloatingPanelHeader>
    <FloatingPanelDragHandle />
    <FloatingPanelTitle>Stay put</FloatingPanelTitle>
    <FloatingPanelPinTrigger />
    <FloatingPanelMinimizeTrigger />
    <FloatingPanelMaximizeTrigger />
    <FloatingPanelCloseTrigger />
  </FloatingPanelHeader>
  <FloatingPanelContent>...</FloatingPanelContent>
  <FloatingPanelResizeHandle />
</FloatingPanel>`}
      >
        <div className="border-border relative h-80 overflow-hidden rounded-md border">
          <FloatingPanel
            defaultPosition={{ x: 40, y: 40 }}
            defaultSize={{ width: 240, height: 160 }}
          >
            <FloatingPanelHeader>
              <FloatingPanelDragHandle />
              <FloatingPanelTitle>Stay put</FloatingPanelTitle>
              <FloatingPanelPinTrigger />
              <FloatingPanelMinimizeTrigger />
              <FloatingPanelMaximizeTrigger />
              <FloatingPanelCloseTrigger />
            </FloatingPanelHeader>
            <FloatingPanelContent>
              <p className="text-sm">
                Click the pin icon to lock this panel where it sits. While
                pinned the drag and resize handles are inert; minimise and
                maximise still work.
              </p>
            </FloatingPanelContent>
            <FloatingPanelResizeHandle />
          </FloatingPanel>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
