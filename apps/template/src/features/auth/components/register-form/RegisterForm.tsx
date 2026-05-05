import { Link } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "darkraise-ui/components/button"
import { useAuth } from "../../hooks/useAuth"
import { AuthFormField } from "../auth-form-field"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export function RegisterForm() {
  const { register } = useAuth()

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: { onChange: registerSchema },
    onSubmit: async ({ value }) => {
      await register(value)
    },
  })

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-medium">Create an account</h1>
        <p className="text-muted-foreground text-sm">
          Enter your details to get started
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <form.Field name="name">
          {(field) => (
            <AuthFormField field={field} label="Name" placeholder="Your name" />
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <AuthFormField
              field={field}
              label="Email"
              type="email"
              placeholder="name@example.com"
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <AuthFormField
              field={field}
              label="Password"
              type="password"
              placeholder="At least 8 characters"
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          )}
        />
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
