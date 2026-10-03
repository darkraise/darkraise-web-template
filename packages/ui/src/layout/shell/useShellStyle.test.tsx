import { act, render, screen } from "@testing-library/react"
import { beforeEach, describe, it, expect } from "vitest"
import type { ShellStyle } from "@theme"
import { useLayoutStore } from "@layout/layoutStore"
import { useShellStyle } from "./useShellStyle"

function Probe({
  override,
  fallback,
}: {
  override?: ShellStyle
  fallback?: ShellStyle
}) {
  return <span>{useShellStyle(override, fallback)}</span>
}

describe("useShellStyle", () => {
  beforeEach(() => useLayoutStore.setState({ shellStyle: null }))

  it("resolves to classic with nothing stored and no default", () => {
    render(<Probe />)
    expect(screen.getByText("classic")).toBeInTheDocument()
  })

  it("uses the app default while nothing is stored", () => {
    render(<Probe fallback="inset" />)
    expect(screen.getByText("inset")).toBeInTheDocument()
  })

  it("prefers the stored choice over the app default", () => {
    useLayoutStore.setState({ shellStyle: "island" })
    render(<Probe fallback="inset" />)
    expect(screen.getByText("island")).toBeInTheDocument()
  })

  it("lets a pinned override win over the stored choice", () => {
    useLayoutStore.setState({ shellStyle: "island" })
    render(<Probe override="framed" fallback="inset" />)
    expect(screen.getByText("framed")).toBeInTheDocument()
  })

  it("follows a new pick while mounted", () => {
    render(<Probe />)
    act(() => useLayoutStore.getState().setShellStyle("flat"))
    expect(screen.getByText("flat")).toBeInTheDocument()
  })
})
