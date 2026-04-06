import { useMemo } from "react"
import { cn } from "@/core/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  use12Hour?: boolean
  minuteStep?: number
  disabled?: boolean
  className?: string
}

function TimePicker({
  value = "12:00",
  onChange,
  use12Hour = true,
  minuteStep = 1,
  disabled = false,
  className,
}: TimePickerProps) {
  const parsed = useMemo(() => {
    const [h, m] = value.split(":").map(Number)
    const hour24 = h ?? 12
    const minute = m ?? 0

    if (!use12Hour) {
      return {
        hour: String(hour24).padStart(2, "0"),
        minute: String(minute).padStart(2, "0"),
        period: undefined as string | undefined,
      }
    }

    const period = hour24 >= 12 ? "PM" : "AM"
    const hour12 = hour24 % 12 || 12
    return {
      hour: String(hour12).padStart(2, "0"),
      minute: String(minute).padStart(2, "0"),
      period,
    }
  }, [value, use12Hour])

  const hours = useMemo(() => {
    if (use12Hour) {
      return Array.from({ length: 12 }, (_, i) => {
        const h = i === 0 ? 12 : i
        return String(h).padStart(2, "0")
      })
    }
    return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  }, [use12Hour])

  const minutes = useMemo(
    () =>
      Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) =>
        String(i * minuteStep).padStart(2, "0"),
      ),
    [minuteStep],
  )

  function update(newHour: string, newMinute: string, newPeriod?: string) {
    let h = Number(newHour)
    const m = Number(newMinute)

    if (use12Hour && newPeriod) {
      if (newPeriod === "AM" && h === 12) h = 0
      else if (newPeriod === "PM" && h !== 12) h += 12
    }

    onChange?.(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Select
        value={parsed.hour}
        onValueChange={(h) => update(h, parsed.minute, parsed.period)}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 w-16 text-center">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground text-sm font-medium">:</span>

      <Select
        value={parsed.minute}
        onValueChange={(m) => update(parsed.hour, m, parsed.period)}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 w-16 text-center">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {use12Hour && (
        <Select
          value={parsed.period}
          onValueChange={(p) => update(parsed.hour, parsed.minute, p)}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 w-18">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

export { TimePicker }
export type { TimePickerProps }
