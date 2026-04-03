import { Link } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { useAuth } from "../hooks/use-auth"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export function LoginForm() {
  const { login } = useAuth()

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      await login(value)
    },
  })

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-medium">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to sign in
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
            <div className="space-y-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                type="email"
                placeholder="name@example.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => (
                  <p key={err.message} className="text-xs text-destructive">
                    {err.message}
                  </p>
                ))}
            </div>
          )}
        />

        <form.Field
          name="password"
          children={(field) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => (
                  <p key={err.message} className="text-xs text-destructive">
                    {err.message}
                  </p>
                ))}
            </div>
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
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          )}
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  )
}
