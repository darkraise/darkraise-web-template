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
  it(".card-surface ruleset matches .glass verbatim", () => {
    const glass = extractRuleBody("glass")
    const cardSurface = extractRuleBody("card-surface")
    expect(cardSurface).toBe(glass)
  })

  it(".overlay-surface ruleset is .glass-strong plus the overlay backdrop", () => {
    const backdrop = [
      "-webkit-backdrop-filter: var(--overlay-backdrop);",
      "backdrop-filter: var(--overlay-backdrop);",
    ]
    const lines = extractRuleBody(".overlay-surface").split("\n")
    for (const line of backdrop) expect(lines).toContain(line)
    expect(lines.filter((line) => !backdrop.includes(line)).join("\n")).toBe(
      extractRuleBody("glass-strong"),
    )
  })

  it.each([
    "glass-thin",
    "glass",
    "glass-strong",
    "card-surface",
    "modal-surface",
  ])("%s draws no backdrop", (name) => {
    expect(extractRuleBody(name)).not.toContain("backdrop-filter")
  })

  it("all four tier classes are present in theme.css", () => {
    expect(themeCss).toMatch(/@utility\s+glass-thin\s*\{/)
    expect(themeCss).toMatch(/@utility\s+glass\s*\{/)
    expect(themeCss).toMatch(/@utility\s+glass-strong\s*\{/)
    expect(themeCss).toMatch(/@utility\s+card-surface\s*\{/)
    expect(themeCss).toMatch(/\.overlay-surface\s*\{/)
  })

  // No style restyles the strong tier, so its edge is the theme border
  // rather than a fog tint that only a .dr-surface subtree populates.
  it("edges the strong tier with the theme border", () => {
    expect(extractRuleBody("glass-strong")).toContain(
      "border: 1px solid hsl(var(--border));",
    )
  })
})
