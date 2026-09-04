import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TopNavLayout } from "./TopNavLayout"
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
      <TopNavLayout nav={nav} showThemeSwitcher={false} {...props}>
        <div>Content</div>
      </TopNavLayout>
    </RouterAdapterProvider>,
  )
}

describe("TopNavLayout shell grid", () => {
  it("marks its regions", () => {
    const { container } = renderLayout()
    const shell = container.querySelector(".dr-shell")
    expect(shell).toHaveAttribute("data-structure", "top-nav")
    expect(shell?.querySelector('[data-region="bar"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="content"]')).toBeInTheDocument()
  })

  it("makes every region a direct grid child", () => {
    const { container } = renderLayout()
    const shell = container.querySelector(".dr-shell") as HTMLElement
    for (const region of ["bar", "content"]) {
      expect(
        container.querySelector(`[data-region="${region}"]`)?.parentElement,
      ).toBe(shell)
    }
  })

  it("pins the style when the prop is given", () => {
    const { container } = renderLayout({ shellStyle: "flat" })
    expect(container.querySelector(".dr-shell")).toHaveAttribute(
      "data-shell-style",
      "flat",
    )
  })

  it("isolates its content the way the other shells do", () => {
    // This layout was the only one never marked data-content, so the
    // isolation and gradient-overlay rules keyed to it never applied here.
    const { container } = renderLayout()
    expect(container.querySelector("main[data-content]")).toBeInTheDocument()
  })

  it("routes its skip link through the label system", () => {
    // The default label and the SkipLink component's hardcoded fallback read
    // the same, so only an override can tell them apart.
    render(
      <UiLabelsProvider
        value={{ layout: { skipToContent: "Aller au contenu" } }}
      >
        <RouterAdapterProvider value={adapter}>
          <TopNavLayout nav={nav} showThemeSwitcher={false}>
            <div>Content</div>
          </TopNavLayout>
        </RouterAdapterProvider>
      </UiLabelsProvider>,
    )
    expect(
      screen.getByRole("link", { name: "Aller au contenu" }),
    ).toBeInTheDocument()
  })
})
