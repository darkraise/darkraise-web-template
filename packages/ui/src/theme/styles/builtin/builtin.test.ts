import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { compileThemeCss } from "@theme/config/compile"
import { resolveRegistry } from "@theme/config/registry"
import { BUILTIN_STYLES, STYLE_NAMES } from "@theme/styles"

const BUILTIN_DIR = join("src", "theme", "styles", "builtin")
const GENERATED = join("src", "theme", "styles", "generated", "builtins.css")

describe("built-in style definitions", () => {
  it("defines the four styles in STYLE_NAMES order", () => {
    expect(Object.keys(BUILTIN_STYLES)).toEqual([...STYLE_NAMES])
  })

  it("resolves without issues, in the same order, all built in", () => {
    const registry = resolveRegistry()
    expect(registry.issues).toEqual([])
    expect(Object.keys(registry.styles)).toEqual([...STYLE_NAMES])
    expect(Object.values(registry.styles).every((s) => s.builtIn)).toBe(true)
    expect(registry.presets).toEqual({})
    expect(registry.hash).toBe("")
  })

  it("keeps each style's frosted flag and axis defaults", () => {
    const { styles } = resolveRegistry()
    expect(
      STYLE_NAMES.map((name) => [
        name,
        styles[name]?.frosted,
        styles[name]?.defaults,
      ]),
    ).toEqual([
      ["flat", false, { elevation: "flat" }],
      ["quiet", false, {}],
      ["tactile", false, {}],
      ["glass", true, { backgroundStyle: "gradient" }],
    ])
  })

  it("lists consumer styles after the built-ins", () => {
    const registry = resolveRegistry({
      styles: { "glass-ink": { label: "Ink", extends: "glass" } },
    })
    expect(Object.keys(registry.styles)).toEqual([...STYLE_NAMES, "glass-ink"])
    expect(registry.styles["glass-ink"]?.lineage).toEqual([
      "glass-ink",
      "glass",
    ])
  })

  // Built-ins compile at kit build and ship as plain data.
  it("imports nothing but types and sibling definitions", () => {
    const files = readdirSync(BUILTIN_DIR).filter(
      (name) => name.endsWith(".ts") && !name.endsWith(".test.ts"),
    )
    expect(files.sort()).toEqual([
      "flat.ts",
      "glass.ts",
      "index.ts",
      "quiet.ts",
      "tactile.ts",
    ])
    for (const file of files) {
      const source = readFileSync(join(BUILTIN_DIR, file), "utf8")
      const imports = source.match(/^import\b[^;]*?from\s+"[^"]+"/gms) ?? []
      for (const statement of imports) {
        expect(
          /^import type\b/.test(statement) ||
            /from "\.\/[a-z]+"$/.test(statement),
          `${file}: ${statement}`,
        ).toBe(true)
      }
    }
  })
})

describe("generated built-in stylesheet", () => {
  it("equals the compiler's output for the built-in definitions", () => {
    expect(readFileSync(GENERATED, "utf8")).toBe(
      compileThemeCss(resolveRegistry(), { include: "builtin" }),
    )
  })
})
