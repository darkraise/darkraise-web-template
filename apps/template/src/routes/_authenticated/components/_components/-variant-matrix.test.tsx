import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"
import { VariantMatrix } from "./-variant-matrix"

const VARIANTS = ["default", "outline"] as const
const SIZES = ["sm", "lg"] as const

const observed = new Set<() => void>()

class StubResizeObserver {
  private readonly notify: () => void

  constructor(callback: ResizeObserverCallback) {
    this.notify = () => callback([], this)
  }

  observe() {
    observed.add(this.notify)
  }

  unobserve() {
    observed.delete(this.notify)
  }

  disconnect() {
    observed.delete(this.notify)
  }
}

const layout = { wrapper: 600, wrapperSpill: 0, cellSpill: 0 }

function resize(changes: Partial<typeof layout>) {
  Object.assign(layout, changes)
  act(() => {
    for (const notify of [...observed]) notify()
  })
}

function stubSize(name: "clientWidth" | "scrollWidth") {
  vi.spyOn(HTMLElement.prototype, name, "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    const spill = name === "scrollWidth"
    if (this.hasAttribute("data-showcase-matrix")) {
      return layout.wrapper + (spill ? layout.wrapperSpill : 0)
    }
    if (this.tagName === "TD") return 100 + (spill ? layout.cellSpill : 0)
    return 0
  })
}

beforeEach(() => {
  Object.assign(layout, { wrapper: 600, wrapperSpill: 0, cellSpill: 0 })
  vi.stubGlobal("ResizeObserver", StubResizeObserver)
  stubSize("clientWidth")
  stubSize("scrollWidth")
})

