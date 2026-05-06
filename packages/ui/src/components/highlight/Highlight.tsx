import * as React from "react"

import "./highlight.css"

const REGEX_META = /[.*+?^${}()|[\]\\]/g

function escapeRegex(value: string): string {
  return value.replace(REGEX_META, "\\$&")
}

function normalizeQuery(query: string | string[]): string[] {
  const list = Array.isArray(query) ? query : [query]
  return list.filter((entry) => typeof entry === "string" && entry.length > 0)
}

export interface HighlightProps {
  text: string
  query: string | string[]
  ignoreCase?: boolean
  matchAll?: boolean
  renderMatch?: (match: string, index: number) => React.ReactNode
}

function Highlight({
  text,
  query,
  ignoreCase = true,
  matchAll = true,
  renderMatch,
}: HighlightProps) {
  const terms = React.useMemo(() => normalizeQuery(query), [query])

  const chunks = React.useMemo(() => {
    if (terms.length === 0) {
      return [{ text, match: false }] as Array<{ text: string; match: boolean }>
    }
    const splitter = new RegExp(
      `(${terms.map(escapeRegex).join("|")})`,
      ignoreCase ? "gi" : "g",
    )
    const matcher = new RegExp(
      `^(?:${terms.map(escapeRegex).join("|")})$`,
      ignoreCase ? "i" : "",
    )
    const result: Array<{ text: string; match: boolean }> = []
    let matched = false
    for (const part of text.split(splitter)) {
      if (!part) continue
      const isMatch = matcher.test(part) && (matchAll || !matched)
      if (isMatch) matched = true
      result.push({ text: part, match: isMatch })
    }
    return result
  }, [terms, text, ignoreCase, matchAll])

  if (terms.length === 0) {
    return <>{text}</>
  }

  return (
    <>
      {chunks.map((chunk, index) => {
        if (!chunk.match) {
          return <React.Fragment key={index}>{chunk.text}</React.Fragment>
        }
        if (renderMatch) {
          return (
            <React.Fragment key={index}>
              {renderMatch(chunk.text, index)}
            </React.Fragment>
          )
        }
        return (
          <mark key={index} data-match="true" className="dr-highlight-match">
            {chunk.text}
          </mark>
        )
      })}
    </>
  )
}

export { Highlight }
