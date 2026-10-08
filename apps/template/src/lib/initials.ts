const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u

/**
 * Up to two initials for an avatar fallback: the first letter or digit of the
 * first two words, or the first `singleWordLetters` of a lone word. Characters
 * that are not letters or digits (punctuation, emoji) are skipped, and the
 * name is read by code point, so a surrogate pair is never split.
 */
export function initialsOf(name: string, singleWordLetters: 1 | 2): string {
  const words = name
    .split(/\s+/u)
    .map((word) =>
      Array.from(word).filter((char) => LETTER_OR_DIGIT.test(char)),
    )
    .filter((chars) => chars.length > 0)
  const [first, second] = words
  if (!first) return ""
  const letters = second
    ? [first[0], second[0]]
    : first.slice(0, singleWordLetters)
  return letters.join("").toUpperCase()
}
