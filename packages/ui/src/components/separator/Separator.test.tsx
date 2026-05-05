import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { createRef } from "react"
import { Separator } from "../separator"

describe("Separator", () => {
  it("renders a horizontal separator by default", () => {
    const { container } = render(<Separator />)
    const el = container.firstChild as HTMLElement
    expect(el).toBeInTheDocument()
    expect(el).toHaveClass("dr-separator")
    expect(el).toHaveAttribute("data-orientation", "horizontal")
  })

  it("renders a vertical separator when orientation is vertical", () => {
    const { container } = render(<Separator orientation="vertical" />)
    const el = container.firstChild as HTMLElement
    expect(el).toHaveAttribute("data-orientation", "vertical")
  })

  it("does not apply vertical orientation to a horizontal separator", () => {
    const { container } = render(<Separator orientation="horizontal" />)
    const el = container.firstChild as HTMLElement
    expect(el).not.toHaveAttribute("data-orientation", "vertical")
  })

  it("applies custom className", () => {
    const { container } = render(<Separator className="my-separator" />)
    expect(container.firstChild).toHaveClass("my-separator")
  })

  it("forwards ref to the separator element", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Separator ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })

  it("is decorative by default and has no role", () => {
    const { container } = render(<Separator />)
    const el = container.firstChild as HTMLElement
    expect(el).not.toHaveAttribute("role", "separator")
  })

  it("has separator role when decorative is false", () => {
    const { container } = render(<Separator decorative={false} />)
    const el = container.firstChild as HTMLElement
    expect(el).toHaveAttribute("role", "separator")
  })
})
