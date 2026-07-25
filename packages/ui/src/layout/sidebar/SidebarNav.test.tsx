// `RouterLinkProps` does not include arbitrary `data-*` props, so a
// contract-conforming adapter Link — the package's own StubLink included —
// is free to drop them. The collapsed square must therefore be selectable
// without relying on an attribute that only lands on the anchor when the
// consumer happens to spread its rest props.
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { RouterAdapterProvider } from "@router"
import type { RouterAdapter, RouterLinkProps } from "@router"
import { SidebarNav } from "./SidebarNav"
import { SidebarProvider } from "./SidebarContext"
import type { NavGroup } from "@layout/types"

const thisDir = dirname(fileURLToPath(import.meta.url))
const sidebarNavCss = readFileSync(
  resolve(thisDir, "./sidebar-nav.css"),
  "utf8",
)

function StrictLink({ to, className, style, children }: RouterLinkProps) {
  return (
    <a href={to} className={className} style={style}>
      {children}
    </a>
  )
}

const strictAdapter: RouterAdapter = {
  Link: StrictLink,
  useNavigate: () => () => {},
  usePathname: () => "/",
  useBack: () => () => {},
  useInvalidate: () => () => {},
}

const nav: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/" }] },
]

// The selector list of the rule that pins the icon-only item to a square,
// read from the stylesheet itself so the test tracks the real CSS rather
// than a hard-coded copy of it.
function collapsedSquareSelector(): string {
  const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
  const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, selector, body]) =>
      selector.includes(".dr-sidebar-nav-link") &&
      body.includes("w-[var(--density-cell)]"),
  )
  if (!rule) {
    throw new Error("no collapsed square rule found in sidebar-nav.css")
  }
  return rule[1].trim()
}

function renderNav(collapsed: boolean) {
  const { container } = render(
    <RouterAdapterProvider value={strictAdapter}>
      <SidebarProvider collapsed={collapsed}>
        <SidebarNav nav={nav} />
      </SidebarProvider>
    </RouterAdapterProvider>,
  )
  const link = container.querySelector(".dr-sidebar-nav-link")
  if (!link) throw new Error("no sidebar nav link rendered")
  return link
}

describe("SidebarNav collapsed styling", () => {
  it("matches the collapsed square rule when the adapter Link drops data-* props", () => {
    expect(renderNav(true).matches(collapsedSquareSelector())).toBe(true)
  })

  it("does not match the collapsed square rule while expanded", () => {
    expect(renderNav(false).matches(collapsedSquareSelector())).toBe(false)
  })
})
