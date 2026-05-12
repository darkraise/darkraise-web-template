import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  loadPersistedState,
  savePersistedState,
  parsePersistedState,
  type PersistedPanelState,
} from "./floatingPanelStorage"

const storageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      store = Object.fromEntries(
        Object.entries(store).filter(([k]) => k !== key),
      )
    },
    clear: () => {
      store = {}
    },
  }
})()

const valid: PersistedPanelState = {
  position: { x: 1, y: 2 },
  size: { width: 320, height: 240 },
  minimized: false,
  maximized: false,
  pinned: false,
}

describe("parsePersistedState", () => {
  it("returns the input when the shape is valid", () => {
    expect(parsePersistedState(valid)).toEqual(valid)
  })

  it("returns null on missing fields", () => {
    expect(parsePersistedState({ position: { x: 1, y: 2 } })).toBeNull()
  })

  it("returns null on wrong types", () => {
    expect(
      parsePersistedState({
        ...valid,
        position: { x: "no", y: 2 },
      }),
    ).toBeNull()
  })

  it("returns null when input is not an object", () => {
    expect(parsePersistedState("nope")).toBeNull()
    expect(parsePersistedState(null)).toBeNull()
    expect(parsePersistedState(undefined)).toBeNull()
  })
})

describe("loadPersistedState", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock)
    storageMock.clear()
  })

  it("returns null when no key is present", () => {
    expect(loadPersistedState("missing")).toBeNull()
  })

  it("returns the parsed value when the key contains valid JSON", () => {
    localStorage.setItem("k", JSON.stringify(valid))
    expect(loadPersistedState("k")).toEqual(valid)
  })

  it("returns null and clears the key when stored JSON is malformed", () => {
    localStorage.setItem("k", "{not json")
    expect(loadPersistedState("k")).toBeNull()
    expect(localStorage.getItem("k")).toBeNull()
  })

  it("returns null and clears the key when stored value does not match the schema", () => {
    localStorage.setItem("k", JSON.stringify({ foo: "bar" }))
    expect(loadPersistedState("k")).toBeNull()
    expect(localStorage.getItem("k")).toBeNull()
  })
})

describe("savePersistedState", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock)
    storageMock.clear()
  })

  it("writes the value as JSON under the given key", () => {
    savePersistedState("k", valid)
    expect(JSON.parse(localStorage.getItem("k") ?? "")).toEqual(valid)
  })

  it("swallows write errors without throwing", () => {
    const broken = {
      setItem: () => {
        throw new Error("quota")
      },
      getItem: () => null,
      removeItem: () => undefined,
    } as unknown as Storage
    expect(() => savePersistedState("k", valid, broken)).not.toThrow()
  })
})
