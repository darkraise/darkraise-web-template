import { writeFileSync } from "node:fs"
import { scaffoldAxes } from "../src/theme/axes/scaffoldAxes"

const target = new URL("../../../create-app/bin/axes.json", import.meta.url)
writeFileSync(target, `${JSON.stringify(scaffoldAxes(), null, 2)}\n`)
console.log(`[write-scaffold-axes] wrote ${target.pathname}`)
