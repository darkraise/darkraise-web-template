"use client"

import * as React from "react"

import { Button } from "@components/button"
import { cn } from "@lib/utils"
import "./steps.css"

export type StepStatus = "complete" | "current" | "upcoming"

export type StepsOrientation = "horizontal" | "vertical"

export interface StepsStepChangeDetails {
  step: number
}

interface StepsContextValue {
  step: number
  count: number
  orientation: StepsOrientation
  linear: boolean
  goToStep: (next: number) => void
  next: () => void
  prev: () => void
  registerTrigger: (index: number, el: HTMLElement | null) => void
  focusTrigger: (index: number) => void
  listRef: React.RefObject<HTMLDivElement | null>
  triggersRef: React.RefObject<Map<number, HTMLElement>>
}

const StepsContext = React.createContext<StepsContextValue | null>(null)

function useStepsContext(part: string): StepsContextValue {
  const ctx = React.useContext(StepsContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <Steps> root component`)
  }
  return ctx
}

function clampStep(value: number, count: number): number {
  if (value < 0) return 0
  if (value > count) return count
  return value
}

function statusFor(index: number, step: number): StepStatus {
  if (index < step) return "complete"
  if (index === step) return "current"
  return "upcoming"
}

export interface StepsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  count: number
  step?: number
  defaultStep?: number
  onStepChange?: (details: StepsStepChangeDetails) => void
  orientation?: StepsOrientation
  linear?: boolean
}

function Steps({
  className,
  count,
  step: stepProp,
  defaultStep = 0,
  onStepChange,
  orientation = "horizontal",
  linear = false,
  children,
  ...rest
}: StepsProps) {
  const isControlled = stepProp !== undefined

  const [internalStep, setInternalStep] = React.useState<number>(
    clampStep(defaultStep, count),
  )

  const rawStep = isControlled ? (stepProp as number) : internalStep
  const step = clampStep(rawStep, count)

  const onStepChangeRef = React.useRef(onStepChange)
  React.useEffect(() => {
    onStepChangeRef.current = onStepChange
  }, [onStepChange])

  const goToStep = React.useCallback(
    (nextStep: number) => {
      const clamped = clampStep(nextStep, count)
      if (clamped === step) return
      if (!isControlled) {
        setInternalStep(clamped)
      }
      onStepChangeRef.current?.({ step: clamped })
    },
    [count, isControlled, step],
  )

  const next = React.useCallback(() => {
    goToStep(step + 1)
  }, [goToStep, step])

  const prev = React.useCallback(() => {
    goToStep(step - 1)
  }, [goToStep, step])

  const triggersRef = React.useRef<Map<number, HTMLElement>>(new Map())
  const listRef = React.useRef<HTMLDivElement | null>(null)

  const registerTrigger = React.useCallback(
    (index: number, el: HTMLElement | null) => {
      const map = triggersRef.current
      if (el) {
        map.set(index, el)
      } else {
        map.delete(index)
      }
    },
    [],
  )

  const focusTrigger = React.useCallback((index: number) => {
    const el = triggersRef.current.get(index)
    el?.focus()
  }, [])

  const ctx = React.useMemo<StepsContextValue>(
    () => ({
      step,
      count,
      orientation,
      linear,
      goToStep,
      next,
      prev,
      registerTrigger,
      focusTrigger,
      listRef,
      triggersRef,
    }),
    [
      step,
      count,
      orientation,
      linear,
      goToStep,
      next,
      prev,
      registerTrigger,
      focusTrigger,
    ],
  )

  return (
    <div
      className={cn("dr-steps", className)}
      data-orientation={orientation}
      {...rest}
    >
      <StepsContext.Provider value={ctx}>{children}</StepsContext.Provider>
    </div>
  )
}

export type StepsListProps = React.HTMLAttributes<HTMLDivElement>

function StepsList({ className, onKeyDown, ...props }: StepsListProps) {
  const { orientation, listRef, triggersRef, focusTrigger, count } =
    useStepsContext("StepsList")

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    const indices = Array.from(triggersRef.current.keys()).sort((a, b) => a - b)
    if (indices.length === 0) return

    const activeEl = document.activeElement as HTMLElement | null
    const currentIndex = indices.find(
      (i) => triggersRef.current.get(i) === activeEl,
    )

    const first = indices[0]
    const last = indices[indices.length - 1]
    if (first === undefined || last === undefined) return

    const isVertical = orientation === "vertical"
    const nextKey = isVertical ? "ArrowDown" : "ArrowRight"
    const prevKey = isVertical ? "ArrowUp" : "ArrowLeft"

    const focusAt = (i: number) => {
      const target = indices[i]
      if (target !== undefined) focusTrigger(target)
    }

    switch (event.key) {
      case nextKey: {
        event.preventDefault()
        if (currentIndex === undefined) {
          focusTrigger(first)
          return
        }
        const pos = indices.indexOf(currentIndex)
        focusAt(Math.min(pos + 1, indices.length - 1))
        return
      }
      case prevKey: {
        event.preventDefault()
        if (currentIndex === undefined) {
          focusTrigger(first)
          return
        }
        const pos = indices.indexOf(currentIndex)
        focusAt(Math.max(pos - 1, 0))
        return
      }
      case "Home": {
        event.preventDefault()
        focusTrigger(first)
        return
      }
      case "End": {
        event.preventDefault()
        focusTrigger(last)
        return
      }
      default:
        return
    }
  }

  // Keep count referenced so list re-renders if consumer count changes.
  void count

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation={orientation}
      data-orientation={orientation}
      className={cn("dr-steps-list", className)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

interface StepsItemContextValue {
  index: number
  status: StepStatus
}

const StepsItemContext = React.createContext<StepsItemContextValue | null>(null)

function useStepsItemContext(part: string): StepsItemContextValue {
  const ctx = React.useContext(StepsItemContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <StepsItem>`)
  }
  return ctx
}

