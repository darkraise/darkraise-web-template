import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import { LayoutSwitcher } from "./LayoutSwitcher"
import { useLayoutStore, LAYOUT_VARIANTS } from "@layout/layoutStore"

function open() {
  fireEvent.click(screen.getByRole("button", { name: /switch layout/i }))
}

describe("LayoutSwitcher", () => {
  beforeEach(() => useLayoutStore.setState({ layout: "sidebar" }))

  it("offers every variant by default", () => {
    render(<LayoutSwitcher />)
    open()
    expect(
      screen.getByRole("menuitem", { name: "Split Panel" }),
    ).toBeInTheDocument()
  })

  it("offers only the variants an app can actually render", () => {
    // SplitPanelLayout needs a `panel`; an app without one must be able to
    // leave it out rather than offer a shell it cannot build.
    render(<LayoutSwitcher variants={["sidebar", "top-nav"]} />)
    open()
    expect(screen.queryByRole("menuitem", { name: "Split Panel" })).toBeNull()
    expect(screen.queryByRole("menuitem", { name: "Stacked" })).toBeNull()
    expect(
      screen.getByRole("menuitem", { name: "Sidebar" }),
    ).toBeInTheDocument()
  })

  it("selects split panel", () => {
    render(<LayoutSwitcher />)
    open()
    fireEvent.click(screen.getByRole("menuitem", { name: "Split Panel" }))
    expect(useLayoutStore.getState().layout).toBe("split-panel")
  })
})

describe("layout store", () => {
  it("lists every variant, so a persisted split-panel survives the guard", () => {
    expect(LAYOUT_VARIANTS).toEqual([
      "sidebar",
      "top-nav",
      "stacked",
      "split-panel",
    ])
  })

  it("accepts split-panel as a value", () => {
    useLayoutStore.getState().setLayout("split-panel")
    expect(useLayoutStore.getState().layout).toBe("split-panel")
  })
})
