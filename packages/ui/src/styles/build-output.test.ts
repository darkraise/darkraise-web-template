import { describe, it, expect } from "vitest"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

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

  it("ends with the kit's four font families", () => {
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
      "JetBrains Mono Variable",
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
    for (const name of ["inter", "geist", "ibm-plex-sans", "jetbrains-mono"]) {
      expect(files).toContain(`${name}-LICENSE`)
    }
  })
})
