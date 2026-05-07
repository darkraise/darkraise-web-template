import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@lib/utils"
import "./button.css"

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
export type ButtonSize = "default" | "sm" | "lg" | "icon"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  type,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  // Default <button> elements to type="button"; the HTML default is "submit",
  // which silently submits the parent form on click.
  const resolvedType = asChild ? type : (type ?? "button")
  return (
    <Comp
      ref={ref}
      type={resolvedType}
      className={cn("dr-btn", className)}
      data-variant={variant}
      data-size={size}
      {...props}
    />
  )
}

export { Button }
