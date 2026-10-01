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
  it.each([undefined, "filled", "outline"] as const)(
    "marks the current page as an active ghost link (variant %s)",
    (variant) => {
      const page = currentPage(variant)
      expect(page).toHaveAttribute("aria-current", "page")
      expect(page).toHaveAttribute("data-variant", "ghost")
      expect(page).toHaveAttribute("data-active", "true")
    },
  )

  it("leaves the other pages unmarked", () => {
    currentPage()
    const other = screen.getByText("1")
    expect(other).not.toHaveAttribute("aria-current")
    expect(other).toHaveAttribute("data-variant", "ghost")
    expect(other).not.toHaveAttribute("data-active")
  })

  it("stamps the variant on the root", () => {
    currentPage("outline")
    expect(screen.getByRole("navigation")).toHaveAttribute(
      "data-variant",
      "outline",
    )
  })
})
