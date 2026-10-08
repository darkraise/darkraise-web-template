import { describe, expect, it } from "vitest"
import { readdirSync } from "node:fs"
import { resolve } from "node:path"
import {
  FONT_PACKAGES,
  assertFirstParty,
  buildStylesheet,
  readFontPackages,
} from "../../scripts/build-css"

describe("assertFirstParty", () => {
  it.each([
    '@import "https://fonts.googleapis.com/css2?family=Inter";',
    "@import url(https://example.com/a.css);",
    "a { background: url(https://example.com/a.png); }",
    "a { background: url('//cdn.example.com/a.png'); }",
    '@font-face { src: url("http://example.com/a.woff2"); }',
  ])("rejects %s", (css) => {
    expect(() => assertFirstParty(css)).toThrow(/build-css/)
  })

  it("accepts relative and data URLs", () => {
    expect(() =>
      assertFirstParty(
        `a { background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>"); }\n` +
          "@font-face { src: url(./fonts/a.woff2); }",
      ),
    ).not.toThrow()
  })
})

describe("kit font packages", () => {
  it("takes every wght-normal subset each package publishes", () => {
    const fonts = readFontPackages()
    expect(fonts.map((font) => font.name)).toEqual([...FONT_PACKAGES])
    for (const font of fonts) {
      const published = readdirSync(resolve(font.dir, "files"))
        .filter((file) => file.endsWith("-wght-normal.woff2"))
        .sort()
      expect(font.faces.map((face) => face.file).sort()).toEqual(published)
    }
  })

  it("appends the four families after everything else", () => {
    const css = buildStylesheet()
    const tail = css.slice(css.indexOf("@font-face"))
    expect(tail.replace(/@font-face\s*\{[^}]*\}/g, "").trim()).toBe("")
    expect([
      ...new Set(
        [...tail.matchAll(/font-family: "([^"]+)"/g)].map((m) => m[1]),
      ),
    ]).toEqual([
      "Inter Variable",
      "Geist Variable",
      "IBM Plex Sans Variable",
      "JetBrains Mono Variable",
    ])
  })
})
