/**
 * CSS source with its comments removed. A comment marker inside a string is
 * text, and a backslash in a string escapes the character after it. With
 * `keepNewlines`, a comment leaves its newlines behind, so line numbers in
 * the result still match the source.
 */
export function stripCssComments(
  css: string,
  { keepNewlines = false }: { keepNewlines?: boolean } = {},
): string {
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
      const close = end === -1 ? css.length : end + 2
      if (keepNewlines) out += css.slice(i, close).replace(/[^\n]/g, "")
      i = close - 1
    } else {
      out += ch
    }
  }
  return out
}
