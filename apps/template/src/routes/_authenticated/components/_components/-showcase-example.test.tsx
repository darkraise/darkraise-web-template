import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ShowcaseExample } from "./-showcase-example"

// The kit resolves its own React copy under Vitest, so its stateful parts
// cannot render here; the code disclosure is not what this test is about.
vi.mock("darkraise-ui/components/accordion", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <>{children}</>
  return {
    Accordion: Pass,
    AccordionItem: Pass,
    AccordionTrigger: Pass,
    AccordionContent: Pass,
  }
})
vi.mock("darkraise-ui/components/clipboard", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <>{children}</>
  return {
    Clipboard: Pass,
    ClipboardTrigger: Pass,
    ClipboardIndicator: () => null,
  }
})

describe("ShowcaseExample", () => {
  it("marks its wrapper and its preview card with the showcase hooks", () => {
    const { container } = render(
      <ShowcaseExample title="Sample" code="<Sample />">
        <span>sample demo</span>
      </ShowcaseExample>,
    )
    const example = container.firstElementChild
    expect(example).toHaveAttribute("data-showcase-example", "")
    const preview = screen.getByText("sample demo").parentElement
    expect(preview).toHaveAttribute("data-showcase-preview", "")
    expect(preview).toHaveClass("dr-card")
    expect(example?.querySelectorAll("[data-showcase-preview]")).toHaveLength(1)
  })
})
