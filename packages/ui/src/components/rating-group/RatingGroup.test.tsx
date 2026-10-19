import * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { UiLabelsProvider } from "@labels"
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
    const target = items[2]
    if (!target) throw new Error("item 2 missing")
    await user.click(target)
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
    const target = items[2]
    if (!target) throw new Error("item 2 missing")
    fireEvent.pointerEnter(target)
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
    const target = items[3]
    if (!target) throw new Error("item 3 missing")
    fireEvent.pointerEnter(target)
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
    if (!fourth) throw new Error("item 3 missing")
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

  it("commits a half value from the right half of an item under RTL", () => {
    const onValueChange = vi.fn<(d: RatingGroupValueChangeDetails) => void>()
    render(
      <div dir="rtl">
        <Basic max={5} allowHalf onValueChange={onValueChange} />
      </div>,
    )
    const fourth = screen.getAllByRole("radio")[3]
    if (!fourth) throw new Error("item 3 missing")
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
    fireEvent.click(fourth, { clientX: 16 })
    expect(onValueChange).toHaveBeenLastCalledWith({ value: 3.5 })
    fireEvent.click(fourth, { clientX: 4 })
    expect(onValueChange).toHaveBeenLastCalledWith({ value: 4 })
  })

  it("increments with ArrowLeft and decrements with ArrowRight under RTL", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn<(d: RatingGroupValueChangeDetails) => void>()
    render(
      <div dir="rtl">
        <Basic max={5} defaultValue={3} onValueChange={onValueChange} />
      </div>,
    )
    const third = screen.getByTestId("star-3").parentElement as HTMLElement
    third.focus()
    await user.keyboard("{ArrowLeft}")
    expect(onValueChange).toHaveBeenLastCalledWith({ value: 4 })
    await user.keyboard("{ArrowRight}")
    expect(onValueChange).toHaveBeenLastCalledWith({ value: 3 })
  })

  it("blocks click commits while readOnly and shows no hover preview", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn<(d: RatingGroupValueChangeDetails) => void>()
    render(
      <Basic max={5} readOnly defaultValue={2} onValueChange={onValueChange} />,
    )
    const items = screen.getAllByRole("radio")
    const target = items[4]
    if (!target) throw new Error("item 4 missing")
    await user.click(target)
    expect(onValueChange).not.toHaveBeenCalled()
    // Hovering star 4 must NOT light it up — read-only is static, so the
    // painted highlight reflects the committed value (2) only.
    const hovered = items[3]
    if (!hovered) throw new Error("item 3 missing")
    fireEvent.pointerEnter(hovered)
    expect(screen.getByTestId("star-4")).toHaveAttribute(
      "data-highlighted",
      "false",
    )
    // The committed value is still painted.
    expect(screen.getByTestId("star-2")).toHaveAttribute(
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

describe("RatingGroup disabled", () => {
  it("ignores clicks and arrow keys", () => {
    const onValueChange = vi.fn()
    render(<Basic max={5} disabled onValueChange={onValueChange} />)
    const items = screen.getAllByRole("radio")
    fireEvent.click(items[2] as HTMLElement)
    fireEvent.keyDown(items[0] as HTMLElement, { key: "ArrowRight" })
    fireEvent.keyDown(items[0] as HTMLElement, { key: "Enter" })
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe("RatingGroup item names", () => {
  it("names each item with the rating announcement", () => {
    render(<Basic max={5} />)
    expect(
      screen
        .getAllByRole("radio")
        .map((item) => item.getAttribute("aria-label")),
    ).toEqual(["1 star", "2 stars", "3 stars", "4 stars", "5 stars"])
  })

  it("reads the announcement through the labels provider", () => {
    render(
      <UiLabelsProvider
        value={{ announcements: { rating: (value) => `${value} of 3` } }}
      >
        <Basic max={3} />
      </UiLabelsProvider>,
    )
    expect(screen.getByRole("radio", { name: "2 of 3" })).toBeInTheDocument()
  })

  it("keeps a name the consumer gives the item", () => {
    render(
      <RatingGroup max={2}>
        <span id="awful">Awful</span>
        <RatingGroupControl>
          <RatingGroupItem index={1} aria-labelledby="awful" />
          <RatingGroupItem index={2} aria-label="Great" />
        </RatingGroupControl>
      </RatingGroup>,
    )
    const [first, second] = screen.getAllByRole("radio")
    expect(first).toHaveAccessibleName("Awful")
    expect(first).not.toHaveAttribute("aria-label")
    expect(second).toHaveAccessibleName("Great")
  })

  it.each([
    [3.5, 4, "3.5 stars"],
    [4, 4, "4 stars"],
    [0.5, 1, "0.5 stars"],
  ])("checks only the item holding %s in half mode", (value, index, name) => {
    render(<Basic max={5} allowHalf defaultValue={value} />)
    const checked = screen.getAllByRole("radio", { checked: true })
    expect(checked).toHaveLength(1)
    expect(checked[0]).toHaveAccessibleName(name)
    expect(checked[0]).toHaveAttribute("aria-posinset", String(index))
    expect(checked[0]).toHaveAttribute("tabindex", "0")
  })

  it("renames the half item as arrow keys step through half values", async () => {
    const user = userEvent.setup()
    render(<Basic max={5} allowHalf defaultValue={3} />)
    await user.tab()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("radio", { checked: true })).toHaveAccessibleName(
      "3.5 stars",
    )
    expect(screen.getByRole("radio", { name: "3.5 stars" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("radio", { checked: true })).toHaveAccessibleName(
      "4 stars",
    )
  })
})
