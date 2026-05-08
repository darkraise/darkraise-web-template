import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import { DateInput } from "darkraise-ui/components/date-input"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/date-input")({
  component: DateInputPage,
})

function DateInputPage() {
  const [ymd, setYmd] = useState<Date | null>(null)
  const [mdy, setMdy] = useState<Date | null>(null)
  const [dmy, setDmy] = useState<Date | null>(null)

  return (
    <ShowcasePage
      title="Date Input"
      description="Three independent numeric segments for entering a date. Supports year-month-day, month-day-year, and day-month-year formats with arrow-key adjustments and per-segment validation."
    >
      <ShowcaseExample
        title="Default (year-month-day)"
        code={`const [date, setDate] = useState<Date | null>(null)

<DateInput value={date} onValueChange={setDate} aria-label="Date" />`}
      >
        <div className="space-y-2">
          <DateInput value={ymd} onValueChange={setYmd} aria-label="Date" />
          <p className="text-muted-foreground text-xs">
            Committed:{" "}
            <span className="font-medium">
              {ymd ? ymd.toISOString().slice(0, 10) : "(none)"}
            </span>
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Month-day-year (US)"
        code={`<DateInput
  format="mdy"
  value={date}
  onValueChange={setDate}
  aria-label="US date"
/>`}
      >
        <div className="space-y-2">
          <DateInput
            format="mdy"
            value={mdy}
            onValueChange={setMdy}
            aria-label="US date"
          />
          <p className="text-muted-foreground text-xs">
            Committed:{" "}
            <span className="font-medium">
              {mdy ? mdy.toLocaleDateString("en-US") : "(none)"}
            </span>
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Day-month-year (EU) with external clear"
        code={`<DateInput
  format="dmy"
  value={date}
  onValueChange={setDate}
  aria-label="EU date"
/>
<Button variant="outline" onClick={() => setDate(null)}>
  Clear
</Button>`}
      >
        <div className="flex items-center gap-3">
          <DateInput
            format="dmy"
            value={dmy}
            onValueChange={setDmy}
            aria-label="EU date"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDmy(null)}
            disabled={dmy === null}
          >
            Clear
          </Button>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
