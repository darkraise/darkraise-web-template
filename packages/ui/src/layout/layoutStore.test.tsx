import { act } from "@testing-library/react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
  localStorage.setItem("layout-variant", "top-nav")
  localStorage.setItem("theme-shell-style", "island")
})

import { useLayoutStore } from "./layoutStore"

function Probe() {
  const layout = useLayoutStore((s) => s.layout)
  const shellStyle = useLayoutStore((s) => s.shellStyle)
  return <span>{`${layout}:${shellStyle ?? "unset"}`}</span>
}

describe("layout store and server rendering", () => {
  it("renders the defaults on the server", () => {
    expect(renderToString(<Probe />)).toContain("sidebar:unset")
  })

  it("hydrates server markup without a mismatch, then shows the stored values", async () => {
    const container = document.createElement("div")
    container.innerHTML = renderToString(<Probe />)
    document.body.append(container)
    const onRecoverableError = vi.fn()
    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(container, <Probe />, { onRecoverableError })
    })
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.textContent).toBe("top-nav:island")
    act(() => root?.unmount())
    container.remove()
  })
})
