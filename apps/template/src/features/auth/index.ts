export { useAuth } from "./hooks/useAuth"
export { useAuthStore } from "./store"
export { authAdapter, setAuthAdapter, mockAuthAdapter } from "./adapter"
export type {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AuthAdapter,
} from "./types"
