"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { cn } from "@lib/utils"
import "./segment-group.css"

type SegmentGroupOrientation = "horizontal" | "vertical"

interface SegmentGroupContextValue {
  value: string | null | undefined
  orientation: SegmentGroupOrientation
  disabled: boolean
  registerItem: (value: string, el: HTMLElement | null) => void
  rootRef: React.RefObject<HTMLDivElement | null>
  itemsRef: React.RefObject<Map<string, HTMLElement>>
  notifyItemsChanged: () => void
}

const SegmentGroupContext =
  React.createContext<SegmentGroupContextValue | null>(null)

function useSegmentGroupContext(part: string): SegmentGroupContextValue {
  const ctx = React.useContext(SegmentGroupContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within a <SegmentGroup> root component`,
    )
  }
  return ctx
}

export interface SegmentGroupProps extends Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Root>,
  "orientation"
> {
  orientation?: SegmentGroupOrientation
}

function SegmentGroup({
  className,
  orientation = "horizontal",
  disabled = false,
  value,
  defaultValue,
  onValueChange,
  children,
  ref,
  ...props
}: SegmentGroupProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState<
    string | null | undefined
  >(defaultValue)
  const currentValue = isControlled ? value : internalValue

  const onValueChangeRef = React.useRef(onValueChange)
  React.useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next)
      }
      onValueChangeRef.current?.(next)
    },
    [isControlled],
  )

  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const setRootRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  const itemsRef = React.useRef<Map<string, HTMLElement>>(new Map())
  const [itemsVersion, setItemsVersion] = React.useState(0)
  const notifyItemsChanged = React.useCallback(() => {
    setItemsVersion((v) => v + 1)
  }, [])

  const registerItem = React.useCallback(
    (itemValue: string, el: HTMLElement | null) => {
      const map = itemsRef.current
      if (el) {
        map.set(itemValue, el)
      } else {
        map.delete(itemValue)
      }
      notifyItemsChanged()
    },
    [notifyItemsChanged],
  )

  const ctx = React.useMemo<SegmentGroupContextValue>(
    () => ({
      value: currentValue,
      orientation,
      disabled,
      registerItem,
      rootRef,
      itemsRef,
      notifyItemsChanged,
    }),
    [currentValue, orientation, disabled, registerItem, notifyItemsChanged],
  )

  // Keep itemsVersion referenced to satisfy the lint rule and ensure
  // re-renders propagate to the indicator.
  void itemsVersion

  return (
    <RadioGroupPrimitive.Root
      ref={setRootRef}
      value={currentValue ?? ""}
      onValueChange={handleValueChange}
      orientation={orientation}
      disabled={disabled}
      data-orientation={orientation}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-segment-group", className)}
      {...props}
    >
      <SegmentGroupContext.Provider value={ctx}>
        {children}
      </SegmentGroupContext.Provider>
    </RadioGroupPrimitive.Root>
  )
}

export interface SegmentGroupItemProps extends Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Item>,
  "value"
> {
  value: string
}

function SegmentGroupItem({
  className,
  value,
  children,
  ref,
  disabled,
  ...props
}: SegmentGroupItemProps) {
  const {
    registerItem,
    value: activeValue,
    disabled: groupDisabled,
  } = useSegmentGroupContext("SegmentGroupItem")
  const innerRef = React.useRef<HTMLButtonElement | null>(null)
  const isDisabled = disabled || groupDisabled

  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      innerRef.current = node
      registerItem(value, node)
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [value, ref, registerItem],
  )

  const isChecked = activeValue === value

  return (
    <RadioGroupPrimitive.Item
      ref={setRef}
      value={value}
      disabled={isDisabled}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn("dr-segment-group-item", className)}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Item>
  )
}

export type SegmentGroupIndicatorProps = React.HTMLAttributes<HTMLDivElement>

function SegmentGroupIndicator({
  className,
  style,
  ...props
}: SegmentGroupIndicatorProps) {
  const { value, orientation, itemsRef, rootRef, notifyItemsChanged } =
    useSegmentGroupContext("SegmentGroupIndicator")
  const [rect, setRect] = React.useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const [mounted, setMounted] = React.useState(false)
  const rafRef = React.useRef<number | null>(null)

  const measure = React.useCallback(() => {
    if (!value) {
      setRect(null)
      return
    }
    const root = rootRef.current
    const item = itemsRef.current.get(value)
    if (!root || !item) {
      setRect(null)
      return
    }
    const rootRect = root.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    setRect({
      top: itemRect.top - rootRect.top,
      left: itemRect.left - rootRect.left,
      width: itemRect.width,
      height: itemRect.height,
    })
  }, [value, rootRef, itemsRef])

  React.useLayoutEffect(() => {
    measure()
  }, [measure])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      measure()
    })
    observer.observe(root)
    for (const el of itemsRef.current.values()) {
      observer.observe(el)
    }
    return () => {
      observer.disconnect()
    }
  }, [measure, rootRef, itemsRef])

  // After the first paint with measured rect, flip data-mounted so subsequent
  // updates animate. Using rAF guarantees the initial transition-less paint
  // commits before transitions are enabled.
  React.useEffect(() => {
    if (mounted) return
    if (!rect) return
    rafRef.current = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [mounted, rect])

  // Sync the data-mounted attribute on the root element so CSS can suppress
  // the first transition without an extra wrapper.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.setAttribute("data-mounted", mounted ? "true" : "false")
  }, [mounted, rootRef])

  // When item registration changes (e.g. items mount in a different order),
  // re-measure on the next frame.
  React.useEffect(() => {
    const id = requestAnimationFrame(() => {
      measure()
    })
    return () => cancelAnimationFrame(id)
  }, [measure, notifyItemsChanged])

  const isActive = value !== undefined && rect !== null

  const computedStyle: React.CSSProperties = {
    ...style,
  }

  if (rect) {
    if (orientation === "vertical") {
      computedStyle.transform = `translateY(${rect.top}px)`
      computedStyle.height = `${rect.height}px`
      computedStyle.left = `${rect.left}px`
      computedStyle.width = `${rect.width}px`
    } else {
      computedStyle.transform = `translateX(${rect.left}px)`
      computedStyle.width = `${rect.width}px`
      computedStyle.top = `${rect.top}px`
      computedStyle.height = `${rect.height}px`
    }
  } else {
    computedStyle.opacity = 0
    computedStyle.pointerEvents = "none"
  }

  return (
    <div
      aria-hidden="true"
      data-orientation={orientation}
      data-active={isActive ? "true" : "false"}
      className={cn("dr-segment-group-indicator", className)}
      style={computedStyle}
      {...props}
    />
  )
}

export { SegmentGroup, SegmentGroupItem, SegmentGroupIndicator }
