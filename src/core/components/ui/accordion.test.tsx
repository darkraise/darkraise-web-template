import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion"

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
    expect(
      screen.queryByText("Content for section one"),
    ).not.toBeInTheDocument()
  })

  it("only one item is open at a time in single mode", async () => {
    const user = userEvent.setup()
    render(<TestAccordion />)
    await user.click(screen.getByText("Section One"))
    await user.click(screen.getByText("Section Two"))
    expect(
      screen.queryByText("Content for section one"),
    ).not.toBeInTheDocument()
    expect(screen.getByText("Content for section two")).toBeInTheDocument()
  })
})
