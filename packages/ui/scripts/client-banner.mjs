import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { BANNER, listEntries } from "./client-entries.mjs"

// esbuild drops module-level directives when it bundles, so the banner is
// added to each client entry after tsup has written it. Shared chunks stay
// without it: the client boundary is the entry module a consumer imports.
let added = 0
for (const { file, client } of listEntries()) {
  if (!client) continue
  const code = readFileSync(file, "utf8")
  if (code.startsWith(BANNER)) continue
  writeFileSync(file, BANNER + code)
  const mapFile = `${file}.map`
  if (existsSync(mapFile)) {
    // One leading ";" shifts every mapping down by the inserted line.
    const map = JSON.parse(readFileSync(mapFile, "utf8"))
    map.mappings = `;${map.mappings}`
    writeFileSync(mapFile, JSON.stringify(map))
  }
  added += 1
}
console.log(`client-banner: added to ${added} entries`)
