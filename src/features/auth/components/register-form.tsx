import { Link } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { FieldWrapper } from "@/features/forms"
import { useAuth } from "../hooks/use-auth"

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
        <p className="text-sm text-muted-foreground">
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
        <form.Field
          name="name"
          children={(field) => (
            <FieldWrapper field={field} label="Name">
              <Input
                id={field.name}
                placeholder="Your name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </FieldWrapper>
          )}
        />

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

        <form.Field
          name="password"
          children={(field) => (
            <FieldWrapper field={field} label="Password">
              <Input
                id={field.name}
                type="password"
                placeholder="At least 8 characters"
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          )}
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
