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
