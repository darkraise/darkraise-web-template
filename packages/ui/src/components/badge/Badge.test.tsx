import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Badge } from "../badge"

describe("Badge", () => {
  it("renders with text content", () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("renders dr-badge class by default", () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText("Default")).toHaveClass("dr-badge")
  })

  it("applies default variant data attribute", () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText("Default")).toHaveAttribute(
      "data-variant",
      "default",
    )
  })

  it("applies secondary variant data attribute", () => {
    render(<Badge variant="secondary">Secondary</Badge>)
    expect(screen.getByText("Secondary")).toHaveAttribute(
      "data-variant",
      "secondary",
    )
  })

  it("applies destructive variant data attribute", () => {
    render(<Badge variant="destructive">Error</Badge>)
    expect(screen.getByText("Error")).toHaveAttribute(
      "data-variant",
      "destructive",
    )
  })

  it("applies outline variant data attribute", () => {
    render(<Badge variant="outline">Outline</Badge>)
    expect(screen.getByText("Outline")).toHaveAttribute(
      "data-variant",
      "outline",
    )
  })

  it("applies custom className", () => {
    render(<Badge className="custom-class">Styled</Badge>)
    expect(screen.getByText("Styled")).toHaveClass("custom-class")
  })
})
