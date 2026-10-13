import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { compileThemeCss } from "@theme/config/compile"
import { resolveRegistry } from "@theme/config/registry"
import { BUILTIN_STYLES, STYLE_NAMES } from "@theme/styles"
import { BUILTIN_PRESETS } from "./presets"

const BUILTIN_DIR = join("src", "theme", "styles", "builtin")
const PRESETS_DIR = join(BUILTIN_DIR, "presets")
const GENERATED_DIR = join("src", "theme", "styles", "generated")

/**
 * Every statement of `source` that loads another module: an import or a
 * re-export with `from`, a bare side-effect import, and a dynamic import or
 * require, which a guard below never allows.
 */
function moduleStatements(source: string): string[] {
  return (
    source.match(
      /^import\b[^;"]*?from\s+"[^"]+"|^export\s+(?:type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s+from\s+"[^"]+"|^import\s+"[^"]+"|\bimport\(|\brequire\(/gm,
    ) ?? []
  )
}

describe("built-in style definitions", () => {
  it("defines the four styles in STYLE_NAMES order", () => {
    expect(Object.keys(BUILTIN_STYLES)).toEqual([...STYLE_NAMES])
  })

  it("resolves without issues, in the same order, all built in", () => {
    const registry = resolveRegistry()
    expect(registry.issues).toEqual([])
    expect(Object.keys(registry.styles)).toEqual([...STYLE_NAMES])
    expect(Object.values(registry.styles).every((s) => s.builtIn)).toBe(true)
    expect(Object.keys(registry.presets)).toEqual(Object.keys(BUILTIN_PRESETS))
    expect(Object.values(registry.presets).every((p) => p.builtIn)).toBe(true)
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
      ["glass", true, { backgroundStyle: "gradient", gradientPattern: "dots" }],
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
      const imports = moduleStatements(source)
      for (const statement of imports) {
        expect(
          /^(?:import|export) type\b/.test(statement) ||
            /from "\.\/[a-z]+"$/.test(statement) ||
            /^import \{[^}]*\} from "\.\.\/\.\.\/(?:config\/transparency|types)"$/.test(
              statement,
            ),
          `${file}: ${statement}`,
        ).toBe(true)
      }
    }
  })

  it("lets a preset file import nothing but types and sibling presets", () => {
    const files = readdirSync(PRESETS_DIR).filter(
      (name) => name.endsWith(".ts") && !name.endsWith(".test.ts"),
    )
    expect(files).toContain("index.ts")
    for (const file of files) {
      const source = readFileSync(join(PRESETS_DIR, file), "utf8")
      const imports = moduleStatements(source)
      for (const statement of imports) {
        expect(
          /^(?:import|export) type\b/.test(statement) ||
            /from "\.\/[a-z]+(-[a-z]+)*"$/.test(statement),
          `${file}: ${statement}`,
        ).toBe(true)
      }
    }
  })

  // The overlay shadow composes the elevation lift and the glow axes around
  // the dropdown shadow, and the outline edge is the kit's 3:1 boundary.
  it("leaves the overlay shadow and the outline edge to the kit in every style and preset", () => {
    const { styles, presets } = resolveRegistry()
    const written = [
      ...Object.values(styles).map((style) => ({
        name: `styles.${style.name}`,
        maps: [
          ...Object.values(style.tokens),
          ...style.when.map((entry) => entry.tokens ?? {}),
          style.forcedFallback,
        ],
      })),
      ...Object.values(presets).map((preset) => ({
        name: `presets.${preset.name}`,
        maps: Object.values(preset.tokens),
      })),
    ]
    expect(written).toHaveLength(
      STYLE_NAMES.length + Object.keys(BUILTIN_PRESETS).length,
    )
    for (const { name, maps } of written) {
      for (const tokens of maps) {
        expect(tokens, name).not.toHaveProperty("overlayShadow")
        expect(tokens, name).not.toHaveProperty("buttonNeutralBorder")
      }
    }
  })
})

describe("generated built-in stylesheets", () => {
  it("holds one sheet per built-in style", () => {
    expect(readdirSync(GENERATED_DIR).sort()).toEqual(
      STYLE_NAMES.map((name) => `${name}.css`).sort(),
    )
  })

  it.each(STYLE_NAMES)("%s.css equals the compiler's output for it", (name) => {
    expect(readFileSync(join(GENERATED_DIR, `${name}.css`), "utf8")).toBe(
      compileThemeCss(resolveRegistry(), {
        include: "builtin",
        styles: [name],
      }),
    )
  })
})
