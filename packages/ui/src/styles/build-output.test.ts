import { describe, it, expect } from "vitest"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, relative, resolve } from "node:path"
import { buildThemeJsonSchema } from "@theme/config/jsonSchema"

const distDir = resolve(__dirname, "../../dist")
const dist = resolve(distDir, "styles.css")

function builtStylesheet(): string {
  if (!existsSync(dist)) {
    throw new Error("run `pnpm --filter darkraise-ui build` before this test")
  }
  return readFileSync(dist, "utf8")
}

describe("published stylesheet", () => {
  it("makes no third-party network request at load time", () => {
    const css = builtStylesheet()
    expect(css).not.toMatch(/@import\s+(?:url\(\s*)?["']?https?:/)
    expect(css).not.toMatch(/url\(\s*["']?(?:https?:)?\/\//i)
  })

  it("ends with the kit's six font families", () => {
    const css = builtStylesheet()
    const tail = css.slice(css.indexOf("@font-face"))
    expect(tail.replace(/@font-face\s*\{[^}]*\}/g, "").trim()).toBe("")
    expect([
      ...new Set(
        [...tail.matchAll(/font-family:\s*"([^"]+)"/g)].map((m) => m[1]),
      ),
    ]).toEqual([
      "Inter Variable",
      "Geist Variable",
      "IBM Plex Sans Variable",
      "Hanken Grotesk Variable",
      "JetBrains Mono Variable",
      "Newsreader Variable",
    ])
  })

  it("loads every face from a file shipped beside it", () => {
    const urls = [
      ...builtStylesheet().matchAll(/@font-face\s*\{[^}]*?url\(([^)]+)\)/g),
    ].map((m) => m[1] as string)
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      expect(url).toMatch(/^\.\/fonts\/[\w.-]+\.woff2$/)
      expect(existsSync(resolve(distDir, url)), url).toBe(true)
    }
  })

  it("ships each font's licence beside its files", () => {
    const files = readdirSync(resolve(distDir, "fonts"))
    for (const name of [
      "inter",
      "geist",
      "ibm-plex-sans",
      "hanken-grotesk",
      "jetbrains-mono",
      "newsreader",
    ]) {
      expect(files).toContain(`${name}-LICENSE`)
    }
  })
})

/** Every bare specifier the built module at `entry` reaches through relative imports. */
function packageImports(entry: string): string[] {
  if (!existsSync(entry)) {
    throw new Error("run `pnpm --filter darkraise-ui build` before this test")
  }
  const found = new Set<string>()
  const seen = new Set<string>()
  const queue = [entry]
  for (let file = queue.pop(); file; file = queue.pop()) {
    if (seen.has(file)) continue
    seen.add(file)
    const code = readFileSync(file, "utf8")
    for (const [, specifier] of code.matchAll(
      /(?:\bfrom\s*|\bimport\s*\(\s*|^import\s*)["']([^"']+)["']/gm,
    )) {
      if (specifier?.startsWith(".")) {
        queue.push(resolve(dirname(file), specifier))
      } else if (specifier) {
        found.add(`${relative(distDir, file)} imports ${specifier}`)
      }
    }
  }
  return [...found]
}

describe("published theme-config entry", () => {
  it("imports no package, so neither React nor Node built-ins", () => {
    expect(packageImports(resolve(distDir, "theme-config/index.js"))).toEqual(
      [],
    )
  })

  it("ships the JSON Schema the kit builds", () => {
    const file = resolve(distDir, "theme.schema.json")
    expect(existsSync(file)).toBe(true)
    expect(readFileSync(file, "utf8")).toBe(
      `${JSON.stringify(buildThemeJsonSchema(), null, 2)}\n`,
    )
  })

  it("ships declarations that resolve the registry type the theme entry names", () => {
    const types = readFileSync(resolve(distDir, "theme/types.d.ts"), "utf8")
    expect(types).toContain('import("./config/registry").ThemeRegistry')
    expect(existsSync(resolve(distDir, "theme/config/registry.d.ts"))).toBe(
      true,
    )
    expect(
      readFileSync(resolve(distDir, "theme/config/index.d.ts"), "utf8"),
    ).toContain("type ThemeRegistry")
  })
})
