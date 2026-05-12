import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createFloatingPanelStore } from "./floatingPanelStore"
import { savePersistedState } from "./floatingPanelStorage"

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

describe("getIdsSnapshot", () => {
  it("returns the same array reference when no ids change", () => {
    const store = createFloatingPanelStore()
    store.register("a", { component: () => null, componentProps: {} })
    const first = store.getIdsSnapshot()
    store.update("a", { position: { x: 1, y: 1 } })
    expect(store.getIdsSnapshot()).toBe(first)
  })

  it("returns a new array reference when an id is added or removed", () => {
    const store = createFloatingPanelStore()
    store.register("a", { component: () => null, componentProps: {} })
    const first = store.getIdsSnapshot()
    store.register("b", { component: () => null, componentProps: {} })
    expect(store.getIdsSnapshot()).not.toBe(first)
    expect(store.getIdsSnapshot()).toEqual(["a", "b"])
  })
})

describe("createFloatingPanelStore — persistence", () => {
  let storage: Storage
  beforeEach(() => {
    const data = new Map<string, string>()
    storage = {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
      clear: () => data.clear(),
      key: (i) => Array.from(data.keys())[i] ?? null,
      get length() {
        return data.size
      },
    }
    vi.stubGlobal("localStorage", storage)
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("hydrates an entry with persisted geometry when the key exists at init time", () => {
    savePersistedState(
      "dr-floating-panel:inspector",
      {
        position: { x: 100, y: 200 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        pinned: true,
      },
      storage,
    )
    const store = createFloatingPanelStore({ storage })
    store.register("inspector", {
      component: () => null,
      componentProps: {},
      defaultPosition: { x: 0, y: 0 },
      defaultSize: { width: 320, height: 240 },
      persistKey: "dr-floating-panel:inspector",
    })
    expect(store.getEntry("inspector")?.position).toEqual({ x: 100, y: 200 })
    expect(store.getEntry("inspector")?.pinned).toBe(true)
  })

  it("writes persisted state on update when persistKey is set, debounced to one write per window", () => {
    const store = createFloatingPanelStore({ storage, persistDebounceMs: 150 })
    store.register("inspector", {
      component: () => null,
      componentProps: {},
      persistKey: "dr-floating-panel:inspector",
    })
    store.update("inspector", { position: { x: 1, y: 1 } })
    store.update("inspector", { position: { x: 2, y: 2 } })
    store.update("inspector", { position: { x: 3, y: 3 } })
    expect(storage.getItem("dr-floating-panel:inspector")).toBeNull()
    vi.advanceTimersByTime(160)
    const stored = JSON.parse(
      storage.getItem("dr-floating-panel:inspector") ?? "{}",
    )
    expect(stored.position).toEqual({ x: 3, y: 3 })
  })

  it("never persists `open` or `componentProps`", () => {
    const store = createFloatingPanelStore({ storage, persistDebounceMs: 0 })
    store.register("inspector", {
      component: () => null,
      componentProps: { v: 1 },
      persistKey: "dr-floating-panel:inspector",
    })
    store.update("inspector", { componentProps: { v: 99 } })
    store.close("inspector")
    vi.advanceTimersByTime(1)
    const stored = JSON.parse(
      storage.getItem("dr-floating-panel:inspector") ?? "{}",
    )
    expect(stored).not.toHaveProperty("open")
    expect(stored).not.toHaveProperty("componentProps")
  })

  it("does not write when persistKey is null", () => {
    const store = createFloatingPanelStore({ storage, persistDebounceMs: 0 })
    store.register("x", { component: () => null, componentProps: {} })
    store.update("x", { position: { x: 1, y: 1 } })
    vi.advanceTimersByTime(1)
    expect(storage.length).toBe(0)
  })
})
