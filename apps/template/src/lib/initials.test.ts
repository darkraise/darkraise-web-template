import { describe, expect, it } from "vitest"
import { initialsOf } from "./initials"

describe("initialsOf", () => {
  it.each([
    ["two words", "Alex Johnson", 1, "AJ"],
    ["two words, two-letter mode", "Wireless Headphones", 2, "WH"],
    ["more than two words", "Samsung Galaxy S24 Ultra", 2, "SG"],
    ["a single word, one letter", "Alex", 1, "A"],
    ["a single word, two letters", "iPhone", 2, "IP"],
    ["leading punctuation", "(Refurbished) Laptop", 2, "RL"],
    ["a punctuation-only word", "— Monitor Stand", 2, "MS"],
    ["a leading emoji", "🎧 Headphones", 2, "HE"],
    ["a leading emoji, one letter", "🎧 Headphones", 1, "H"],
    ["a letter outside the basic plane", "𝒜lice Smith", 1, "𝒜S"],
    ["a leading digit", "4K Monitor", 2, "4M"],
    ["accented letters", "élodie durand", 1, "ÉD"],
    ["surrounding spaces", "  Jane  Doe  ", 1, "JD"],
    ["no letters at all", "!!! ???", 2, ""],
    ["an empty name", "", 1, ""],
  ] as const)("%s", (_, name, singleWordLetters, expected) => {
    expect(initialsOf(name, singleWordLetters)).toBe(expected)
  })
})
