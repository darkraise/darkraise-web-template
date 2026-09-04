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
