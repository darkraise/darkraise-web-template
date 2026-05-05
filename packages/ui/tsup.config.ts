import { defineConfig } from "tsup"
import { readdirSync } from "node:fs"
import { join } from "node:path"

const componentEntries = Object.fromEntries(
  readdirSync(join(import.meta.dirname, "src/components"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [
      `components/${entry.name}`,
      `src/components/${entry.name}/index.ts`,
    ]),
)

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "hooks/index": "src/hooks/index.ts",
    "theme/index": "src/theme/index.ts",
    "layout/index": "src/layout/index.ts",
    "errors/index": "src/errors/index.ts",
    "router/index": "src/router/index.ts",
    "forms/index": "src/forms/index.ts",
    "data-table/index": "src/data-table/index.ts",
    "lib/index": "src/lib/index.ts",
    ...componentEntries,
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime", "tailwindcss"],
})
