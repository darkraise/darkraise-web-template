/** Capitalised words a sentence-case label may still contain. */
export const PROPER_WORDS: ReadonlySet<string> = new Set([
  "CSV",
  "PDF",
  "KPI",
  "JSON",
  "PNG",
  "URL",
  "URLs",
  "UI",
  "ID",
  "US",
  "EU",
  "Darkraise",
  "Atlas",
  "Material-style",
  "Monday",
  "English",
  "French",
  "Vietnamese",
  "Tiếng",
  "Việt",
])

/** A code identifier or key chord, such as MetricGrid, Editable<number> or Ctrl+Enter. */
const CODE = /\p{Ll}\p{Lu}|[<+]/u

/**
 * The words after the first that start with a capital and are not proper
 * words. A lone capital letter names an option ("Option A"), so it passes,
 * and code keeps its own casing.
 */
export function capitalisedWords(text: string): string[] {
  return text
    .replace(/\{\{.*?\}\}/g, "")
    .trim()
    .split(/\s+/)
    .slice(1)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(
      (word) =>
        /^\p{Lu}/u.test(word) &&
        [...word].length > 1 &&
        !PROPER_WORDS.has(word) &&
        !CODE.test(word),
    )
}
