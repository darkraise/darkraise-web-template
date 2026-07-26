import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Badge } from "@components/badge"
import { ACCENT_HUES } from "@lib/accent-hues"

const thisDir = dirname(fileURLToPath(import.meta.url))

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

describe("badge.css", () => {
  // Guards that every accent hue in the shared list has a CSS rule, so a hue
  // in the type with no rule does not silently render unstyled.
  it("declares a rule for every accent hue", () => {
    const css = readFileSync(resolve(thisDir, "./badge.css"), "utf8")
    for (const hue of ACCENT_HUES) {
      expect(css).toContain(`.dr-badge[data-variant="${hue}"]`)
    }
  })
})
