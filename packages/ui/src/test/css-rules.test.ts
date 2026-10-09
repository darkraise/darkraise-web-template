import { globSync, readFileSync } from "node:fs"
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

  it("gives the offset its selector text starts at", () => {
    const css =
      "@media (hover: hover) {\n  .a { color: red; }\n}\n.b { color: blue; }"
    expect(cssRules(css).map((rule) => rule.start)).toEqual([
      css.indexOf("{") + 1,
      css.lastIndexOf("}", css.indexOf(".b")) + 1,
    ])
  })
})

const GUARD = "src/test/css-rules.test.ts"

/**
 * Whether source text holds the brace-blind rule splitter, which reads a
 * brace inside a string as the end of a rule: as a regex literal with any
 * flags, or as the string a RegExp is built from.
 */
function splitsRulesByRegex(source: string): boolean {
  return /\(\[\^\{\}\]\+\)\\*\{\(\[\^\{\}\]\*\)\\*\}/.test(source)
}

describe("the brace-blind rule splitter", () => {
  it.each([
    String.raw`css.matchAll(/([^{}]+)\{([^{}]*)\}/g)`,
    String.raw`const RULE = /([^{}]+)\{([^{}]*)\}/`,
    String.raw`css.matchAll(/([^{}]+)\{([^{}]*)\}/gu)`,
    String.raw`new RegExp("([^{}]+)\\{([^{}]*)\\}", "g")`,
    String.raw`new RegExp('([^{}]+)\\{([^{}]*)\\}')`,
  ])("is found in %s", (source) => {
    expect(splitsRulesByRegex(source)).toBe(true)
  })

  it.each([
    "cssRules(css)",
    String.raw`/\{([^}]*)\}/`,
    String.raw`/([^{}]+)\{/`,
  ])("is not found in %s", (source) => {
    expect(splitsRulesByRegex(source)).toBe(false)
  })

  it("is in no kit source: cssRules splits rules", () => {
    const files = globSync("src/**/*.{ts,tsx}")
      .map((file) => file.replace(/\\/g, "/"))
      .filter((file) => file !== GUARD)
    expect(files.length).toBeGreaterThan(0)
    const offenders = files.filter((file) =>
      splitsRulesByRegex(readFileSync(file, "utf8")),
    )
    expect(offenders).toEqual([])
  })
})
