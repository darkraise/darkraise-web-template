"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import "./rating-group.css"

export interface RatingGroupValueChangeDetails {
  value: number
}

export interface RatingGroupItemState {
  index: number
  value: number
  highlighted: boolean
  half: boolean
}

interface RatingGroupContextValue {
  value: number
  hoverValue: number | null
  hoverHalf: boolean
  max: number
  allowHalf: boolean
  readOnly: boolean
  disabled: boolean
  name?: string
  labelId: string
  setHover: (value: number | null, half?: boolean) => void
  commit: (next: number) => void
  focusItem: (index: number) => void
  registerItem: (index: number, el: HTMLElement | null) => void
  itemsRef: React.RefObject<Map<number, HTMLElement>>
}

const RatingGroupContext = React.createContext<RatingGroupContextValue | null>(
  null,
)

const RatingGroupItemStateContext =
  React.createContext<RatingGroupItemState | null>(null)

function useRatingGroupContext(part: string): RatingGroupContextValue {
  const ctx = React.useContext(RatingGroupContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within a <RatingGroup> root component`,
    )
  }
  return ctx
}

function clamp(n: number, min: number, max: number): number {
  if (n < min) return min
  if (n > max) return max
  return n
}

function snap(n: number, allowHalf: boolean): number {
  if (allowHalf) return Math.round(n * 2) / 2
  return Math.round(n)
}

function getItemState(
  index: number,
  value: number,
  hoverValue: number | null,
  hoverHalf: boolean,
  allowHalf: boolean,
): RatingGroupItemState {
  const effective = hoverValue ?? value
  let half = false
  if (allowHalf) {
    if (hoverValue !== null) {
      half = hoverValue === index && hoverHalf
    } else {
      half = effective === index - 0.5
    }
  }
  const highlighted = effective >= index || effective === index - 0.5
  return {
    index,
    value: effective,
    highlighted,
    half,
  }
}

export interface RatingGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  value?: number
  defaultValue?: number
  onValueChange?: (details: RatingGroupValueChangeDetails) => void
  max?: number
  allowHalf?: boolean
  readOnly?: boolean
  disabled?: boolean
  name?: string
}

function RatingGroup({
  className,
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max = 5,
  allowHalf = false,
  readOnly = false,
  disabled = false,
  name,
  children,
  ...rest
}: RatingGroupProps) {
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState<number>(
    snap(defaultValue, allowHalf),
  )
  const rawValue = isControlled ? (valueProp as number) : internalValue
  const value = clamp(snap(rawValue, allowHalf), 0, max)

  const onValueChangeRef = React.useRef(onValueChange)
  React.useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  const [hoverState, setHoverState] = React.useState<{
    value: number | null
    half: boolean
  }>({ value: null, half: false })

  const setHover = React.useCallback(
    (next: number | null, half: boolean = false) => {
      if (disabled) return
      setHoverState({ value: next, half })
    },
    [disabled],
  )

  const commit = React.useCallback(
    (next: number) => {
      if (disabled || readOnly) return
      const snapped = clamp(snap(next, allowHalf), 0, max)
      if (!isControlled) setInternalValue(snapped)
      onValueChangeRef.current?.({ value: snapped })
    },
    [allowHalf, disabled, isControlled, max, readOnly],
  )

  const itemsRef = React.useRef<Map<number, HTMLElement>>(new Map())
  const registerItem = React.useCallback(
    (index: number, el: HTMLElement | null) => {
      if (el) itemsRef.current.set(index, el)
      else itemsRef.current.delete(index)
    },
    [],
  )

  const focusItem = React.useCallback((index: number) => {
    const el = itemsRef.current.get(index)
    el?.focus()
  }, [])

  const labelId = React.useId()

  const ctx = React.useMemo<RatingGroupContextValue>(
    () => ({
      value,
      hoverValue: hoverState.value,
      hoverHalf: hoverState.half,
      max,
      allowHalf,
      readOnly,
      disabled,
      name,
      labelId,
      setHover,
      commit,
      focusItem,
      registerItem,
      itemsRef,
    }),
    [
      value,
      hoverState.value,
      hoverState.half,
      max,
      allowHalf,
      readOnly,
      disabled,
      name,
      labelId,
      setHover,
      commit,
      focusItem,
      registerItem,
    ],
  )

  return (
    <div
      className={cn("dr-rating-group", className)}
      data-disabled={disabled ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
      {...rest}
    >
      <RatingGroupContext.Provider value={ctx}>
        {children}
      </RatingGroupContext.Provider>
    </div>
  )
}

function RatingGroupLabel({
  className,
  id,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { labelId } = useRatingGroupContext("RatingGroupLabel")
  return (
    <label
      id={id ?? labelId}
      className={cn("dr-rating-group-label", className)}
      {...props}
    />
  )
}

export interface RatingGroupControlProps extends React.HTMLAttributes<HTMLDivElement> {
  renderItem?: (state: RatingGroupItemState, index: number) => React.ReactNode
}

function RatingGroupControl({
  className,
  renderItem,
  onPointerLeave,
  onPointerCancel,
  children,
  ...props
}: RatingGroupControlProps) {
  const { setHover, max, labelId } = useRatingGroupContext("RatingGroupControl")

  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event)
    if (event.defaultPrevented) return
    setHover(null)
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerCancel?.(event)
    if (event.defaultPrevented) return
    setHover(null)
  }

  let content: React.ReactNode = children
  if (renderItem && !children) {
    content = (
      <>
        {Array.from({ length: max }).map((_, i) => {
          const index = i + 1
          return (
            <RatingGroupItem key={index} index={index}>
              <RatingGroupItemContext>
                {(state) => renderItem(state, index)}
              </RatingGroupItemContext>
            </RatingGroupItem>
          )
        })}
        <RatingGroupHiddenInput />
      </>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className={cn("dr-rating-group-control", className)}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
      {...props}
    >
      {content}
    </div>
  )
}

export interface RatingGroupItemProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "onClick"
> {
  index: number
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void
}

function RatingGroupItem({
  className,
  index,
  children,
  onClick,
  onPointerEnter,
  onPointerMove,
  onKeyDown,
  ...props
}: RatingGroupItemProps) {
  const ctx = useRatingGroupContext("RatingGroupItem")
  const {
    value,
    hoverValue,
    hoverHalf,
    max,
    allowHalf,
    readOnly,
    disabled,
    setHover,
    commit,
    focusItem,
    registerItem,
  } = ctx

  const innerRef = React.useRef<HTMLSpanElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      innerRef.current = node
      registerItem(index, node)
    },
    [index, registerItem],
  )

  const state = getItemState(index, value, hoverValue, hoverHalf, allowHalf)
  const ariaCheckedTarget = Math.ceil(value)
  const isChecked = ariaCheckedTarget === index
  const tabIndex = (() => {
    if (disabled) return -1
    if (value === 0) return index === 1 ? 0 : -1
    return ariaCheckedTarget === index ? 0 : -1
  })()

  const handlePointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    onPointerMove?.(event)
    if (event.defaultPrevented) return
    if (disabled) return
    if (!allowHalf) {
      if (hoverValue !== index || hoverHalf) setHover(index, false)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const isLeftHalf = event.clientX - rect.left < rect.width / 2
    if (hoverValue !== index || hoverHalf !== isLeftHalf) {
      setHover(index, isLeftHalf)
    }
  }

  const handlePointerEnter = (event: React.PointerEvent<HTMLSpanElement>) => {
    onPointerEnter?.(event)
    if (event.defaultPrevented) return
    if (disabled) return
    if (!allowHalf) {
      setHover(index, false)
    } else {
      const rect = event.currentTarget.getBoundingClientRect()
      const isLeftHalf = event.clientX - rect.left < rect.width / 2
      setHover(index, isLeftHalf)
    }
  }

  const handleClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (disabled || readOnly) return
    if (!allowHalf) {
      commit(index)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const isLeftHalf = event.clientX - rect.left < rect.width / 2
    commit(isLeftHalf ? index - 0.5 : index)
  }

  const step = allowHalf ? 0.5 : 1

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (disabled) return
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp": {
        if (readOnly) return
        event.preventDefault()
        const next = clamp(value + step, 0, max)
        commit(next)
        const focusTarget = Math.max(1, Math.ceil(next))
        focusItem(focusTarget)
        return
      }
      case "ArrowLeft":
      case "ArrowDown": {
        if (readOnly) return
        event.preventDefault()
        const next = clamp(value - step, 0, max)
        commit(next)
        const focusTarget = Math.max(1, Math.ceil(next))
        focusItem(focusTarget)
        return
      }
      case "Home": {
        if (readOnly) return
        event.preventDefault()
        commit(0)
        focusItem(1)
        return
      }
      case "End": {
        if (readOnly) return
        event.preventDefault()
        commit(max)
        focusItem(max)
        return
      }
      case " ":
      case "Enter": {
        if (readOnly) return
        event.preventDefault()
        if (hoverValue !== null) {
          const target = allowHalf && hoverHalf ? hoverValue - 0.5 : hoverValue
          commit(target)
        } else {
          commit(index)
        }
        return
      }
      default:
        return
    }
  }

  return (
    <RatingGroupItemStateContext.Provider value={state}>
      <span
        ref={setRef}
        role="radio"
        tabIndex={tabIndex}
        aria-checked={isChecked}
        aria-posinset={index}
        aria-setsize={max}
        aria-disabled={disabled || undefined}
        data-disabled={disabled ? "true" : undefined}
        data-readonly={readOnly ? "true" : undefined}
        data-highlighted={state.highlighted ? "true" : "false"}
        data-half={state.half ? "true" : "false"}
        data-checked={isChecked ? "true" : undefined}
        className={cn("dr-rating-group-item", "focus-ring-tight", className)}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </span>
    </RatingGroupItemStateContext.Provider>
  )
}

export interface RatingGroupItemContextProps {
  children: (state: RatingGroupItemState) => React.ReactNode
}

function RatingGroupItemContext({ children }: RatingGroupItemContextProps) {
  const state = React.useContext(RatingGroupItemStateContext)
  if (!state) {
    throw new Error(
      "<RatingGroupItemContext> must be used within a <RatingGroupItem>",
    )
  }
  return <>{children(state)}</>
}

function RatingGroupHiddenInput(
  props: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "name"
  >,
) {
  const { value, name } = useRatingGroupContext("RatingGroupHiddenInput")
  if (!name) return null
  return (
    <input
      type="hidden"
      name={name}
      value={String(value)}
      data-rating-hidden-input=""
      {...props}
    />
  )
}

export {
  RatingGroup,
  RatingGroupLabel,
  RatingGroupControl,
  RatingGroupItem,
  RatingGroupItemContext,
  RatingGroupHiddenInput,
}
