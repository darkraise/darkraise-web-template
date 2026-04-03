import { useCallback } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuthStore } from "../store"
import { authAdapter } from "../adapter"
import type { LoginCredentials, RegisterCredentials } from "../types"

export function useAuth() {
  const { user, isAuthenticated, setAuth, logout: clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authAdapter.login(credentials)
      setAuth(response)
      navigate({ to: "/" })
    },
    [setAuth, navigate],
  )

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const response = await authAdapter.register(credentials)
      setAuth(response)
      navigate({ to: "/" })
    },
    [setAuth, navigate],
  )

  const logout = useCallback(async () => {
    await authAdapter.logout()
    clearAuth()
    navigate({ to: "/login" })
  }, [clearAuth, navigate])

  const forgotPassword = useCallback(async (email: string) => {
    await authAdapter.forgotPassword(email)
  }, [])

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      await authAdapter.resetPassword(token, password)
      navigate({ to: "/login" })
    },
    [navigate],
  )

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  }
}
