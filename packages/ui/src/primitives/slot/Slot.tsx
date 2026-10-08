import * as React from "react"
import { cn } from "@lib/utils"
import { useComposedRefs } from "./composeRefs"

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
  // In React 19 the ref of a child is a regular prop (`child.props.ref`).
  // Reading the legacy `child.ref` accessor logs a removal warning, so
  // pull it from props instead.
  const childRef = React.isValidElement(children)
    ? (children.props as { ref?: React.Ref<HTMLElement> }).ref
    : undefined
  const composedRef = useComposedRefs<HTMLElement>(ref, childRef)

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

  // Strip undefined values from childProps so they don't clobber valid
  // parent props (e.g. <button onClick={undefined}> would otherwise
  // wipe out the slot's onClick handler).
  const definedChildProps: Record<string, unknown> = {}
  for (const k of Object.keys(childProps)) {
    const v = (childProps as Record<string, unknown>)[k]
    if (v !== undefined) definedChildProps[k] = v
  }

  const merged: ChildProps = {
    ...rest,
    ...(definedChildProps as ChildProps),
    className: cn(className, childProps.className),
    style: { ...style, ...childProps.style },
    ref: composedRef,
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
