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

  it("forwards ref to Card element", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Card ref={ref}>Content</Card>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
