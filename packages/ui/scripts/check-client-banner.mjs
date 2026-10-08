import { readFileSync } from "node:fs"
import { dirname, relative, resolve } from "node:path"
import { BANNER, distDir, listEntries } from "./client-entries.mjs"

const SPECIFIER_RE =
  /(?:\bfrom\s*|\bimport\s*\(\s*|^import\s*)(["'])([^"']+)\1/gm
const REACT_RE = /^react(?:-dom)?(?:\/|$)/

function reactImports(entryFile) {
  const seen = new Set()
  const found = []
  const queue = [entryFile]
  while (queue.length > 0) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    for (const [, , specifier] of readFileSync(file, "utf8").matchAll(
      SPECIFIER_RE,
    )) {
      if (specifier.startsWith(".")) {
        queue.push(resolve(dirname(file), specifier))
      } else if (REACT_RE.test(specifier)) {
        found.push(`${relative(distDir, file)} imports ${specifier}`)
      }
    }
  }
  return found
}

const entries = listEntries()
const problems = []
for (const { file, name, client } of entries) {
  const code = readFileSync(file, "utf8")
  const path = `dist/${name}.js`
  if (client && !code.startsWith(BANNER)) {
    problems.push(`${path}: client entry does not start with "use client"`)
  }
  if (!client) {
    if (code.includes('"use client"')) {
      problems.push(`${path}: server-safe entry carries "use client"`)
    }
    for (const hit of reactImports(file)) {
      problems.push(`${path}: server-safe entry graph reaches React (${hit})`)
    }
  }
}

if (entries.length === 0) {
  problems.push("dist: no entry files found; run the build first")
}

if (problems.length > 0) {
  console.error(problems.join("\n"))
  process.exit(1)
}
console.log(`check-client-banner: ${entries.length} entries ok`)
