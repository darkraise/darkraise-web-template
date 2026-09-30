import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const srcDir = resolve(packageRoot, "src")
const distDir = resolve(packageRoot, "dist")

const { paths } = JSON.parse(
  readFileSync(resolve(packageRoot, "tsconfig.json"), "utf8"),
).compilerOptions as { paths: Record<string, [string, ...string[]]> }

const aliases = Object.entries(paths).map(([pattern, [target]]) => ({
  prefix: pattern.replace(/\*$/, ""),
  wildcard: pattern.endsWith("*"),
  target: resolve(
    distDir,
    relative(srcDir, resolve(packageRoot, target.replace(/\*$/, ""))),
  ),
}))

const SPECIFIER_RE = /(\bfrom\s+|\bimport\s*\(\s*|^import\s+)(["'])([^"']+)\2/gm
// The JS bundle already imports the CSS; a declaration file that keeps the
// import fails consumers under TypeScript's noUncheckedSideEffectImports.
const CSS_IMPORT_RE = /^import\s+["'][^"']+\.css["'];?\r?\n/gm

function resolveSpecifier(specifier: string, fromFile: string): string | null {
  const alias = aliases.find((a) =>
    a.wildcard ? specifier.startsWith(a.prefix) : specifier === a.prefix,
  )
  const target = alias
    ? alias.wildcard
      ? join(alias.target, specifier.slice(alias.prefix.length))
      : alias.target
    : specifier.startsWith(".")
      ? resolve(dirname(fromFile), specifier)
      : null
  if (!target) return null
  // tsup writes sibling bundles such as dist/components/card.js, and module
  // resolution prefers that untyped file over card/index.d.ts, so directory
  // imports must name index explicitly.
  const resolved = existsSync(`${target}.d.ts`)
    ? target
    : existsSync(join(target, "index.d.ts"))
      ? join(target, "index")
      : null
  if (!resolved) {
    if (!alias) return null
    throw new Error(`Cannot resolve "${specifier}" in ${fromFile}`)
  }
  const rel = relative(dirname(fromFile), resolved).replaceAll("\\", "/")
  return rel.startsWith(".") ? rel : `./${rel}`
}

function* declarationFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* declarationFiles(path)
    else if (entry.name.endsWith(".d.ts")) yield path
  }
}

let rewritten = 0
for (const file of declarationFiles(distDir)) {
  const source = readFileSync(file, "utf8")
  const output = source
    .replace(CSS_IMPORT_RE, "")
    .replace(
      SPECIFIER_RE,
      (match, lead: string, quote: string, spec: string) => {
        const next = resolveSpecifier(spec, file)
        return next ? `${lead}${quote}${next}${quote}` : match
      },
    )
  if (output !== source) {
    writeFileSync(file, output)
    rewritten++
  }
}
console.log(`[rewrite-dts-imports] rewrote ${rewritten} declaration files`)
