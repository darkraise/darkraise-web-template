import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@components/carousel"

const meta: Meta<typeof Carousel> = {
  title: "UI/Carousel",
  component: Carousel,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Carousel>

const ITEMS = ["1", "2", "3", "4", "5"]

export const Basic: Story = {
  render: () => (
    <div className="w-72">
      <Carousel>
        <CarouselContent>
          {ITEMS.map((n) => (
            <CarouselItem key={n}>
              <div className="bg-muted flex h-32 items-center justify-center rounded border text-3xl">
                {n}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="h-64">
      <Carousel orientation="vertical">
        <CarouselContent className="h-64">
          {ITEMS.map((n) => (
            <CarouselItem key={n} className="pt-2">
              <div className="bg-muted flex h-20 items-center justify-center rounded border text-2xl">
                {n}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
}
