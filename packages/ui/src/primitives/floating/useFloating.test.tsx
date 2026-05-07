import { describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/react"
import { useFloating } from "./useFloating"

describe("useFloating", () => {
  it("returns refs and floatingStyles", () => {
    const { result } = renderHook(() => useFloating({ placement: "bottom" }))
    expect(typeof result.current.refs.setReference).toBe("function")
    expect(typeof result.current.refs.setFloating).toBe("function")
    expect(result.current.floatingStyles).toBeDefined()
  })

  it("applies the placement option", () => {
    const { result } = renderHook(() => useFloating({ placement: "right" }))
    expect(result.current.placement).toBe("right")
  })
})
