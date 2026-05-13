import { describe, expect, it, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { useSyncExternalStore } from "react"
import {
  FloatingPanel,
  FloatingPanelCloseTrigger,
  FloatingPanelContent,
  FloatingPanelDragHandle,
  FloatingPanelHeader,
  FloatingPanelMaximizeTrigger,
  FloatingPanelMinimizeTrigger,
  FloatingPanelPinTrigger,
  FloatingPanelTitle,
} from "./FloatingPanel"
import {
  FloatingPanelProvider,
  useFloatingPanelStore,
} from "./FloatingPanelProvider"

describe("FloatingPanel", () => {
  it("renders with the default position and size", () => {
    render(
      <FloatingPanel
        defaultPosition={{ x: 50, y: 60 }}
        defaultSize={{ width: 200, height: 150 }}
        data-testid="p"
      >
        <FloatingPanelHeader>Header</FloatingPanelHeader>
        <FloatingPanelContent>Body</FloatingPanelContent>
      </FloatingPanel>,
    )
    const panel = screen.getByTestId("p")
    expect(panel.style.left).toBe("50px")
    expect(panel.style.top).toBe("60px")
    expect(panel.style.width).toBe("200px")
    expect(panel.style.height).toBe("150px")
  })

  it("dragging the header moves the panel", () => {
    function Wrapper() {
      const [pos, setPos] = React.useState({ x: 0, y: 0 })
      return (
        <FloatingPanel
          position={pos}
          onPositionChange={setPos}
          defaultSize={{ width: 100, height: 100 }}
          data-testid="p"
        >
          <FloatingPanelHeader data-testid="h">Header</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      )
    }
    render(<Wrapper />)
    const header = screen.getByTestId("h")
    header.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 0,
        clientY: 0,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 30,
        clientY: 40,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 30,
        clientY: 40,
        pointerId: 1,
        bubbles: true,
      }),
    )
    const panel = screen.getByTestId("p")
    expect(panel.style.left).toBe("30px")
    expect(panel.style.top).toBe("40px")
  })

  it("se corner resize adjusts width and height, anchoring the top-left", () => {
    function Wrapper() {
      const [size, setSize] = React.useState({ width: 100, height: 100 })
      return (
        <FloatingPanel
          defaultPosition={{ x: 0, y: 0 }}
          size={size}
          onSizeChange={setSize}
          data-testid="p"
        >
          <FloatingPanelHeader>H</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      )
    }
    render(<Wrapper />)
    const panel = screen.getByTestId("p")
    const handle = panel.querySelector('[data-edge="se"]') as HTMLElement
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 250,
        clientY: 220,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 250,
        clientY: 220,
        pointerId: 1,
        bubbles: true,
      }),
    )
    expect(panel.style.width).toBe("250px")
    expect(panel.style.height).toBe("220px")
    expect(panel.style.left).toBe("0px")
    expect(panel.style.top).toBe("0px")
  })

  it("west edge resize keeps the right edge fixed", () => {
    function Wrapper() {
      const [pos, setPos] = React.useState({ x: 200, y: 100 })
      const [size, setSize] = React.useState({ width: 200, height: 150 })
      return (
        <FloatingPanel
          position={pos}
          onPositionChange={setPos}
          size={size}
          onSizeChange={setSize}
          data-testid="p"
        >
          <FloatingPanelHeader>H</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      )
    }
    render(<Wrapper />)
    const panel = screen.getByTestId("p")
    const handle = panel.querySelector('[data-edge="w"]') as HTMLElement
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 200,
        clientY: 175,
        pointerId: 1,
        bubbles: true,
      }),
    )
    // Drag the left edge right by 60px → width shrinks by 60, left moves
    // right by 60. Right edge (400) stays put.
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 260,
        clientY: 175,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 260,
        clientY: 175,
        pointerId: 1,
        bubbles: true,
      }),
    )
    expect(panel.style.left).toBe("260px")
    expect(panel.style.width).toBe("140px")
    // Right edge unchanged: 260 + 140 = 400, same as the original 200 + 200.
    expect(panel.style.top).toBe("100px")
    expect(panel.style.height).toBe("150px")
  })

  it("north edge resize keeps the bottom edge fixed", () => {
    function Wrapper() {
      const [pos, setPos] = React.useState({ x: 100, y: 200 })
      const [size, setSize] = React.useState({ width: 200, height: 150 })
      return (
        <FloatingPanel
          position={pos}
          onPositionChange={setPos}
          size={size}
          onSizeChange={setSize}
          data-testid="p"
        >
          <FloatingPanelHeader>H</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      )
    }
    render(<Wrapper />)
    const panel = screen.getByTestId("p")
    const handle = panel.querySelector('[data-edge="n"]') as HTMLElement
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 200,
        clientY: 200,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 200,
        clientY: 240,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 200,
        clientY: 240,
        pointerId: 1,
        bubbles: true,
      }),
    )
    expect(panel.style.top).toBe("240px")
    expect(panel.style.height).toBe("110px")
    // Bottom edge unchanged: 240 + 110 = 350 = original 200 + 150.
    expect(panel.style.left).toBe("100px")
    expect(panel.style.width).toBe("200px")
  })

  it("close trigger hides the panel", async () => {
    const user = userEvent.setup()
    render(
      <FloatingPanel
        defaultPosition={{ x: 0, y: 0 }}
        defaultSize={{ width: 200, height: 150 }}
        data-testid="p"
      >
        <FloatingPanelHeader>
          <FloatingPanelDragHandle />
          <FloatingPanelTitle>Demo</FloatingPanelTitle>
          <FloatingPanelCloseTrigger />
        </FloatingPanelHeader>
        <FloatingPanelContent>x</FloatingPanelContent>
      </FloatingPanel>,
    )
    expect(screen.getByTestId("p")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /close/i }))
    expect(screen.queryByTestId("p")).toBeNull()
  })

  it("minimize trigger toggles data-minimized and drops inline height", async () => {
    const user = userEvent.setup()
    render(
      <FloatingPanel
        defaultPosition={{ x: 0, y: 0 }}
        defaultSize={{ width: 200, height: 150 }}
        data-testid="p"
      >
        <FloatingPanelHeader>
          <FloatingPanelTitle>Demo</FloatingPanelTitle>
          <FloatingPanelMinimizeTrigger />
        </FloatingPanelHeader>
        <FloatingPanelContent>x</FloatingPanelContent>
      </FloatingPanel>,
    )
    const panel = screen.getByTestId("p")
    expect(panel.getAttribute("data-minimized")).toBeNull()
    expect(panel.style.height).toBe("150px")
    await user.click(screen.getByRole("button", { name: /minimize/i }))
    expect(panel.getAttribute("data-minimized")).toBe("true")
    // Height inline style is dropped while minimised so CSS / natural flow
    // shrinks the panel to the header height.
    expect(panel.style.height).toBe("")
    // Width and position are preserved so the panel doesn't jump corners.
    expect(panel.style.width).toBe("200px")
  })

  it("maximize trigger toggles data-maximized and drops layout inline styles", async () => {
    const user = userEvent.setup()
    render(
      <FloatingPanel
        defaultPosition={{ x: 30, y: 40 }}
        defaultSize={{ width: 200, height: 150 }}
        data-testid="p"
      >
        <FloatingPanelHeader>
          <FloatingPanelTitle>Demo</FloatingPanelTitle>
          <FloatingPanelMaximizeTrigger />
        </FloatingPanelHeader>
        <FloatingPanelContent>x</FloatingPanelContent>
      </FloatingPanel>,
    )
    const panel = screen.getByTestId("p")
    await user.click(screen.getByRole("button", { name: /maximize/i }))
    expect(panel.getAttribute("data-maximized")).toBe("true")
    // While maximised inline left/top/width/height are skipped so the CSS
    // inset:0 rule wins without competing inline values.
    expect(panel.style.left).toBe("")
    expect(panel.style.top).toBe("")
    expect(panel.style.width).toBe("")
    expect(panel.style.height).toBe("")
  })

  it("maximize trigger is hidden while the panel is minimized", async () => {
    const user = userEvent.setup()
    render(
      <FloatingPanel
        defaultPosition={{ x: 0, y: 0 }}
        defaultSize={{ width: 200, height: 150 }}
      >
        <FloatingPanelHeader>
          <FloatingPanelTitle>Demo</FloatingPanelTitle>
          <FloatingPanelMinimizeTrigger />
          <FloatingPanelMaximizeTrigger />
        </FloatingPanelHeader>
        <FloatingPanelContent>x</FloatingPanelContent>
      </FloatingPanel>,
    )
    expect(
      screen.getByRole("button", { name: /maximize/i }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /minimize/i }))
    expect(screen.queryByRole("button", { name: /maximize/i })).toBeNull()
  })

  it("scope='global' switches the panel to fixed positioning and portals to body", () => {
    render(
      <div data-testid="host" style={{ isolation: "isolate" }}>
        <FloatingPanel
          defaultPosition={{ x: 0, y: 0 }}
          defaultSize={{ width: 200, height: 150 }}
          scope="global"
          data-testid="p"
        >
          <FloatingPanelHeader>H</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      </div>,
    )
    const panel = screen.getByTestId("p")
    expect(panel).toHaveAttribute("data-scope", "global")
    expect(Number(panel.style.zIndex)).toBeGreaterThanOrEqual(1)
    // Global panels portal to document.body so they escape ancestor
    // stacking contexts (here, the host div with isolation: isolate). If
    // this assertion fails, sidebar/header z-index issues will surface.
    const host = screen.getByTestId("host")
    expect(host.contains(panel)).toBe(false)
    expect(document.body.contains(panel)).toBe(true)
  })

  it("scope='local' keeps the panel inside its parent (no portal)", () => {
    render(
      <div data-testid="host">
        <FloatingPanel
          defaultPosition={{ x: 0, y: 0 }}
          defaultSize={{ width: 200, height: 150 }}
          scope="local"
          data-testid="p"
        >
          <FloatingPanelHeader>H</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      </div>,
    )
    const host = screen.getByTestId("host")
    const panel = screen.getByTestId("p")
    // Local panels render in-place so position: absolute can anchor to the
    // parent card.
    expect(host.contains(panel)).toBe(true)
  })

  it("a later-opened panel stacks above earlier ones, regardless of scope", () => {
    render(
      <>
        <FloatingPanel
          defaultPosition={{ x: 0, y: 0 }}
          defaultSize={{ width: 200, height: 150 }}
          scope="local"
          data-testid="p1"
        >
          <FloatingPanelHeader>H</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
        <FloatingPanel
          defaultPosition={{ x: 100, y: 100 }}
          defaultSize={{ width: 200, height: 150 }}
          scope="global"
          data-testid="p2"
        >
          <FloatingPanelHeader>H</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      </>,
    )
    const z1 = Number(screen.getByTestId("p1").style.zIndex)
    const z2 = Number(screen.getByTestId("p2").style.zIndex)
    // Even though p2 is global (which used to sit on a lower tier than
    // local), opening it later puts it on top.
    expect(z2).toBeGreaterThan(z1)
  })

  it("multiple scope='global' panels co-exist independently", () => {
    render(
      <>
        <FloatingPanel
          scope="global"
          defaultPosition={{ x: 0, y: 0 }}
          defaultSize={{ width: 200, height: 150 }}
          data-testid="g1"
        >
          <FloatingPanelHeader>H1</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
        <FloatingPanel
          scope="global"
          defaultPosition={{ x: 50, y: 50 }}
          defaultSize={{ width: 200, height: 150 }}
          data-testid="g2"
        >
          <FloatingPanelHeader>H2</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      </>,
    )
    const g1 = screen.getByTestId("g1")
    const g2 = screen.getByTestId("g2")
    expect(g1).toHaveAttribute("data-scope", "global")
    expect(g2).toHaveAttribute("data-scope", "global")
    // Distinct z-indexes — neither is suppressed.
    expect(Number(g2.style.zIndex)).toBeGreaterThan(Number(g1.style.zIndex))
    // Each owns its own position and size — no shared state.
    expect(g1.style.left).toBe("0px")
    expect(g2.style.left).toBe("50px")
  })

  it("clicking an earlier panel brings it to the front", async () => {
    const user = userEvent.setup()
    render(
      <>
        <FloatingPanel
          defaultPosition={{ x: 0, y: 0 }}
          defaultSize={{ width: 200, height: 150 }}
          data-testid="p1"
        >
          <FloatingPanelHeader>H1</FloatingPanelHeader>
          <FloatingPanelContent data-testid="c1">x</FloatingPanelContent>
        </FloatingPanel>
        <FloatingPanel
          defaultPosition={{ x: 100, y: 100 }}
          defaultSize={{ width: 200, height: 150 }}
          data-testid="p2"
        >
          <FloatingPanelHeader>H2</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      </>,
    )
    const p1 = screen.getByTestId("p1")
    const p2 = screen.getByTestId("p2")
    expect(Number(p1.style.zIndex)).toBeLessThan(Number(p2.style.zIndex))
    await user.click(screen.getByTestId("c1"))
    expect(Number(p1.style.zIndex)).toBeGreaterThan(Number(p2.style.zIndex))
  })

  it("clicking a header trigger does not start a drag", () => {
    // Header captures pointer for drag, but pressing on an interactive
    // descendant (close / minimize / maximize) must skip drag init so the
    // click reaches the inner button. Same gotcha as the toast close button.
    const captureSpy = vi.fn()
    HTMLElement.prototype.setPointerCapture = captureSpy
    try {
      render(
        <FloatingPanel
          defaultPosition={{ x: 0, y: 0 }}
          defaultSize={{ width: 200, height: 150 }}
          data-testid="p"
        >
          <FloatingPanelHeader data-testid="h">
            <FloatingPanelCloseTrigger />
          </FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>,
      )
      const closeBtn = screen.getByRole("button", { name: /close/i })
      act(() => {
        closeBtn.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            pointerId: 1,
            clientX: 10,
            clientY: 10,
          }),
        )
      })
      expect(captureSpy).not.toHaveBeenCalled()
    } finally {
      HTMLElement.prototype.setPointerCapture = vi.fn()
    }
  })

  it("clamps drag so the panel can't be moved past the viewport (global)", () => {
    function Wrapper() {
      const [pos, setPos] = React.useState({ x: 0, y: 0 })
      return (
        <FloatingPanel
          position={pos}
          onPositionChange={setPos}
          defaultSize={{ width: 200, height: 150 }}
          scope="global"
          data-testid="p"
        >
          <FloatingPanelHeader data-testid="h">H</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      )
    }
    render(<Wrapper />)
    const header = screen.getByTestId("h")
    header.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 0,
        clientY: 0,
        pointerId: 1,
        bubbles: true,
      }),
    )
    // Drag far past the viewport — jsdom defaults innerWidth/Height to 1024×768.
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 5000,
        clientY: 5000,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 5000,
        clientY: 5000,
        pointerId: 1,
        bubbles: true,
      }),
    )
    const panel = screen.getByTestId("p")
    // 1024 - 200 = 824 max, 768 - 150 = 618 max.
    expect(Number(panel.style.left.replace("px", ""))).toBe(824)
    expect(Number(panel.style.top.replace("px", ""))).toBe(618)
  })

  it("clamps drag so the panel can't be moved before origin", () => {
    function Wrapper() {
      const [pos, setPos] = React.useState({ x: 100, y: 100 })
      return (
        <FloatingPanel
          position={pos}
          onPositionChange={setPos}
          defaultSize={{ width: 200, height: 150 }}
          scope="global"
          data-testid="p"
        >
          <FloatingPanelHeader data-testid="h">H</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      )
    }
    render(<Wrapper />)
    const header = screen.getByTestId("h")
    header.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 0,
        clientY: 0,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: -5000,
        clientY: -5000,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: -5000,
        clientY: -5000,
        pointerId: 1,
        bubbles: true,
      }),
    )
    const panel = screen.getByTestId("p")
    expect(panel.style.left).toBe("0px")
    expect(panel.style.top).toBe("0px")
  })

  it("respects min size", () => {
    function Wrapper() {
      const [size, setSize] = React.useState({ width: 100, height: 100 })
      return (
        <FloatingPanel
          defaultPosition={{ x: 0, y: 0 }}
          size={size}
          onSizeChange={setSize}
          minWidth={120}
          minHeight={120}
          data-testid="p"
        >
          <FloatingPanelHeader>H</FloatingPanelHeader>
          <FloatingPanelContent>x</FloatingPanelContent>
        </FloatingPanel>
      )
    }
    render(<Wrapper />)
    const panel = screen.getByTestId("p")
    const handle = panel.querySelector('[data-edge="se"]') as HTMLElement
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 30,
        clientY: 30,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 30,
        clientY: 30,
        pointerId: 1,
        bubbles: true,
      }),
    )
    expect(panel.style.width).toBe("120px")
    expect(panel.style.height).toBe("120px")
  })

  it("pin trigger flips data-pinned and aria-pressed", async () => {
    const user = userEvent.setup()
    render(
      <FloatingPanel
        defaultPosition={{ x: 10, y: 10 }}
        defaultSize={{ width: 200, height: 200 }}
        data-testid="p"
      >
        <FloatingPanelHeader>
          <FloatingPanelTitle>Pin me</FloatingPanelTitle>
          <FloatingPanelPinTrigger data-testid="pin" />
        </FloatingPanelHeader>
        <FloatingPanelContent>x</FloatingPanelContent>
      </FloatingPanel>,
    )
    const panel = screen.getByTestId("p")
    const pin = screen.getByTestId("pin")
    expect(panel.getAttribute("data-pinned")).toBeNull()
    expect(pin.getAttribute("aria-pressed")).toBe("false")
    await user.click(pin)
    expect(panel.getAttribute("data-pinned")).toBe("true")
    expect(pin.getAttribute("aria-pressed")).toBe("true")
    await user.click(pin)
    expect(panel.getAttribute("data-pinned")).toBeNull()
  })

  it("pinned panel ignores header drag and hides the resize edges", () => {
    render(
      <FloatingPanel
        defaultPosition={{ x: 50, y: 50 }}
        defaultSize={{ width: 200, height: 200 }}
        defaultPinned
        data-testid="p"
      >
        <FloatingPanelHeader data-testid="header">
          <FloatingPanelTitle>Pinned</FloatingPanelTitle>
        </FloatingPanelHeader>
        <FloatingPanelContent>x</FloatingPanelContent>
      </FloatingPanel>,
    )
    const panel = screen.getByTestId("p")
    expect(panel.getAttribute("data-pinned")).toBe("true")
    // No resize edge regions are rendered when pinned.
    expect(
      panel.querySelectorAll('[data-slot="floating-panel-edge"]').length,
    ).toBe(0)
    // Header pointerdown does not start a drag — pointermove should not
    // change the position.
    const header = screen.getByTestId("header")
    header.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 250,
        clientY: 250,
        pointerId: 1,
        bubbles: true,
      }),
    )
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 250,
        clientY: 250,
        pointerId: 1,
        bubbles: true,
      }),
    )
    expect(panel.style.left).toBe("50px")
    expect(panel.style.top).toBe("50px")
  })
})

