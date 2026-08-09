"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { useId } from "@primitives/state"
import { Presence } from "@primitives/presence"
import { composeRefs } from "@primitives/slot"
import { cn } from "@lib/utils"
import "./accordion.css"

import {
  resolveCardElevation,
  type CardBorder,
  type CardElevation,
} from "@components/card"

import {
  useAccordion,
  type AccordionContextValue,
  type UseAccordionOptions,
} from "./useAccordion"

type AccordionVariant = "default" | "card"

interface AccordionRenderContextValue extends AccordionContextValue {
  variant: AccordionVariant
  border?: CardBorder
  elevation?: CardElevation | "auto"
}

const AccordionContext =
  React.createContext<AccordionRenderContextValue | null>(null)

function useAccordionContext(consumer: string): AccordionRenderContextValue {
  const ctx = React.useContext(AccordionContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Accordion>`)
  return ctx
}

interface AccordionItemContextValue {
  value: string
  open: boolean
  triggerId: string
  contentId: string
  disabled: boolean
}

const AccordionItemContext =
  React.createContext<AccordionItemContextValue | null>(null)

function useAccordionItemContext(consumer: string): AccordionItemContextValue {
  const ctx = React.useContext(AccordionItemContext)
  if (!ctx) throw new Error(`${consumer} must be used within <AccordionItem>`)
  return ctx
}

type AccordionSingleProps = {
  type: "single"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  collapsible?: boolean
}

type AccordionMultipleProps = {
  type: "multiple"
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

type AccordionCommonProps = {
  disabled?: boolean
  orientation?: "horizontal" | "vertical"
  variant?: AccordionVariant
  border?: CardBorder
  elevation?: boolean | CardElevation
  className?: string
  children?: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
} & Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange">

type AccordionProps =
  | (AccordionCommonProps & AccordionSingleProps)
  | (AccordionCommonProps & AccordionMultipleProps)

function Accordion(props: AccordionProps) {
  const {
    className,
    ref,
    disabled,
    orientation,
    variant = "default",
    border,
    elevation = false,
    children,
    ...rest
  } = props

  const opts: UseAccordionOptions =
    props.type === "single"
      ? {
          type: "single",
          value: props.value,
          defaultValue: props.defaultValue,
          onValueChange: props.onValueChange,
          collapsible: props.collapsible,
          disabled,
          orientation,
        }
      : {
          type: "multiple",
          value: props.value,
          defaultValue: props.defaultValue,
          onValueChange: props.onValueChange,
          disabled,
          orientation,
        }

  const ctx = useAccordion(opts)

  const {
    type: _t,
    value: _v,
    defaultValue: _dv,
    onValueChange: _ovc,
    collapsible: _c,
    ...domProps
  } = rest as Record<string, unknown>
  void _t
  void _v
  void _dv
  void _ovc
  void _c

  const resolvedElevation = resolveCardElevation(elevation)

  return (
    <div
      ref={ref}
      data-orientation={ctx.orientation}
      data-variant={variant === "card" ? "card" : undefined}
      className={cn("dr-accordion", className)}
      {...(domProps as React.HTMLAttributes<HTMLDivElement>)}
    >
      <AccordionContext.Provider
        value={{
          ...ctx,
          variant,
          border,
          elevation: resolvedElevation,
        }}
      >
        {children}
      </AccordionContext.Provider>
    </div>
  )
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function AccordionItem({
  className,
  ref,
  value,
  disabled = false,
  children,
  ...props
}: AccordionItemProps) {
  const ctx = useAccordionContext("AccordionItem")
  const open = ctx.isOpen(value)
  const triggerId = useId()
  const contentId = useId()
  const itemCtx = React.useMemo<AccordionItemContextValue>(
    () => ({
      value,
      open,
      triggerId,
      contentId,
      disabled: ctx.disabled || disabled,
    }),
    [value, open, triggerId, contentId, ctx.disabled, disabled],
  )

  const isCard = ctx.variant === "card"

  return (
    <div
      ref={ref}
      data-state={open ? "open" : "closed"}
      data-disabled={itemCtx.disabled ? "" : undefined}
      data-orientation={ctx.orientation}
      data-variant={isCard ? "card" : undefined}
      data-border={
        isCard && ctx.border && ctx.border !== "default"
          ? ctx.border
          : undefined
      }
      data-elevation={isCard ? ctx.elevation : undefined}
      className={cn("dr-accordion-item", isCard && "dr-card", className)}
      {...props}
    >
      <AccordionItemContext.Provider value={itemCtx}>
        {children}
      </AccordionItemContext.Provider>
    </div>
  )
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function AccordionTrigger({
  className,
  children,
  ref,
  onClick,
  onKeyDown,
  ...props
}: AccordionTriggerProps) {
  const ctx = useAccordionContext("AccordionTrigger")
  const item = useAccordionItemContext("AccordionTrigger")
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const composedRef = composeRefs(ref, buttonRef)

  const register = ctx.registerTrigger
  React.useEffect(() => {
    return register(item.value, buttonRef.current, item.disabled)
  }, [register, item.value, item.disabled])

  return (
    <h3 style={{ display: "flex", margin: 0 }}>
      <button
        ref={composedRef}
        type="button"
        id={item.triggerId}
        aria-controls={item.contentId}
        aria-expanded={item.open}
        data-state={item.open ? "open" : "closed"}
        data-disabled={item.disabled ? "" : undefined}
        data-orientation={ctx.orientation}
        disabled={item.disabled}
        className={cn("dr-accordion-trigger", className)}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented) return
          ctx.toggleItem(item.value, item.disabled)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          ctx.handleTriggerKeyDown(event, item.value)
        }}
        {...props}
      >
        {children}
        <ChevronDown aria-hidden="true" />
      </button>
    </h3>
  )
}

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function AccordionContent({
  className,
  children,
  ref,
  forceMount,
  style,
  ...props
}: AccordionContentProps) {
  const ctx = useAccordionContext("AccordionContent")
  const item = useAccordionItemContext("AccordionContent")
  const [innerNode, setInnerNode] = React.useState<HTMLDivElement | null>(null)
  const [contentHeight, setContentHeight] = React.useState<number | null>(null)

  React.useLayoutEffect(() => {
    if (!innerNode) return
    const measure = () => setContentHeight(innerNode.scrollHeight)
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(innerNode)
    return () => ro.disconnect()
  }, [innerNode])

  const heightStyle =
    contentHeight != null
      ? ({
          "--radix-accordion-content-height": `${contentHeight}px`,
        } as React.CSSProperties)
      : undefined

  const node = (
    <div
      ref={ref}
      role="region"
      id={item.contentId}
      aria-labelledby={item.triggerId}
      data-state={item.open ? "open" : "closed"}
      data-disabled={item.disabled ? "" : undefined}
      data-orientation={ctx.orientation}
      className="dr-accordion-content"
      style={{ ...heightStyle, ...style }}
      {...props}
    >
      <div
        ref={setInnerNode}
        className={cn("dr-accordion-content-inner", className)}
      >
        {children}
      </div>
    </div>
  )

  return (
    <Presence present={item.open} forceMount={forceMount}>
      {node}
    </Presence>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
