import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const SRC = join(import.meta.dirname, "..", "..")
const OPAQUE_FILL =
  /bg-primary(?![-/\w])|background(-color)?:\s*hsl\(var\(--primary\)\s*\)/
// Stripping block comments wholesale is the only reliable way to tell a
// declaration from a sentence about one. scifi.css discusses `bg-primary` in
// prose at two points, and it indents its continuation lines rather than
// prefixing them with `*`, so every line-shape heuristic misreads that prose
// as code.
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g

function sourceFiles(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: "utf8" })
    .filter((p) => /\.(css|tsx)$/.test(p) && !p.includes(".test."))
    .map((p) => join(SRC, p))
}

describe("primary-fill migration", () => {
  // --primary-foreground is chosen for contrast against --primary-fill only.
  // A background painted with bare --primary would carry a label with no
  // contrast guarantee: white measures 1.98:1 on dark yellow.
  it("paints no opaque background from --primary", () => {
    const offenders = sourceFiles().filter((file) =>
      OPAQUE_FILL.test(readFileSync(file, "utf8").replace(BLOCK_COMMENT, " ")),
    )

    expect(offenders).toEqual([])
  })
})
