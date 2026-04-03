import { createFileRoute } from "@tanstack/react-router"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"

export const Route = createFileRoute("/_guest/reset-password")({
  component: () => <ResetPasswordForm token="mock-token" />,
})
