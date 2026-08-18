import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { createRef } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@components/card"

describe("Card", () => {
  it("renders Card with children", () => {
    render(<Card>Card body</Card>)
    expect(screen.getByText("Card body")).toBeInTheDocument()
  })

  it("renders CardHeader with children", () => {
    render(<CardHeader>Header content</CardHeader>)
    expect(screen.getByText("Header content")).toBeInTheDocument()
  })

  it("renders CardTitle with text", () => {
    render(<CardTitle>My Title</CardTitle>)
    expect(screen.getByText("My Title")).toBeInTheDocument()
  })

  it("renders CardDescription with text", () => {
    render(<CardDescription>Some description</CardDescription>)
    expect(screen.getByText("Some description")).toBeInTheDocument()
  })

  it("renders CardContent with children", () => {
    render(<CardContent>Main content</CardContent>)
    expect(screen.getByText("Main content")).toBeInTheDocument()
  })

  it("renders CardFooter with children", () => {
    render(<CardFooter>Footer actions</CardFooter>)
    expect(screen.getByText("Footer actions")).toBeInTheDocument()
  })

  it("renders full card composition", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
    expect(screen.getByText("Footer")).toBeInTheDocument()
  })

  it("applies custom className to Card", () => {
    const { container } = render(<Card className="custom-card">Content</Card>)
    expect(container.firstChild).toHaveClass("custom-card")
  })

  it("applies custom className to CardHeader", () => {
    const { container } = render(
      <CardHeader className="custom-header">Header</CardHeader>,
    )
    expect(container.firstChild).toHaveClass("custom-header")
  })

  it("omits data-divided by default", () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild).not.toHaveAttribute("data-divided")
  })

  it("sets data-divided when divided is true", () => {
    const { container } = render(<Card divided>Content</Card>)
    expect(container.firstChild).toHaveAttribute("data-divided", "true")
  })

  it("omits data-divided when divided is false", () => {
    const { container } = render(<Card divided={false}>Content</Card>)
    expect(container.firstChild).not.toHaveAttribute("data-divided")
  })

  it("omits data-border by default", () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild).not.toHaveAttribute("data-border")
  })

  it("omits data-border for the default variant", () => {
    const { container } = render(<Card border="default">Content</Card>)
    expect(container.firstChild).not.toHaveAttribute("data-border")
  })

  it("sets data-border for non-default variants", () => {
    const { container } = render(<Card border="accent">Content</Card>)
    expect(container.firstChild).toHaveAttribute("data-border", "accent")
  })

  it("combines border and divided independently", () => {
    const { container } = render(
      <Card border="none" divided>
        Content
      </Card>,
    )
    expect(container.firstChild).toHaveAttribute("data-border", "none")
    expect(container.firstChild).toHaveAttribute("data-divided", "true")
  })

  it("does not leak card attributes to a nested card", () => {
    const { container } = render(
      <Card border="strong" divided>
        <CardContent>
          <Card>Inner</Card>
        </CardContent>
      </Card>,
    )
    const inner = container.querySelectorAll(".dr-card")[1]
    expect(inner).not.toHaveAttribute("data-border")
    expect(inner).not.toHaveAttribute("data-divided")
  })

  it("omits data-intensity by default", () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild).not.toHaveAttribute("data-intensity")
  })

  it("omits data-intensity for the default variant", () => {
    const { container } = render(<Card intensity="default">Content</Card>)
    expect(container.firstChild).not.toHaveAttribute("data-intensity")
  })

  it.each(["none", "soft", "strong"] as const)(
    "sets data-intensity for the %s variant",
    (intensity) => {
      const { container } = render(<Card intensity={intensity}>Content</Card>)
      expect(container.firstChild).toHaveAttribute("data-intensity", intensity)
    },
  )

  it("combines intensity, border and divided independently", () => {
    const { container } = render(
      <Card intensity="strong" border="none" divided>
        Content
      </Card>,
    )
    expect(container.firstChild).toHaveAttribute("data-intensity", "strong")
    expect(container.firstChild).toHaveAttribute("data-border", "none")
    expect(container.firstChild).toHaveAttribute("data-divided", "true")
  })

  it("does not leak data-intensity to a nested card", () => {
    const { container } = render(
      <Card intensity="strong">
        <CardContent>
          <Card>Inner</Card>
        </CardContent>
      </Card>,
    )
    const inner = container.querySelectorAll(".dr-card")[1]
    expect(inner).not.toHaveAttribute("data-intensity")
  })

  it("forwards ref to Card element", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Card ref={ref}>Content</Card>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
