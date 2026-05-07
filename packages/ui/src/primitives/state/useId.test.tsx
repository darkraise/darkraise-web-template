import { describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/react"
import { useId } from "./useId"

describe("useId", () => {
  it("returns the override when provided", () => {
    const { result } = renderHook(() => useId("custom-id"))
    expect(result.current).toBe("custom-id")
  })

  it("returns a stable React-generated id when no override is given", () => {
    const { result, rerender } = renderHook(
      ({ id }: { id?: string }) => useId(id),
      {
        initialProps: {},
      },
    )
    const first = result.current
    expect(first).toMatch(/[A-Za-z0-9]/) // React's useId returns a non-empty generated id
    rerender({})
    expect(result.current).toBe(first)
  })

  it("switches between override and generated based on the prop", () => {
    const { result, rerender } = renderHook(
      ({ id }: { id?: string }) => useId(id),
      {
        initialProps: { id: "x" } as { id?: string },
      },
    )
    expect(result.current).toBe("x")
    rerender({ id: undefined })
    expect(result.current).not.toBe("x")
    expect(result.current).toMatch(/[A-Za-z0-9]/)
  })
})
