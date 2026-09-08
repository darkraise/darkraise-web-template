import { useAppTranslation } from "@/i18n/useAppTranslation"
import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "darkraise-ui/components/button"
import { Alert, AlertDescription } from "darkraise-ui/components/alert"
import { Stack } from "darkraise-ui/layout"
import { useAuth } from "../../hooks/useAuth"
import { AuthFormField } from "../auth-form-field"

const schema = z.object({
  email: z.email("Enter a valid email"),
})

export function ForgotPasswordForm() {
  const t = useAppTranslation()

  const { forgotPassword } = useAuth()
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      setFormError(null)
      try {
        await forgotPassword(value.email)
        setSent(true)
      } catch (err) {
        setFormError(
          err instanceof Error
            ? err.message
            : t("Unable to send the reset link. Please try again."),
        )
      }
    },
  })

  if (sent) {
    return (
      <Stack gap="md" className="text-center">
        <h1 className="text-2xl font-medium">{t("Check your email")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("We sent a password reset link to your email address.")}
        </p>
        <Link to="/login">
          <Button variant="outline" className="mt-4">
            {t("Back to sign in")}
          </Button>
        </Link>
      </Stack>
    )
  }

  return (
    <>
      <Stack gap="xs" className="text-center">
        <h1 className="text-2xl font-medium">{t("Forgot password?")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("Enter your email and we&apos;ll send a reset link")}
        </p>
      </Stack>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <Stack gap="md">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <form.Field name="email">
            {(field) => (
              <AuthFormField
                field={field}
                label={t("Email")}
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="name@example.com"
              />
            )}
          </form.Field>

          <form.Subscribe
            selector={(s) => [s.canSubmit, s.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? t("Sending...") : t("Send reset link")}
              </Button>
            )}
          />
        </Stack>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        <Link to="/login" className="text-primary hover:underline">
          {t("Back to sign in")}
        </Link>
      </p>
    </>
  )
}
