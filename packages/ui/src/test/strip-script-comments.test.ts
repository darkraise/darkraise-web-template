import { describe, expect, it } from "vitest"
import { stripScriptComments } from "./strip-script-comments"

describe("stripScriptComments", () => {
  it("drops a line comment holding an apostrophe", () => {
    expect(
      stripScriptComments("const a = \"x\" // don't\nconst b = 'y'\n"),
    ).toBe("const a = \"x\" \nconst b = 'y'\n")
  })

  it("reads a */ inside a string as text", () => {
    expect(stripScriptComments('const s = "*/"; /* gone */ const t = 1')).toBe(
      'const s = "*/";  const t = 1',
    )
  })

  it("reads a /* inside a regex literal as text", () => {
    expect(
      stripScriptComments(String.raw`const re = /\/*/; const n = 1 /* c */`),
    ).toBe(String.raw`const re = /\/*/; const n = 1 `)
  })

  it("reads a /* inside a template literal as text", () => {
    expect(
      stripScriptComments(
        'const t = `${fn({ a: "x" })} /* kept */ ${b}` // c\nconst u = 1',
      ),
    ).toBe('const t = `${fn({ a: "x" })} /* kept */ ${b}` \nconst u = 1')
  })

  it("reads a slash after an operand as division", () => {
    expect(stripScriptComments("const r = a / 2 /* half */ / 3")).toBe(
      "const r = a / 2  / 3",
    )
  })

  it("keeps a comment's newlines, so line numbers still match", () => {
    expect(stripScriptComments("a()\n/* one\ntwo */\nb()")).toBe("a()\n\n\nb()")
  })
})
