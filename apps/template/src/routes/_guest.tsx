import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { useAuthStore } from "@/features/auth"

export const Route = createFileRoute("/_guest")({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/" })
    }
  },
  component: () => (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  ),
})
