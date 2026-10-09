import * as React from "react"

import { cn } from "@lib/utils"
import "./timer.css"

export type TimerState = "idle" | "running" | "paused" | "completed"
export type TimerAction = "start" | "pause" | "resume" | "reset" | "restart"
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
    case "restart":
      return true
  }
}

interface TimerClock {
  state: TimerState
  startedAt: number
  accumulated: number
  now: number
}

function elapsedOf(clock: TimerClock): number {
  return clock.state === "running"
    ? clock.accumulated + (clock.now - clock.startedAt)
    : clock.accumulated
}

function transition(
  clock: TimerClock,
  action: TimerAction,
  at: number,
): TimerClock {
  if (!isEnabled(clock.state, action)) return clock
  switch (action) {
    case "start":
    case "restart":
      return { state: "running", startedAt: at, accumulated: 0, now: at }
    case "pause":
      return {
        state: "paused",
        startedAt: 0,
        accumulated: clock.accumulated + (at - clock.startedAt),
        now: at,
      }
    case "resume":
      return { ...clock, state: "running", startedAt: at, now: at }
    case "reset":
      return { state: "idle", startedAt: 0, accumulated: 0, now: at }
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

  const [clock, setClock] = React.useState<TimerClock>(() => {
    const at = Date.now()
    return {
      state: initialState,
      startedAt: initialState === "running" ? at : 0,
      accumulated: 0,
      now: at,
    }
  })
  const { state } = clock
  const onTickRef = React.useRef(onTick)
  const onCompleteRef = React.useRef(onComplete)
  const completedOnMountRef = React.useRef(false)

  React.useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  React.useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Schedule ticks while running. Cleaned up on state change, interval change,
  // and unmount. Effect intentionally re-keys on interval so we honor changes
  // without callback identity churn.
  React.useEffect(() => {
    if (state !== "running") return
    const id = setInterval(() => {
      const at = Date.now()
      setClock((prev) => ({ ...prev, now: at }))
    }, interval)
    return () => clearInterval(id)
  }, [state, interval])

  // Drive tick callback + completion detection from clock updates.
  React.useEffect(() => {
    const elapsed = elapsedOf(clock)
    const display = countdown ? Math.max(0, targetMs - elapsed) : elapsed
    onTickRef.current?.(display)
    if (
      countdown &&
      clock.state === "running" &&
      targetMs > 0 &&
      elapsed >= targetMs
    ) {
      // Freeze accumulated at the target so display reads exactly 0.
      setClock({
        state: "completed",
        startedAt: 0,
        accumulated: targetMs,
        now: clock.now,
      })
      onCompleteRef.current?.()
    }
  }, [clock, countdown, targetMs])

  // Handle the immediate-complete case for autoStart with targetMs <= 0. The
  // ref keeps StrictMode's second mount from firing onComplete again.
  React.useEffect(() => {
    if (
      countdown &&
      autoStart &&
      targetMs <= 0 &&
      !completedOnMountRef.current
    ) {
      completedOnMountRef.current = true
      setClock((prev) => ({
        ...prev,
        state: "completed",
        startedAt: 0,
        accumulated: 0,
      }))
      onCompleteRef.current?.()
    }
    // run-once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The timestamp is taken here, not in the updater, so StrictMode's second
  // updater call computes the same transition.
  const dispatch = React.useCallback((action: TimerAction) => {
    const at = Date.now()
    setClock((prev) => transition(prev, action, at))
  }, [])

  const elapsedMs = elapsedOf(clock)
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
