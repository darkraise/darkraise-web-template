import { createFileRoute } from "@tanstack/react-router"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const Route = createFileRoute("/_guest/forgot-password")({
  component: ForgotPasswordForm,
})
