import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { VariantMatrix } from "./-variant-matrix"

const VARIANTS = ["default", "outline"] as const
const SIZES = ["sm", "lg"] as const

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
})
