import { create } from "zustand"
import type { User } from "./types"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (payload: { user: User; token: string }) => void
  logout: () => void
}

const getStoredToken = () => {
  try {
    return localStorage.getItem("auth-token")
  } catch {
    return null
  }
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem("auth-user")
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),

  setAuth: ({ user, token }) => {
    set({ user, token, isAuthenticated: true })
    try {
      localStorage.setItem("auth-token", token)
      localStorage.setItem("auth-user", JSON.stringify(user))
    } catch {
      // Authentication remains usable in memory when persistence is denied.
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false })
    for (const key of ["auth-token", "auth-user"]) {
      try {
        localStorage.removeItem(key)
      } catch {
        // A storage failure must not keep the current session authenticated.
      }
    }
  },
}))
