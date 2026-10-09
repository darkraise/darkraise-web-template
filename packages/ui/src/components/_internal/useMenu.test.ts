import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import * as React from "react"
import { useMenu } from "./useMenu"

function makeItem(value: string, disabled = false) {
  const node = document.createElement("div")
  document.body.append(node)
  return {
    id: value,
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
    expect(result.current.focusedId).toBe("b")
    a.cleanup()
    b.cleanup()
  })

  it("focusFirst before any row registers focuses the first row once rows register", () => {
    const { result } = renderHook(() => useMenu({ defaultOpen: true }))
    act(() => result.current.focusFirst())
    expect(result.current.focusedIndex).toBe(-1)
    expect(result.current.focusedId).toBeNull()
    const a = makeItem("a")
    const b = makeItem("b")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
    })
    expect(result.current.focusedIndex).toBe(0)
    expect(result.current.focusedId).toBe("a")
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
    expect(result.current.focusedId).toBe("b")
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
    expect(result.current.focusedId).toBe("a")
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(1)
    expect(result.current.focusedId).toBe("b")
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(0)
    expect(result.current.focusedId).toBe("a")
    act(() => result.current.focusPrev())
    expect(result.current.focusedIndex).toBe(1)
    expect(result.current.focusedId).toBe("b")
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
    expect(result.current.focusedId).toBe("c")
    a.cleanup()
    b.cleanup()
    c.cleanup()
  })

  it("navigation skips items that are not displayed", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    const c = makeItem("c")
    b.ref.current?.style.setProperty("display", "none")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
      result.current.registerItem(c)
    })
    act(() => result.current.focusFirst())
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(2)
    expect(result.current.focusedId).toBe("c")
    act(() => result.current.focusPrev())
    expect(result.current.focusedIndex).toBe(0)
    expect(result.current.focusedId).toBe("a")
    act(() => {
      result.current.typeahead("b")
    })
    expect(result.current.focusedIndex).toBe(0)
    expect(result.current.focusedId).toBe("a")
    a.cleanup()
    b.cleanup()
    c.cleanup()
  })

  it("navigation leaves a focused row that stops being displayed", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    const c = makeItem("c")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
      result.current.registerItem(c)
    })
    act(() => result.current.focusFirst())
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(1)
    expect(result.current.focusedId).toBe("b")
    b.ref.current?.style.setProperty("display", "none")
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(2)
    expect(result.current.focusedId).toBe("c")
    act(() => result.current.focusPrev())
    expect(result.current.focusedIndex).toBe(0)
    expect(result.current.focusedId).toBe("a")
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
    expect(result.current.focusedId).toBe("banana")
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
    expect(result.current.focusedId).toBe("apple")
    act(() => {
      result.current.typeahead("p")
    })
    // Chained "ap" (length > 1): preserves focus if current item still
    // matches (apple starts with "ap").
    expect(result.current.focusedIndex).toBe(0)
    expect(result.current.focusedId).toBe("apple")
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
    expect(result.current.focusedId).toBe("apple")
    // Wait past the typeahead window so the buffer resets to a fresh "a".
    act(() => {
      vi.advanceTimersByTime(600)
    })
    act(() => {
      result.current.typeahead("a")
    })
    // Fresh single "a", current focus 0: searches from offset 1, finds apricot.
    expect(result.current.focusedIndex).toBe(1)
    expect(result.current.focusedId).toBe("apricot")
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
    expect(result.current.focusedId).toBe("apple")
    act(() => {
      vi.advanceTimersByTime(600)
    })
    act(() => {
      result.current.typeahead("b")
    })
    expect(result.current.focusedIndex).toBe(1)
    expect(result.current.focusedId).toBe("banana")
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
    expect(result.current.focusedId).toBe("a")
    act(() => result.current.setOpen(false))
    expect(result.current.focusedIndex).toBe(-1)
    expect(result.current.focusedId).toBeNull()
    a.cleanup()
  })

  it("focus falls to the next row when the focused row unregisters", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    const c = makeItem("c")
    let unregisterB = () => {}
    act(() => {
      result.current.registerItem(a)
      unregisterB = result.current.registerItem(b)
      result.current.registerItem(c)
    })
    act(() => result.current.focusFirst())
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(1)
    expect(result.current.focusedId).toBe("b")
    act(() => {
      b.cleanup()
      unregisterB()
    })
    expect(result.current.items()[result.current.focusedIndex]?.value).toBe("c")
    expect(result.current.focusedId).toBe("c")
    a.cleanup()
    c.cleanup()
  })

  it("focus falls to the next row when the focused row unregisters before leaving the document", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    const c = makeItem("c")
    let unregisterB = () => {}
    act(() => {
      result.current.registerItem(a)
      unregisterB = result.current.registerItem(b)
      result.current.registerItem(c)
    })
    act(() => result.current.focusFirst())
    act(() => result.current.focusNext())
    act(() => {
      unregisterB()
      b.cleanup()
    })
    expect(result.current.items()[result.current.focusedIndex]?.value).toBe("c")
    expect(result.current.focusedId).toBe("c")
    a.cleanup()
    c.cleanup()
  })

  it("no row is focused when the focused last row unregisters", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    let unregisterB = () => {}
    act(() => {
      result.current.registerItem(a)
      unregisterB = result.current.registerItem(b)
    })
    act(() => result.current.focusLast())
    act(() => {
      b.cleanup()
      unregisterB()
    })
    expect(result.current.items()[result.current.focusedIndex]).toBeUndefined()
    expect(result.current.focusedId).toBeNull()
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(0)
    expect(result.current.focusedId).toBe("a")
    a.cleanup()
  })

  it("a focused row that becomes disabled keeps focus until navigation leaves it", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    const c = makeItem("c")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
      result.current.registerItem(c)
    })
    act(() => result.current.focusFirst())
    act(() => result.current.focusNext())
    act(() => {
      b.disabled = true
    })
    expect(result.current.focusedIndex).toBe(1)
    expect(result.current.focusedId).toBe("b")
    act(() => result.current.focusNext())
    expect(result.current.focusedIndex).toBe(2)
    expect(result.current.focusedId).toBe("c")
    act(() => result.current.focusPrev())
    expect(result.current.focusedIndex).toBe(0)
    expect(result.current.focusedId).toBe("a")
    a.cleanup()
    b.cleanup()
    c.cleanup()
  })

  it("registerItem replaces the record of a known id without re-rendering", () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders += 1
      return useMenu()
    })
    const a = makeItem("a")
    act(() => {
      result.current.registerItem(a)
    })
    const rendersAfterAdd = renders
    act(() => {
      result.current.registerItem({ ...a, disabled: true })
    })
    expect(renders).toBe(rendersAfterAdd)
    expect(result.current.items()).toHaveLength(1)
    expect(result.current.items()[0]?.disabled).toBe(true)
    a.cleanup()
  })

  it("adding or removing an id re-renders", () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders += 1
      return useMenu()
    })
    const a = makeItem("a")
    let unregister = () => {}
    const rendersBefore = renders
    act(() => {
      unregister = result.current.registerItem(a)
    })
    expect(renders).toBeGreaterThan(rendersBefore)
    const rendersAfterAdd = renders
    act(() => unregister())
    expect(renders).toBeGreaterThan(rendersAfterAdd)
    expect(result.current.items()).toHaveLength(0)
    a.cleanup()
  })

  it("unregisterItem removes a row by id", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
    })
    act(() => result.current.unregisterItem("a"))
    expect(result.current.items().map((it) => it.id)).toEqual(["b"])
    a.cleanup()
    b.cleanup()
  })

  it("setFocusedId focuses a row by id", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    const c = makeItem("c")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
      result.current.registerItem(c)
    })
    act(() => result.current.setFocusedId("b"))
    expect(result.current.focusedId).toBe("b")
    expect(result.current.focusedIndex).toBe(1)
    act(() => result.current.focusNext())
    expect(result.current.focusedId).toBe("c")
    act(() => result.current.setFocusedId(null))
    expect(result.current.focusedId).toBeNull()
    expect(result.current.focusedIndex).toBe(-1)
    a.cleanup()
    b.cleanup()
    c.cleanup()
  })

  it("setFocusedIndex keeps focusedId in step", () => {
    const { result } = renderHook(() => useMenu())
    const a = makeItem("a")
    const b = makeItem("b")
    act(() => {
      result.current.registerItem(a)
      result.current.registerItem(b)
    })
    act(() => result.current.setFocusedIndex(1))
    expect(result.current.focusedId).toBe("b")
    act(() => result.current.setFocusedIndex(-1))
    expect(result.current.focusedId).toBeNull()
    a.cleanup()
    b.cleanup()
  })

  it("focus stays on its row when a row registers before it", () => {
    const { result } = renderHook(() => useMenu())
    const b = makeItem("b")
    const c = makeItem("c")
    act(() => {
      result.current.registerItem(b)
      result.current.registerItem(c)
    })
    act(() => result.current.focusFirst())
    const a = makeItem("a")
    const aNode = a.ref.current
    if (aNode) document.body.prepend(aNode)
    act(() => {
      result.current.registerItem(a)
    })
    expect(result.current.focusedId).toBe("b")
    expect(result.current.focusedIndex).toBe(1)
    a.cleanup()
    b.cleanup()
    c.cleanup()
  })
})
