import { act, render, renderHook, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { beforeEach, describe, it, expect, vi } from "vitest"
import type { ShellStyle } from "@theme"
import { ThemeProvider } from "@theme/theme-provider"
import { themeConfig, type ThemeConfig } from "@theme/themeConfig"
import { useTheme } from "@theme/useTheme"
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

describe("useShellStyle under a theme preset", () => {
  const config: ThemeConfig = {
    ...themeConfig,
    styles: { ink: { label: "Ink", extends: "glass" } },
    presets: {
      night: { label: "Night", style: "ink", shellStyle: "island" },
      plain: { label: "Plain", style: "ink" },
    },
  }

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider config={config}>{children}</ThemeProvider>
  )

  function renderUnder(
    preset: string,
    { override, fallback }: { override?: ShellStyle; fallback?: ShellStyle },
  ) {
    localStorage.setItem("theme-style", "ink")
    localStorage.setItem("theme-preset", preset)
    return renderHook(
      () => ({
        shell: useShellStyle(override, fallback),
        theme: useTheme(),
      }),
      { wrapper },
    )
  }

  beforeEach(() => {
    localStorage.clear()
    for (const name of document.documentElement.getAttributeNames())
      document.documentElement.removeAttribute(name)
    useLayoutStore.setState({ shellStyle: null })
  })

  it("uses the preset's shell style while nothing is stored", () => {
    const { result } = renderUnder("night", {})
    expect(result.current.theme.preset).toBe("night")
    expect(result.current.shell).toBe("island")
  })

  it("prefers the stored choice over the preset's shell style", () => {
    useLayoutStore.setState({ shellStyle: "framed" })
    const { result } = renderUnder("night", { fallback: "inset" })
    expect(result.current.shell).toBe("framed")
  })

  it("prefers the preset's shell style over the app default", () => {
    const { result } = renderUnder("night", { fallback: "inset" })
    expect(result.current.shell).toBe("island")
  })

  it("lets a pinned override win over the preset's shell style", () => {
    const { result } = renderUnder("night", {
      override: "flat",
      fallback: "inset",
    })
    expect(result.current.shell).toBe("flat")
  })

  it.each(["base", "plain"])(
    "falls through to the app default under the %s preset",
    (preset) => {
      const { result } = renderUnder(preset, { fallback: "inset" })
      expect(result.current.theme.preset).toBe(preset)
      expect(result.current.shell).toBe("inset")
    },
  )

  it("hydrates server markup without a mismatch, then shows the stored preset's shell style", async () => {
    const tree = (
      <ThemeProvider config={config}>
        <Probe />
      </ThemeProvider>
    )
    const container = document.createElement("div")
    container.innerHTML = renderToString(tree)
    document.body.append(container)
    expect(container.textContent).toBe("classic")
    localStorage.setItem("theme-style", "ink")
    localStorage.setItem("theme-preset", "night")
    const onRecoverableError = vi.fn()
    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(container, tree, { onRecoverableError })
    })
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.textContent).toBe("island")
    act(() => root?.unmount())
    container.remove()
  })

  it("hydrates a default preset's shell style without a mismatch", async () => {
    const tree = (
      <ThemeProvider
        config={{ ...config, defaults: { style: "ink", preset: "night" } }}
      >
        <Probe />
      </ThemeProvider>
    )
    const container = document.createElement("div")
    container.innerHTML = renderToString(tree)
    document.body.append(container)
    expect(container.textContent).toBe("island")
    const onRecoverableError = vi.fn()
    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(container, tree, { onRecoverableError })
    })
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.textContent).toBe("island")
    act(() => root?.unmount())
    container.remove()
  })

  it("follows a preset switch while mounted", () => {
    const { result } = renderUnder("plain", { fallback: "inset" })
    expect(result.current.shell).toBe("inset")
    act(() => result.current.theme.setPreset("night"))
    expect(result.current.shell).toBe("island")
    act(() => result.current.theme.setPreset("base"))
    expect(result.current.shell).toBe("inset")
  })
})
