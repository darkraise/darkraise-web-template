import { useState } from "react"
import type { AnyFieldApi } from "@tanstack/react-form"
import type { InputHTMLAttributes, ReactNode } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Field, FieldLabel, FieldError } from "darkraise-ui/components/field"
import { Input } from "darkraise-ui/components/input"
import { Button } from "darkraise-ui/components/button"

interface AuthFormFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onBlur"
> {
  field: AnyFieldApi
  label: string
  labelSlot?: ReactNode
}

export function AuthFormField({
  field,
  label,
  labelSlot,
  ...inputProps
}: AuthFormFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isPassword = inputProps.type === "password"
  const [revealed, setRevealed] = useState(false)

  return (
    <Field data-invalid={isInvalid}>
      {labelSlot ?? <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Input
        id={field.name}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        {...inputProps}
        type={isPassword && revealed ? "text" : inputProps.type}
        trailingAction={
          isPassword ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              onClick={() => setRevealed((prev) => !prev)}
            >
              {revealed ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          ) : undefined
        }
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
