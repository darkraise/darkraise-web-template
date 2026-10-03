import { describe, expect, it } from "vitest"
import { assertFirstParty } from "../../scripts/build-css"

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
