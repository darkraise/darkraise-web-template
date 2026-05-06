import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "darkraise-ui/components/button"
import { Stack } from "darkraise-ui/layout"
import { useAuth } from "../../hooks/useAuth"
import { AuthFormField } from "../auth-form-field"

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { resetPassword } = useAuth()

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await resetPassword(token, value.password)
    },
  })

  return (
    <>
      <Stack gap="xs" className="text-center">
        <h1 className="text-2xl font-medium">Reset password</h1>
        <p className="text-muted-foreground text-sm">Enter your new password</p>
      </Stack>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <Stack gap="md">
          <form.Field name="password">
            {(field) => (
              <AuthFormField
                field={field}
                label="New password"
                type="password"
                placeholder="At least 8 characters"
              />
            )}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => (
              <AuthFormField
                field={field}
                label="Confirm password"
                type="password"
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
                {isSubmitting ? "Resetting..." : "Reset password"}
              </Button>
            )}
          />
        </Stack>
      </form>
    </>
  )
}
