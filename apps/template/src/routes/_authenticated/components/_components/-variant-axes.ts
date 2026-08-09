/**
 * Builds an axis list that provably covers every member of `T`.
 *
 * Adding a variant to the UI package makes every incomplete call site a type
 * error, so a demo page cannot silently fall behind the component it documents.
 */
export const allOf =
  <T extends string>() =>
  <U extends readonly T[]>(
    ...items: U &
      ([T] extends [U[number]] ? unknown : ["missing", Exclude<T, U[number]>])
  ): U =>
    items
