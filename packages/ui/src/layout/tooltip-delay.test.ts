import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Both app-shell layouts used to mount `<TooltipProvider delayDuration={0}>`,
// which set a zero hover-intent gate for every page rendered inside them —
// tooltips fired the instant the pointer crossed a trigger. The layouts must
// inherit the library default instead of pinning their own.
const LAYOUTS = [
  "src/layout/sidebar/SidebarLayout.tsx",
  "src/layout/stacked-layout/StackedLayout.tsx",
]

describe("app-shell tooltip delay", () => {
  for (const path of LAYOUTS) {
    it(`${path} inherits the default tooltip delay`, () => {
      const source = readFileSync(path, "utf8")
      expect(source).toMatch(/<TooltipProvider/)
      expect(source).not.toMatch(/<TooltipProvider[^>]*delayDuration/)
    })
  }
})
