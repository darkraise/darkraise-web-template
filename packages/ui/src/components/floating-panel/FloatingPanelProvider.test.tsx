import { describe, it, expect } from "vitest"
import { render, renderHook } from "@testing-library/react"
import { FloatingPanelProvider } from "./FloatingPanelProvider"
import { useAppFloatingPanels } from "./useAppFloatingPanels"

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
