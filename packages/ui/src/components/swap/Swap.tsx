import * as React from "react"

import { cn } from "../../lib/utils"
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
  onPressedChange,
  children,
  ...props
}: SwapProps) {
  const isControlled = pressedProp !== undefined
  const [internalPressed, setInternalPressed] = React.useState(defaultPressed)
  const pressed = isControlled ? pressedProp : internalPressed
  const onPressedChangeRef = React.useRef(onPressedChange)

  React.useEffect(() => {
    onPressedChangeRef.current = onPressedChange
  }, [onPressedChange])

  const previousPressedRef = React.useRef(pressed)
  React.useEffect(() => {
    if (previousPressedRef.current !== pressed) {
      previousPressedRef.current = pressed
      onPressedChangeRef.current?.(pressed)
    }
  }, [pressed])

  // setInternalPressed is exposed in case future iterations want a setter on
  // context; current behaviour is purely presentational, so consumers update
  // pressed externally.
  void setInternalPressed

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
