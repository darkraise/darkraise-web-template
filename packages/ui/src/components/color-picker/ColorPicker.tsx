import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { HexColorPicker } from "react-colorful"

import { cn } from "../../lib/utils"
import "./color-picker.css"

declare global {
  interface Window {
    EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> }
  }
}

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

function normalizeHex(input: string): string | null {
  const match = HEX_PATTERN.exec(input.trim())
  if (!match || !match[1]) return null
  let hex = match[1].toLowerCase()
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  }
  return `#${hex}`
}

export type ColorPickerFormat = "hex"

export interface ColorPickerValueChangeDetails {
  value: string
}

export interface ColorPickerOpenChangeDetails {
  open: boolean
}

export interface ColorPickerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  value?: string
  defaultValue?: string
  onValueChange?: (details: ColorPickerValueChangeDetails) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (details: ColorPickerOpenChangeDetails) => void
  disabled?: boolean
  closeOnSelect?: boolean
  format?: ColorPickerFormat
}

interface ColorPickerContextValue {
  value: string
  setValue: (next: string) => void
  open: boolean
  setOpen: (next: boolean) => void
  disabled: boolean
  format: ColorPickerFormat
  closeOnSelect: boolean
  inputId: string
  labelId: string
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const ColorPickerContext = React.createContext<ColorPickerContextValue | null>(
  null,
)

function useColorPickerContext(part: string): ColorPickerContextValue {
  const ctx = React.useContext(ColorPickerContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within a <ColorPicker> root component`,
    )
  }
  return ctx
}

function ColorPicker({
  className,
  value: valueProp,
  defaultValue = "#000000",
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  closeOnSelect = false,
  format = "hex",
  children,
  ...props
}: ColorPickerProps) {
  const [internalValue, setInternalValue] = React.useState<string>(
    () => normalizeHex(defaultValue) ?? "#000000",
  )
  const value =
    valueProp !== undefined
      ? (normalizeHex(valueProp) ?? valueProp)
      : internalValue

  const onValueChangeRef = React.useRef(onValueChange)
  React.useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  const setValue = React.useCallback(
    (next: string) => {
      const normalized = normalizeHex(next) ?? next
      if (valueProp === undefined) setInternalValue(normalized)
      onValueChangeRef.current?.({ value: normalized })
    },
    [valueProp],
  )

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const open = openProp ?? internalOpen
  const onOpenChangeRef = React.useRef(onOpenChange)
  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (disabled && next) return
      if (openProp === undefined) setInternalOpen(next)
      onOpenChangeRef.current?.({ open: next })
    },
    [openProp, disabled],
  )

  const baseId = React.useId()
  const inputId = `${baseId}-input`
  const labelId = `${baseId}-label`
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  const ctx = React.useMemo<ColorPickerContextValue>(
    () => ({
      value,
      setValue,
      open,
      setOpen,
      disabled,
      format,
      closeOnSelect,
      inputId,
      labelId,
      triggerRef,
    }),
    [
      value,
      setValue,
      open,
      setOpen,
      disabled,
      format,
      closeOnSelect,
      inputId,
      labelId,
    ],
  )

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <ColorPickerContext.Provider value={ctx}>
        <div
          className={cn("dr-color-picker", className)}
          data-state={open ? "open" : "closed"}
          data-disabled={disabled ? "true" : undefined}
          {...props}
        >
          {children}
        </div>
      </ColorPickerContext.Provider>
    </PopoverPrimitive.Root>
  )
}

export type ColorPickerLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

function ColorPickerLabel({ className, ...props }: ColorPickerLabelProps) {
  const { labelId, inputId } = useColorPickerContext("ColorPickerLabel")
  return (
    <label
      id={labelId}
      htmlFor={inputId}
      className={cn("dr-color-picker-label", className)}
      {...props}
    />
  )
}

export type ColorPickerControlProps = React.HTMLAttributes<HTMLDivElement>

function ColorPickerControl({ className, ...props }: ColorPickerControlProps) {
  const { open, disabled } = useColorPickerContext("ColorPickerControl")
  return (
    <div
      className={cn("dr-color-picker-control", className)}
      data-state={open ? "open" : "closed"}
      data-disabled={disabled ? "true" : undefined}
      {...props}
    />
  )
}

export interface ColorPickerSwatchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> {
  ref?: React.Ref<HTMLButtonElement>
}

function ColorPickerSwatch({
  className,
  type = "button",
  onClick,
  style,
  ref,
  "aria-label": ariaLabelProp,
  ...props
}: ColorPickerSwatchProps) {
  const { value, disabled } = useColorPickerContext("ColorPickerSwatch")
  return (
    <PopoverPrimitive.Trigger asChild>
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-label={
          ariaLabelProp ?? `Open color picker, current color ${value}`
        }
        data-disabled={disabled ? "true" : undefined}
        className={cn("dr-color-picker-swatch", className)}
        style={{ backgroundColor: value, ...style }}
        onClick={onClick}
        {...props}
      />
    </PopoverPrimitive.Trigger>
  )
}

export interface ColorPickerInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "type"
> {
  ref?: React.Ref<HTMLInputElement>
}

function ColorPickerInput({
  className,
  onChange,
  onBlur,
  onKeyDown,
  ref,
  "aria-label": ariaLabelProp,
  ...props
}: ColorPickerInputProps) {
  const { value, setValue, disabled, inputId, labelId } =
    useColorPickerContext("ColorPickerInput")

  const [draft, setDraft] = React.useState<string | null>(null)
  const display = draft ?? value

  const commitDraft = (next: string) => {
    if (next === "") {
      setDraft(null)
      return
    }
    const normalized = normalizeHex(next)
    if (normalized) {
      setValue(normalized)
    }
    setDraft(null)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    if (event.defaultPrevented) return
    setDraft(event.target.value)
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event)
    if (event.defaultPrevented) return
    if (draft === null) return
    commitDraft(draft)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "Enter") {
      event.currentTarget.blur()
    }
  }

  return (
    <input
      ref={ref}
      id={inputId}
      type="text"
      spellCheck={false}
      autoComplete="off"
      value={display}
      disabled={disabled}
      aria-labelledby={ariaLabelProp ? undefined : labelId}
      aria-label={ariaLabelProp}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-input", "dr-color-picker-input", className)}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export interface ColorPickerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function ColorPickerTrigger({
  className,
  type = "button",
  onClick,
  children,
  ref,
  "aria-label": ariaLabelProp,
  ...props
}: ColorPickerTriggerProps) {
  const { open, disabled, triggerRef } =
    useColorPickerContext("ColorPickerTrigger")

  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
    },
    [ref, triggerRef],
  )

  return (
    <PopoverPrimitive.Trigger asChild>
      <button
        ref={setRef}
        type={type}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabelProp ?? "Open color picker"}
        disabled={disabled}
        data-state={open ? "open" : "closed"}
        data-disabled={disabled ? "true" : undefined}
        className={cn("dr-color-picker-trigger", className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    </PopoverPrimitive.Trigger>
  )
}

export interface ColorPickerContentProps extends React.ComponentProps<
  typeof PopoverPrimitive.Content
> {
  ref?: React.Ref<HTMLDivElement>
}

function ColorPickerContent({
  className,
  align = "start",
  sideOffset = 4,
  ref,
  children,
  ...props
}: ColorPickerContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        role="dialog"
        className={cn("dr-color-picker-content", className)}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
}

export type ColorPickerAreaProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
>

function ColorPickerArea({ className, ...props }: ColorPickerAreaProps) {
  const { value, setValue, disabled } = useColorPickerContext("ColorPickerArea")
  return (
    <div
      className={cn("dr-color-picker-area", className)}
      data-disabled={disabled ? "true" : undefined}
      {...props}
    >
      <HexColorPicker
        color={value}
        onChange={(next) => {
          if (disabled) return
          setValue(next)
        }}
      />
    </div>
  )
}

export type ColorPickerSwatchGroupProps = React.HTMLAttributes<HTMLDivElement>

function ColorPickerSwatchGroup({
  className,
  ...props
}: ColorPickerSwatchGroupProps) {
  return (
    <div
      role="group"
      aria-label="Color presets"
      className={cn("dr-color-picker-swatch-group", className)}
      {...props}
    />
  )
}

export interface ColorPickerSwatchItemProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> {
  value: string
  ref?: React.Ref<HTMLButtonElement>
}

function ColorPickerSwatchItem({
  className,
  type = "button",
  value: itemValue,
  onClick,
  style,
  ref,
  "aria-label": ariaLabelProp,
  ...props
}: ColorPickerSwatchItemProps) {
  const { value, setValue, disabled, setOpen, closeOnSelect } =
    useColorPickerContext("ColorPickerSwatchItem")
  const normalized = normalizeHex(itemValue) ?? itemValue
  const active = normalized.toLowerCase() === value.toLowerCase()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (disabled) return
    setValue(normalized)
    if (closeOnSelect) setOpen(false)
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabelProp ?? `Select color ${normalized}`}
      data-active={active ? "true" : "false"}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-color-picker-swatch-item", className)}
      style={{ backgroundColor: normalized, ...style }}
      onClick={handleClick}
      {...props}
    />
  )
}

function isEyeDropperSupported(): boolean {
  return (
    typeof window !== "undefined" && typeof window.EyeDropper === "function"
  )
}

export interface ColorPickerEyeDropperTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function ColorPickerEyeDropperTrigger({
  className,
  type = "button",
  onClick,
  children,
  ref,
  "aria-label": ariaLabelProp,
  ...props
}: ColorPickerEyeDropperTriggerProps) {
  const [supported, setSupported] = React.useState(false)
  const { setValue, disabled } = useColorPickerContext(
    "ColorPickerEyeDropperTrigger",
  )

  React.useEffect(() => {
    setSupported(isEyeDropperSupported())
  }, [])

  if (!supported) return null

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (disabled) return
    if (typeof window === "undefined" || !window.EyeDropper) return
    try {
      const result = await new window.EyeDropper().open()
      setValue(result.sRGBHex)
    } catch {
      // user cancelled — silent
    }
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabelProp ?? "Pick color from screen"}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-color-picker-eye-dropper-trigger", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  ColorPicker,
  ColorPickerLabel,
  ColorPickerControl,
  ColorPickerSwatch,
  ColorPickerInput,
  ColorPickerTrigger,
  ColorPickerContent,
  ColorPickerArea,
  ColorPickerSwatchGroup,
  ColorPickerSwatchItem,
  ColorPickerEyeDropperTrigger,
}
