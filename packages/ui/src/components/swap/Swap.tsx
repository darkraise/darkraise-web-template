import * as React from "react"

import { cn } from "@lib/utils"
import "./swap.css"

interface SwapContextValue {
  pressed: boolean
}

const SwapContext = React.createContext<SwapContextValue | null>(null)

function useSwapContext(part: string): SwapContextValue {
  const ctx = React.useContext(SwapContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <Swap> root component`)
  }
  return ctx
}

export interface SwapProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

function Swap({
  className,
  pressed: pressedProp,
  defaultPressed = false,
  // Swap is presentational and doesn't drive its own pressed state, so the
  // callback is never invoked from inside the component. Keep it on the prop
  // surface for forward compatibility but strip it from the rest props so it
  // doesn't reach the underlying <div> as an unknown DOM attribute, and don't
  // echo controlled prop changes back to the parent.
  onPressedChange,
  children,
  ...props
}: SwapProps) {
  void onPressedChange
  const isControlled = pressedProp !== undefined
  const [internalPressed] = React.useState(defaultPressed)
  const pressed = isControlled ? pressedProp : internalPressed

  const ctx = React.useMemo<SwapContextValue>(() => ({ pressed }), [pressed])

  return (
    <div
      className={cn("dr-swap", className)}
      data-pressed={pressed ? "true" : "false"}
      {...props}
    >
      <SwapContext.Provider value={ctx}>{children}</SwapContext.Provider>
    </div>
  )
}

export interface SwapIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: "on" | "off"
}

function SwapIndicator({ className, state, ...props }: SwapIndicatorProps) {
  const { pressed } = useSwapContext("SwapIndicator")
  const active = state === "on" ? pressed : !pressed
  return (
    <span
      className={cn("dr-swap-indicator", className)}
      data-state={state}
      data-active={active ? "true" : "false"}
      aria-hidden={active ? undefined : "true"}
      {...props}
    />
  )
}

export { Swap, SwapIndicator }
