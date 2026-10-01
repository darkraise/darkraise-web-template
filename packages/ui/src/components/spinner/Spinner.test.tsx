import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Spinner } from "./Spinner"

const thisDir = dirname(fileURLToPath(import.meta.url))

describe("Spinner", () => {
  it("renders with role='status'", () => {
    render(<Spinner />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("uses provided aria-label as accessible name", () => {
    render(<Spinner aria-label="Loading messages" />)
    expect(
      screen.getByRole("status", { name: "Loading messages" }),
    ).toBeInTheDocument()
  })

  it("renders a default sr-only label when none is provided", () => {
    render(<Spinner />)
    expect(screen.getByText("Loading")).toHaveClass("sr-only")
  })

  it("applies size data attribute", () => {
    render(<Spinner size="lg" data-testid="s" />)
    expect(screen.getByTestId("s")).toHaveAttribute("data-size", "lg")
  })

  it("applies variant data attribute", () => {
    render(<Spinner variant="primary" data-testid="s" />)
    expect(screen.getByTestId("s")).toHaveAttribute("data-variant", "primary")
  })

  it("defaults to the default size", () => {
    render(<Spinner data-testid="s" />)
    expect(screen.getByTestId("s")).toHaveAttribute("data-size", "default")
  })

  it("styles every size step", () => {
    const css = readFileSync(resolve(thisDir, "./spinner.css"), "utf8")
    for (const size of ["sm", "default", "lg"]) {
      expect(css).toContain(`.dr-spinner[data-size="${size}"]`)
    }
    expect(css).not.toContain('[data-size="md"]')
  })
})
