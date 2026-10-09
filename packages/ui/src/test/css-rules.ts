export interface CssRule {
  selector: string
  body: string
  wrappers: string[]
}

/**
 * Innermost rules of a stylesheet whose comments are already stripped: each
 * block that holds no other block, with the raw text since the brace before
 * it as its selector, so wrappers such as @layer and @media are transparent.
 * `wrappers` holds the preludes of the blocks around the rule, outermost
 * first, whitespace collapsed. A brace inside a string is text, and a
 * backslash in a string escapes the character after it.
 */
export function cssRules(css: string): CssRule[] {
  const rules: CssRule[] = []
  const preludes: string[] = []
  let quote = ""
  let statement = 0
  let since = 0
  let selectorStart = 0
  let open = -1
  for (let i = 0; i < css.length; i++) {
    const ch = css[i] as string
    if (quote) {
      if (ch === "\\") i++
      else if (ch === quote) quote = ""
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === ";") {
      statement = i + 1
    } else if (ch === "{") {
      preludes.push(css.slice(statement, i).replace(/\s+/g, " ").trim())
      open = i > since ? i : -1
      selectorStart = since
      since = i + 1
      statement = i + 1
    } else if (ch === "}") {
      preludes.pop()
      if (open !== -1) {
        rules.push({
          selector: css.slice(selectorStart, open),
          body: css.slice(open + 1, i),
          wrappers: [...preludes],
        })
      }
      open = -1
      since = i + 1
      statement = i + 1
    }
  }
  return rules
}
