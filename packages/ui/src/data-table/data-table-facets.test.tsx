import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { DataTable } from "@data-table"

interface Row {
  name: string
  kind: string
}

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "kind", header: "Kind" },
]

const rows: Row[] = [
  { name: "a", kind: "alpha" },
  { name: "b", kind: "beta" },
  { name: "c", kind: "alpha" },
  { name: "d", kind: "gamma" },
]

function visibleNames(): string[] {
  const body = screen.getAllByRole("rowgroup")[1]
  if (!body) return []
  return within(body)
    .getAllByRole("row")
    .map((r) => within(r).getAllByRole("cell")[0]?.textContent ?? "")
}

async function openFacet(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /filter by kind/i }))
}

describe("DataTable faceted filters", () => {
  it("offers each distinct value with its count", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={rows} facets={["kind"]} />)
    await openFacet(user)

    expect(
      screen.getByRole("menuitemcheckbox", { name: /alpha/ }),
    ).toHaveTextContent("2")
    expect(
      screen.getByRole("menuitemcheckbox", { name: /beta/ }),
    ).toHaveTextContent("1")
    expect(
      screen.getByRole("menuitemcheckbox", { name: /gamma/ }),
    ).toHaveTextContent("1")
  })

  it("narrows to one selected value", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={rows} facets={["kind"]} />)
    await openFacet(user)
    await user.click(screen.getByRole("menuitemcheckbox", { name: /alpha/ }))

    expect(visibleNames()).toEqual(["a", "c"])
  })

  it("shows the union when two values are selected", async () => {
    // Two values within one facet is an OR, not an AND -- an AND would always
    // be empty, because a row has exactly one value for the column.
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={rows} facets={["kind"]} />)
    await openFacet(user)
    await user.click(screen.getByRole("menuitemcheckbox", { name: /alpha/ }))
    await user.click(screen.getByRole("menuitemcheckbox", { name: /beta/ }))

    expect(visibleNames()).toEqual(["a", "b", "c"])
  })

  it("restores every row when the filter is cleared", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={rows} facets={["kind"]} />)
    await openFacet(user)
    await user.click(screen.getByRole("menuitemcheckbox", { name: /alpha/ }))
    await user.keyboard("{Escape}")

    await user.click(screen.getByRole("button", { name: /reset/i }))
    expect(visibleNames()).toEqual(["a", "b", "c", "d"])
  })

  it("renders no facet control when none is asked for", () => {
    render(<DataTable columns={columns} data={rows} />)
    expect(
      screen.queryByRole("button", { name: /filter by kind/i }),
    ).not.toBeInTheDocument()
  })
})
