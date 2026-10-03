import { act } from "@testing-library/react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"

vi.hoisted(() => {
  localStorage.setItem("layout-variant", "top-nav")
  localStorage.setItem("theme-shell-style", "island")
})

import { useLayoutStore } from "./layoutStore"

it("shows the stored values on a client-only first render", () => {
  const seen: string[] = []
  function Recorder() {
    const layout = useLayoutStore((s) => s.layout)
    const shellStyle = useLayoutStore((s) => s.shellStyle)
    seen.push(`${layout}:${shellStyle ?? "unset"}`)
    return null
  }
  const root = createRoot(document.createElement("div"))
  act(() => root.render(<Recorder />))
  expect(seen[0]).toBe("top-nav:island")
  act(() => root.unmount())
})
