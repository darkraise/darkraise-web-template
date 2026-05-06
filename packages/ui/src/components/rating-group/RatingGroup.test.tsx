import * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  RatingGroup,
  RatingGroupControl,
  RatingGroupHiddenInput,
  RatingGroupItem,
  RatingGroupItemContext,
  RatingGroupLabel,
} from "./RatingGroup"
import type {
  RatingGroupItemState,
  RatingGroupValueChangeDetails,
} from "./RatingGroup"

function Star({ state }: { state: RatingGroupItemState }) {
  return (
    <span
      data-testid={`star-${state.index}`}
      data-highlighted={state.highlighted ? "true" : "false"}
      data-half={state.half ? "true" : "false"}
    >
      *
    </span>
  )
}

function Basic(props: Partial<React.ComponentProps<typeof RatingGroup>> = {}) {
  return (
    <RatingGroup {...props}>
      <RatingGroupLabel>Rate</RatingGroupLabel>
      <RatingGroupControl renderItem={(state) => <Star state={state} />} />
    </RatingGroup>
  )
}

describe("RatingGroup", () => {
  it("renders `max` items via the renderItem auto-generated control", () => {
    render(<Basic max={5} />)
    const items = screen.getAllByRole("radio")
    expect(items).toHaveLength(5)
  })

  it("commits a click as the new value", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn<(d: RatingGroupValueChangeDetails) => void>()
    render(<Basic max={5} onValueChange={onValueChange} />)
    const items = screen.getAllByRole("radio")
    await user.click(items[2])
    expect(onValueChange).toHaveBeenCalledWith({ value: 3 })
    expect(screen.getByTestId("star-3")).toHaveAttribute(
      "data-highlighted",
      "true",
    )
  })

  it("highlights items up to the hovered index on pointer move", () => {
    render(<Basic max={5} />)
    const items = screen.getAllByRole("radio")
    expect(screen.getByTestId("star-1")).toHaveAttribute(
      "data-highlighted",
      "false",
    )
    fireEvent.pointerEnter(items[2])
    expect(screen.getByTestId("star-1")).toHaveAttribute(
      "data-highlighted",
      "true",
    )
    expect(screen.getByTestId("star-2")).toHaveAttribute(
      "data-highlighted",
      "true",
    )
    expect(screen.getByTestId("star-3")).toHaveAttribute(
      "data-highlighted",
      "true",
    )
    expect(screen.getByTestId("star-4")).toHaveAttribute(
      "data-highlighted",
      "false",
    )
    expect(screen.getByTestId("star-5")).toHaveAttribute(
      "data-highlighted",
      "false",
    )
  })

  it("reverts hover preview when pointer leaves the control", () => {
    const { container } = render(<Basic max={5} defaultValue={1} />)
    const items = screen.getAllByRole("radio")
    fireEvent.pointerEnter(items[3])
    expect(screen.getByTestId("star-4")).toHaveAttribute(
      "data-highlighted",
      "true",
    )
    const control = container.querySelector(
      ".dr-rating-group-control",
    ) as HTMLElement
    fireEvent.pointerLeave(control)
    expect(screen.getByTestId("star-2")).toHaveAttribute(
      "data-highlighted",
      "false",
    )
    expect(screen.getByTestId("star-4")).toHaveAttribute(
      "data-highlighted",
      "false",
    )
    expect(screen.getByTestId("star-1")).toHaveAttribute(
      "data-highlighted",
      "true",
    )
  })

  it("commits a half value when the left half of an item is clicked", () => {
    const onValueChange = vi.fn<(d: RatingGroupValueChangeDetails) => void>()
    render(<Basic max={5} allowHalf onValueChange={onValueChange} />)
    const items = screen.getAllByRole("radio")
    const fourth = items[3]
    // Force a measurable rect; jsdom returns zeroed rects by default.
    fourth.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 20,
      bottom: 20,
      width: 20,
      height: 20,
      toJSON: () => "",
    })
    fireEvent.click(fourth, { clientX: 4 })
    expect(onValueChange).toHaveBeenCalledWith({ value: 3.5 })
  })

  it("increments with ArrowRight and decrements with ArrowLeft", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn<(d: RatingGroupValueChangeDetails) => void>()
    render(<Basic max={5} defaultValue={3} onValueChange={onValueChange} />)
    const third = screen.getByTestId("star-3").parentElement as HTMLElement
    third.focus()
    await user.keyboard("{ArrowRight}")
    expect(onValueChange).toHaveBeenLastCalledWith({ value: 4 })
    await user.keyboard("{ArrowLeft}")
    expect(onValueChange).toHaveBeenLastCalledWith({ value: 3 })
    await user.keyboard("{ArrowLeft}")
    expect(onValueChange).toHaveBeenLastCalledWith({ value: 2 })
  })

  it("blocks click commits while readOnly but still previews on hover", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn<(d: RatingGroupValueChangeDetails) => void>()
    render(
      <Basic max={5} readOnly defaultValue={2} onValueChange={onValueChange} />,
    )
    const items = screen.getAllByRole("radio")
    await user.click(items[4])
    expect(onValueChange).not.toHaveBeenCalled()
    fireEvent.pointerEnter(items[3])
    expect(screen.getByTestId("star-4")).toHaveAttribute(
      "data-highlighted",
      "true",
    )
  })

  it("renders a hidden input when name is provided", () => {
    const { container } = render(
      <RatingGroup max={5} defaultValue={3} name="rating">
        <RatingGroupControl renderItem={(state) => <Star state={state} />} />
      </RatingGroup>,
    )
    const hidden = container.querySelector(
      'input[type="hidden"][name="rating"]',
    ) as HTMLInputElement | null
    expect(hidden).not.toBeNull()
    expect(hidden?.value).toBe("3")
  })

  it("supports the lower-level RatingGroupItemContext API", () => {
    render(
      <RatingGroup max={3} defaultValue={2}>
        <RatingGroupControl>
          {[1, 2, 3].map((index) => (
            <RatingGroupItem key={index} index={index}>
              <RatingGroupItemContext>
                {(state) => <Star state={state} />}
              </RatingGroupItemContext>
            </RatingGroupItem>
          ))}
          <RatingGroupHiddenInput />
        </RatingGroupControl>
      </RatingGroup>,
    )
    expect(screen.getByTestId("star-1")).toHaveAttribute(
      "data-highlighted",
      "true",
    )
    expect(screen.getByTestId("star-2")).toHaveAttribute(
      "data-highlighted",
      "true",
    )
    expect(screen.getByTestId("star-3")).toHaveAttribute(
      "data-highlighted",
      "false",
    )
  })
})
