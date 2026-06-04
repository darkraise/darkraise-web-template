import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "darkraise-ui/components/button"
import { Stack } from "darkraise-ui/layout"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute("/_guest/reset-password")({
  validateSearch: searchSchema,
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  const { token } = Route.useSearch()

  if (!token) {
    return (
      <Stack gap="md" className="text-center">
        <h1 className="text-2xl font-medium">Invalid reset link</h1>
        <p className="text-muted-foreground text-sm">
          This password reset link is missing or has expired. Request a new one
          to continue.
        </p>
        <Link to="/forgot-password">
          <Button variant="outline" className="mt-4">
            Request a new link
          </Button>
        </Link>
      </Stack>
    )
  }

  return <ResetPasswordForm token={token} />
}
