import * as React from "react"
import { cn } from "@lib/utils"
import "./kbd.css"

export type KbdSize = "sm" | "md" | "lg"

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  size?: KbdSize
}

function Kbd({ className, size = "md", ...rest }: KbdProps) {
  return <kbd data-size={size} className={cn("dr-kbd", className)} {...rest} />
}

export { Kbd }
