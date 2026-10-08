import { useUiText } from "../../i18n/useUiText"
import { useUiLabels } from "../../labels"
import * as React from "react"
import { cn } from "@lib/utils"
import { useId } from "@primitives/state"
import { useDateInput, type UseDateInputOptions } from "./useDateInput"
import "./date-input.css"

export interface DateInputProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    UseDateInputOptions {
  disabled?: boolean
  "aria-label"?: string
}

const SEGMENT_LIMITS: Record<
  "year" | "month" | "day",
  { min: number; max: number; len: number }
> = {
  year: { min: 1, max: 9999, len: 4 },
  month: { min: 1, max: 12, len: 2 },
  day: { min: 1, max: 31, len: 2 },
}

function DateInput({
  className,
  value,
  defaultValue,
  onValueChange,
  format,
  disabled,
  "aria-label": ariaLabel,
  ...rest
}: DateInputProps) {
  const uiText = useUiText()
  const labels = useUiLabels()

  const groupId = useId()
  const { parts, setSegment, adjustSegment, order } = useDateInput({
    value,
    defaultValue,
    onValueChange,
    format,
  })
  const inputsRef = React.useRef<Record<string, HTMLInputElement | null>>({})

  return (
    <div
      role="group"
      aria-labelledby={groupId}
      className={cn("dr-date-input", className)}
      data-disabled={disabled || undefined}
      {...rest}
    >
      <span id={groupId} className="sr-only">
        {ariaLabel ?? uiText("Date")}
      </span>
      {order.map((key, idx) => {
        const limits = SEGMENT_LIMITS[key]
        const valStr = parts[key]
        return (
          <React.Fragment key={key}>
            {idx > 0 ? (
              <span className="dr-date-input-sep" aria-hidden>
                /
              </span>
            ) : null}
            <input
              ref={(node) => {
                inputsRef.current[key] = node
              }}
              type="text"
              role="spinbutton"
              inputMode="numeric"
              aria-label={labels.dateInput[key]}
              placeholder={labels.dateInputPlaceholder[key]}
              aria-valuemin={limits.min}
              aria-valuemax={limits.max}
              aria-valuenow={Number.parseInt(valStr, 10) || undefined}
              size={limits.len}
              maxLength={limits.len}
              value={valStr}
              disabled={disabled}
              data-segment={key}
              className="dr-date-input-segment"
              onChange={(event) => {
                const next = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, limits.len)
                setSegment(key, next)
                // A full segment hands the next digit to the next segment,
                // selected so typing replaces what it holds.
                const following = order[idx + 1]
                const target = following && inputsRef.current[following]
                if (next.length === limits.len && target) {
                  target.focus()
                  target.select()
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp") {
                  event.preventDefault()
                  adjustSegment(key, 1)
                } else if (event.key === "ArrowDown") {
                  event.preventDefault()
                  adjustSegment(key, -1)
                } else if (event.key === "Backspace" && valStr.length === 0) {
                  // A segment with digits lets the browser delete one.
                  event.preventDefault()
                  const prev = order[idx - 1]
                  if (prev) inputsRef.current[prev]?.focus()
                }
              }}
            />
          </React.Fragment>
        )
      })}
    </div>
  )
}

export { DateInput }
