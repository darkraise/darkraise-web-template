import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { FieldWrapper } from "@/features/forms"
import { useAuth } from "../hooks/use-auth"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
})

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuth()
  const [sent, setSent] = useState(false)

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await forgotPassword(value.email)
      setSent(true)
    },
  })

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-medium">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a password reset link to your email address.
        </p>
        <Link to="/login">
          <Button variant="outline" className="mt-4">
            Back to sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-medium">Forgot password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <form.Field
          name="email"
          children={(field) => (
            <FieldWrapper field={field} label="Email">
              <Input
                id={field.name}
                type="email"
                placeholder="name@example.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </FieldWrapper>
          )}
        />

        <form.Subscribe
          selector={(s) => [s.canSubmit, s.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          )}
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  )
}
