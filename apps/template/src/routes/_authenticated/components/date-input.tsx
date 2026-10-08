import { useUiLocale } from "darkraise-ui/i18n"
import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import { DateInput } from "darkraise-ui/components/date-input"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/date-input")({
  component: DateInputPage,
})

// toISOString reads the date in UTC, which east of UTC is the day before a
// local-midnight Date.
function localIsoDate(date: Date) {
  const pad = (value: number, length: number) =>
    String(value).padStart(length, "0")
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`
}

function DateInputPage() {
  const uiLocale = useUiLocale()

  const [localeDate, setLocaleDate] = useState<Date | null>(null)
  const [ymd, setYmd] = useState<Date | null>(null)
  const [mdy, setMdy] = useState<Date | null>(null)
  const [dmy, setDmy] = useState<Date | null>(null)

  return (
    <ShowcasePage
      title="Date Input"
      description="Three independent numeric segments for entering a date. The segment order follows the UI locale unless format sets year-month-day, month-day-year or day-month-year, with arrow-key adjustments and per-segment validation."
    >
      <ShowcaseExample
        title="Default (follows the UI locale)"
        code={`const [date, setDate] = useState<Date | null>(null)

<DateInput value={date} onValueChange={setDate} aria-label="Date" />`}
      >
        <div className="space-y-2">
          <DateInput
            value={localeDate}
            onValueChange={setLocaleDate}
            aria-label="Date"
          />
          <p className="text-muted-foreground text-xs">
            Committed:{" "}
            <span className="font-medium">
              {localeDate ? localIsoDate(localeDate) : "(none)"}
            </span>
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Year-month-day"
        code={`<DateInput
  format="ymd"
  value={date}
  onValueChange={setDate}
  aria-label="ISO date"
/>`}
      >
        <DateInput
          format="ymd"
          value={ymd}
          onValueChange={setYmd}
          aria-label="ISO date"
        />
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
              {mdy ? mdy.toLocaleDateString(uiLocale.locale) : "(none)"}
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
