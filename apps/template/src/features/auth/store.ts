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
    localStorage.setItem("auth-token", token)
    localStorage.setItem("auth-user", JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem("auth-token")
    localStorage.removeItem("auth-user")
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
