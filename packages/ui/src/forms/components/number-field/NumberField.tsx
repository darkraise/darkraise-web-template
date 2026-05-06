import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "../../../lib/utils"
import { Input } from "../../../components/input"
import { FieldWrapper } from "../field-wrapper"
import type { FieldPrimitiveProps } from "../../types"
import "./number-field.css"

interface NumberFieldProps extends FieldPrimitiveProps<number> {
  label: string
  description?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

function decimalPlacesOf(n: number): number {
  const s = n.toString()
  const dotIdx = s.indexOf(".")
  return dotIdx < 0 ? 0 : s.length - dotIdx - 1
}

function roundToStep(value: number, step: number): number {
  const places = decimalPlacesOf(step)
  return places === 0 ? value : Number(value.toFixed(places))
}

export function NumberField({
  name,
  value,
  onChange,
  onBlur,
  isInvalid,
  errors,
  label,
  description,
  placeholder,
  min,
  max,
  step,
}: NumberFieldProps) {
  const stepValue = step ?? 1
  const current = Number.isFinite(value) ? value : (min ?? 0)
  const atMin = min != null && current <= min
  const atMax = max != null && current >= max

  const apply = (next: number) => {
    const clampedHigh = max != null ? Math.min(next, max) : next
    const clamped = min != null ? Math.max(clampedHigh, min) : clampedHigh
    onChange(roundToStep(clamped, stepValue))
  }

  return (
    <FieldWrapper
      name={name}
      label={label}
      description={description}
      isInvalid={isInvalid}
      errors={errors}
    >
      {(invalid) => (
        <div className="dr-number-field">
          <Input
            id={name}
            type="number"
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            value={Number.isFinite(value) ? value : ""}
            onBlur={onBlur}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === "") {
                onChange(Number.NaN)
                return
              }
              const parsed = Number(raw)
              onChange(Number.isFinite(parsed) ? parsed : Number.NaN)
            }}
            onWheel={(e) => {
              if (e.currentTarget === document.activeElement) {
                e.currentTarget.blur()
              }
            }}
            aria-invalid={invalid}
            className={cn("dr-number-field__input")}
          />
          <div className="dr-number-field__controls">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Increment"
              disabled={atMax}
              onClick={() => apply(current + stepValue)}
              className="dr-number-field__btn"
            >
              <ChevronUp />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Decrement"
              disabled={atMin}
              onClick={() => apply(current - stepValue)}
              className="dr-number-field__btn"
            >
              <ChevronDown />
            </button>
          </div>
        </div>
      )}
    </FieldWrapper>
  )
}
