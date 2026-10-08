/**
 * CSS source with its comments removed. A comment marker inside a string is
 * text, and a backslash in a string escapes the character after it.
 */
export function stripCssComments(css: string): string {
  let out = ""
  let quote = ""
  for (let i = 0; i < css.length; i++) {
    const ch = css[i] as string
    if (quote) {
      out += ch
      if (ch === "\\") {
        i++
        out += css[i] ?? ""
      } else if (ch === quote) {
        quote = ""
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch
      out += ch
    } else if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2)
      i = end === -1 ? css.length : end + 1
    } else {
      out += ch
    }
  }
  return out
}
