import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const thisDir = dirname(fileURLToPath(import.meta.url))
const themeCssPath = resolve(thisDir, "theme.css")
const themeCss = readFileSync(themeCssPath, "utf8")

function extractRuleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  // Match either @utility name { ... } or .name { ... }
  const utilityPattern = new RegExp(`@utility\\s+${escaped}\\s*\\{([^}]*)\\}`)
  const classPattern = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`)
  const match = themeCss.match(utilityPattern) ?? themeCss.match(classPattern)
  if (!match || match[1] === undefined) {
    throw new Error(`Selector not found in theme.css: ${selector}`)
  }
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
}

describe("theme aliases", () => {
  it("modal-surface draws no backdrop", () => {
    expect(extractRuleBody("modal-surface")).not.toContain("backdrop-filter")
  })

  it("defines none of the removed fog utilities", () => {
    expect(themeCss).not.toMatch(
      /@utility\s+(?:glass|glass-thin|glass-strong|card-surface)\s*\{/,
    )
  })

  it("overlay-surface applies the overlay recipe and nothing else", () => {
    expect(extractRuleBody("overlay-surface").split("\n")).toEqual([
      "background: var(--overlay-bg);",
      "background-blend-mode: var(--surface-overlay-blend-mode);",
      "border-color: var(--overlay-border);",
      "-webkit-backdrop-filter: var(--overlay-backdrop);",
      "backdrop-filter: var(--overlay-backdrop);",
      "--field-edge: var(--field-edge-lifted);",
    ])
    expect(themeCss).toMatch(/@utility\s+overlay-surface\s*\{/)
    expect(themeCss).not.toMatch(/\.overlay-surface\s*\{/)
  })
})
