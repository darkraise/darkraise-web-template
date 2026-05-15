"use client"

import * as React from "react"

import { RadioGroup, RadioGroupItem } from "@components/radio-group"
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
  React.ComponentProps<typeof RadioGroup>,
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
      const existing = map.get(itemValue)
      if (el) {
        if (existing === el) return
        map.set(itemValue, el)
      } else {
        if (!existing) return
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
    <RadioGroup
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
    </RadioGroup>
  )
}

export interface SegmentGroupItemProps extends Omit<
  React.ComponentProps<typeof RadioGroupItem>,
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

  React.useEffect(() => {
    registerItem(value, innerRef.current)
    return () => {
      registerItem(value, null)
    }
  }, [registerItem, value])

  const isChecked = activeValue === value

  return (
    <RadioGroupItem
      ref={(node) => {
        innerRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      }}
      value={value}
      disabled={isDisabled}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn("dr-segment-group-item", className)}
      {...props}
    >
      {children}
    </RadioGroupItem>
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
    topDirect: number
    topTransform: number
    leftDirect: number
    leftTransform: number
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
    // Two different reference frames are at play here:
    //
    // - Parallel axis (the one the indicator slides along): the indicator
    //   uses `transform: translate` from its CSS *static position*, which
    //   for a sibling of the items in a flex container lands at the
    //   padding edge. To move to the item's offset, subtract the padding
    //   (otherwise the pill is offset by the root's padding amount).
    //
    // - Perpendicular axis (where the indicator just lines up with the
    //   items): the indicator uses `top:` or `left:` directly, which on
    //   an absolutely-positioned element references the offsetParent's
    //   PADDING BOX. With no border, padding-box top = border top, so
    //   `top: 0` would stick the pill to the container's border edge
    //   instead of the padding edge where the items sit. Use the raw
    //   `offsetTop`/`offsetLeft` (which equal the padding) so direct
    //   positioning lands on the item's edge.
    const cs = getComputedStyle(root)
    const paddingLeft = parseFloat(cs.paddingLeft) || 0
    const paddingTop = parseFloat(cs.paddingTop) || 0
    setRect({
      topDirect: item.offsetTop,
      topTransform: item.offsetTop - paddingTop,
      leftDirect: item.offsetLeft,
      leftTransform: item.offsetLeft - paddingLeft,
      width: item.offsetWidth,
      height: item.offsetHeight,
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
      // Parallel axis: translateY uses the transform offset.
      computedStyle.transform = `translateY(${rect.topTransform}px)`
      computedStyle.height = `${rect.height}px`
      // Perpendicular axis: `left:` is padding-box-relative, use direct.
      computedStyle.left = `${rect.leftDirect}px`
      computedStyle.width = `${rect.width}px`
    } else {
      computedStyle.transform = `translateX(${rect.leftTransform}px)`
      computedStyle.width = `${rect.width}px`
      computedStyle.top = `${rect.topDirect}px`
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
