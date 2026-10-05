import { describe, expect, it, vi } from "vitest"
import { render, renderHook, waitFor } from "@testing-library/react"
import { autoUpdate } from "@floating-ui/react"
import { useFloating } from "./useFloating"

vi.mock("@floating-ui/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@floating-ui/react")>()
  return { ...actual, autoUpdate: vi.fn(actual.autoUpdate) }
})

function Anchored() {
  const { setReference, setFloating } = useFloating().refs
  return (
    <>
      <button type="button" ref={setReference}>
        anchor
      </button>
      <div data-testid="floating" ref={setFloating}>
        popup
      </div>
    </>
  )
}

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

  it("repositions the popup while both elements are mounted", async () => {
    const { getByRole, getByTestId } = render(<Anchored />)
    await waitFor(() =>
      expect(autoUpdate).toHaveBeenCalledWith(
        getByRole("button"),
        getByTestId("floating"),
        expect.any(Function),
      ),
    )
  })
})
