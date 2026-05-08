import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import * as React from "react"
import {
  FloatingPanel,
  FloatingPanelContent,
  FloatingPanelHeader,
  FloatingPanelResizeHandle,
} from "./FloatingPanel"

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

  it("resize handle adjusts size", () => {
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
          <FloatingPanelResizeHandle data-testid="rh" />
        </FloatingPanel>
      )
    }
    render(<Wrapper />)
    const handle = screen.getByTestId("rh")
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
    const panel = screen.getByTestId("p")
    expect(panel.style.width).toBe("250px")
    expect(panel.style.height).toBe("220px")
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
          <FloatingPanelResizeHandle data-testid="rh" />
        </FloatingPanel>
      )
    }
    render(<Wrapper />)
    const handle = screen.getByTestId("rh")
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
    const panel = screen.getByTestId("p")
    expect(panel.style.width).toBe("120px")
    expect(panel.style.height).toBe("120px")
  })
})
