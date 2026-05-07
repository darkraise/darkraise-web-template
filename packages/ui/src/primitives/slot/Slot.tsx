import * as React from "react"
import { cn } from "@lib/utils"
import { composeRefs } from "./composeRefs"

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export function Slot({
  children,
  className,
  style,
  ref,
  ...rest
}: SlotProps & { ref?: React.Ref<HTMLElement> }) {
  if (!React.isValidElement(children)) {
    throw new Error("Slot expects a single React element child")
  }

  type ChildProps = React.HTMLAttributes<HTMLElement> & {
    className?: string
    style?: React.CSSProperties
    ref?: React.Ref<HTMLElement>
  }
  const child = children as React.ReactElement<ChildProps>
  const childProps = child.props ?? {}

  const merged: ChildProps = {
    ...rest,
    ...childProps,
    className: cn(className, childProps.className),
    style: { ...style, ...childProps.style },
    ref: composeRefs<HTMLElement>(
      ref,
      (child as unknown as { ref?: React.Ref<HTMLElement> }).ref,
    ),
  }

  // Compose event handlers — parent runs first; child runs unless parent preventDefaults.
  for (const key of Object.keys(rest) as Array<keyof typeof rest>) {
    const k = key as string
    if (!k.startsWith("on")) continue
    const parentHandler = (rest as Record<string, unknown>)[k]
    const childHandler = (childProps as Record<string, unknown>)[k]
    if (
      typeof parentHandler === "function" &&
      typeof childHandler === "function"
    ) {
      ;(merged as Record<string, unknown>)[k] = (...args: unknown[]) => {
        ;(parentHandler as (...a: unknown[]) => void)(...args)
        const event = args[0] as { defaultPrevented?: boolean } | undefined
        if (event?.defaultPrevented) return
        ;(childHandler as (...a: unknown[]) => void)(...args)
      }
    }
  }

  return React.cloneElement(child, merged)
}
