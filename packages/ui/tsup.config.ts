import { defineConfig } from "tsup"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const { version } = JSON.parse(
  readFileSync(join(import.meta.dirname, "package.json"), "utf8"),
) as { version: string }

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

export default defineConfig((options) => ({
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
    "labels/index": "src/labels/index.ts",
    "i18n/index": "src/i18n/index.ts",
    "i18n/react-i18next/index": "src/i18n/react-i18next/index.ts",
    "locales/en": "src/locales/en.ts",
    "locales/vi": "src/locales/vi.ts",
    "vite/index": "src/vite/index.ts",
    ...componentEntries,
  },
  define: { __KIT_VERSION__: JSON.stringify(version) },
  format: ["esm"],
  dts: false,
  sourcemap: true,
  // A watch rebuild cleans the whole outDir, which would delete the
  // build:css output (styles.css, fonts) that apps consume from dist.
  clean: !options.watch,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "tailwindcss",
    "recharts",
    "i18next",
    "react-i18next",
    "vite",
  ],
}))
