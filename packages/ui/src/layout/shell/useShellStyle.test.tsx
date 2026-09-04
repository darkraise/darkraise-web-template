import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ThemeProvider } from "@theme"
import type { ShellStyle } from "@theme"
import { useShellStyle } from "./useShellStyle"

function Probe({ override }: { override?: ShellStyle }) {
  return <span>{useShellStyle(override)}</span>
}

describe("useShellStyle", () => {
  it("falls back to the theme value when no override is given", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByText("classic")).toBeInTheDocument()
  })

  it("lets an explicit override win over the theme value", () => {
    render(
      <ThemeProvider>
        <Probe override="island" />
      </ThemeProvider>,
    )
    expect(screen.getByText("island")).toBeInTheDocument()
  })

  it("still resolves without a ThemeProvider", () => {
    // Layouts must not hard-require the provider: the axis is cosmetic.
    render(<Probe />)
    expect(screen.getByText("classic")).toBeInTheDocument()
  })

  it("honours an override without a ThemeProvider", () => {
    render(<Probe override="framed" />)
    expect(screen.getByText("framed")).toBeInTheDocument()
  })
})
