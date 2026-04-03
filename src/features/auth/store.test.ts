import { describe, it, expect, beforeEach, vi } from "vitest"
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
