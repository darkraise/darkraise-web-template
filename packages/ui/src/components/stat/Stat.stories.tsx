import type { Meta, StoryObj } from "@storybook/react-vite"
import { Stat, StatLabel, StatValue, StatChange } from "@components/stat"

const meta: Meta<typeof Stat> = {
  title: "UI/Stat",
  component: Stat,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Stat>

export const Default: Story = {
  render: () => (
    <Stat>
      <StatLabel>Revenue</StatLabel>
      <StatValue>$45,231</StatValue>
      <StatChange direction="up">+12.5%</StatChange>
    </Stat>
  ),
}

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Stat>
        <StatLabel>Revenue</StatLabel>
        <StatValue>$45,231</StatValue>
        <StatChange direction="up">+12.5%</StatChange>
      </Stat>
      <Stat>
        <StatLabel>Active users</StatLabel>
        <StatValue>2,318</StatValue>
        <StatChange direction="down">-3.4%</StatChange>
      </Stat>
      <Stat>
        <StatLabel>Conversion</StatLabel>
        <StatValue>4.27%</StatValue>
        <StatChange direction="flat">0.0%</StatChange>
      </Stat>
    </div>
  ),
}

export const WithoutChange: Story = {
  render: () => (
    <Stat>
      <StatLabel>Total orders</StatLabel>
      <StatValue>1,204</StatValue>
    </Stat>
  ),
}
