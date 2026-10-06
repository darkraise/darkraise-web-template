import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

describe("sidebar collapsible", () => {
  it("reads no Radix collapsible variable anywhere", () => {
    for (const path of cssFiles("src")) {
      expect(readFileSync(path, "utf8"), path).not.toContain(
        "--radix-collapsible-content-height",
      )
    }
  })

  it("keeps Collapsible's animation and only shortens it", () => {
    const css = readFileSync(
      "src/layout/sidebar/sidebar-nav.css",
      "utf8",
    ).replace(/\s+/g, " ")
    expect(css).toContain(
      ".dr-sidebar-nav-collapsible-content.dr-collapsible-content[data-state] { animation-duration: var(--duration-fast); }",
    )
    expect(css).not.toMatch(/animation: collapsible-(?:up|down)/)
  })
})