describe('FloatingPanel scope="app"', () => {
  it("renders null (no visible markup) when scope is app", () => {
    const Inner = () => <div data-testid="inner">inner</div>
    const { container } = render(
      <FloatingPanelProvider>
        <FloatingPanel
          scope="app"
          id="x"
          component={Inner}
          componentProps={{}}
        />
      </FloatingPanelProvider>,
    )
    expect(container.querySelector(".dr-floating-panel")).toBeNull()
  })

  it("registers the panel in the store on mount", () => {
    const Inner = () => null
    function Probe() {
      const store = useFloatingPanelStore()
      const ids = useSyncExternalStore(
        store.subscribe,
        () => store.getIdsSnapshot(),
        () => store.getIdsSnapshot(),
      )
      return <span data-testid="ids">{ids.join(",")}</span>
    }
    const { getByTestId } = render(
      <FloatingPanelProvider>
        <FloatingPanel
          scope="app"
          id="inspector"
          component={Inner}
          componentProps={{}}
        />
        <Probe />
      </FloatingPanelProvider>,
    )
    expect(getByTestId("ids").textContent).toBe("inspector")
  })

  it('throws a clear error when scope="app" is rendered without a provider', () => {
    const Inner = () => null
    // React error boundary suppression: spy on console.error to keep noise out of test output.
    const err = vi.spyOn(console, "error").mockImplementation(() => {})
    const renderWithoutProvider = () =>
      render(
        <FloatingPanel
          scope="app"
          id="x"
          component={Inner}
          componentProps={{}}
        />,
      )
    expect(renderWithoutProvider).toThrow(/FloatingPanelProvider/i)
    err.mockRestore()
  })

  it("updates componentProps when the JSX prop changes", () => {
    const Inner = (props: { v: number }) => <div>{props.v}</div>
    function Probe({ id }: { id: string }) {
      const store = useFloatingPanelStore()
      const entry = useSyncExternalStore(
        store.subscribe,
        () => store.getEntry(id),
        () => store.getEntry(id),
      )
      return (
        <span data-testid="props">{JSON.stringify(entry?.componentProps)}</span>
      )
    }
    function Host({ v }: { v: number }) {
      return (
        <FloatingPanelProvider>
          <FloatingPanel
            scope="app"
            id="x"
            component={Inner}
            componentProps={{ v }}
          />
          <Probe id="x" />
        </FloatingPanelProvider>
      )
    }
    const { getByTestId, rerender } = render(<Host v={1} />)
    expect(getByTestId("props").textContent).toBe(JSON.stringify({ v: 1 }))
    rerender(<Host v={42} />)
    expect(getByTestId("props").textContent).toBe(JSON.stringify({ v: 42 }))
  })
})
