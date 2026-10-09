import { existsSync, readdirSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

export const BANNER = '"use client";\n'

// DARKRAISE_UI_DIST points the scripts at another build output, which their
// tests use. The name is namespaced because the build shares this module.
export const distDir = process.env.DARKRAISE_UI_DIST
  ? resolve(process.env.DARKRAISE_UI_DIST)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist")

export const SERVER_SAFE_ENTRIES = new Set([
  "lib/index",
  "locales/en",
  "locales/vi",
  "vite/index",
])

const CHUNK_RE = /^chunk-[A-Z0-9]+\.js$/

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return entry.name.endsWith(".js") && !CHUNK_RE.test(entry.name)
      ? [path]
      : []
  })
}

export function listEntries() {
  if (!existsSync(distDir)) return []
  return walk(distDir).map((file) => {
    const name = relative(distDir, file).split(sep).join("/").slice(0, -3)
    return { file, name, client: !SERVER_SAFE_ENTRIES.has(name) }
  })
}
