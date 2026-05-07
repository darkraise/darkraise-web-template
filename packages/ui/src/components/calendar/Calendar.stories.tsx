import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Calendar, type DateRange } from "@components/calendar"

const meta: Meta<typeof Calendar> = {
  title: "UI/Calendar",
  component: Calendar,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Calendar>

export const Single: Story = {
  render: () => {
    function Demo() {
      const [date, setDate] = useState<Date | undefined>(new Date())
      return <Calendar mode="single" selected={date} onSelect={setDate} />
    }
    return <Demo />
  },
}

export const Range: Story = {
  render: () => {
    function Demo() {
      const [range, setRange] = useState<DateRange | undefined>(undefined)
      return (
        <Calendar mode="range" selected={range} onSelect={setRange} min={1} />
      )
    }
    return <Demo />
  },
}

export const Multi: Story = {
  render: () => {
    function Demo() {
      const [dates, setDates] = useState<Date[]>([])
      return <Calendar mode="multi" selected={dates} onSelect={setDates} />
    }
    return <Demo />
  },
}
