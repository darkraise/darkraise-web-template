import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  UiLabelsProvider,
  useUiLabels,
  defaultLabels,
  mergeLabels,
} from "@labels"

function Probe() {
  const labels = useUiLabels()
  return (
    <>
      <span data-testid="reset">{labels.dataTable.reset}</span>
      <span data-testid="empty">{labels.dataTable.empty}</span>
      <span data-testid="logout">{labels.userMenu.logout}</span>
      <span data-testid="page">{labels.dataTable.pageInfo(2, 7)}</span>
    </>
  )
}

describe("useUiLabels", () => {
  it("returns the English defaults with no provider mounted", () => {
    render(<Probe />)
    expect(screen.getByTestId("reset")).toHaveTextContent("Reset")
    expect(screen.getByTestId("empty")).toHaveTextContent("No results found")
    expect(screen.getByTestId("logout")).toHaveTextContent("Log out")
    expect(screen.getByTestId("page")).toHaveTextContent("Page 2 of 7")
  })

  it("applies a partial override and leaves siblings at their defaults", () => {
    render(
      <UiLabelsProvider value={{ dataTable: { reset: "Đặt lại" } }}>
        <Probe />
      </UiLabelsProvider>,
    )
    expect(screen.getByTestId("reset")).toHaveTextContent("Đặt lại")
    expect(screen.getByTestId("empty")).toHaveTextContent("No results found")
  })

  it("overrides an interpolating label with a function", () => {
    render(
      <UiLabelsProvider
        value={{ dataTable: { pageInfo: (p, n) => `Trang ${p}/${n}` } }}
      >
        <Probe />
      </UiLabelsProvider>,
    )
    expect(screen.getByTestId("page")).toHaveTextContent("Trang 2/7")
  })

  it("merges a nested provider over its nearest ancestor", () => {
    render(
      <UiLabelsProvider value={{ dataTable: { reset: "Đặt lại" } }}>
        <UiLabelsProvider value={{ userMenu: { logout: "Đăng xuất" } }}>
          <Probe />
        </UiLabelsProvider>
      </UiLabelsProvider>,
    )
    expect(screen.getByTestId("reset")).toHaveTextContent("Đặt lại")
    expect(screen.getByTestId("logout")).toHaveTextContent("Đăng xuất")
  })
})

describe("mergeLabels", () => {
  it("merges the nested theme records key by key", () => {
    const merged = mergeLabels(defaultLabels, {
      theme: { modes: { dark: "Tối" } },
    })
    expect(merged.theme.modes.dark).toBe("Tối")
    expect(merged.theme.modes.light).toBe("Light")
    expect(merged.theme.groupLabels.color).toBe("Color")
  })

  it("does not mutate the base object", () => {
    mergeLabels(defaultLabels, { dataTable: { reset: "X" } })
    expect(defaultLabels.dataTable.reset).toBe("Reset")
  })
})
