import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const thisFile = fileURLToPath(import.meta.url)
const packageRoot = resolve(dirname(thisFile), "..")
const themePath = resolve(packageRoot, "src/styles/theme.css")
const outPath = resolve(packageRoot, "dist/styles.css")

const RELATIVE_IMPORT_RE = /^@import\s+"((?:\.\.?\/)[^"]+)";\s*$/gm

function inlineRelativeImports(
  source: string,
  fromPath: string,
  seen: ReadonlySet<string> = new Set(),
): string {
  if (seen.has(fromPath)) {
    throw new Error(`CSS import cycle detected: ${fromPath}`)
  }
  const nextSeen = new Set(seen).add(fromPath)
  return source.replace(RELATIVE_IMPORT_RE, (_, importPath: string) => {
    const resolved = resolve(dirname(fromPath), importPath)
    const child = readFileSync(resolved, "utf8")
    return inlineRelativeImports(child, resolved, nextSeen)
  })
}

function main() {
  const theme = readFileSync(themePath, "utf8")
  const flat = inlineRelativeImports(theme, themePath)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, flat)
  console.log(`[build-css] wrote ${outPath} (${flat.length} bytes)`)
}

main()
