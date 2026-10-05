import { readFileSync } from "node:fs"

const THEME = "src/styles/theme.css"

/** Declarations that override the utility's height, fill, border or radius. */
const OVERRIDING_DECLARATION =
  /(?<![\w-])(?:(?:min-|max-)?height|background(?:-color)?|border(?:-[a-z]+)*)\s*:/

/** Tailwind utilities that would do the same from the rule's own `@apply`. */
const OVERRIDING_UTILITY = /^-?(?:h|min-h|max-h|size|bg|border|rounded)(?:-|$)/

/**
 * The body of `@utility field-trigger` in a stylesheet's text, normalised as
 * the static tests normalise rule bodies: comments stripped, whitespace
 * collapsed, trimmed. Nested rules stay in it.
 */
export function fieldTriggerBodyOf(css: string): string {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ")
  const head = text.indexOf("@utility field-trigger {")
  if (head === -1)
    throw new Error("no @utility field-trigger in the stylesheet")
  const open = text.indexOf("{", head)
  let depth = 0
  let close = open
  for (; close < text.length; close++) {
    if (text[close] === "{") depth++
    else if (text[close] === "}" && --depth === 0) break
  }
  return text.slice(open + 1, close).trim()
}

/**
 * Whether a rule body carries the utility unaltered: it applies
 * `field-trigger` and neither declares nor applies anything that would
 * override the utility's height, fill, border or radius. Layout such as
 * `width` or `min-w-48` may sit beside it.
 */
function carriesFieldTrigger(body: string): boolean {
  const tokens = [...body.matchAll(/@apply([^;]*);/g)].flatMap((match) =>
    (match[1] ?? "").trim().split(/\s+/),
  )
  if (!tokens.includes("field-trigger")) return false
  if (OVERRIDING_DECLARATION.test(body)) return false
  return !tokens.some((token) =>
    OVERRIDING_UTILITY.test(
      token.replace(/^(?:(?:[^[\]:]|\[[^\]]*\])*:)*/, ""),
    ),
  )
}

/** `resolveFieldTrigger` against a given stylesheet's text. */
export function resolveFieldTriggerIn(body: string, css: string): string {
  return carriesFieldTrigger(body) ? fieldTriggerBodyOf(css) : body
}

let themeBody: string | undefined

/**
 * A trigger rule that only applies `field-trigger` carries the utility's
 * declarations, which live in theme.css rather than in its own body. Given a
 * normalised rule body, returns the utility's body when the rule carries it
 * unaltered, and the body unchanged otherwise, so a local override of the
 * height, fill, border or radius is what the static tests read.
 */
export function resolveFieldTrigger(body: string): string {
  if (!carriesFieldTrigger(body)) return body
  if (themeBody === undefined) {
    themeBody = fieldTriggerBodyOf(readFileSync(THEME, "utf8"))
  }
  return themeBody
}