afterEach(() => {
  observed.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("VariantMatrix", () => {
  it("renders one cell per row and column pair", () => {
    render(
      <VariantMatrix
        rows={{ label: "variant", values: VARIANTS }}
        cols={{ label: "size", values: SIZES }}
        render={(variant, size) => <span>{`${variant}/${size}`}</span>}
      />,
    )
    expect(screen.getByText("default/sm")).toBeInTheDocument()
    expect(screen.getByText("default/lg")).toBeInTheDocument()
    expect(screen.getByText("outline/sm")).toBeInTheDocument()
    expect(screen.getByText("outline/lg")).toBeInTheDocument()
  })

  it("labels both axes", () => {
    render(
      <VariantMatrix
        rows={{ label: "variant", values: VARIANTS }}
        cols={{ label: "size", values: SIZES }}
        render={(variant, size) => <span>{`${variant}/${size}`}</span>}
      />,
    )
    expect(screen.getByText("variant \\ size")).toBeInTheDocument()
    expect(screen.getByText("sm")).toBeInTheDocument()
    expect(screen.getByText("outline")).toBeInTheDocument()
  })

  it("renders a labelled single row when cols is omitted", () => {
    render(
      <VariantMatrix
        rows={{ label: "orientation", values: ["horizontal", "vertical"] }}
        render={(orientation) => <span>{`sample-${orientation}`}</span>}
      />,
    )
    expect(
      screen.getByRole("rowheader", { name: "horizontal" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("rowheader", { name: "vertical" }),
    ).toBeInTheDocument()
    expect(screen.getByText("sample-horizontal")).toBeInTheDocument()
    expect(screen.getByText("sample-vertical")).toBeInTheDocument()
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument()
  })

  it("rejects a two-parameter render when cols is omitted", () => {
    render(
      // @ts-expect-error - single-axis render receives only the row value
      <VariantMatrix
        rows={{ label: "orientation", values: ["horizontal", "vertical"] }}
        render={(row: string, col: string) => <span>{`${row}/${col}`}</span>}
      />,
    )
    expect(
      screen.getByRole("rowheader", { name: "horizontal" }),
    ).toBeInTheDocument()
  })

  it("shrinks the header column to its labels", () => {
    const { container } = render(
      <VariantMatrix
        rows={{ label: "variant", values: VARIANTS }}
        cols={{ label: "size", values: SIZES }}
        render={(variant, size) => <span>{`${variant}/${size}`}</span>}
      />,
    )
    const headers = container.querySelectorAll("tr > th:first-child")
    expect(headers).toHaveLength(3)
    for (const header of headers) {
      expect(header).toHaveClass("w-px", "whitespace-nowrap")
    }
  })

  it("shares the remaining width equally and never lets a cell widen it", () => {
    const dual = render(
      <VariantMatrix
        rows={{ label: "variant", values: VARIANTS }}
        cols={{ label: "size", values: SIZES }}
        render={(variant, size) => <span>{`${variant}/${size}`}</span>}
      />,
    )
    const cells = dual.container.querySelectorAll("td")
    expect(cells).toHaveLength(4)
    for (const cell of cells) {
      expect(cell).toHaveClass("max-w-0")
      expect(cell).toHaveStyle({ width: "50%" })
    }
    dual.unmount()

    const single = render(
      <VariantMatrix
        rows={{ label: "orientation", values: ["horizontal", "vertical"] }}
        render={(orientation) => <span>{`sample-${orientation}`}</span>}
      />,
    )
    for (const cell of single.container.querySelectorAll("td")) {
      expect(cell).toHaveClass("w-full", "max-w-0")
    }
  })

  it("marks its wrapper with the showcase matrix hook and does not clip", () => {
    const dual = render(
      <VariantMatrix
        rows={{ label: "variant", values: VARIANTS }}
        cols={{ label: "size", values: SIZES }}
        render={(variant, size) => <span>{`${variant}/${size}`}</span>}
      />,
    )
    const dualWrapper = dual.container.firstElementChild
    expect(dualWrapper).toHaveAttribute("data-showcase-matrix", "")
    expect(dualWrapper).not.toHaveClass("overflow-x-auto")
    dual.unmount()

    const single = render(
      <VariantMatrix
        rows={{ label: "orientation", values: ["horizontal", "vertical"] }}
        render={(orientation) => <span>{`sample-${orientation}`}</span>}
      />,
    )
    const singleWrapper = single.container.firstElementChild
    expect(singleWrapper).toHaveAttribute("data-showcase-matrix", "")
    expect(singleWrapper).not.toHaveClass("overflow-x-auto")
  })

  it("stays a table while every cell fits", () => {
    const { container } = render(
      <VariantMatrix
        rows={{ label: "variant", values: VARIANTS }}
        cols={{ label: "size", values: SIZES }}
        render={(variant, size) => <span>{`${variant}/${size}`}</span>}
      />,
    )
    resize({ wrapper: 600 })
    expect(container.querySelector("table")).toBeInTheDocument()
    expect(container.querySelector("dl")).not.toBeInTheDocument()
  })

  it("reflows into a labelled list when a cell spills", () => {
    const { container } = render(
      <VariantMatrix
        rows={{ label: "variant", values: VARIANTS }}
        cols={{ label: "size", values: SIZES }}
        render={(variant, size) => <span>{`${variant}/${size}`}</span>}
      />,
    )
    resize({ wrapper: 300, cellSpill: 4 })
    expect(container.querySelector("table")).not.toBeInTheDocument()
    const items = [...container.querySelectorAll("dl > div")].map((item) => [
      item.querySelector("dt")?.textContent,
      item.querySelector("dd")?.textContent,
    ])
    expect(items).toEqual([
      ["default · sm", "default/sm"],
      ["default · lg", "default/lg"],
      ["outline · sm", "outline/sm"],
      ["outline · lg", "outline/lg"],
    ])
    expect(container.firstElementChild).toHaveAttribute(
      "data-showcase-matrix",
      "",
    )
  })

  it("reflows when the table outgrows its wrapper", () => {
    const { container } = render(
      <VariantMatrix
        rows={{ label: "variant", values: VARIANTS }}
        cols={{ label: "size", values: SIZES }}
        render={(variant, size) => <span>{`${variant}/${size}`}</span>}
      />,
    )
    resize({ wrapper: 300, wrapperSpill: 7 })
    expect(container.querySelector("table")).not.toBeInTheDocument()
    expect(container.querySelectorAll("dl > div")).toHaveLength(4)
  })

  it("returns to the table only 16px past the width that forced the list", () => {
    const { container } = render(
      <VariantMatrix
        rows={{ label: "variant", values: VARIANTS }}
        cols={{ label: "size", values: SIZES }}
        render={(variant, size) => <span>{`${variant}/${size}`}</span>}
      />,
    )
    resize({ wrapper: 300, cellSpill: 4 })
    expect(container.querySelector("dl")).toBeInTheDocument()

    resize({ wrapper: 315, cellSpill: 0 })
    expect(container.querySelector("dl")).toBeInTheDocument()

    resize({ wrapper: 316 })
    expect(container.querySelector("table")).toBeInTheDocument()
    expect(container.querySelector("dl")).not.toBeInTheDocument()

    resize({ wrapper: 316 })
    expect(container.querySelector("table")).toBeInTheDocument()
  })

  it("labels each list item with its row when cols is omitted", () => {
    const { container } = render(
      <VariantMatrix
        rows={{ label: "orientation", values: ["horizontal", "vertical"] }}
        render={(orientation) => <span>{`sample-${orientation}`}</span>}
      />,
    )
    resize({ wrapper: 200, cellSpill: 3 })
    expect(container.querySelector("table")).not.toBeInTheDocument()
    expect(
      [...container.querySelectorAll("dt")].map((dt) => dt.textContent),
    ).toEqual(["horizontal", "vertical"])
    expect(screen.getByText("sample-vertical").closest("dd")).not.toBeNull()
  })
})
