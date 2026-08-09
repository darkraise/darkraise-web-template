import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@components/accordion"

function TestAccordion() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Section One</AccordionTrigger>
        <AccordionContent>Content for section one</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section Two</AccordionTrigger>
        <AccordionContent>Content for section two</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

describe("Accordion", () => {
  it("renders accordion triggers", () => {
    render(<TestAccordion />)
    expect(screen.getByText("Section One")).toBeInTheDocument()
    expect(screen.getByText("Section Two")).toBeInTheDocument()
  })

  it("does not show content before expanding", () => {
    render(<TestAccordion />)
    expect(
      screen.queryByText("Content for section one"),
    ).not.toBeInTheDocument()
  })

  it("shows content when trigger is clicked", async () => {
    const user = userEvent.setup()
    render(<TestAccordion />)
    await user.click(screen.getByText("Section One"))
    expect(screen.getByText("Content for section one")).toBeInTheDocument()
  })

  it("collapses an open item when trigger is clicked again", async () => {
    const user = userEvent.setup()
    render(<TestAccordion />)
    await user.click(screen.getByText("Section One"))
    expect(screen.getByText("Content for section one")).toBeInTheDocument()
    await user.click(screen.getByText("Section One"))
    await waitFor(() =>
      expect(
        screen.queryByText("Content for section one"),
      ).not.toBeInTheDocument(),
    )
  })

  it("only one item is open at a time in single mode", async () => {
    const user = userEvent.setup()
    render(<TestAccordion />)
    await user.click(screen.getByText("Section One"))
    await user.click(screen.getByText("Section Two"))
    await waitFor(() =>
      expect(
        screen.queryByText("Content for section one"),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByText("Content for section two")).toBeInTheDocument()
  })
})

describe("Accordion card variant", () => {
  function CardAccordion(props: {
    border?: "default" | "none" | "strong" | "accent"
    elevation?: boolean | "flat" | "low" | "medium" | "high"
  }) {
    return (
      <Accordion type="single" collapsible variant="card" {...props}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section One</AccordionTrigger>
          <AccordionContent>Content for section one</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  }

  it("always applies the dr-accordion root class", () => {
    const { container } = render(<TestAccordion />)
    expect(container.firstChild).toHaveClass("dr-accordion")
  })

  it("omits data-variant in the default variant", () => {
    const { container } = render(<TestAccordion />)
    expect(container.firstChild).not.toHaveAttribute("data-variant")
    expect(container.querySelector(".dr-accordion-item")).not.toHaveClass(
      "dr-card",
    )
  })

  it("marks the root and items as cards in the card variant", () => {
    const { container } = render(<CardAccordion />)
    expect(container.firstChild).toHaveAttribute("data-variant", "card")
    const item = container.querySelector(".dr-accordion-item")
    expect(item).toHaveClass("dr-card")
    expect(item).toHaveAttribute("data-variant", "card")
  })

  it("forwards border to the item", () => {
    const { container } = render(<CardAccordion border="accent" />)
    expect(container.querySelector(".dr-accordion-item")).toHaveAttribute(
      "data-border",
      "accent",
    )
  })

  it("maps elevation true to auto, matching Card", () => {
    const { container } = render(<CardAccordion elevation />)
    expect(container.querySelector(".dr-accordion-item")).toHaveAttribute(
      "data-elevation",
      "auto",
    )
  })

  it("forwards an explicit elevation level to the item", () => {
    const { container } = render(<CardAccordion elevation="low" />)
    expect(container.querySelector(".dr-accordion-item")).toHaveAttribute(
      "data-elevation",
      "low",
    )
  })

  it("does not apply card styling hooks in the default variant", () => {
    const { container } = render(<TestAccordion />)
    const item = container.querySelector(".dr-accordion-item")
    expect(item).not.toHaveAttribute("data-border")
    expect(item).not.toHaveAttribute("data-elevation")
  })

  it("ignores border and elevation in the default variant", () => {
    const { container } = render(
      <Accordion type="single" collapsible border="accent" elevation="low">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section One</AccordionTrigger>
          <AccordionContent>Content for section one</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    const item = container.querySelector(".dr-accordion-item")
    expect(item).not.toHaveAttribute("data-border")
    expect(item).not.toHaveAttribute("data-elevation")
    expect(item).not.toHaveClass("dr-card")
  })

  it("does not leak the variant into a nested default accordion", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Accordion type="single" collapsible variant="card">
        <AccordionItem value="outer">
          <AccordionTrigger>Outer</AccordionTrigger>
          <AccordionContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="inner">
                <AccordionTrigger>Inner</AccordionTrigger>
                <AccordionContent>Inner content</AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    await user.click(screen.getByText("Outer"))
    const items = container.querySelectorAll(".dr-accordion-item")
    expect(items).toHaveLength(2)
    expect(items[1]).not.toHaveAttribute("data-variant")
    expect(items[1]).not.toHaveClass("dr-card")
  })

  it("keeps open and close behaviour in the card variant", async () => {
    const user = userEvent.setup()
    render(<CardAccordion />)
    await user.click(screen.getByText("Section One"))
    expect(screen.getByText("Content for section one")).toBeInTheDocument()
    await user.click(screen.getByText("Section One"))
    await waitFor(() =>
      expect(
        screen.queryByText("Content for section one"),
      ).not.toBeInTheDocument(),
    )
  })
})
