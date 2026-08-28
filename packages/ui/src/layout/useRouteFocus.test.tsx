import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { useState } from "react"

import { useRouteFocus } from "@layout/useRouteFocus"
import { RouterAdapterProvider } from "@router"
import type { RouterAdapter } from "@router"

/**
 * Minimal adapter whose pathname is driven by a prop, so a test can navigate
 * without a router.
 */
function adapterFor(pathname: string): RouterAdapter {
  return {
    Link: ({ to, children }) => <a href={to}>{children}</a>,
    useNavigate: () => () => {},
    usePathname: () => pathname,
    useBack: () => () => {},
    useInvalidate: () => () => {},
  }
}

function Harness() {
  const [pathname, setPathname] = useState("/first")
  return (
    <RouterAdapterProvider value={adapterFor(pathname)}>
      <Consumer />
      <main id="main-content">Page content</main>
      <button onClick={() => setPathname("/second")}>Navigate</button>
      <button onClick={() => setPathname(pathname)}>Re-render</button>
    </RouterAdapterProvider>
  )
}

function Consumer() {
  useRouteFocus()
  return null
}

describe("useRouteFocus", () => {
  it("leaves focus alone on first render", () => {
    render(<Harness />)
    // Arriving on a page is not a navigation; stealing focus here would fight
    // the browser's own restoration.
    expect(document.activeElement).toBe(document.body)
  })

  it("moves focus to main after a route change", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole("button", { name: "Navigate" }))
    expect(document.activeElement).toBe(document.getElementById("main-content"))
  })

  it("makes main a focus destination without adding a tab stop", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole("button", { name: "Navigate" }))
    expect(document.getElementById("main-content")).toHaveAttribute(
      "tabindex",
      "-1",
    )
  })

  it("does nothing when the pathname has not changed", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const button = screen.getByRole("button", { name: "Re-render" })
    await user.click(button)
    expect(document.activeElement).toBe(button)
  })
})
