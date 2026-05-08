import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Banner } from "./Banner"

describe("Banner", () => {
  it("renders children with role='region' by default", () => {
    render(<Banner>Heads up</Banner>)
    expect(screen.getByRole("region")).toHaveTextContent("Heads up")
  })

  it("calls onDismiss when the close button is clicked", async () => {
    const onDismiss = vi.fn()
    render(
      <Banner dismissible onDismiss={onDismiss}>
        Heads up
      </Banner>,
    )
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("uses role='alert' when variant is destructive", () => {
    render(<Banner variant="destructive">Bad</Banner>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })
})
