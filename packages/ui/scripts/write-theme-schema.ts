import { writeFileSync } from "node:fs"
import { buildThemeJsonSchema } from "../src/theme/config/jsonSchema"

const target = new URL("../dist/theme.schema.json", import.meta.url)
writeFileSync(target, `${JSON.stringify(buildThemeJsonSchema(), null, 2)}\n`)
console.log(`[write-theme-schema] wrote ${target.pathname}`)
