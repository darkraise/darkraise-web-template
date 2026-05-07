import { describe, expect, it, vi } from "vitest"
import { composeRefs } from "./composeRefs"

describe("composeRefs", () => {
  it("invokes a single function ref", () => {
    const ref = vi.fn()
    const composed = composeRefs(ref)
    const node = document.createElement("div")
    composed(node)
    expect(ref).toHaveBeenCalledWith(node)
  })

  it("assigns to a single ref object", () => {
    const ref: { current: HTMLDivElement | null } = { current: null }
    const composed = composeRefs(ref)
    const node = document.createElement("div")
    composed(node)
    expect(ref.current).toBe(node)
  })

  it("invokes multiple refs in order", () => {
    const a = vi.fn()
    const b: { current: HTMLDivElement | null } = { current: null }
    const c = vi.fn()
    const node = document.createElement("div")
    composeRefs(a, b, c)(node)
    expect(a).toHaveBeenCalledWith(node)
    expect(b.current).toBe(node)
    expect(c).toHaveBeenCalledWith(node)
  })

  it("ignores null and undefined entries", () => {
    const ref = vi.fn()
    const composed = composeRefs(ref, null, undefined)
    composed(document.createElement("div"))
    expect(ref).toHaveBeenCalledTimes(1)
  })

  it("clears refs on unmount-style null call", () => {
    const a = vi.fn()
    const b: { current: HTMLDivElement | null } = {
      current: document.createElement("div"),
    }
    composeRefs(a, b)(null)
    expect(a).toHaveBeenCalledWith(null)
    expect(b.current).toBe(null)
  })
})
