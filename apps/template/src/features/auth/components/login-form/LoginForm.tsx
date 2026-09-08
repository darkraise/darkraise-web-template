import { useAppTranslation } from "@/i18n/useAppTranslation"
import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "darkraise-ui/components/button"
import { FieldLabel } from "darkraise-ui/components/field"
import { Alert, AlertDescription } from "darkraise-ui/components/alert"
import { Stack } from "darkraise-ui/layout"
import { useAuth } from "../../hooks/useAuth"
import { AuthFormField } from "../auth-form-field"

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export function LoginForm() {
  const t = useAppTranslation()

  const { login } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      setFormError(null)
      try {
        await login(value)
      } catch (err) {
        setFormError(
          err instanceof Error
            ? err.message
            : t("Unable to sign in. Please try again."),
        )
      }
    },
  })

  return (
    <>
      <Stack gap="xs" className="text-center">
        <h1 className="text-2xl font-medium">{t("Welcome back")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("Enter your credentials to sign in")}
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

          <form.Field name="password">
            {(field) => (
              <AuthFormField
                field={field}
                label={t("Password")}
                type="password"
                autoComplete="current-password"
                labelSlot={
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name}>
                      {t("Password")}
                    </FieldLabel>
                    <Link
                      to="/forgot-password"
                      className="text-muted-foreground hover:text-primary text-xs"
                    >
                      {t("Forgot password?")}
                    </Link>
                  </div>
                }
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
                {isSubmitting ? t("Signing in...") : t("Sign in")}
              </Button>
            )}
          />
        </Stack>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        {t("Don&apos;t have an account?")}{" "}
        <Link to="/register" className="text-primary hover:underline">
          {t("Sign up")}
        </Link>
      </p>
    </>
  )
}
