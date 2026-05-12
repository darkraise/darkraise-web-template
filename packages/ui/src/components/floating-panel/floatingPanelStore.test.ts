import { describe, it, expect, vi } from "vitest"
import { createFloatingPanelStore } from "./floatingPanelStore"

describe("createFloatingPanelStore", () => {
  it("starts with an empty entry registry", () => {
    const store = createFloatingPanelStore()
    expect(store.getEntries()).toEqual({})
    expect(store.list()).toEqual([])
  })

  it("notifies subscribers when an action runs and returns an unsubscribe function", () => {
    const store = createFloatingPanelStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    store.register("a", { component: () => null, componentProps: {} })
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    store.register("b", { component: () => null, componentProps: {} })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe("register — idempotent re-registration", () => {
  it("keeps existing position/size/min/max/pin when an id is re-registered", () => {
    const store = createFloatingPanelStore()
    const A = () => null
    const B = () => null
    store.register("inspector", {
      component: A,
      componentProps: { v: 1 },
      defaultPosition: { x: 10, y: 10 },
    })
    // Simulate the user dragging by hand-patching position later via the eventual update API:
    const entries = store.getEntries()
    expect(entries.inspector?.position).toEqual({ x: 10, y: 10 })

    // Re-register with a different defaultPosition + new component + new props.
    store.register("inspector", {
      component: B,
      componentProps: { v: 2 },
      defaultPosition: { x: 999, y: 999 },
    })
    const after = store.getEntry("inspector")
    expect(after?.component).toBe(B)
    expect(after?.componentProps).toEqual({ v: 2 })
    expect(after?.position).toEqual({ x: 10, y: 10 }) // preserved
  })

  it("warns in dev when component reference changes for an already-registered id", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const store = createFloatingPanelStore()
    const A = () => null
    const B = () => null
    store.register("x", { component: A, componentProps: {} })
    store.register("x", { component: B, componentProps: {} })
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it("does not warn when component reference is stable across re-registrations", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const store = createFloatingPanelStore()
    const A = () => null
    store.register("x", { component: A, componentProps: {} })
    store.register("x", { component: A, componentProps: { v: 2 } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
