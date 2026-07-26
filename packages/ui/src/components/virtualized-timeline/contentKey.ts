// Ids are consumer-supplied and arbitrary, so any printable separator (a
// space, a comma) could occur inside one, letting two different sets of ids
// join into the same key. NUL cannot appear in a practical identifier.
// Built via `String.fromCharCode` rather than a typed escape sequence: the
// escape corrupted silently more than once in this codebase's history
// (collapsed to an actual NUL byte, or left as literal backslashes) when
// passed through tooling that treats backslash-u as live text to decode. A
// numeric char code has nothing for that kind of pipeline to misinterpret.
const NUL_SEPARATOR = String.fromCharCode(0)

/**
 * Joins ids into a single primitive string, stable under content rather than
 * iterable identity: two iterables with the same members produce the same
 * key regardless of whether they are the same array instance, which is what
 * makes it safe to use as a React memo or effect dependency for a value
 * mirrored from a controlled prop.
 *
 * Reordering the same members yields a different key. That is acceptable
 * here: it costs one extra effect run, not an infinite loop.
 */
export function contentKey(ids: Iterable<string>): string {
  return Array.from(ids).join(NUL_SEPARATOR)
}
