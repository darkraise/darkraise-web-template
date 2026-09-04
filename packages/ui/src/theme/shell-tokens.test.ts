import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, it, expect } from "vitest"
import { SHELL_STYLES } from "./types"

// vitest runs with the package root as cwd; import.meta.url is not a file URL
// under this config.
const css = readFileSync(resolve(process.cwd(), "src/styles/theme.css"), "utf8")

const SHELL_TOKENS = [
  "--shell-gap",
  "--shell-pad",
  "--shell-radius",
  "--shell-region-border",
  "--shell-region-shadow",
  "--shell-ground",
]

// Everything before the first per-style block. A token whose only definition
// sits inside a [data-shell-style] block resolves to nothing under `classic`.
const beforeStyleBlocks = css.slice(0, css.indexOf('[data-shell-style="'))

describe("shell tokens", () => {
  it.each(SHELL_TOKENS)("declares %s outside the style blocks", (token) => {
    expect(beforeStyleBlocks).toContain(`${token}:`)
  })

  it.each(SHELL_STYLES.filter((style) => style !== "classic"))(
    "binds a block for %s",
    (style) => {
      expect(css).toContain(`[data-shell-style="${style}"]`)
    },
  )

  it("gives classic no block of its own, since it is the default", () => {
    expect(css).not.toContain('[data-shell-style="classic"]')
  })

  it("does not round shell regions into lozenges under the pill radius", () => {
    const scaleOf = (selector: string) => {
      const block = css.slice(css.indexOf(selector))
      return /--shell-radius-scale:\s*([^;]+);/.exec(block)?.[1].trim()
    }
    expect(scaleOf('[data-radius="pill"] {')).toBe(
      scaleOf('[data-radius="rounded"] {'),
    )
  })

  it("keeps the region shadow off the elevation axis", () => {
    // The spec pins this: a shell's separation from the page belongs to the
    // shell style, not to the page's elevation setting.
    const styleBlocks = css.slice(css.indexOf('[data-shell-style="'))
    expect(styleBlocks).not.toMatch(
      /--shell-region-shadow:[^;]*var\(--elevation-/,
    )
  })
})

const shellStyles = readFileSync(
  resolve(process.cwd(), "src/layout/shell/shell-styles.css"),
  "utf8",
)

describe("shell style rules", () => {
  it("never reaches for !important", () => {
    expect(shellStyles).not.toMatch(/!important/)
  })

  it("targets the shell root, not the document element", () => {
    // A document-level selector would lose to a pinned shellStyle prop.
    expect(shellStyles).not.toMatch(
      /\[data-shell-style="[a-z]+"\]\s+\.dr-shell/,
    )
  })

  it("styles regions by role rather than by layout class", () => {
    expect(shellStyles).not.toMatch(/\.dr-sidebar-layout|\.dr-stacked-layout/)
    expect(shellStyles).toContain('[data-region="nav"]')
  })

  it("gives classic no rules, since it is the unstyled base", () => {
    expect(shellStyles).not.toContain('data-shell-style="classic"')
  })

  it("covers every non-default style", () => {
    for (const style of SHELL_STYLES.filter((s) => s !== "classic")) {
      expect(shellStyles).toContain(`data-shell-style="${style}"`)
    }
  })
})

const shellPresets = readFileSync(
  resolve(process.cwd(), "src/layout/shell/shell-presets.css"),
  "utf8",
)
const sidebarLayout = readFileSync(
  resolve(process.cwd(), "src/layout/sidebar/sidebar-layout.css"),
  "utf8",
)
const layoutHeader = readFileSync(
  resolve(process.cwd(), "src/layout/layout-header/layout-header.css"),
  "utf8",
)

describe("preset chrome", () => {
  it("paints glass chrome on every chrome region", () => {
    for (const region of ["nav", "subnav", "bar", "panel"]) {
      expect(shellPresets).toContain(`[data-region="${region}"]`)
    }
  })

  it("gives a detached glass region its fog edge back", () => {
    // The generic shell-style rule is (0,3,0) and would otherwise replace
    // the fog border and the specular with a neutral one.
    expect(shellPresets).toMatch(
      /island[\s\S]*?inset 0 0 0 1px var\(--fog-20\)/,
    )
  })

  it("keeps the seam edge on the welded styles", () => {
    expect(shellPresets).toContain("border-right: 1px solid var(--fog-20)")
    expect(shellPresets).toContain("border-bottom: 1px solid var(--fog-20)")
  })

  it("no longer duplicates chrome paint in the layout files", () => {
    // Chrome is a region concern now; a layout-class rule would sit at
    // (0,2,0) and lose to the shell-style rules.
    expect(sidebarLayout).not.toContain('[data-preset="glass"]')
    expect(layoutHeader).not.toContain('[data-preset="glass"]')
  })
})
