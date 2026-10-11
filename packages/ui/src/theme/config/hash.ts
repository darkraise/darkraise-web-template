import type { ThemeDefinitions } from "./schema"

/**
 * JSON with object keys sorted at every depth, arrays in order, `undefined`
 * members dropped and no whitespace, so equal content prints equal text
 * whatever order its keys were written in.
 */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => (item === undefined ? "null" : canonicalJson(item))).join(",")}]`
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>
    const members = Object.keys(record)
      .sort()
      .filter((key) => record[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    return `{${members.join(",")}}`
  }
  return JSON.stringify(value) ?? "null"
}

/** 32-bit FNV-1a over UTF-16 code units, in base 36. */
export function fnv1a36(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

/** `""` when there is nothing to hash, so apps with only built-ins share one value. */
export function definitionsHash(definitions?: ThemeDefinitions): string {
  const styles = definitions?.styles
  const presets = definitions?.presets
  const fonts = definitions?.fonts
  const empty = (record: object | undefined) =>
    record === undefined || Object.keys(record).length === 0
  if (empty(styles) && empty(presets) && empty(fonts)) return ""
  // An absent member drops out of the JSON, so a config without fonts keeps
  // the hash it had before fonts existed.
  return fnv1a36(canonicalJson({ styles, presets, fonts }))
}
