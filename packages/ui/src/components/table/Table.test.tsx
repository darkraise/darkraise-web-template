import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table"

function renderTable(align?: "start" | "center" | "end") {
  render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead align={align}>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell align={align}>$5</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  )
  return {
    head: screen.getByRole("columnheader", { name: "Total" }),
    cell: screen.getByRole("cell", { name: "$5" }),
  }
}

describe("Table align", () => {
  it("renders align as data-align, not as the HTML attribute", () => {
    const { head, cell } = renderTable("end")
    for (const element of [head, cell]) {
      expect(element).toHaveAttribute("data-align", "end")
      expect(element).not.toHaveAttribute("align")
    }
  })

  it("leaves data-align off by default", () => {
    const { head, cell } = renderTable()
    expect(head).not.toHaveAttribute("data-align")
    expect(cell).not.toHaveAttribute("data-align")
  })
})
