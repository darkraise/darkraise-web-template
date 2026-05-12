import { describe, it, expect } from "vitest"
import { act, fireEvent, render, renderHook } from "@testing-library/react"
import { useState } from "react"
import { FloatingPanelProvider } from "./FloatingPanelProvider"
import { useAppFloatingPanels } from "./useAppFloatingPanels"
import {
  FloatingPanel,
  FloatingPanelContent,
  FloatingPanelHeader,
  FloatingPanelTitle,
} from "./FloatingPanel"
import { FloatingPanelHost } from "./FloatingPanelHost"

describe("FloatingPanelProvider + useAppFloatingPanels", () => {
  it("renders children", () => {
    const { getByText } = render(
      <FloatingPanelProvider>
        <span>hello</span>
      </FloatingPanelProvider>,
    )
    expect(getByText("hello")).toBeInTheDocument()
  })

  it("throws when useAppFloatingPanels is called without a provider", () => {
    expect(() => renderHook(() => useAppFloatingPanels())).toThrow(
      /FloatingPanelProvider/i,
    )
  })

  it("exposes open/close/toggle/list bound to the underlying store", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FloatingPanelProvider>{children}</FloatingPanelProvider>
    )
    const { result } = renderHook(() => useAppFloatingPanels(), { wrapper })
    expect(typeof result.current.open).toBe("function")
    expect(typeof result.current.close).toBe("function")
    expect(typeof result.current.toggle).toBe("function")
    expect(typeof result.current.list).toBe("function")
    expect(result.current.list()).toEqual([])
  })

  it("forwards open() error to the caller when invoked on an unregistered id", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FloatingPanelProvider persistDebounceMs={0}>
        {children}
      </FloatingPanelProvider>
    )
    const { result } = renderHook(() => useAppFloatingPanels(), { wrapper })
    expect(() => result.current.open("nope")).toThrow(/was never registered/i)
  })
})

function Inspector() {
  return (
    <>
      <FloatingPanelHeader>
        <FloatingPanelTitle>Inspector</FloatingPanelTitle>
      </FloatingPanelHeader>
      <FloatingPanelContent>
        <div data-testid="inspector-content">stays mounted</div>
      </FloatingPanelContent>
    </>
  )
}

function RouteA() {
  return (
    <FloatingPanel
      scope="app"
      id="inspector"
      component={Inspector}
      componentProps={{}}
      defaultPosition={{ x: 60, y: 90 }}
    />
  )
}

function RouteB() {
  return <div data-testid="route-b">route B (no panel declaration here)</div>
}

function FakeRouter() {
  const [route, setRoute] = useState<"a" | "b">("a")
  return (
    <FloatingPanelProvider>
      <button data-testid="go-b" onClick={() => setRoute("b")}>
        go b
      </button>
      {route === "a" ? <RouteA /> : <RouteB />}
      <FloatingPanelHost />
    </FloatingPanelProvider>
  )
}

describe('scope="app" route survival', () => {
  it("keeps the panel rendered after the declaring route unmounts", () => {
    const { getByTestId, queryByTestId } = render(<FakeRouter />)
    expect(getByTestId("inspector-content")).toBeInTheDocument()
    act(() => {
      fireEvent.click(getByTestId("go-b"))
    })
    expect(queryByTestId("inspector-content")).toBeInTheDocument()
    expect(queryByTestId("route-b")).toBeInTheDocument()
  })
})
