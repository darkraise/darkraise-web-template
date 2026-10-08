/** Capitalised words a sentence-case label may still contain. */
export const PROPER_WORDS: ReadonlySet<string> = new Set([
  "CSV",
  "PDF",
  "KPI",
  "JSON",
  "PNG",
  "Darkraise",
  "English",
  "Vietnamese",
  "Tiếng",
  "Việt",
])

/**
 * The words after the first that start with a capital and are not proper
 * words. A lone capital letter names an option ("Option A"), so it passes.
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
        !PROPER_WORDS.has(word),
    )
}
