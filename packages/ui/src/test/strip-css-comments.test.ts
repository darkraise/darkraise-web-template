import { globSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { stripCssComments } from "./strip-css-comments"

// The source text of the quote-blind pattern, which ends a comment at a `*/`
// inside a CSS string.
const QUOTE_BLIND = /\/\\\/\\\*\[\\s\\S\]\*\?\\\*\\\/\//g

describe("stripCssComments", () => {
  it("keeps a comment's newlines when asked, so line numbers still match", () => {
    expect(
      stripCssComments("a {}\n/* one\ntwo */\nb {}", { keepNewlines: true }),
    ).toBe("a {}\n\n\nb {}")
  })

  it("is what every kit test strips CSS comments with", () => {
    const files = globSync("src/**/*.{ts,tsx}").map((file) =>
      file.replace(/\\/g, "/"),
    )
    expect(files.length).toBeGreaterThan(0)
    const offenders = files.flatMap((file) => {
      const uses = [...readFileSync(file, "utf8").matchAll(QUOTE_BLIND)].length
      return uses > 0 ? [`${file}: ${uses}`] : []
    })
    expect(offenders).toEqual([])
  })
})
