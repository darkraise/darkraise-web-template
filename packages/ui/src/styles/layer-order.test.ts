import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { compile } from "tailwindcss"
import { LAYER_STATEMENT } from "@theme/config/compile"
import { buildStylesheet } from "../../scripts/build-css"

const KIT_ENTRY = "darkraise-ui/styles.css"

/**
 * What a consumer's Tailwind build makes of the published stylesheet: the
 * app's entry imports it, and Tailwind resolves the `@import "tailwindcss"`
 * that it leaves in place.
 */
async function consumerBuild(entry: string): Promise<string> {
  const compiler = await compile(entry, {
    base: resolve("src", "styles"),
    loadStylesheet: async (id, base) => {
      if (id === KIT_ENTRY) {
        const path = resolve("dist", "styles.css")
        return { path, base: dirname(path), content: buildStylesheet() }
      }
      let path: string
      if (id.startsWith(".")) {
        path = resolve(base, id)
      } else {
        const dir = resolve("node_modules", id)
        const pkg = JSON.parse(
          readFileSync(resolve(dir, "package.json"), "utf8"),
        )
        path = resolve(dir, pkg.exports["."].style)
      }
      return { path, base: dirname(path), content: readFileSync(path, "utf8") }
    },
  })
  return compiler.build([])
}

/** Layer names in the order the browser fixes them: first appearance wins. */
function layerOrder(css: string): string[] {
  const order: string[] = []
  for (const match of css.matchAll(/@layer\s+([^;{]+)[;{]/g)) {
    for (const name of (match[1] as string).split(",")) {
      if (!order.includes(name.trim())) order.push(name.trim())
    }
  }
  return order
}

// Tailwind's own statement names only theme, base, components and
// utilities, so the kit's statement must come before it or every style
// layer would sort after utilities.
describe("cascade layer order", () => {
  it("opens theme.css with the layer statement", () => {
    const theme = readFileSync(resolve("src", "styles", "theme.css"), "utf8")
    expect(theme.split("\n")[0]).toBe(LAYER_STATEMENT)
  })

  // Tailwind hoists `@layer properties;` above everything: that layer holds
  // only the @property fallbacks for its own --tw-* variables and sorts
  // lowest, below every kit layer.
  it("keeps the kit's layer order in a consumer's compiled stylesheet", async () => {
    const css = await consumerBuild(`@import "${KIT_ENTRY}";\n`)
    const kitLayers = LAYER_STATEMENT.replace(/^@layer |;$/g, "").split(", ")
    expect(layerOrder(css)).toEqual(["properties", ...kitLayers])
  })
})
