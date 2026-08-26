import { render, screen, within, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { DataTable } from "@data-table"

interface Row {
  name: string
}

const columns = [{ accessorKey: "name", header: "Name" }]
const rows: Row[] = Array.from({ length: 5000 }, (_, i) => ({
  name: `row-${i}`,
}))

const VIRTUAL = { rowHeight: 32, height: 320 }

function bodyRows() {
  const body = screen.getAllByRole("rowgroup")[1]
  return body ? within(body).getAllByRole("row") : []
}

function scroller() {
  return document.querySelector(".dr-data-table-viewport") as HTMLElement
}

describe("DataTable virtualization", () => {
  it("mounts a bounded number of rows for a long list", () => {
    render(<DataTable columns={columns} data={rows} virtualize={VIRTUAL} />)
    // 320px of viewport at 32px a row is ten, plus overscan at each end. The
    // bound is what matters: 5000 mounted rows is the failure this prevents.
    expect(bodyRows().length).toBeLessThan(40)
    expect(bodyRows().length).toBeGreaterThan(0)
  })

  it("still reports the full row count to assistive tech", () => {
    render(<DataTable columns={columns} data={rows} virtualize={VIRTUAL} />)
    // A screen reader must hear "row 4000 of 5000", not "of 20".
    expect(screen.getByRole("table")).toHaveAttribute("aria-rowcount", "5000")
  })

  it("mounts different rows once scrolled", () => {
    render(<DataTable columns={columns} data={rows} virtualize={VIRTUAL} />)
    const before = bodyRows().map((r) => r.textContent)
    expect(before[0]).toContain("row-0")

    fireEvent.scroll(scroller(), { target: { scrollTop: 32 * 1000 } })

    const after = bodyRows().map((r) => r.textContent)
    expect(after[0]).not.toBe(before[0])
    expect(after.join()).toContain("row-1000")
  })

  it("gives each mounted row its true index", () => {
    render(<DataTable columns={columns} data={rows} virtualize={VIRTUAL} />)
    fireEvent.scroll(scroller(), { target: { scrollTop: 32 * 1000 } })
    const first = bodyRows()[0]
    // Without aria-rowindex a virtualized row claims to be the first one.
    expect(first?.getAttribute("aria-rowindex")).not.toBe("1")
  })

  it("reserves the full scroll height", () => {
    render(<DataTable columns={columns} data={rows} virtualize={VIRTUAL} />)
    // Padding rows above and below the window stand in for the rows that are
    // not mounted, so the scrollbar reflects the whole list.
    const pads = Array.from(
      document.querySelectorAll(".dr-data-table-virtual-pad"),
    ) as HTMLElement[]
    const padded = pads.reduce((n, el) => n + parseInt(el.style.height, 10), 0)
    expect(padded + bodyRows().length * 32).toBe(5000 * 32)
  })

  it("paginates as before when virtualization is off", () => {
    render(<DataTable columns={columns} data={rows.slice(0, 30)} />)
    expect(scroller()).toBeNull()
    expect(screen.getByText("Rows per page")).toBeInTheDocument()
  })
})
