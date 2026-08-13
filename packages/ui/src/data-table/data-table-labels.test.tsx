import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { UiLabelsProvider } from "@labels"
import { DataTable } from "@data-table"

interface Row {
  name: string
}

const columns = [{ accessorKey: "name", header: "Name" }]
const rows: Row[] = [{ name: "a" }, { name: "b" }]

describe("DataTable labels", () => {
  it("renders English chrome with no provider", () => {
    render(<DataTable columns={columns} data={rows} searchKey="name" />)
    expect(screen.getByText("Columns")).toBeInTheDocument()
    expect(screen.getByText("Rows per page")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument()
  })

  it("renders overridden chrome", () => {
    render(
      <UiLabelsProvider
        value={{
          dataTable: {
            columns: "Cột",
            rowsPerPage: "Số dòng mỗi trang",
            search: "Tìm kiếm...",
            pageInfo: (p, n) => `Trang ${p}/${n}`,
          },
        }}
      >
        <DataTable columns={columns} data={rows} searchKey="name" />
      </UiLabelsProvider>,
    )
    expect(screen.getByText("Cột")).toBeInTheDocument()
    expect(screen.getByText("Số dòng mỗi trang")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Tìm kiếm...")).toBeInTheDocument()
    expect(screen.getByText("Trang 1/1")).toBeInTheDocument()
  })

  it("lets the searchPlaceholder prop win over the label", () => {
    render(
      <UiLabelsProvider value={{ dataTable: { search: "Tìm kiếm..." } }}>
        <DataTable
          columns={columns}
          data={rows}
          searchKey="name"
          searchPlaceholder="Explicit"
        />
      </UiLabelsProvider>,
    )
    expect(screen.getByPlaceholderText("Explicit")).toBeInTheDocument()
  })

  it("renders the overridden empty state", () => {
    render(
      <UiLabelsProvider value={{ dataTable: { empty: "Không có kết quả" } }}>
        <DataTable columns={columns} data={[]} />
      </UiLabelsProvider>,
    )
    expect(screen.getByText("Không có kết quả")).toBeInTheDocument()
  })
})
