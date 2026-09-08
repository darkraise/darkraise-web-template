import { expect, it } from "vitest"
import { en } from "./en"
import { vi } from "./vi"

function leaves(value: object, prefix = ""): string[] {
  return Object.entries(value)
    .flatMap(([key, entry]) =>
      typeof entry === "object" && entry !== null
        ? leaves(entry, `${prefix}${key}.`)
        : [`${prefix}${key}:${typeof entry}`],
    )
    .sort()
}
it("ships Vietnamese for every English message with matching message types", () => {
  expect(leaves(vi.messages)).toEqual(leaves(en.messages))
  expect(vi.messages.announcements.contributions(2, "8/9/2026")).toBe(
    "2 lượt đóng góp vào 8/9/2026",
  )
})
