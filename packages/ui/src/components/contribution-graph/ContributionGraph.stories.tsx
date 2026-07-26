import type { Meta, StoryObj } from "@storybook/react-vite"
import { ContributionGraph } from "./ContributionGraph"
import { addDays, toISODateKey } from "./buildCalendar"

const meta: Meta<typeof ContributionGraph> = {
  title: "UI/ContributionGraph",
  component: ContributionGraph,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof ContributionGraph>

const END = new Date(2026, 6, 24)
const START = addDays(END, -364)

/** Deterministic pseudo-random series so the story renders identically on
 *  every reload and in visual-regression runs. */
function sampleData() {
  const data: { date: string; value: number }[] = []
  let seed = 42
  for (let offset = 0; offset <= 364; offset++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    const value = seed % 11
    if (value > 2) {
      data.push({
        date: toISODateKey(addDays(START, offset)),
        value: value - 2,
      })
    }
  }
  return data
}

const data = sampleData()

export const Default: Story = {
  render: () => (
    <ContributionGraph startDate={START} endDate={END} data={data} />
  ),
}

export const MondayStart: Story = {
  render: () => (
    <ContributionGraph
      startDate={START}
      endDate={END}
      data={data}
      weekStartsOn={1}
    />
  ),
}

export const Minimal: Story = {
  render: () => (
    <ContributionGraph
      startDate={START}
      endDate={END}
      data={data}
      showLegend={false}
      showMonthLabels={false}
      showWeekdayLabels={false}
    />
  ),
}

export const Clickable: Story = {
  render: () => (
    <ContributionGraph
      startDate={START}
      endDate={END}
      data={data}
      onCellClick={(cell) => window.alert(`${cell.key}: ${cell.value}`)}
    />
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs">{size}</span>
          <div className="overflow-x-auto">
            <ContributionGraph
              startDate={START}
              endDate={END}
              data={data}
              size={size}
            />
          </div>
        </div>
      ))}
    </div>
  ),
}

export const Hues: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["default", "green", "violet", "amber"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs">{variant}</span>
          <div className="overflow-x-auto">
            <ContributionGraph
              startDate={START}
              endDate={END}
              data={data}
              variant={variant}
            />
          </div>
        </div>
      ))}
    </div>
  ),
}
