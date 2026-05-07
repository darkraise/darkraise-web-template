import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { createRef } from "react"
import { Button } from "@components/button"

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("renders dr-btn class by default", () => {
    render(<Button>Default</Button>)
    expect(screen.getByRole("button")).toHaveClass("dr-btn")
  })

  it("applies default variant and size data attributes by default", () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("data-variant", "default")
    expect(button).toHaveAttribute("data-size", "default")
  })

  it("applies destructive variant data attribute", () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-variant",
      "destructive",
    )
  })

  it("applies outline variant data attribute", () => {
    render(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-variant",
      "outline",
    )
  })

  it("applies secondary variant data attribute", () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-variant",
      "secondary",
    )
  })

  it("applies ghost variant data attribute", () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("data-variant", "ghost")
    expect(button.className).not.toMatch(/\bbackdrop-blur\b/)
    expect(button.className).not.toMatch(/\bbackdrop-filter\b/)
  })

  it("applies link variant data attribute", () => {
    render(<Button variant="link">Link</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "link")
  })

  it("applies sm size data attribute", () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "sm")
  })

  it("applies lg size data attribute", () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "lg")
  })

  it("applies icon size data attribute", () => {
    render(<Button size="icon">Icon</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "icon")
  })

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    await user.click(screen.getByRole("button"))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    )
    await user.click(screen.getByRole("button"))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("forwards ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it("renders as child element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/home">Home</a>
      </Button>,
    )
    const link = screen.getByRole("link", { name: "Home" })
    expect(link).toBeInTheDocument()
    expect(link.tagName).toBe("A")
  })

  it("defaults type to 'button' to avoid accidental form submission", () => {
    render(<Button>Default</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("type", "button")
  })

  it("respects an explicit type prop", () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit")
  })

  it("does not inject a type attribute when asChild renders a non-button element", () => {
    render(
      <Button asChild>
        <a href="/home">Home</a>
      </Button>,
    )
    expect(screen.getByRole("link")).not.toHaveAttribute("type")
  })

  it("applies custom className alongside dr-btn", () => {
    render(<Button className="custom-class">Styled</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-class")
    expect(button).toHaveClass("dr-btn")
  })
})
