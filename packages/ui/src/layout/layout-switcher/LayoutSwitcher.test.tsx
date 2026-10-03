import { render, screen, fireEvent } from "@testing-library/react"
import { afterEach, describe, it, expect, beforeEach, vi } from "vitest"
import { LayoutSwitcher } from "./LayoutSwitcher"
import {
  useLayoutStore,
  LAYOUT_VARIANTS,
  SHELL_STYLE_STORAGE_KEY,
} from "@layout/layoutStore"

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
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  // The store reads storage once, when its module loads.
  async function freshStore() {
    vi.resetModules()
    return (await import("@layout/layoutStore")).useLayoutStore
  }

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

  it("persists the shell style under its 6.x key", () => {
    expect(SHELL_STYLE_STORAGE_KEY).toBe("theme-shell-style")
    useLayoutStore.getState().setShellStyle("framed")
    expect(useLayoutStore.getState().shellStyle).toBe("framed")
    expect(localStorage.getItem("theme-shell-style")).toBe("framed")
  })

  it("restores a stored shell style on load", async () => {
    localStorage.setItem("theme-shell-style", "island")
    expect((await freshStore()).getState().shellStyle).toBe("island")
  })

  it("reads an unset shell style as null", async () => {
    expect((await freshStore()).getState().shellStyle).toBeNull()
  })

  it("reads an unknown stored shell style as null", async () => {
    localStorage.setItem("theme-shell-style", "bogus")
    expect((await freshStore()).getState().shellStyle).toBeNull()
  })

  it("reads null when storage cannot be read", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    expect((await freshStore()).getState().shellStyle).toBeNull()
  })

  it("keeps a picked shell style in memory when storage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota")
    })
    useLayoutStore.getState().setShellStyle("flat")
    expect(useLayoutStore.getState().shellStyle).toBe("flat")
  })
})
