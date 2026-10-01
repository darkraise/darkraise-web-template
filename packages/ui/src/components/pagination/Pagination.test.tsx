import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  type PaginationVariant,
} from "./Pagination"

function currentPage(variant?: PaginationVariant): HTMLElement {
  render(
    <Pagination variant={variant}>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="#1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#2" isActive>
            2
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  )
  return screen.getByText("2")
}

describe("Pagination", () => {
  it("fills the current page by default", () => {
    const page = currentPage()
    expect(page).toHaveAttribute("aria-current", "page")
    expect(page).toHaveAttribute("data-variant", "default")
    expect(page).not.toHaveAttribute("data-active")
  })

  it("outlines the current page under the outline variant", () => {
    const page = currentPage("outline")
    expect(page).toHaveAttribute("aria-current", "page")
    expect(page).toHaveAttribute("data-variant", "ghost")
    expect(page).toHaveAttribute("data-active", "true")
  })
})
