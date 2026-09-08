import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { useAuthStore } from "./store"

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

describe("useAuthStore", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("keeps authentication in memory when writes fail", () => {
    vi.stubGlobal("localStorage", {
      ...storageMock,
      setItem: () => {
        throw new Error("Storage denied")
      },
    })
    const user = { id: "1", name: "Test", email: "test@example.com" }
    expect(() =>
      useAuthStore.getState().setAuth({ user, token: "abc" }),
    ).not.toThrow()
    expect(useAuthStore.getState()).toMatchObject({
      user,
      token: "abc",
      isAuthenticated: true,
    })
  })

  it("clears authentication in memory when removal fails", () => {
    useAuthStore.getState().setAuth({
      user: { id: "1", name: "Test", email: "test@example.com" },
      token: "abc",
    })
    vi.stubGlobal("localStorage", {
      ...storageMock,
      removeItem: () => {
        throw new Error("Storage denied")
      },
    })
    expect(() => useAuthStore.getState().logout()).not.toThrow()
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  })
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock)
    storageMock.clear()
    useAuthStore.getState().logout()
  })

  it("starts unauthenticated", () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it("setAuth updates state and localStorage", () => {
    const user = { id: "1", name: "Test", email: "test@example.com" }
    useAuthStore.getState().setAuth({ user, token: "abc123" })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(user)
    expect(state.token).toBe("abc123")
    expect(localStorage.getItem("auth-token")).toBe("abc123")
  })

  it("logout clears state and localStorage", () => {
    useAuthStore.getState().setAuth({
      user: { id: "1", name: "Test", email: "test@example.com" },
      token: "abc123",
    })
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(localStorage.getItem("auth-token")).toBeNull()
  })
})
