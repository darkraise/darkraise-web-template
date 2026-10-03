import { describe, expect, it } from "vitest"
import { fontFaceCss, parseFontFaces } from "../../scripts/font-faces"

const SOURCE = `/* inter-latin-wght-normal */
@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url(./files/inter-latin-wght-normal.woff2) format('woff2-variations');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153;
}
`

describe("parseFontFaces", () => {
  it("reads one face per @font-face rule", () => {
    expect(parseFontFaces(SOURCE)).toEqual([
      {
        family: "Inter Variable",
        style: "normal",
        weight: "100 900",
        file: "inter-latin-wght-normal.woff2",
        format: "woff2-variations",
        unicodeRange: "U+0000-00FF,U+0131,U+0152-0153",
      },
    ])
  })

  it("rejects a face that does not load a packaged woff2 file", () => {
    expect(() =>
      parseFontFaces(SOURCE.replace("./files/", "https://cdn.example.com/")),
    ).toThrow(/src/)
  })
})

describe("fontFaceCss", () => {
  it("loads each face from ./fonts/ with swap display and its own range", () => {
    expect(fontFaceCss(parseFontFaces(SOURCE))).toBe(
      [
        "@font-face {",
        '  font-family: "Inter Variable";',
        "  font-style: normal;",
        "  font-display: swap;",
        "  font-weight: 100 900;",
        '  src: url(./fonts/inter-latin-wght-normal.woff2) format("woff2-variations");',
        "  unicode-range: U+0000-00FF,U+0131,U+0152-0153;",
        "}",
        "",
      ].join("\n"),
    )
  })
})
