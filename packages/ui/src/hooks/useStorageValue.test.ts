import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { useStorageValue } from "./useStorageValue"

describe("useStorageValue", () => {
  afterEach(() => {
    localStorage.clear()
  })

  it("reads the stored value during the first render", () => {
    localStorage.setItem("k", JSON.stringify({ a: 1 }))
    const seen: unknown[] = []
    renderHook(() => {
      const result = useStorageValue<{ a: number }>(localStorage, "k")
      seen.push(result.value)
      return result
    })
    expect(seen[0]).toEqual({ a: 1 })
  })

  it("falls back to the default value when nothing is stored", () => {
    const { result } = renderHook(() =>
      useStorageValue<string>(localStorage, "missing", {
        defaultValue: "fallback",
      }),
    )
    expect(result.current.value).toBe("fallback")
  })

  it("parses the first value with the given parse option", () => {
    localStorage.setItem("k", "raw")
    const { result } = renderHook(() =>
      useStorageValue<string>(localStorage, "k", {
        parse: (str, fallback) => (str === null ? fallback : `parsed ${str}`),
      }),
    )
    expect(result.current.value).toBe("parsed raw")
  })

  it("renders undefined first and fetches after mount without initializeWithValue", () => {
    localStorage.setItem("k", JSON.stringify("stored"))
    const seen: unknown[] = []
    const { result } = renderHook(() => {
      const r = useStorageValue<string>(localStorage, "k", {
        initializeWithValue: false,
      })
      seen.push(r.value)
      return r
    })
    expect(seen[0]).toBeUndefined()
    expect(result.current.value).toBe("stored")
  })

  it("keeps its value when options change after mount", () => {
    localStorage.setItem("k", JSON.stringify("stored"))
    const { result, rerender } = renderHook(
      ({ defaultValue }) =>
        useStorageValue<string>(localStorage, "k", { defaultValue }),
      { initialProps: { defaultValue: "first" } },
    )
    rerender({ defaultValue: "second" })
    expect(result.current.value).toBe("stored")
  })

  it("refetches when the key changes and writes through set", () => {
    localStorage.setItem("a", JSON.stringify("A"))
    localStorage.setItem("b", JSON.stringify("B"))
    const { result, rerender } = renderHook(
      ({ storageKey }) => useStorageValue<string>(localStorage, storageKey),
      { initialProps: { storageKey: "a" } },
    )
    expect(result.current.value).toBe("A")
    rerender({ storageKey: "b" })
    expect(result.current.value).toBe("B")
    act(() => {
      result.current.set("C")
    })
    expect(result.current.value).toBe("C")
    expect(localStorage.getItem("b")).toBe(JSON.stringify("C"))
  })
})
