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
const scifiCss = readFileSync(
  resolve(thisDir, "../../theme/presets/scifi/scifi.css"),
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

describe("SidebarNav activeBar", () => {
  function renderWithActiveBar(activeBar?: boolean | "bar" | "ring" | "both") {
    const { container } = render(
      <RouterAdapterProvider value={strictAdapter}>
        <SidebarProvider collapsed={false}>
          <SidebarNav nav={nav} activeBar={activeBar} />
        </SidebarProvider>
      </RouterAdapterProvider>,
    )
    const el = container.querySelector(".dr-sidebar-nav")
    if (!el) throw new Error("no sidebar nav rendered")
    return el
  }

  it("emits no attribute when the prop is omitted", () => {
    expect(renderWithActiveBar().getAttribute("data-active-bar")).toBeNull()
  })

  it("maps true to bar", () => {
    expect(renderWithActiveBar(true).getAttribute("data-active-bar")).toBe(
      "bar",
    )
  })

  it("maps false to ring", () => {
    expect(renderWithActiveBar(false).getAttribute("data-active-bar")).toBe(
      "ring",
    )
  })

  it("passes through each explicit value", () => {
    expect(renderWithActiveBar("bar").getAttribute("data-active-bar")).toBe(
      "bar",
    )
    expect(renderWithActiveBar("ring").getAttribute("data-active-bar")).toBe(
      "ring",
    )
    expect(renderWithActiveBar("both").getAttribute("data-active-bar")).toBe(
      "both",
    )
  })

  it("has a ring rule with no 3px rail", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes('[data-active-bar="ring"]') &&
        !selector.includes("data-preset"),
    )
    expect(rule, "no activeBar=ring rule in sidebar-nav.css").toBeDefined()
    expect(rule?.[2]).toMatch(/inset 0 0 0 1px/)
    expect(rule?.[2]).not.toMatch(/inset 3px/)
  })

  it("has a both rule carrying the ring and the rail", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes('[data-active-bar="both"]') &&
        !selector.includes("data-preset"),
    )
    expect(rule, "no activeBar=both rule in sidebar-nav.css").toBeDefined()
    expect(rule?.[2]).toMatch(/inset 0 0 0 1px/)
    expect(rule?.[2]).toMatch(/inset 3px/)
  })

  it("gives glass its own variant for each value", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rules = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    for (const value of ["bar", "ring", "both"]) {
      const rule = rules.find(
        ([, selector]) =>
          selector.includes('[data-preset="glass"]') &&
          selector.includes(`[data-active-bar="${value}"]`),
      )
      expect(rule, `no glass rule for activeBar=${value}`).toBeDefined()
    }
  })

  it("gives glass a full-opacity standalone ring with no rail", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes('[data-preset="glass"]') &&
        selector.includes('[data-active-bar="ring"]'),
    )
    expect(rule, "no glass activeBar=ring rule found").toBeDefined()
    expect(rule?.[2]).toMatch(/inset 0 0 0 1px/)
    expect(rule?.[2]).not.toMatch(/0\.3/)
  })

  it("gives glass both the rail and a tinted ring, rail painted first", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes('[data-preset="glass"]') &&
        selector.includes('[data-active-bar="both"]'),
    )
    expect(rule, "no glass activeBar=both rule found").toBeDefined()
    const body = rule?.[2] ?? ""
    expect(body).toMatch(/inset 3px/)
    expect(body).toMatch(/inset 0 0 0 1px/)
    expect(body).toMatch(/0\.3/)
    const railIndex = body.indexOf("inset 3px")
    const ringIndex = body.indexOf("inset 0 0 0 1px")
    expect(railIndex).toBeGreaterThanOrEqual(0)
    expect(ringIndex).toBeGreaterThanOrEqual(0)
    expect(railIndex).toBeLessThan(ringIndex)
  })

  it("keeps the glass default carrying both layers", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const base = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes('[data-preset="glass"]') &&
        selector.includes(".dr-sidebar-nav-item.active") &&
        !selector.includes("data-active-bar"),
    )
    expect(base, "glass base rule missing").toBeDefined()
    expect(base?.[2]).toMatch(/inset 3px/)
    expect(base?.[2]).toMatch(/inset 0 0 0 1px/)
  })

  it("gives scifi its own variant for each value, in its own file", () => {
    const withoutComments = scifiCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rules = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    for (const value of ["bar", "ring", "both"]) {
      const rule = rules.find(
        ([, selector]) =>
          selector.includes(".dr-sidebar-nav-item") &&
          selector.includes(`[data-active-bar="${value}"]`),
      )
      expect(rule, `no scifi rule for activeBar=${value}`).toBeDefined()
    }
  })

  it("gives scifi both the rail and the ring, rail painted first", () => {
    const withoutComments = scifiCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes(".dr-sidebar-nav-item") &&
        selector.includes('[data-active-bar="both"]'),
    )
    expect(rule, "no scifi activeBar=both rule found").toBeDefined()
    const body = rule?.[2] ?? ""
    expect(body).toMatch(/inset 3px/)
    expect(body).toMatch(/inset 0 0 0 1px/)
    const railIndex = body.indexOf("inset 3px")
    const ringIndex = body.indexOf("inset 0 0 0 1px")
    expect(railIndex).toBeGreaterThanOrEqual(0)
    expect(ringIndex).toBeGreaterThanOrEqual(0)
    expect(railIndex).toBeLessThan(ringIndex)
  })

  it("keeps the scifi default as a ring only", () => {
    const withoutComments = scifiCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const base = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes(".dr-sidebar-nav-item.active") &&
        !selector.includes("data-active-bar"),
    )
    expect(base, "scifi base rule missing").toBeDefined()
    expect(base?.[2]).toMatch(/inset 0 0 0 1px/)
    expect(base?.[2]).not.toMatch(/inset 3px/)
  })
})
