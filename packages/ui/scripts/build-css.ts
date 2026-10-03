import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const thisFile = fileURLToPath(import.meta.url)
const packageRoot = resolve(dirname(thisFile), "..")
export const themePath = resolve(packageRoot, "src/styles/theme.css")
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

const ABSOLUTE_IMPORT_RE = /@import\s+(?:url\(\s*)?["']?https?:/
const ABSOLUTE_URL_RE = /url\(\s*["']?(?:https?:)?\/\//i

export function assertFirstParty(css: string): void {
  if (ABSOLUTE_IMPORT_RE.test(css)) {
    throw new Error(
      "build-css: an absolute @import reached the bundle. Consumers must not " +
        "make third-party requests at stylesheet load time.",
    )
  }
  const absolute = css.match(ABSOLUTE_URL_RE)
  if (absolute) {
    throw new Error(
      `build-css: an absolute url() reached the bundle (${absolute[0]}…). ` +
        "Consumers must not make third-party requests at stylesheet load time.",
    )
  }
}

export function buildStylesheet(): string {
  const theme = readFileSync(themePath, "utf8")
  const flat = inlineRelativeImports(theme, themePath)
  assertFirstParty(flat)
  return flat
}

function main() {
  const flat = buildStylesheet()
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, flat)
  console.log(`[build-css] wrote ${outPath} (${flat.length} bytes)`)
}

if (process.argv[1] && resolve(process.argv[1]) === thisFile) {
  main()
}
