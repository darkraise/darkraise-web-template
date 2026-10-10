import { mkdirSync, writeFileSync } from "node:fs"
import { compileThemeCss } from "../src/theme/config/compile"
import { resolveRegistry } from "../src/theme/config/registry"

const registry = resolveRegistry()
// The registry drops a definition with an error, which would silently drop
// a built-in style from the stylesheet.
if (registry.issues.length > 0) {
  const lines = registry.issues.map(
    (issue) => `- ${issue.level} ${issue.path}: ${issue.message}`,
  )
  throw new Error(
    `[generate-style-css] Built-in style definitions have issues:\n${lines.join("\n")}`,
  )
}

const target = new URL(
  "../src/theme/styles/generated/builtins.css",
  import.meta.url,
)
mkdirSync(new URL(".", target), { recursive: true })
writeFileSync(target, compileThemeCss(registry, { include: "builtin" }))
console.log(`[generate-style-css] wrote ${target.pathname}`)
