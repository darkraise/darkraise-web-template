import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

// The e2e suite keeps its own copies of the theme's palette lists so the tests
// stay plain data with no runtime coupling to the package. The cost of that is
// drift, and the drift is silent: when the kit gained the "coral" accent and
// the "Control Depth" axis, seven theme-switcher tests started failing, and
// because they were already failing nobody could tell whether a later change
// had broken anything else.
//
// This pins the copies to the source they mirror. It reads the package's
// TypeScript rather than importing it, because `darkraise-ui/theme` re-exports
// React components and their stylesheets — too much to pull into a Node test
// for two arrays of strings.

const TYPES_PATH = resolve(
  __dirname,
  "../../../../packages/ui/src/theme/types.ts",
)

/** The string literals of an exported `as const` array in the package source. */
function packageList(name: string): string[] {
  const source = readFileSync(TYPES_PATH, "utf8")
  const match = new RegExp(
    `export const ${name} = \\[([\\s\\S]*?)\\] as const`,
  ).exec(source)
  const body = match?.[1]
  if (body === undefined) throw new Error(`${name} not found in ${TYPES_PATH}`)
  return [...body.matchAll(/"([^"]+)"/g)].flatMap((m) => m[1] ?? [])
}

describe("e2e theme fixtures mirror the package", () => {
  it("lists every accent colour", async () => {
    const { ACCENT_COLORS } = await import("../../e2e/fixtures/theme")
    expect([...ACCENT_COLORS]).toEqual(packageList("ACCENT_COLORS"))
  })

  it("lists every surface colour", async () => {
    const { SURFACE_COLORS } = await import("../../e2e/fixtures/theme")
    // The package spreads ACCENT_COLORS into SURFACE_COLORS, so the regex
    // captures only the twelve neutral ramps written literally before it.
    const neutrals = packageList("SURFACE_COLORS")
    const accents = packageList("ACCENT_COLORS")
    expect([...SURFACE_COLORS]).toEqual([...neutrals, ...accents])
  })
})
