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

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export function RegisterForm() {
  const t = useAppTranslation()

  const { register } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: { onChange: registerSchema },
    onSubmit: async ({ value }) => {
      setFormError(null)
      try {
        await register(value)
      } catch (err) {
        setFormError(
          err instanceof Error
            ? err.message
            : t("Unable to create your account. Please try again."),
        )
      }
    },
  })

  return (
    <>
      <Stack gap="xs" className="text-center">
        <h1 className="text-2xl font-medium">{t("Create an account")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("Enter your details to get started")}
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

          <form.Field name="name">
            {(field) => (
              <AuthFormField
                field={field}
                label={t("Name")}
                autoComplete="name"
                autoFocus
                placeholder={t("Your name")}
              />
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <AuthFormField
                field={field}
                label={t("Email")}
                type="email"
                autoComplete="email"
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
                autoComplete="new-password"
                placeholder={t("At least 8 characters")}
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
                {isSubmitting ? t("Creating account...") : t("Create account")}
              </Button>
            )}
          />
        </Stack>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        {t("Already have an account?")}{" "}
        <Link to="/login" className="text-primary hover:underline">
          {t("Sign in")}
        </Link>
      </p>
    </>
  )
}
