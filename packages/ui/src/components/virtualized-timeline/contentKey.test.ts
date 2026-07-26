import { describe, expect, it } from "vitest"

import { contentKey } from "./contentKey"

describe("contentKey", () => {
  it("gives equal contents an equal key", () => {
    expect(contentKey(["a", "b", "c"])).toBe(contentKey(["a", "b", "c"]))
  })

  it("gives different contents different keys", () => {
    expect(contentKey(["a", "b"])).not.toBe(contentKey(["a", "c"]))
  })

  it("distinguishes sets that differ only in where a space falls", () => {
    // The case that broke a space separator: ["a b", "c"] and ["a", "b c"]
    // join to the same string under a space, but must not collide here.
    expect(contentKey(["a b", "c"])).not.toBe(contentKey(["a", "b c"]))
  })

  it("handles an empty iterable", () => {
    expect(contentKey([])).toBe("")
  })
})
