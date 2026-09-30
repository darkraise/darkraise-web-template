import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

const read = (path: string) =>
  readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ")

describe("destructive fills use the solid pair", () => {
  it("destructive button", () => {
    const css = read("src/components/button/button.css")
    expect(css).toContain(
      '.dr-btn[data-variant="destructive"] { @apply text-destructive-solid-foreground; --hue: hsl(var(--destructive-solid));',
    )
  })

  it("destructive badge and its dot", () => {
    const css = read("src/components/badge/badge.css")
    expect(css).toContain(
      "@apply bg-destructive-solid text-destructive-solid-foreground hover:bg-destructive-solid/80 border-transparent;",
    )
    expect(css).toContain(
      '.dr-badge-anchor-dot[data-variant="destructive"] { @apply bg-destructive-solid;',
    )
  })

  it("notification count", () => {
    const css = read("src/layout/notification-bell/notification-bell.css")
    expect(css).toContain("bg-destructive-solid text-destructive-solid-foreground")
    expect(css).not.toMatch(/bg-destructive(?![\w-])/)
  })
})

describe("toast action colours", () => {
  const css = read("src/components/sonner/sonner.css")

  it("the action reads the variant's action pair, falling back to the primary pair", () => {
    expect(css).toContain(
      "background-color: hsl(var(--toast-action, var(--primary-fill)));",
    )
    expect(css).toContain(
      "color: hsl(var(--toast-action-foreground, var(--primary-foreground)));",
    )
  })

  it.each([
    ["success", "var(--success)", "var(--success-foreground)"],
    ["error", "var(--destructive-solid)", "var(--destructive-solid-foreground)"],
    ["warning", "var(--warning)", "var(--warning-foreground)"],
    ["info", "var(--info)", "var(--info-foreground)"],
  ])("%s sets its action pair", (variant, fill, label) => {
    const block = new RegExp(
      `\\.dr-toast--${variant} \\{[^}]*--toast-action: ${fill.replace(/[()]/g, "\\$&")};[^}]*--toast-action-foreground: ${label.replace(/[()]/g, "\\$&")};`,
    )
    expect(css).toMatch(block)
  })

  it("has no warning-only label override left", () => {
    expect(css).not.toContain(".dr-toast--warning .dr-toast-action")
  })

  it("the loading variant sets no action pair", () => {
    expect(css).not.toMatch(/\.dr-toast--loading \{[^}]*--toast-action/)
  })
})
