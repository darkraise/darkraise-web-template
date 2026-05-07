import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import * as React from "react"
import { useMenu } from "./useMenu"

function makeItem(value: string, disabled = false) {
  const node = document.createElement("div")
  document.body.append(node)
  return {
    value,
    textValue: value,
    disabled,
    ref: { current: node } as React.RefObject<HTMLElement | null>,
    cleanup: () => node.remove(),
  }
}

describe("useMenu", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts closed by default", () => {
    const { result } = renderHook(() => useMenu())
    expect(result.current.open).toBe(false)
    expect(result.current.state).toBe("closed")
  })

  it("supports defaultOpen", () => {
    const { result } = renderHook(() => useMenu({ defaultOpen: true }))
    expect(result.current.open).toBe(true)
    expect(result.current.state).toBe("open")
  })

  it("toggle and setOpen mutate state", () => {
    const { result } = renderHook(() => useMenu())
    act(() => result.current.toggle())
    expect(result.current.open).toBe(true)
    act(() => result.current.setOpen(false))
    expect(result.current.open).toBe(false)
  })

  it("controlled mode tracks the parent open prop", () => {
    const onOpenChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useMenu({ open, onOpenChange }),
      { initialProps: { open: false } },
    )
    expect(result.current.open).toBe(false)
    rerender({ open: true })
    expect(result.current.open).toBe(true)
    act(() => result.current.setOpen(false))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("registers items and surfaces them in document order", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    const c = makeItem("c")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
      result.current.registerItem(c)
    })
    expect(result.current.items().map((it) => it.value)).toEqual([
      "a",
      "b",
      "c",
    ])
    a.cleanup()
    b.cleanup()
    c.cleanup()
  })

  it("focusFirst skips disabled items", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a", true)
    const b = makeItem("b")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
    })
    act(() => result.current.focusFirst())
    expect(result.current.focusedIndex).toBe(1)
    a.cleanup()
    b.cleanup()
  })

  it("focusLast skips disabled items", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    const c = makeItem("c", true)
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
      result.current.registerItem(c)
    })
    act(() => result.current.focusLast())
    expect(result.current.focusedIndex).toBe(1)
    a.cleanup()
    b.cleanup()
    c.cleanup()
  })

  it("focusNext / focusPrev wrap when loop is true", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
    })
    act(() => result.current.focusFirst())
    expect(result.current.focusedIndex).toBe(0)
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(1)
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(0)
    act(() => result.current.focusPrev())
    expect(result.current.focusedIndex).toBe(1)
    a.cleanup()
    b.cleanup()
  })

  it("focusNext skips disabled items", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b", true)
    const c = makeItem("c")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
      result.current.registerItem(c)
    })
    act(() => result.current.focusFirst())
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(2)
    a.cleanup()
    b.cleanup()
    c.cleanup()
  })

  it("typeahead matches first letter", () => {
    const { result } = renderHook(() => useMenu())
    const apple = { ...makeItem("apple") }
    const banana = { ...makeItem("banana") }
    const cherry = { ...makeItem("cherry") }
    apple.textValue = "Apple"
    banana.textValue = "Banana"
    cherry.textValue = "Cherry"
    act(() => {
      result.current.registerItem(apple)
      result.current.registerItem(banana)
      result.current.registerItem(cherry)
    })
    let idx = -1
    act(() => {
      idx = result.current.typeahead("b")
    })
    expect(idx).toBe(1)
    expect(result.current.focusedIndex).toBe(1)
    apple.cleanup()
    banana.cleanup()
    cherry.cleanup()
  })

  it("typeahead chains characters within window", () => {
    const { result } = renderHook(() => useMenu())
    const apple = { ...makeItem("apple") }
    const apricot = { ...makeItem("apricot") }
    const banana = { ...makeItem("banana") }
    apple.textValue = "Apple"
    apricot.textValue = "Apricot"
    banana.textValue = "Banana"
    act(() => {
      result.current.registerItem(apple)
      result.current.registerItem(apricot)
      result.current.registerItem(banana)
    })
    act(() => {
      result.current.typeahead("a")
    })
    // Single char "a": no focus → searches from index 0; apple matches.
    expect(result.current.focusedIndex).toBe(0)
    act(() => {
      result.current.typeahead("p")
    })
    // Chained "ap" (length > 1): preserves focus if current item still
    // matches (apple starts with "ap").
    expect(result.current.focusedIndex).toBe(0)
    apple.cleanup()
    apricot.cleanup()
    banana.cleanup()
  })

  it("typeahead repeated single char advances to next match", () => {
    const { result } = renderHook(() => useMenu())
    const apple = makeItem("apple")
    const apricot = makeItem("apricot")
    const banana = makeItem("banana")
    apple.textValue = "Apple"
    apricot.textValue = "Apricot"
    banana.textValue = "Banana"
    act(() => {
      result.current.registerItem(apple)
      result.current.registerItem(apricot)
      result.current.registerItem(banana)
    })
    act(() => {
      result.current.typeahead("a")
    })
    expect(result.current.focusedIndex).toBe(0)
    // Wait past the typeahead window so the buffer resets to a fresh "a".
    act(() => {
      vi.advanceTimersByTime(600)
    })
    act(() => {
      result.current.typeahead("a")
    })
    // Fresh single "a", current focus 0: searches from offset 1, finds apricot.
    expect(result.current.focusedIndex).toBe(1)
    apple.cleanup()
    apricot.cleanup()
    banana.cleanup()
  })

  it("typeahead resets buffer after timeout", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("apple")
    const b = makeItem("banana")
    a.textValue = "Apple"
    b.textValue = "Banana"
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
    })
    act(() => {
      result.current.typeahead("a")
    })
    expect(result.current.focusedIndex).toBe(0)
    act(() => {
      vi.advanceTimersByTime(600)
    })
    act(() => {
      result.current.typeahead("b")
    })
    expect(result.current.focusedIndex).toBe(1)
    a.cleanup()
    b.cleanup()
  })

  it("focus resets when menu closes", () => {
    const { result } = renderHook(() => useMenu({ defaultOpen: true }))
    const a = makeItem("a")
    act(() => {
      result.current.registerItem(a)
    })
    act(() => result.current.focusFirst())
    expect(result.current.focusedIndex).toBe(0)
    act(() => result.current.setOpen(false))
    expect(result.current.focusedIndex).toBe(-1)
    a.cleanup()
  })
})
