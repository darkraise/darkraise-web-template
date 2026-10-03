import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// Tokens that styles replaced. Each is gone from every kit stylesheet, module
// and test, comments included, so nothing reads one or brings it back.
const REMOVED = [
  "--shadow-button",
  "--backdrop-filter",
  "--backdrop-blur",
  "--surface-opacity",
  "--glass-overlay-base-alpha",
  "--inset-hi",
  "--inset-hi-strong",
  "--inset-hi-button",
  "--glass-halo-raised",
  "--glass-halo-overlay",
  "--glass-halo-modal",
  "--glass-state-hover-glow",
  "--glass-state-active-inset",
  "--glass-state-selected-fill",
]

const SELF = join("src", "theme", "styles", "removed-tokens.test.ts")

function everySourceFile(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return everySourceFile(path)
    return /\.(css|ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

const SOURCES = everySourceFile("src").filter((path) => path !== SELF)

describe("removed tokens", () => {
  it("scans the kit's sources", () => {
    expect(SOURCES.length).toBeGreaterThan(100)
  })

  it.each(REMOVED)("leaves no %s in kit CSS or TS", (name) => {
    const pattern = new RegExp(`${name}(?![\\w-])`)
    const offenders = SOURCES.filter((path) =>
      pattern.test(readFileSync(path, "utf8")),
    )
    expect(offenders).toEqual([])
  })
})
