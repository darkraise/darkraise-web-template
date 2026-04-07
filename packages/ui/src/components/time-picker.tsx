import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Clock } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { ScrollArea } from "./scroll-area"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  use12Hour?: boolean
  minuteStep?: number
  disabled?: boolean
  placeholder?: string
  className?: string
}

function TimeColumn({
  items,
  value,
  onChange,
  showInput = true,
}: {
  items: string[]
  value: string
  onChange: (val: string) => void
  showInput?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const el = itemRefs.current.get(value)
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2)
    setInputValue(raw)
    const padded = raw.padStart(2, "0")
    if (raw.length > 0 && items.includes(padded)) {
      onChange(padded)
    }
  }

  const handleInputBlur = () => {
    setInputValue(value)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const padded = inputValue.padStart(2, "0")
      if (items.includes(padded)) {
        onChange(padded)
      }
      setInputValue(value)
      e.currentTarget.blur()
    }
  }

  return (
    <div className="flex flex-col">
      {showInput && (
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onFocus={(e) => e.target.select()}
          className="bg-muted/50 focus:bg-accent w-14 py-2 text-center text-sm font-medium outline-none"
        />
      )}
      <ScrollArea className="h-48" ref={containerRef}>
        <div className="flex flex-col py-1">
          {items.map((item) => (
            <button
              key={item}
              ref={(el) => {
                if (el) itemRefs.current.set(item, el)
              }}
              type="button"
              onClick={() => onChange(item)}
              className={cn(
                "hover:bg-accent mx-1 rounded-md px-3 py-1.5 text-sm transition-colors",
                value === item
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function TimePicker({
  value = "12:00",
  onChange,
  use12Hour = true,
  minuteStep = 1,
  disabled = false,
  placeholder = "Select time",
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)

  const parsed = useMemo(() => {
    const [h, m] = value.split(":").map(Number)
    const hour24 = h ?? 12
    const minute = m ?? 0

    if (!use12Hour) {
      return {
        hour: String(hour24).padStart(2, "0"),
        minute: String(minute).padStart(2, "0"),
        period: "AM",
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

  const to24 = useCallback(
    (hour: string, minute: string, period: string) => {
      let h = Number(hour)
      const m = Number(minute)
      if (use12Hour) {
        if (period === "AM" && h === 12) h = 0
        else if (period === "PM" && h !== 12) h += 12
      }
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    },
    [use12Hour],
  )

  const displayValue = useMemo(() => {
    if (use12Hour) {
      return `${parsed.hour}:${parsed.minute} ${parsed.period}`
    }
    return `${parsed.hour}:${parsed.minute}`
  }, [parsed, use12Hour])

  const handleNow = () => {
    const now = new Date()
    const h = String(now.getHours()).padStart(2, "0")
    const m = String(now.getMinutes()).padStart(2, "0")
    onChange?.(`${h}:${m}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-8 justify-between text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {value ? displayValue : placeholder}
          <Clock className="text-muted-foreground ml-2 h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <div className="flex border-b">
          <TimeColumn
            items={hours}
            value={parsed.hour}
            onChange={(h) => onChange?.(to24(h, parsed.minute, parsed.period))}
          />
          <div className="bg-border w-px" />
          <TimeColumn
            items={minutes}
            value={parsed.minute}
            onChange={(m) => onChange?.(to24(parsed.hour, m, parsed.period))}
          />
          {use12Hour && (
            <>
              <div className="bg-border w-px" />
              <TimeColumn
                items={["AM", "PM"]}
                value={parsed.period}
                onChange={(p) =>
                  onChange?.(to24(parsed.hour, parsed.minute, p))
                }
                showInput={false}
              />
            </>
          )}
        </div>
        <div className="flex items-center justify-between p-2">
          <Button
            variant="link"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleNow}
          >
            Now
          </Button>
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setOpen(false)}
          >
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { TimePicker }
export type { TimePickerProps }
