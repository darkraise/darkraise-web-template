import { describe, expect, it } from "vitest"
import { cssRules } from "./css-rules"

function trimmed(css: string): Array<[string, string]> {
  return cssRules(css).map((rule) => [rule.selector.trim(), rule.body.trim()])
}

describe("cssRules", () => {
  it("reads a brace inside a content string as text", () => {
    expect(
      trimmed('.a::before { content: "}"; color: red; }\n.b { color: blue; }'),
    ).toEqual([
      [".a::before", 'content: "}"; color: red;'],
      [".b", "color: blue;"],
    ])
  })

  it("reads a brace inside an attribute selector string as text", () => {
    expect(trimmed('[data-open="{"] { color: red; }')).toEqual([
      ['[data-open="{"]', "color: red;"],
    ])
  })

  it("keeps an escaped quote inside its string", () => {
    expect(trimmed('.a { content: "\\"}"; }\n.b { color: blue; }')).toEqual([
      [".a", 'content: "\\"}";'],
      [".b", "color: blue;"],
    ])
  })

  it("returns innermost rules, with wrappers transparent", () => {
    expect(
      trimmed(
        "@layer components {\n  @media (hover: hover) {\n    .a:hover { color: red; }\n  }\n  .b { color: blue; }\n}",
      ),
    ).toEqual([
      [".a:hover", "color: red;"],
      [".b", "color: blue;"],
    ])
  })

  it("names the blocks around each rule, outermost first", () => {
    const css =
      "@layer components {\n  .a { color: red; @media (hover:  hover) {\n    &:hover { color: blue; }\n  } }\n}"
    expect(cssRules(css).map((rule) => rule.wrappers)).toEqual([
      ["@layer components", ".a", "@media (hover: hover)"],
    ])
  })
})
