import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TopNavLayout } from "./TopNavLayout"
import { RouterAdapterProvider } from "@router"
import { UiLabelsProvider } from "@labels"
import type { RouterAdapter, RouterLinkProps } from "@router"
import type { NavGroup } from "@layout/types"
import userEvent from "@testing-library/user-event"

// Spreads the rest: `asChild` composition passes role, id and handlers down
// through Link, and a stub that swallows them makes menu items untestable.
function StubLink({ to, className, children, ...rest }: RouterLinkProps) {
  return (
    <a href={to} className={className} {...rest}>
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

const nestedNav: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/" },
      {
        label: "Library",
        href: "/library",
        children: [{ label: "Accordion", href: "/library/accordion" }],
      },
    ],
  },
]

function renderNested() {
  return render(
    <RouterAdapterProvider value={adapter}>
      <TopNavLayout nav={nestedNav} showThemeSwitcher={false}>
        <div>Content</div>
      </TopNavLayout>
    </RouterAdapterProvider>,
  )
}

describe("TopNavLayout nested nav items", () => {
  it("reaches a child route through a dropdown", async () => {
    const user = userEvent.setup()
    renderNested()
    await user.click(screen.getByRole("button", { name: /Library/ }))
    expect(
      await screen.findByRole("menuitem", { name: "Accordion" }),
    ).toBeInTheDocument()
  })

  it("keeps the parent route reachable in its own right", async () => {
    const user = userEvent.setup()
    renderNested()
    await user.click(screen.getByRole("button", { name: /Library/ }))
    const parent = await screen.findByRole("menuitem", { name: "Library" })
    expect(parent).toHaveAttribute("href", "/library")
  })

  it("leaves childless items as plain links", () => {
    renderNested()
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
  })
})
