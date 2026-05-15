import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Label } from "darkraise-ui/components/label"
import { TimePicker } from "darkraise-ui/components/time-picker"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/time-picker")({
  component: TimePickerPage,
})

function TimePickerPage() {
  const [start, setStart] = useState("09:00")
  const [end, setEnd] = useState("17:00")
  const [militaryTime, setMilitaryTime] = useState("17:30")

  return (
    <ShowcasePage
      title="Time Picker"
      description="HH:MM time input. Pair with a DatePicker / Calendar when both date and time are needed."
    >
      <ShowcaseExample
        title="Single value (12-hour, default)"
        code={`const [time, setTime] = useState("09:00")

<TimePicker value={time} onChange={setTime} />`}
      >
        <div className="max-w-xs">
          <TimePicker value={start} onChange={setStart} />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="24-hour format"
        code={`const [time, setTime] = useState("17:30")

<TimePicker value={time} onChange={setTime} format="24h" />`}
      >
        <div className="max-w-xs">
          <TimePicker
            value={militaryTime}
            onChange={setMilitaryTime}
            format="24h"
          />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Start / end pair"
        code={`const [start, setStart] = useState("09:00")
const [end, setEnd] = useState("17:00")

<div className="space-y-2">
  <div className="flex items-center justify-between gap-2">
    <Label className="text-xs">Start Time</Label>
    <TimePicker value={start} onChange={setStart} />
  </div>
  <div className="flex items-center justify-between gap-2">
    <Label className="text-xs">End Time</Label>
    <TimePicker value={end} onChange={setEnd} />
  </div>
</div>`}
      >
        <div className="max-w-xs space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">Start Time</Label>
            <TimePicker value={start} onChange={setStart} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">End Time</Label>
            <TimePicker value={end} onChange={setEnd} />
          </div>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
