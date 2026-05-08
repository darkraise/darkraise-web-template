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

const SEGMENT_LABELS: Record<"year" | "month" | "day", string> = {
  year: "Year",
  month: "Month",
  day: "Day",
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
      {...rest}
    >
      <span id={groupId} className="sr-only">
        {ariaLabel ?? "Date"}
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
              aria-label={SEGMENT_LABELS[key]}
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
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp") {
                  event.preventDefault()
                  adjustSegment(key, 1)
                } else if (event.key === "ArrowDown") {
                  event.preventDefault()
                  adjustSegment(key, -1)
                } else if (event.key === "Backspace") {
                  event.preventDefault()
                  if (valStr.length > 0) {
                    setSegment(key, "")
                  } else {
                    const segIdx = order.indexOf(key)
                    const prev = order[segIdx - 1]
                    if (prev) inputsRef.current[prev]?.focus()
                  }
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
