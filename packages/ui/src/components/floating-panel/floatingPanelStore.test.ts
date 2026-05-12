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

describe("update", () => {
  it("merges a partial patch into the entry and notifies subscribers", () => {
    const store = createFloatingPanelStore()
    const listener = vi.fn()
    store.register("x", { component: () => null, componentProps: {} })
    store.subscribe(listener)
    store.update("x", { position: { x: 42, y: 7 } })
    const entry = store.getEntry("x")
    expect(entry?.position).toEqual({ x: 42, y: 7 })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("returns a new entry object reference so per-id selectors detect the change", () => {
    const store = createFloatingPanelStore()
    store.register("x", { component: () => null, componentProps: {} })
    const before = store.getEntry("x")
    store.update("x", { open: false })
    const after = store.getEntry("x")
    expect(after).not.toBe(before)
  })

  it("preserves other entries' references when one entry is updated", () => {
    const store = createFloatingPanelStore()
    store.register("a", { component: () => null, componentProps: {} })
    store.register("b", { component: () => null, componentProps: {} })
    const beforeB = store.getEntry("b")
    store.update("a", { position: { x: 1, y: 1 } })
    expect(store.getEntry("b")).toBe(beforeB) // ref equality
  })

  it("no-ops when called with an unknown id", () => {
    const store = createFloatingPanelStore()
    const listener = vi.fn()
    store.subscribe(listener)
    store.update("nope", { open: false })
    expect(listener).not.toHaveBeenCalled()
  })
})

describe("open / close / toggle", () => {
  it("open(id) sets entry.open to true", () => {
    const store = createFloatingPanelStore()
    store.register("x", {
      component: () => null,
      componentProps: {},
      defaultOpen: false,
    })
    expect(store.getEntry("x")?.open).toBe(false)
    store.open("x")
    expect(store.getEntry("x")?.open).toBe(true)
  })

  it("open(id, props) merges new componentProps", () => {
    const store = createFloatingPanelStore()
    store.register("x", { component: () => null, componentProps: { a: 1 } })
    store.open("x", { a: 2, b: 3 })
    expect(store.getEntry("x")?.componentProps).toEqual({ a: 2, b: 3 })
  })

  it("close(id) sets entry.open to false but keeps the entry registered", () => {
    const store = createFloatingPanelStore()
    store.register("x", { component: () => null, componentProps: {} })
    store.close("x")
    expect(store.getEntry("x")?.open).toBe(false)
    expect(store.getIdsSnapshot()).toEqual(["x"])
  })

  it("toggle(id) flips entry.open", () => {
    const store = createFloatingPanelStore()
    store.register("x", {
      component: () => null,
      componentProps: {},
      defaultOpen: false,
    })
    store.toggle("x")
    expect(store.getEntry("x")?.open).toBe(true)
    store.toggle("x")
    expect(store.getEntry("x")?.open).toBe(false)
  })

  it("open / close / toggle on an unknown id throw in dev mode", () => {
    const store = createFloatingPanelStore()
    expect(() => store.open("missing")).toThrow(/floatingpanel/i)
    expect(() => store.close("missing")).toThrow(/floatingpanel/i)
    expect(() => store.toggle("missing")).toThrow(/floatingpanel/i)
  })
})
