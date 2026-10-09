import { globSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { stripCssComments } from "./strip-css-comments"

const GUARD = "src/test/strip-css-comments.test.ts"

// One backslash escapes a character in a regex literal, two in a string.
const ESCAPE = String.raw`\\{1,2}`
const QUOTE_BLIND = new RegExp(
  String.raw`\\{0,2}/${ESCAPE}\*\[(?:${ESCAPE}s${ESCAPE}S|${ESCAPE}S${ESCAPE}s)\]\*\?${ESCAPE}\*\\{0,2}/`,
)

// Whether source text holds the quote-blind comment pattern, which ends a
// comment at a `*/` inside a CSS string: as a regex literal with any flags,
// or as the string a RegExp is built from.
function stripsCommentsByRegex(source: string): boolean {
  return QUOTE_BLIND.test(source)
}

describe("stripCssComments", () => {
  it("keeps a comment's newlines when asked, so line numbers still match", () => {
    expect(
      stripCssComments("a {}\n/* one\ntwo */\nb {}", { keepNewlines: true }),
    ).toBe("a {}\n\n\nb {}")
  })

  it("is what every kit test strips CSS comments with", () => {
    const files = globSync("src/**/*.{ts,tsx}")
      .map((file) => file.replace(/\\/g, "/"))
      .filter((file) => file !== GUARD)
    expect(files.length).toBeGreaterThan(0)
    const offenders = files.filter((file) =>
      stripsCommentsByRegex(readFileSync(file, "utf8")),
    )
    expect(offenders).toEqual([])
  })
})

describe("the quote-blind comment pattern", () => {
  it.each([
    String.raw`css.replace(/\/\*[\s\S]*?\*\//g, "")`,
    String.raw`const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//`,
    String.raw`css.replace(/\/\*[\s\S]*?\*\//gu, " ")`,
    String.raw`new RegExp("\\/\\*[\\s\\S]*?\\*\\/", "g")`,
    String.raw`new RegExp("/\\*[\\s\\S]*?\\*/", "g")`,
    String.raw`new RegExp('/\\*[\\S\\s]*?\\*/')`,
  ])("is found in %s", (source) => {
    expect(stripsCommentsByRegex(source)).toBe(true)
  })

  it.each([
    "stripCssComments(css)",
    String.raw`source.replace(/^\s*\/\/.*$/gm, "")`,
    String.raw`/[\s\S]*?/`,
  ])("is not found in %s", (source) => {
    expect(stripsCommentsByRegex(source)).toBe(false)
  })
})
