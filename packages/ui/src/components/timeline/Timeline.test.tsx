import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineMeta,
  TimelineTime,
  TimelineTitle,
} from "./Timeline"

function Basic({
  variant,
}: {
  variant?: "default" | "alternating"
} = {}) {
  return (
    <Timeline variant={variant}>
      <TimelineItem status="complete">
        <TimelineIndicator />
        <TimelineConnector />
        <TimelineContent>
          <TimelineTitle>Order placed</TimelineTitle>
          <TimelineDescription>2 items</TimelineDescription>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem status="current">
        <TimelineIndicator />
        <TimelineConnector variant="dashed" />
        <TimelineContent>
          <TimelineTitle>Packed</TimelineTitle>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem status="upcoming">
        <TimelineIndicator />
        <TimelineContent>
          <TimelineTitle>Shipped</TimelineTitle>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  )
}

describe("Timeline", () => {
  it("renders an ordered list with one item per event", () => {
    render(<Basic />)
    const list = screen.getByRole("list")
    expect(list).toHaveClass("dr-timeline")
    expect(list.tagName).toBe("OL")
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item.tagName).toBe("LI")
    }
  })

  it("reflects the variant on the root", () => {
    const { rerender } = render(<Basic />)
    expect(screen.getByRole("list")).toHaveAttribute("data-variant", "default")
    rerender(<Basic variant="alternating" />)
    expect(screen.getByRole("list")).toHaveAttribute(
      "data-variant",
      "alternating",
    )
  })

  it("mirrors item status onto the item and its parts", () => {
    render(<Basic />)
    const first = screen.getAllByRole("listitem")[0] as HTMLElement
    expect(first).toHaveAttribute("data-status", "complete")
    expect(first.querySelector(".dr-timeline-indicator")).toHaveAttribute(
      "data-status",
      "complete",
    )
    expect(first.querySelector(".dr-timeline-connector")).toHaveAttribute(
      "data-status",
      "complete",
    )
    expect(first.querySelector(".dr-timeline-title")).toHaveAttribute(
      "data-status",
      "complete",
    )
    expect(first.querySelector(".dr-timeline-description")).toHaveAttribute(
      "data-status",
      "complete",
    )
  })

  it("marks only the current item with aria-current", () => {
    render(<Basic />)
    const items = screen.getAllByRole("listitem")
    expect(items[0]).not.toHaveAttribute("aria-current")
    expect(items[1]).toHaveAttribute("aria-current", "step")
    expect(items[2]).not.toHaveAttribute("aria-current")
  })

  it("exposes the status as text for screen readers", () => {
    render(<Basic />)
    expect(screen.getByText("Completed")).toHaveClass("dr-timeline-status-text")
    expect(screen.getByText("Current")).toHaveClass("dr-timeline-status-text")
    expect(screen.getByText("Upcoming")).toHaveClass("dr-timeline-status-text")
  })

  it("hides decorative parts from the accessibility tree", () => {
    render(<Basic />)
    const first = screen.getAllByRole("listitem")[0] as HTMLElement
    expect(first.querySelector(".dr-timeline-indicator")).toHaveAttribute(
      "aria-hidden",
      "true",
    )
    expect(first.querySelector(".dr-timeline-connector")).toHaveAttribute(
      "aria-hidden",
      "true",
    )
  })

  it("reflects the connector variant", () => {
    render(<Basic />)
    const items = screen.getAllByRole("listitem")
    expect(
      (items[0] as HTMLElement).querySelector(".dr-timeline-connector"),
    ).toHaveAttribute("data-variant", "solid")
    expect(
      (items[1] as HTMLElement).querySelector(".dr-timeline-connector"),
    ).toHaveAttribute("data-variant", "dashed")
  })

  it("sets data-side only when the side prop is given", () => {
    render(
      <Timeline variant="alternating">
        <TimelineItem side="end">
          <TimelineIndicator />
          <TimelineContent>
            <TimelineTitle>Pinned right</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineIndicator />
          <TimelineContent>
            <TimelineTitle>Auto</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
      </Timeline>,
    )
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveAttribute("data-side", "end")
    expect(items[1]).not.toHaveAttribute("data-side")
  })

  it("renders the meta slot and forwards dateTime to the time element", () => {
    render(
      <Timeline>
        <TimelineItem>
          <TimelineMeta>
            <TimelineTime dateTime="2026-07-24T09:41">09:41</TimelineTime>
          </TimelineMeta>
          <TimelineIndicator />
          <TimelineContent>
            <TimelineTitle>Order placed</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
      </Timeline>,
    )
    const time = screen.getByText("09:41")
    expect(time.tagName).toBe("TIME")
    expect(time).toHaveAttribute("datetime", "2026-07-24T09:41")
    expect(time.closest(".dr-timeline-meta")).not.toBeNull()
  })

  it("renders arbitrary children inside the indicator", () => {
    render(
      <Timeline>
        <TimelineItem>
          <TimelineIndicator>
            <span>3</span>
          </TimelineIndicator>
          <TimelineContent>
            <TimelineTitle>Third</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
      </Timeline>,
    )
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("throws when a part is used outside its required ancestor", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<TimelineItem />)).toThrow(
      /must be used within a <Timeline>/,
    )
    expect(() => render(<TimelineIndicator />)).toThrow(
      /must be used within a <TimelineItem>/,
    )
    expect(() => render(<TimelineConnector />)).toThrow(
      /must be used within a <TimelineItem>/,
    )
    expect(() => render(<TimelineContent />)).toThrow(
      /must be used within a <TimelineItem>/,
    )
    expect(() => render(<TimelineTitle />)).toThrow(
      /must be used within a <TimelineItem>/,
    )
    expect(() => render(<TimelineDescription />)).toThrow(
      /must be used within a <TimelineItem>/,
    )
    expect(() => render(<TimelineMeta />)).toThrow(
      /must be used within a <TimelineItem>/,
    )
    spy.mockRestore()
  })

  it("keeps a nested timeline's connector a direct child of its own item", () => {
    // Regression test for a leak where the CSS hid a nested timeline's
    // connectors: `.dr-timeline-item:last-child .dr-timeline-connector`
    // used a descendant combinator, so when the outer item that happens to
    // be last-child contains a nested <Timeline>, the rule reached past the
    // nested timeline's own boundary and matched its connectors too. The
    // fix (child combinator: `:last-child > .dr-timeline-connector`) relies
    // on TimelineConnector always being a direct child of its own <li>; this
    // test only proves that DOM invariant holds when a <Timeline> is nested
    // inside another item's content. It cannot assert the CSS rule itself
    // (jsdom does not load component CSS) — that was verified visually,
    // via a real-browser check of both the buggy and fixed selectors.
    render(
      <Timeline>
        <TimelineItem status="complete">
          <TimelineIndicator />
          <TimelineConnector />
          <TimelineContent>
            <TimelineTitle>Group</TimelineTitle>
            <Timeline>
              <TimelineItem status="complete">
                <TimelineIndicator />
                <TimelineConnector />
                <TimelineContent>
                  <TimelineTitle>Nested first</TimelineTitle>
                </TimelineContent>
              </TimelineItem>
              <TimelineItem status="current">
                <TimelineIndicator />
                <TimelineConnector />
                <TimelineContent>
                  <TimelineTitle>Nested last</TimelineTitle>
                </TimelineContent>
              </TimelineItem>
            </Timeline>
          </TimelineContent>
        </TimelineItem>
      </Timeline>,
    )

    const lists = screen.getAllByRole("list")
    expect(lists).toHaveLength(2)
    const nestedList = lists[1] as HTMLElement
    const nestedItems = Array.from(nestedList.children) as HTMLElement[]
    expect(nestedItems).toHaveLength(2)

    for (const item of nestedItems) {
      const connector = item.querySelector(
        ".dr-timeline-connector",
      ) as HTMLElement
      expect(connector.parentElement).toBe(item)
    }
  })
})
