import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const dist = resolve(__dirname, "../../dist/styles.css")

describe("published stylesheet", () => {
  it("makes no third-party network request at load time", () => {
    if (!existsSync(dist)) {
      throw new Error("run `pnpm --filter darkraise-ui build` before this test")
    }
    const css = readFileSync(dist, "utf8")
    expect(css).not.toMatch(/@import\s+url\(\s*["']?https?:/)
  })
})
