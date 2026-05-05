import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "../components/button"

describe("override contract", () => {
  it("Button renders with dr-btn plus consumer utilities", () => {
    const { getByRole } = render(
      <Button className="rounded-full bg-emerald-500 hover:bg-emerald-600">
        click
      </Button>,
    )
    const btn = getByRole("button")
    expect(btn.className).toContain("dr-btn")
    expect(btn.className).toContain("bg-emerald-500")
    expect(btn.className).toContain("hover:bg-emerald-600")
    expect(btn.className).toContain("rounded-full")
  })

  it("Button renders data-variant and data-size attributes", () => {
    const { getByRole } = render(
      <Button variant="destructive" size="lg">
        delete
      </Button>,
    )
    const btn = getByRole("button")
    expect(btn.getAttribute("data-variant")).toBe("destructive")
    expect(btn.getAttribute("data-size")).toBe("lg")
  })
})
