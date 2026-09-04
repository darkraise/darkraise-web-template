import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { StackedLayout } from "./StackedLayout"
import { RouterAdapterProvider } from "@router"
import { UiLabelsProvider } from "@labels"
import type { RouterAdapter, RouterLinkProps } from "@router"
import type { NavGroup } from "@layout/types"

function StubLink({ to, className, children }: RouterLinkProps) {
  return (
    <a href={to} className={className}>
      {children}
    </a>
  )
}

const adapter: RouterAdapter = {
  Link: StubLink,
  useNavigate: () => () => {},
  usePathname: () => "/",
  useBack: () => () => {},
  useInvalidate: () => () => {},
}

const nav: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/" }] },
]

function renderLayout(props = {}) {
  return render(
    <RouterAdapterProvider value={adapter}>
      <StackedLayout nav={nav} showThemeSwitcher={false} {...props}>
        <div>Content</div>
      </StackedLayout>
    </RouterAdapterProvider>,
  )
}

describe("StackedLayout shell grid", () => {
  it("marks its regions", () => {
    const { container } = renderLayout()
    const shell = container.querySelector(".dr-shell")
    expect(shell).toHaveAttribute("data-structure", "stacked")
    expect(shell?.querySelector('[data-region="nav"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="subnav"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="bar"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="content"]')).toBeInTheDocument()
  })

  it("makes every region a direct grid child", () => {
    const { container } = renderLayout()
    const shell = container.querySelector(".dr-shell") as HTMLElement
    for (const region of ["nav", "subnav", "bar", "content"]) {
      expect(
        container.querySelector(`[data-region="${region}"]`)?.parentElement,
      ).toBe(shell)
    }
  })

  it("pins the style when the prop is given", () => {
    const { container } = renderLayout({ shellStyle: "framed" })
    expect(container.querySelector(".dr-shell")).toHaveAttribute(
      "data-shell-style",
      "framed",
    )
  })

  it("renders the real brand mark rather than a coloured box", () => {
    const { container } = renderLayout()
    expect(container.querySelector(".dr-brand-logo")).toBeInTheDocument()
  })

  it("routes its skip link through the label system", () => {
    render(
      <UiLabelsProvider value={{ layout: { skipToContent: "Bo qua" } }}>
        <RouterAdapterProvider value={adapter}>
          <StackedLayout nav={nav} showThemeSwitcher={false}>
            <div>Content</div>
          </StackedLayout>
        </RouterAdapterProvider>
      </UiLabelsProvider>,
    )
    expect(screen.getByRole("link", { name: "Bo qua" })).toBeInTheDocument()
  })
})
