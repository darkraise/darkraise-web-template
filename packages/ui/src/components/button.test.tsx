import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { createRef } from "react"
import { Button } from "./button"

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("applies default variant class", () => {
    render(<Button>Default</Button>)
    expect(screen.getByRole("button")).toHaveClass("btn-glass-hue")
  })

  it("applies destructive variant class", () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole("button")).toHaveClass("btn-glass-hue")
  })

  it("applies outline variant class", () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("border")
    expect(button).toHaveClass("btn-glass-neutral")
  })

  it("applies secondary variant class", () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("bg-secondary")
    expect(button).toHaveClass("btn-glass-neutral")
  })

  it("applies ghost variant class", () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("hover:bg-accent")
    expect(button).toHaveClass("btn-ghost-glass")
  })

  it("ghost variant has no backdrop-filter utility class at idle", () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole("button")
    expect(button.className).not.toMatch(/\bbackdrop-blur\b/)
    expect(button.className).not.toMatch(/\bbackdrop-filter\b/)
  })

  it("applies link variant class", () => {
    render(<Button variant="link">Link</Button>)
    expect(screen.getByRole("button")).toHaveClass("text-primary")
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

  it("applies custom className", () => {
    render(<Button className="custom-class">Styled</Button>)
    expect(screen.getByRole("button")).toHaveClass("custom-class")
  })
})
