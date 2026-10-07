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

  it("writes the anchor and available-space variables onto the popup", async () => {
    // jsdom lays nothing out, so give the anchor a size to read back.
    const rect = vi
      .spyOn(HTMLButtonElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 120,
        bottom: 32,
        width: 120,
        height: 32,
        toJSON: () => ({}),
      } as DOMRect)
    try {
      const { getByTestId } = render(<Anchored />)
      const popup = getByTestId("floating")
      await waitFor(() =>
        expect(popup.style.getPropertyValue("--popup-anchor-width")).toBe(
          "120px",
        ),
      )
      expect(popup.style.getPropertyValue("--popup-anchor-height")).toBe("32px")
      for (const name of [
        "--popup-available-width",
        "--popup-available-height",
      ]) {
        expect(popup.style.getPropertyValue(name)).toMatch(/^\d+(\.\d+)?px$/)
      }
    } finally {
      rect.mockRestore()
    }
  })

  it("passes the positioning strategy through", () => {
    const { result } = renderHook(() => useFloating({ strategy: "fixed" }))
    expect(result.current.strategy).toBe("fixed")
  })
})
