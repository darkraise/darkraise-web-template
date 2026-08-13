import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { UiLabelsProvider } from "@labels"
import { UserMenu } from "@layout/user-menu"

describe("UserMenu labels", () => {
  it("renders English items with no provider", async () => {
    const user = userEvent.setup()
    render(<UserMenu onLogout={vi.fn()} onSettings={vi.fn()} />)
    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Log out")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("renders overridden items", async () => {
    const user = userEvent.setup()
    render(
      <UiLabelsProvider
        value={{ userMenu: { logout: "Đăng xuất", settings: "Cài đặt" } }}
      >
        <UserMenu onLogout={vi.fn()} onSettings={vi.fn()} />
      </UiLabelsProvider>,
    )
    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Đăng xuất")).toBeInTheDocument()
    expect(screen.getByText("Cài đặt")).toBeInTheDocument()
  })
})
