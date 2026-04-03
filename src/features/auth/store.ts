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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),

  setAuth: ({ user, token }) => {
    localStorage.setItem("auth-token", token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem("auth-token")
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
