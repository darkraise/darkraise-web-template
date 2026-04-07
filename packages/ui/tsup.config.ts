import { defineConfig } from "tsup"
import { readdirSync } from "node:fs"
import { join } from "node:path"

const componentFiles = readdirSync(join(import.meta.dirname, "src/components"))
  .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
  .filter(
    (f) =>
      !f.endsWith(".test.tsx") &&
      !f.endsWith(".test.ts") &&
      !f.endsWith(".stories.tsx"),
  )

const componentEntries = Object.fromEntries(
  componentFiles.map((file) => {
    const name = file.replace(/\.tsx?$/, "")
    return [`components/${name}`, `src/components/${file}`]
  }),
)

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "hooks/index": "src/hooks/index.ts",
    "theme/index": "src/theme/index.ts",
    "layout/index": "src/layout/index.ts",
    "errors/index": "src/errors/index.ts",
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
