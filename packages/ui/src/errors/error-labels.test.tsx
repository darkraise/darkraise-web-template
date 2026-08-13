import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { UiLabelsProvider } from "@labels"
import { NotFoundPage, ErrorPage } from "@errors"

describe("error page labels", () => {
  it("renders English copy with no provider", () => {
    render(<NotFoundPage />)
    expect(screen.getByText("Page not found")).toBeInTheDocument()
    expect(screen.getByText("Back to home")).toBeInTheDocument()
  })

  it("renders overridden copy", () => {
    render(
      <UiLabelsProvider
        value={{
          errors: {
            notFoundTitle: "Không tìm thấy trang",
            backHome: "Về trang chủ",
          },
        }}
      >
        <NotFoundPage />
      </UiLabelsProvider>,
    )
    expect(screen.getByText("Không tìm thấy trang")).toBeInTheDocument()
    expect(screen.getByText("Về trang chủ")).toBeInTheDocument()
  })

  it("still prefers a real Error's own message over the generic description", () => {
    render(
      <UiLabelsProvider value={{ errors: { genericDescription: "Lỗi" } }}>
        <ErrorPage error={new Error("boom")} reset={vi.fn()} />
      </UiLabelsProvider>,
    )
    expect(screen.getByText("boom")).toBeInTheDocument()
  })

  it("falls back to the overridden description for a non-Error value", () => {
    render(
      <UiLabelsProvider value={{ errors: { genericDescription: "Lỗi" } }}>
        <ErrorPage error="not an error" reset={vi.fn()} />
      </UiLabelsProvider>,
    )
    expect(screen.getByText("Lỗi")).toBeInTheDocument()
  })
})
