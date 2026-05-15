import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "darkraise-ui/components/select"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/select")({
  component: SelectPage,
})

const TIME_ZONES = [
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Anchorage",
  "America/Bogota",
  "America/Caracas",
  "America/Chicago",
  "America/Denver",
  "America/Halifax",
  "America/Lima",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Bangkok",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Manila",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Brisbane",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Honolulu",
  "UTC",
]

function SelectPage() {
  const [value, setValue] = useState("")
  const [timeZone, setTimeZone] = useState("UTC")

  return (
    <ShowcasePage
      title="Select"
      description="Native-feeling single-select dropdown with keyboard navigation and search-by-letter. Use Combobox or VirtualizedDropdownMenu when the option list is large or filterable."
    >
      <ShowcaseExample
        title="Single value"
        code={`const [value, setValue] = useState("")

<Field>
  <FieldLabel htmlFor="basic-select">Plan</FieldLabel>
  <Select value={value} onValueChange={setValue}>
    <SelectTrigger id="basic-select">
      <SelectValue placeholder="Pick an option" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="alpha">Alpha</SelectItem>
      <SelectItem value="beta">Beta</SelectItem>
      <SelectItem value="gamma">Gamma</SelectItem>
    </SelectContent>
  </Select>
</Field>`}
      >
        <div className="max-w-xs">
          <Field>
            <FieldLabel htmlFor="basic-select">Plan</FieldLabel>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger id="basic-select">
                <SelectValue placeholder="Pick an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alpha">Alpha</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="gamma">Gamma</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Long list (scrollable popover)"
        code={`// When the option list exceeds the popover's max height (20rem),
// the content scrolls. Native mouse-wheel, keyboard arrows, and
// touch-drag all work — no scroll-buttons needed.

<Field>
  <FieldLabel htmlFor="tz-select">Time zone</FieldLabel>
  <Select value={timeZone} onValueChange={setTimeZone}>
    <SelectTrigger id="tz-select">
      <SelectValue placeholder="Pick a time zone" />
    </SelectTrigger>
    <SelectContent>
      {TIME_ZONES.map((tz) => (
        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</Field>`}
      >
        <div className="max-w-xs">
          <Field>
            <FieldLabel htmlFor="tz-select">Time zone</FieldLabel>
            <Select value={timeZone} onValueChange={setTimeZone}>
              <SelectTrigger id="tz-select">
                <SelectValue placeholder="Pick a time zone" />
              </SelectTrigger>
              <SelectContent>
                {TIME_ZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Disabled"
        code={`<Field>
  <FieldLabel>Region</FieldLabel>
  <Select disabled>
    <SelectTrigger>
      <SelectValue placeholder="Disabled" />
    </SelectTrigger>
  </Select>
</Field>`}
      >
        <div className="max-w-xs">
          <Field>
            <FieldLabel>Region</FieldLabel>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Disabled" />
              </SelectTrigger>
            </Select>
          </Field>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
