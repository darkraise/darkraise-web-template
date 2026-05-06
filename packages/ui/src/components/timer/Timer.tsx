import * as React from "react"

import { cn } from "../../lib/utils"
import "./timer.css"

export type TimerState = "idle" | "running" | "paused" | "completed"
export type TimerAction = "start" | "pause" | "resume" | "reset"
export type TimerItemType =
  | "days"
  | "hours"
  | "minutes"
  | "seconds"
  | "milliseconds"

export interface TimerParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

interface TimerContextValue {
  state: TimerState
  displayMs: number
  parts: TimerParts
  countdown: boolean
  isActionEnabled: (action: TimerAction) => boolean
  dispatch: (action: TimerAction) => void
}

const TimerContext = React.createContext<TimerContextValue | null>(null)

function useTimerContext(part: string): TimerContextValue {
  const ctx = React.useContext(TimerContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <Timer> root component`)
  }
  return ctx
}

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = MS_PER_SECOND * 60
const MS_PER_HOUR = MS_PER_MINUTE * 60
const MS_PER_DAY = MS_PER_HOUR * 24

function toParts(ms: number): TimerParts {
  const safe = Math.max(0, ms)
  const days = Math.floor(safe / MS_PER_DAY)
  const hours = Math.floor((safe % MS_PER_DAY) / MS_PER_HOUR)
  const minutes = Math.floor((safe % MS_PER_HOUR) / MS_PER_MINUTE)
  const seconds = Math.floor((safe % MS_PER_MINUTE) / MS_PER_SECOND)
  const milliseconds = Math.floor(safe % MS_PER_SECOND)
  return { days, hours, minutes, seconds, milliseconds }
}

function isEnabled(state: TimerState, action: TimerAction): boolean {
  switch (action) {
    case "start":
      return state === "idle"
    case "pause":
      return state === "running"
    case "resume":
      return state === "paused"
    case "reset":
      return true
  }
}

export interface TimerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  countdown?: boolean
  targetMs?: number
  interval?: number
  autoStart?: boolean
  onComplete?: () => void
  onTick?: (ms: number) => void
}

function Timer({
  className,
  countdown = false,
  targetMs = 0,
  interval = 250,
  autoStart = false,
  onComplete,
  onTick,
  children,
  ...props
}: TimerProps) {
  // Countdown with non-positive target is immediately complete.
  const initialState: TimerState =
    autoStart && (!countdown || targetMs > 0) ? "running" : "idle"

  const [state, setState] = React.useState<TimerState>(initialState)
  const [now, setNow] = React.useState<number>(() => Date.now())
  const startedAtMsRef = React.useRef<number>(
    initialState === "running" ? Date.now() : 0,
  )
  const accumulatedMsRef = React.useRef<number>(0)
  const onTickRef = React.useRef(onTick)
  const onCompleteRef = React.useRef(onComplete)
  const completedFiredRef = React.useRef(false)

  React.useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  React.useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const computeElapsed = React.useCallback(
    (currentNow: number): number => {
      if (state === "running") {
        return accumulatedMsRef.current + (currentNow - startedAtMsRef.current)
      }
      return accumulatedMsRef.current
    },
    [state],
  )

  // Schedule ticks while running. Cleaned up on state change, interval change,
  // and unmount. Effect intentionally re-keys on interval so we honor changes
  // without callback identity churn.
  React.useEffect(() => {
    if (state !== "running") return
    const id = setInterval(() => {
      setNow(Date.now())
    }, interval)
    return () => clearInterval(id)
  }, [state, interval])

  // Drive tick callback + completion detection from `now` updates.
  React.useEffect(() => {
    const elapsed = computeElapsed(now)
    const display = countdown ? Math.max(0, targetMs - elapsed) : elapsed
    onTickRef.current?.(display)
    if (
      countdown &&
      state === "running" &&
      targetMs > 0 &&
      elapsed >= targetMs &&
      !completedFiredRef.current
    ) {
      completedFiredRef.current = true
      // Freeze accumulated at the target so display reads exactly 0.
      accumulatedMsRef.current = targetMs
      startedAtMsRef.current = 0
      setState("completed")
      onCompleteRef.current?.()
    }
  }, [now, countdown, targetMs, state, computeElapsed])

  // Handle the immediate-complete case for autoStart with targetMs <= 0.
  React.useEffect(() => {
    if (countdown && autoStart && targetMs <= 0 && !completedFiredRef.current) {
      completedFiredRef.current = true
      accumulatedMsRef.current = 0
      setState("completed")
      onCompleteRef.current?.()
    }
    // run-once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dispatch = React.useCallback((action: TimerAction) => {
    setState((prev) => {
      if (!isEnabled(prev, action)) return prev
      const current = Date.now()
      switch (action) {
        case "start": {
          accumulatedMsRef.current = 0
          startedAtMsRef.current = current
          completedFiredRef.current = false
          setNow(current)
          return "running"
        }
        case "pause": {
          accumulatedMsRef.current += current - startedAtMsRef.current
          startedAtMsRef.current = 0
          setNow(current)
          return "paused"
        }
        case "resume": {
          startedAtMsRef.current = current
          setNow(current)
          return "running"
        }
        case "reset": {
          accumulatedMsRef.current = 0
          startedAtMsRef.current = 0
          completedFiredRef.current = false
          setNow(current)
          return "idle"
        }
      }
    })
  }, [])

  // Compute display synchronously each render based on `now`.
  const elapsedMs = computeElapsed(now)
  const displayMs = countdown ? Math.max(0, targetMs - elapsedMs) : elapsedMs
  const parts = React.useMemo(() => toParts(displayMs), [displayMs])

  const ctx = React.useMemo<TimerContextValue>(
    () => ({
      state,
      displayMs,
      parts,
      countdown,
      isActionEnabled: (action) => isEnabled(state, action),
      dispatch,
    }),
    [state, displayMs, parts, countdown, dispatch],
  )

  return (
    <div
      className={cn("dr-timer", className)}
      data-state={state}
      data-countdown={countdown ? "true" : "false"}
      {...props}
    >
      <TimerContext.Provider value={ctx}>{children}</TimerContext.Provider>
    </div>
  )
}

function TimerArea({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dr-timer-area", className)} {...props} />
}

export interface TimerItemProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  type: TimerItemType
}

function pad(value: number, length: number): string {
  return value.toString().padStart(length, "0")
}

function formatPart(type: TimerItemType, parts: TimerParts): string {
  switch (type) {
    case "days":
      // Days render naturally without leading zeros so longer durations are
      // not artificially clipped to 2 digits.
      return parts.days.toString()
    case "hours":
      return pad(parts.hours, 2)
    case "minutes":
      return pad(parts.minutes, 2)
    case "seconds":
      return pad(parts.seconds, 2)
    case "milliseconds":
      return pad(parts.milliseconds, 3)
  }
}

function TimerItem({ className, type, ...props }: TimerItemProps) {
  const { parts } = useTimerContext("TimerItem")
  return (
    <span
      className={cn("dr-timer-item", className)}
      data-type={type}
      {...props}
    >
      {formatPart(type, parts)}
    </span>
  )
}

function TimerSeparator({
  className,
  children = ":",
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("dr-timer-separator", className)}
      aria-hidden="true"
      {...props}
    >
      {children}
    </span>
  )
}

function TimerControl({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dr-timer-control", className)} {...props} />
}

export interface TimerActionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action: TimerAction
}

function TimerActionTrigger({
  className,
  action,
  disabled,
  onClick,
  type = "button",
  children,
  ref,
  ...props
}: TimerActionTriggerProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const { isActionEnabled, dispatch } = useTimerContext("TimerActionTrigger")
  const enabled = isActionEnabled(action)
  const isDisabled = disabled ?? !enabled
  return (
    <button
      ref={ref}
      type={type}
      className={cn("dr-timer-action-trigger", className)}
      data-action={action}
      data-state={enabled ? "enabled" : "disabled"}
      disabled={isDisabled}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (!enabled) return
        dispatch(action)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  Timer,
  TimerArea,
  TimerItem,
  TimerSeparator,
  TimerControl,
  TimerActionTrigger,
}
