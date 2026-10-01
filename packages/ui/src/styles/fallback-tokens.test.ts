import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { generateTokens } from "@theme/engine/generateTokens"

/**
 * The `:root` block the page paints before the provider hydrates. Every
 * engine-owned token in it must equal the engine's default light output, or
 * each load flashes stale colours.
 */
function fallbackDeclarations(): Map<string, string> {
  const css = readFileSync("src/styles/theme.css", "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  )
  const layer = css.indexOf("@layer base {")
  const open = css.indexOf("{", css.indexOf(":root", layer))
  let depth = 0
  let close = open
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++
    if (css[i] === "}") {
      depth--
      if (depth === 0) {
        close = i
        break
      }
    }
  }
  const declarations = new Map<string, string>()
  for (const match of css
    .slice(open + 1, close)
    .matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    declarations.set(
      match[1] as string,
      (match[2] as string).replace(/\s+/g, " ").trim(),
    )
  }
  return declarations
}

const engine = generateTokens({
  accentColor: "blue",
  surfaceColor: "slate",
  preset: "default",
  backgroundStyle: "solid",
  mode: "light",
  accentIntensity: "balanced",
})
const block = fallbackDeclarations()

describe("pre-hydration fallback block", () => {
  it.each(Object.keys(engine).filter((key) => block.has(key)))(
    "%s equals the engine's default light value",
    (key) => {
      expect(block.get(key)).toBe(
        (engine[key] as string).replace(/\s+/g, " ").trim(),
      )
    },
  )

  it("declares the tokens added in this phase", () => {
    for (const key of [
      "--primary-text",
      "--legend",
      "--destructive-solid",
      "--destructive-solid-foreground",
      "--field-edge-color",
      "--sidebar-active-bg",
    ]) {
      expect(block.has(key), key).toBe(true)
    }
  })
})
