import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Kbd } from "./Kbd"

const thisDir = dirname(fileURLToPath(import.meta.url))

describe("Kbd", () => {
  it("renders a kbd element with the provided shortcut", () => {
    render(<Kbd>⌘K</Kbd>)
    const node = screen.getByText("⌘K")
    expect(node.tagName).toBe("KBD")
  })

  it("applies size data attribute", () => {
    render(
      <Kbd size="lg" data-testid="k">
        Esc
      </Kbd>,
    )
    expect(screen.getByTestId("k")).toHaveAttribute("data-size", "lg")
  })

  it("defaults to the default size", () => {
    render(<Kbd data-testid="k">K</Kbd>)
    expect(screen.getByTestId("k")).toHaveAttribute("data-size", "default")
  })

  it("styles every size step", () => {
    const css = readFileSync(resolve(thisDir, "./kbd.css"), "utf8")
    for (const size of ["sm", "default", "lg"]) {
      expect(css).toContain(`.dr-kbd[data-size="${size}"]`)
    }
    expect(css).not.toContain('[data-size="md"]')
  })
})
