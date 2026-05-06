import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { CalendarDays, Grid3x3, Layers } from "lucide-react"
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
} from "./SegmentGroup"

const meta: Meta<typeof SegmentGroup> = {
  title: "UI/SegmentGroup",
  component: SegmentGroup,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof SegmentGroup>

export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState("day")
    return (
      <SegmentGroup value={value} onValueChange={setValue}>
        <SegmentGroupIndicator />
        <SegmentGroupItem value="day">Day</SegmentGroupItem>
        <SegmentGroupItem value="week">Week</SegmentGroupItem>
        <SegmentGroupItem value="month">Month</SegmentGroupItem>
      </SegmentGroup>
    )
  },
}

export const Vertical: Story = {
  render: () => {
    const [value, setValue] = React.useState("list")
    return (
      <SegmentGroup
        orientation="vertical"
        value={value}
        onValueChange={setValue}
      >
        <SegmentGroupIndicator />
        <SegmentGroupItem value="list">List</SegmentGroupItem>
        <SegmentGroupItem value="grid">Grid</SegmentGroupItem>
        <SegmentGroupItem value="kanban">Kanban</SegmentGroupItem>
      </SegmentGroup>
    )
  },
}

export const WithIcons: Story = {
  render: () => {
    const [value, setValue] = React.useState("calendar")
    return (
      <SegmentGroup value={value} onValueChange={setValue}>
        <SegmentGroupIndicator />
        <SegmentGroupItem value="calendar">
          <CalendarDays className="mr-2 h-4 w-4" />
          Calendar
        </SegmentGroupItem>
        <SegmentGroupItem value="grid">
          <Grid3x3 className="mr-2 h-4 w-4" />
          Grid
        </SegmentGroupItem>
        <SegmentGroupItem value="layers">
          <Layers className="mr-2 h-4 w-4" />
          Layers
        </SegmentGroupItem>
      </SegmentGroup>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <SegmentGroup defaultValue="week" disabled>
      <SegmentGroupIndicator />
      <SegmentGroupItem value="day">Day</SegmentGroupItem>
      <SegmentGroupItem value="week">Week</SegmentGroupItem>
      <SegmentGroupItem value="month">Month</SegmentGroupItem>
    </SegmentGroup>
  ),
}
