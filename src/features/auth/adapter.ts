import type { AuthAdapter, AuthResponse } from "./types"

const mockUser = {
  id: "1",
  name: "Demo User",
  email: "demo@example.com",
}

export const mockAuthAdapter: AuthAdapter = {
  async login(): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 500))
    return { user: mockUser, token: "mock-jwt-token" }
  },
  async register(): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 500))
    return { user: mockUser, token: "mock-jwt-token" }
  },
  async logout(): Promise<void> {
    await new Promise((r) => setTimeout(r, 200))
  },
  async refreshToken(): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 200))
    return { user: mockUser, token: "mock-refreshed-token" }
  },
  async forgotPassword(): Promise<void> {
    await new Promise((r) => setTimeout(r, 500))
  },
  async resetPassword(): Promise<void> {
    await new Promise((r) => setTimeout(r, 500))
  },
}

export let authAdapter: AuthAdapter = mockAuthAdapter

export function setAuthAdapter(adapter: AuthAdapter) {
  authAdapter = adapter
}
