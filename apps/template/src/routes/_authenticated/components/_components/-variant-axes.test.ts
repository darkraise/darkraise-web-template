import { describe, it, expect } from "vitest"
import { allOf } from "./-variant-axes"

type Fruit = "apple" | "pear" | "plum"

describe("allOf", () => {
  it("returns the items it was given, in order", () => {
    expect(allOf<Fruit>()("apple", "pear", "plum")).toEqual([
      "apple",
      "pear",
      "plum",
    ])
  })

  it("accepts a complete list", () => {
    const all = allOf<Fruit>()("apple", "pear", "plum")
    expect(all).toHaveLength(3)
  })

  it("rejects an incomplete list at compile time", () => {
    // @ts-expect-error - "plum" is missing from the list
    const partial = allOf<Fruit>()("apple", "pear")
    expect(partial).toHaveLength(2)
  })
})
