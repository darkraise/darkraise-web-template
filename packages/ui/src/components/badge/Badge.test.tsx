import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Badge, BadgeAnchor } from "@components/badge"
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

  it.each([
    "success",
    "warning",
    "info",
    "destructive-subtle",
    "success-subtle",
    "warning-subtle",
    "info-subtle",
  ] as const)("applies the %s status variant data attribute", (variant) => {
    render(<Badge variant={variant}>Status</Badge>)
    expect(screen.getByText("Status")).toHaveAttribute("data-variant", variant)
  })

  it("applies custom className", () => {
    render(<Badge className="custom-class">Styled</Badge>)
    expect(screen.getByText("Styled")).toHaveClass("custom-class")
  })

  it("defaults to the default size", () => {
    render(<Badge>Sized</Badge>)
    expect(screen.getByText("Sized")).toHaveAttribute("data-size", "default")
  })

  it("gives an anchored badge the default size", () => {
    render(
      <BadgeAnchor content="3">
        <span>Inbox</span>
      </BadgeAnchor>,
    )
    expect(screen.getByText("3")).toHaveAttribute("data-size", "default")
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

  it("styles every size step", () => {
    const css = readFileSync(resolve(thisDir, "./badge.css"), "utf8")
    for (const size of ["sm", "default", "lg"]) {
      expect(css).toContain(`.dr-badge[data-size="${size}"]`)
    }
    expect(css).not.toContain('[data-size="md"]')
  })

  it("paints the solid status variants from the status solid pair", () => {
    const css = readFileSync(resolve(thisDir, "./badge.css"), "utf8")
    for (const status of ["success", "warning", "info"]) {
      expect(css).toMatch(
        new RegExp(
          `\\.dr-badge\\[data-variant="${status}"\\]\\s*\\{\\s*@apply bg-${status}-solid text-${status}-solid-foreground border-transparent;`,
        ),
      )
    }
  })

  // The warning solid misses the 3:1 mark floor on a light surface.
  it("paints the warning anchor dot from warning-edge", () => {
    const css = readFileSync(resolve(thisDir, "./badge.css"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
    expect(css).toContain(
      '.dr-badge-anchor-dot[data-variant="warning"] { @apply bg-warning-edge; }',
    )
  })

  it("paints the subtle status variants from the status pair", () => {
    const css = readFileSync(resolve(thisDir, "./badge.css"), "utf8")
    for (const status of ["destructive", "success", "warning", "info"]) {
      expect(css).toMatch(
        new RegExp(
          `\\.dr-badge\\[data-variant="${status}-subtle"\\]\\s*\\{\\s*@apply bg-${status}-subtle text-${status}-text border-${status}-edge;`,
        ),
      )
    }
  })
})
