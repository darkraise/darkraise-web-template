import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Route as CarouselRoute } from "./carousel"
import { Route as ShellStylesRoute } from "./shell-styles"
import { Route as TreeViewRoute } from "./tree-view"

// Only the snippets are under test: each example renders its code, never its
// demo, so no kit component mounts (the kit resolves its own React copy under
// Vitest and its stateful parts cannot render here).
vi.mock("./_components/-showcase-page", () => ({
  ShowcasePage: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))
vi.mock("./_components/-showcase-example", () => ({
  ShowcaseExample: ({ title, code }: { title: string; code: string }) => (
    <pre data-snippet={title}>{code}</pre>
  ),
}))

function snippetsOf(route: { options: { component?: unknown } }) {
  const Page = route.options.component as React.ComponentType
  const { container, unmount } = render(<Page />)
  const snippets = new Map(
    [...container.querySelectorAll("pre[data-snippet]")].map((pre) => [
      pre.getAttribute("data-snippet") ?? "",
      pre.textContent ?? "",
    ]),
  )
  unmount()
  return snippets
}

describe("shell-styles snippets", () => {
  const LAYOUTS: Record<string, string> = {
    Sidebar: "SidebarLayout",
    "Top navigation": "TopNavLayout",
    Stacked: "StackedLayout",
    "Split panel": "SplitPanelLayout",
  }

  it("shows each structure with its own layout component", () => {
    const snippets = snippetsOf(ShellStylesRoute)
    expect([...snippets.keys()]).toEqual(Object.keys(LAYOUTS))
    for (const [title, layout] of Object.entries(LAYOUTS)) {
      const code = snippets.get(title) ?? ""
      expect(code, title).toContain(
        `import { ${layout} } from "darkraise-ui/layout"`,
      )
      expect(code, title).toContain(`<${layout} nav={nav}`)
      for (const other of Object.values(LAYOUTS)) {
        if (other !== layout) expect(code, title).not.toContain(other)
      }
    }
    expect(snippets.get("Split panel")).toContain("panel={<MessageList />}")
  })
})

describe("carousel snippets", () => {
  it("keeps room for the arrows wherever a snippet has them", () => {
    const snippets = snippetsOf(CarouselRoute)
    const withArrows = [...snippets].filter(([, code]) =>
      code.includes("<CarouselPrevious"),
    )
    expect(withArrows.map(([title]) => title)).toEqual([
      "Horizontal card slider",
      "With indicators (dot pagination)",
      "Align",
      "Orientation",
    ])
    for (const [title, code] of withArrows) {
      expect(code, title).toMatch(/className="(mx-12|my-12)[ "]/)
    }
  })
})

describe("tree-view lazy snippet", () => {
  it("shows the loader, the empty placeholder and the depth threading", () => {
    const code = snippetsOf(TreeViewRoute).get("Lazy-load children") ?? ""
    expect(code).toContain("const ensureLoaded = async (id: string)")
    expect(code).toContain("void ensureLoaded(newlyOpened)")
    expect(code).toContain('role="none"')
    expect(code).toContain('"--tree-depth": depth + 1')
    expect(code).toContain("renderNode(child, depth + 1)")
  })
})
