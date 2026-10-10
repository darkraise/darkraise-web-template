import { describe, expect, it } from "vitest"
import { canonicalJson, definitionsHash, fnv1a36 } from "./hash"
import type { ThemeDefinitions } from "./schema"

describe("canonicalJson", () => {
  it("sorts object keys at every depth", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe(
      '{"a":{"c":3,"d":2},"b":1}',
    )
    expect(canonicalJson({ a: { c: 3, d: 2 }, b: 1 })).toBe(
      canonicalJson({ b: 1, a: { d: 2, c: 3 } }),
    )
  })

  it("keeps arrays in order and sorts the objects inside them", () => {
    expect(canonicalJson([{ y: 1, x: [3, 1, 2] }, "b", "a"])).toBe(
      '[{"x":[3,1,2],"y":1},"b","a"]',
    )
  })

  it("drops undefined members", () => {
    expect(canonicalJson({ a: undefined, b: { c: undefined, d: "" } })).toBe(
      '{"b":{"d":""}}',
    )
  })

  it("escapes strings and keys as JSON does", () => {
    expect(canonicalJson({ 'q"': 'say "hi"\n', n: null, t: true })).toBe(
      '{"n":null,"q\\"":"say \\"hi\\"\\n","t":true}',
    )
  })
})

describe("fnv1a36", () => {
  // The published 32-bit FNV-1a vectors 0x811c9dc5, 0xe40c292c and
  // 0xbf9cf968, printed in base 36.
  it.each([
    ["", "ztntfp"],
    ["a", "1r9wi7g"],
    ["foobar", "1h5yxyg"],
  ])("hashes %j to %s", (text, hash) => {
    expect(fnv1a36(text)).toBe(hash)
  })
})

describe("definitionsHash", () => {
  const definitions: ThemeDefinitions = {
    styles: {
      "paper-cut": {
        label: "Paper cut",
        extends: "tactile",
        tokens: { shared: { cardEdge: "none" } },
      },
    },
    presets: {
      ink: { label: "Ink", style: "paper-cut", axes: { radius: "sharp" } },
    },
  }

  it("is empty without styles or presets", () => {
    expect(definitionsHash()).toBe("")
    expect(definitionsHash({})).toBe("")
    expect(definitionsHash({ styles: {}, presets: {} })).toBe("")
  })

  it("pins the hash of a fixed definition", () => {
    expect(definitionsHash(definitions)).toBe("cdi9se")
  })

  it("ignores key order and undefined members", () => {
    expect(
      definitionsHash({
        presets: {
          ink: {
            style: "paper-cut",
            axes: { radius: "sharp" },
            label: "Ink",
            shellStyle: undefined,
          },
        },
        styles: {
          "paper-cut": {
            tokens: { shared: { cardEdge: "none" } },
            extends: "tactile",
            label: "Paper cut",
          },
        },
      }),
    ).toBe("cdi9se")
  })

  it("changes when a value changes", () => {
    expect(
      definitionsHash({
        ...definitions,
        presets: {
          ink: { label: "Ink", style: "paper-cut", axes: { radius: "pill" } },
        },
      }),
    ).not.toBe(definitionsHash(definitions))
  })

  it("hashes only the styles and presets of a whole config", () => {
    const config = { defaults: { radius: "pill" }, ...definitions }
    expect(definitionsHash(config)).toBe("cdi9se")
  })
})
