import type { Meta, StoryObj } from "@storybook/react-vite"
import { Marquee } from "@components/marquee"

const meta: Meta<typeof Marquee> = {
  title: "UI/Marquee",
  component: Marquee,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Marquee>

const brands = [
  "Acme",
  "Globex",
  "Initech",
  "Umbrella",
  "Vandelay",
  "Wonka",
  "Stark Industries",
  "Cyberdyne",
]

function BrandRow() {
  return (
    <>
      {brands.map((name) => (
        <span
          key={name}
          className="text-muted-foreground rounded-md border px-4 py-2 text-sm font-semibold tracking-tight"
        >
          {name}
        </span>
      ))}
    </>
  )
}

export const Default: Story = {
  render: () => (
    <Marquee className="w-full max-w-2xl">
      <BrandRow />
    </Marquee>
  ),
}

export const Reversed: Story = {
  render: () => (
    <Marquee reverse className="w-full max-w-2xl">
      <BrandRow />
    </Marquee>
  ),
}

export const PauseOnHover: Story = {
  render: () => (
    <Marquee pauseOnHover className="w-full max-w-2xl">
      <BrandRow />
    </Marquee>
  ),
}
