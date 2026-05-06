import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { Heart, Star } from "lucide-react"

import { cn } from "../../lib/utils"
import {
  RatingGroup,
  RatingGroupControl,
  RatingGroupLabel,
} from "./RatingGroup"

const meta: Meta<typeof RatingGroup> = {
  title: "UI/RatingGroup",
  component: RatingGroup,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof RatingGroup>

export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState(3)
    return (
      <RatingGroup
        max={5}
        value={value}
        onValueChange={(d) => setValue(d.value)}
      >
        <RatingGroupLabel>How was your experience?</RatingGroupLabel>
        <RatingGroupControl
          renderItem={(state) => (
            <Star
              aria-hidden="true"
              className={cn(
                "size-5",
                state.highlighted
                  ? "fill-warning text-warning"
                  : "text-muted-foreground",
              )}
            />
          )}
        />
      </RatingGroup>
    )
  },
}

export const HalfStar: Story = {
  render: () => {
    const [value, setValue] = React.useState(2.5)
    return (
      <RatingGroup
        max={5}
        allowHalf
        value={value}
        onValueChange={(d) => setValue(d.value)}
      >
        <RatingGroupLabel>Rate this product</RatingGroupLabel>
        <RatingGroupControl
          renderItem={(state) => (
            <span className="relative inline-flex">
              <Star
                aria-hidden="true"
                className="text-muted-foreground size-5"
              />
              {state.highlighted ? (
                <Star
                  aria-hidden="true"
                  className={cn(
                    "fill-warning text-warning absolute inset-0 size-5",
                    state.half ? "[clip-path:inset(0_50%_0_0)]" : "",
                  )}
                />
              ) : null}
            </span>
          )}
        />
      </RatingGroup>
    )
  },
}

export const ReadOnly: Story = {
  render: () => (
    <RatingGroup max={5} defaultValue={4} readOnly allowHalf>
      <RatingGroupLabel>Average rating</RatingGroupLabel>
      <RatingGroupControl
        renderItem={(state) => (
          <Star
            aria-hidden="true"
            className={cn(
              "size-5",
              state.highlighted
                ? "fill-warning text-warning"
                : "text-muted-foreground",
            )}
          />
        )}
      />
    </RatingGroup>
  ),
}

export const CustomIcon: Story = {
  render: () => {
    const [value, setValue] = React.useState(2)
    return (
      <RatingGroup
        max={5}
        value={value}
        onValueChange={(d) => setValue(d.value)}
      >
        <RatingGroupLabel>How much do you love it?</RatingGroupLabel>
        <RatingGroupControl
          renderItem={(state) => (
            <Heart
              aria-hidden="true"
              className={cn(
                "size-5",
                state.highlighted
                  ? "fill-destructive text-destructive"
                  : "text-muted-foreground",
              )}
            />
          )}
        />
      </RatingGroup>
    )
  },
}