export interface StepsItemProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number
}

function StepsItem({ className, index, children, ...props }: StepsItemProps) {
  const { step, orientation } = useStepsContext("StepsItem")
  const status = statusFor(index, step)

  const itemCtx = React.useMemo<StepsItemContextValue>(
    () => ({ index, status }),
    [index, status],
  )

  return (
    <div
      className={cn("dr-steps-item", className)}
      data-status={status}
      data-orientation={orientation}
      {...props}
    >
      <StepsItemContext.Provider value={itemCtx}>
        {children}
      </StepsItemContext.Provider>
    </div>
  )
}

export interface StepsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function StepsTrigger({
  className,
  type = "button",
  onClick,
  ref,
  ...props
}: StepsTriggerProps) {
  const { step, linear, goToStep, registerTrigger } =
    useStepsContext("StepsTrigger")
  const { index, status } = useStepsItemContext("StepsTrigger")

  const innerRef = React.useRef<HTMLButtonElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      innerRef.current = node
      registerTrigger(index, node)
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [index, registerTrigger, ref],
  )

  const isLinearLocked = linear && status === "upcoming"
  const isCurrent = index === step
  const tabIndex = isCurrent ? 0 : -1

  return (
    <button
      ref={setRef}
      type={type}
      role="tab"
      aria-selected={isCurrent}
      aria-current={isCurrent ? "step" : undefined}
      tabIndex={tabIndex}
      data-status={status}
      data-locked={isLinearLocked ? "true" : undefined}
      className={cn("dr-steps-trigger", "focus-ring-tight", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (isLinearLocked) return
        goToStep(index)
      }}
      {...props}
    />
  )
}

export type StepsIndicatorProps = React.HTMLAttributes<HTMLDivElement>

function StepsIndicator({ className, ...props }: StepsIndicatorProps) {
  const { status } = useStepsItemContext("StepsIndicator")
  return (
    <div
      data-status={status}
      aria-hidden="true"
      className={cn("dr-steps-indicator", className)}
      {...props}
    />
  )
}

export type StepsTitleProps = React.HTMLAttributes<HTMLSpanElement>

function StepsTitle({ className, ...props }: StepsTitleProps) {
  const { status } = useStepsItemContext("StepsTitle")
  return (
    <span
      data-status={status}
      className={cn("dr-steps-title", className)}
      {...props}
    />
  )
}

export type StepsSeparatorProps = React.HTMLAttributes<HTMLDivElement>

function StepsSeparator({ className, ...props }: StepsSeparatorProps) {
  const { orientation } = useStepsContext("StepsSeparator")
  const { status } = useStepsItemContext("StepsSeparator")
  return (
    <div
      role="separator"
      aria-hidden="true"
      data-status={status}
      data-orientation={orientation}
      className={cn("dr-steps-separator", className)}
      {...props}
    />
  )
}

export interface StepsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number
}

function StepsContent({
  className,
  index,
  children,
  ...props
}: StepsContentProps) {
  const { step } = useStepsContext("StepsContent")
  const isActive = index === step
  return (
    <div
      role="tabpanel"
      data-status={isActive ? "active" : "inactive"}
      hidden={!isActive}
      className={cn("dr-steps-content", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export type StepsCompletedContentProps = React.HTMLAttributes<HTMLDivElement>

function StepsCompletedContent({
  className,
  children,
  ...props
}: StepsCompletedContentProps) {
  const { step, count } = useStepsContext("StepsCompletedContent")
  const isComplete = step === count
  if (!isComplete) return null
  return (
    <div
      role="tabpanel"
      data-active="true"
      className={cn("dr-steps-completed-content", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export type StepsControlsProps = React.HTMLAttributes<HTMLDivElement>

function StepsControls({ className, ...props }: StepsControlsProps) {
  return <div className={cn("dr-steps-controls", className)} {...props} />
}

export type StepsPrevTriggerProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>

function StepsPrevTrigger({
  className,
  type = "button",
  onClick,
  disabled,
  ...props
}: StepsPrevTriggerProps) {
  const { step, prev } = useStepsContext("StepsPrevTrigger")
  const isAtStart = step === 0
  const isDisabled = disabled || isAtStart
  return (
    <Button
      type={type}
      variant="outline"
      disabled={isDisabled}
      data-disabled={isDisabled ? "true" : undefined}
      className={cn("dr-steps-prev-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (isDisabled) return
        prev()
      }}
      {...props}
    />
  )
}

export type StepsNextTriggerProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>

function StepsNextTrigger({
  className,
  type = "button",
  onClick,
  disabled,
  ...props
}: StepsNextTriggerProps) {
  const { step, count, next } = useStepsContext("StepsNextTrigger")
  const isAtEnd = step === count
  const isDisabled = disabled || isAtEnd
  return (
    <Button
      type={type}
      variant="default"
      disabled={isDisabled}
      data-disabled={isDisabled ? "true" : undefined}
      className={cn("dr-steps-next-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (isDisabled) return
        next()
      }}
      {...props}
    />
  )
}

export {
  Steps,
  StepsList,
  StepsItem,
  StepsTrigger,
  StepsIndicator,
  StepsTitle,
  StepsSeparator,
  StepsContent,
  StepsCompletedContent,
  StepsControls,
  StepsPrevTrigger,
  StepsNextTrigger,
}
