import storybook from "eslint-plugin-storybook"
import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import prettier from "eslint-config-prettier"

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/storybook-static/**",
      "**/.tanstack/**",
      "**/coverage/**",
      "**/routeTree.gen.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  reactHooks.configs.flat.recommended,
  {
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      // React Compiler is not enabled in this project, so its compatibility
      // diagnostics (e.g. TanStack Table/Virtual returning non-memoizable
      // functions) are not actionable here.
      "react-hooks/incompatible-library": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    // TanStack Router file-route modules export a `Route` object and keep
    // their page component local, so the page is never an export. The router
    // Vite plugin handles HMR for these; the rule cannot be satisfied here.
    files: ["apps/template/src/routes/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}", "scripts/**/*.{ts,mts}", "create-app/bin/**"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Type-aware pass: flag usage of @deprecated APIs across typed source.
    // Scoped to package sources (excluding tests/stories, which the
    // tsconfigs exclude from their project) so the parser's project service
    // can resolve every linted file.
    files: ["apps/template/src/**/*.{ts,tsx}", "packages/ui/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "**/*.stories.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "error",
    },
  },
  prettier,
  storybook.configs["flat/recommended"],
)
