# Web Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a consistent, opinionated React frontend starter template for dashboard and SaaS apps with a layered core + feature module architecture.

**Architecture:** Thin core (theme, layout, typography, shared components, hooks, utilities, providers) that every project keeps, plus five opt-in feature modules (auth, data-table, charts, dashboard, forms) that can be removed by deleting their folder. Features depend only on core; features never import from each other (exception: dashboard imports from charts).

**Tech Stack:** Vite + React SWC, TypeScript strict, TanStack Router (file-based), TanStack Query, Zustand, TanStack Form + Zod, shadcn/ui + Tailwind CSS v3, Lucide React, Recharts

**Spec:** `docs/superpowers/specs/2026-04-03-web-template-design.md`

---

## File Structure

```
web-template/
├── .husky/
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
├── .storybook/
│   ├── main.ts
│   └── preview.tsx
├── e2e/
│   └── smoke.spec.ts
├── public/
│   └── (static assets)
├── src/
│   ├── core/
│   │   ├── theme/
│   │   │   ├── primitives.css
│   │   │   ├── themes/
│   │   │   │   ├── default.css
│   │   │   │   ├── emerald.css
│   │   │   │   ├── rose.css
│   │   │   │   ├── amber.css
│   │   │   │   └── violet.css
│   │   │   ├── theme-provider.tsx
│   │   │   ├── theme-switcher.tsx
│   │   │   ├── use-theme.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── sidebar-layout.tsx
│   │   │   ├── top-nav-layout.tsx
│   │   │   ├── stacked-layout.tsx
│   │   │   ├── split-panel-layout.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── search-command.tsx
│   │   │   ├── user-menu.tsx
│   │   │   ├── notification-bell.tsx
│   │   │   ├── mobile-drawer.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   └── ui/              # shadcn/ui components installed via CLI
│   │   ├── hooks/
│   │   │   ├── use-media-query.ts
│   │   │   ├── use-breakpoint.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   ├── api-client.ts
│   │   │   └── index.ts
│   │   └── providers/
│   │       ├── app-providers.tsx
│   │       └── index.ts
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── register-form.tsx
│   │   │   │   ├── forgot-password-form.tsx
│   │   │   │   ├── reset-password-form.tsx
│   │   │   │   └── auth-layout.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-auth.ts
│   │   │   ├── types.ts
│   │   │   ├── adapter.ts
│   │   │   ├── store.ts
│   │   │   └── index.ts
│   │   ├── data-table/
│   │   │   ├── components/
│   │   │   │   ├── data-table.tsx
│   │   │   │   ├── column-header.tsx
│   │   │   │   ├── data-table-toolbar.tsx
│   │   │   │   ├── data-table-pagination.tsx
│   │   │   │   ├── column-visibility.tsx
│   │   │   │   ├── row-actions.tsx
│   │   │   │   ├── data-table-skeleton.tsx
│   │   │   │   └── data-table-empty.tsx
│   │   │   ├── types.ts
│   │   │   ├── export-csv.ts
│   │   │   └── index.ts
│   │   ├── charts/
│   │   │   ├── components/
│   │   │   │   ├── area-chart.tsx
│   │   │   │   ├── bar-chart.tsx
│   │   │   │   ├── line-chart.tsx
│   │   │   │   ├── pie-chart.tsx
│   │   │   │   ├── chart-card.tsx
│   │   │   │   └── chart-tooltip.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-chart-colors.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── stat-card.tsx
│   │   │   │   ├── kpi-card.tsx
│   │   │   │   ├── activity-feed.tsx
│   │   │   │   ├── progress-card.tsx
│   │   │   │   └── metric-grid.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── forms/
│   │       ├── components/
│   │       │   ├── field-wrapper.tsx
│   │       │   ├── text-field.tsx
│   │       │   ├── textarea-field.tsx
│   │       │   ├── number-field.tsx
│   │       │   ├── select-field.tsx
│   │       │   ├── combobox-field.tsx
│   │       │   ├── multi-select-field.tsx
│   │       │   ├── checkbox-field.tsx
│   │       │   ├── radio-group-field.tsx
│   │       │   ├── switch-field.tsx
│   │       │   ├── date-picker-field.tsx
│   │       │   ├── date-range-field.tsx
│   │       │   ├── file-upload-field.tsx
│   │       │   ├── form-section.tsx
│   │       │   └── form-actions.tsx
│   │       ├── types.ts
│   │       └── index.ts
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── _authenticated.tsx
│   │   ├── _authenticated/
│   │   │   ├── index.tsx
│   │   │   └── settings.tsx
│   │   ├── _guest.tsx
│   │   └── _guest/
│   │       ├── login.tsx
│   │       ├── register.tsx
│   │       ├── forgot-password.tsx
│   │       └── reset-password.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── app.tsx
│   ├── main.tsx
│   ├── routeTree.gen.ts          # auto-generated by TanStack Router plugin
│   └── env.d.ts
├── .gitignore
├── .prettierrc
├── .prettierignore
├── commitlint.config.ts
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Phase 1: Foundation

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/app.tsx`, `src/env.d.ts`, `postcss.config.js`, `tailwind.config.ts`, `.gitignore`

- [ ] **Step 1: Initialize the project with Vite**

```bash
cd "D:/Repositories/_local_projects/web-template"
npm create vite@latest . -- --template react-swc-ts
```

Select "Ignore files and continue" if prompted about non-empty directory.

- [ ] **Step 2: Install core dependencies**

```bash
npm install @tanstack/react-router @tanstack/react-query @tanstack/react-form @tanstack/react-table zustand zod recharts lucide-react
npm install -D @tanstack/router-plugin tailwindcss@3 postcss autoprefixer @types/node
```

- [ ] **Step 3: Initialize Tailwind CSS**

```bash
npx tailwindcss init -p --ts
```

- [ ] **Step 4: Configure tailwind.config.ts with font stack, animations, and path aliases**

Replace `tailwind.config.ts` with:

```typescript
import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"
import tailwindAnimate from "tailwindcss-animate"

const config: Config = {
  darkMode: ["selector", '[data-mode="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        mono: ["JetBrains Mono", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--surface-sidebar))",
        },
        surface: {
          base: "hsl(var(--surface-base))",
          raised: "hsl(var(--surface-raised))",
          overlay: "hsl(var(--surface-overlay))",
          sunken: "hsl(var(--surface-sunken))",
          sidebar: "hsl(var(--surface-sidebar))",
          header: "hsl(var(--surface-header))",
        },
        "border-subtle": "hsl(var(--border-subtle))",
        "border-default": "hsl(var(--border-default))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "animate-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "animate-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        in: "animate-in 200ms ease-out",
        out: "animate-out 150ms ease-in",
        "slide-in-right": "slide-in-right 200ms ease-out",
        "slide-in-bottom": "slide-in-bottom 200ms ease-out",
        "accordion-down": "accordion-down 200ms ease-out",
        "accordion-up": "accordion-up 200ms ease-in",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindAnimate],
}

export default config
```

- [ ] **Step 5: Install tailwindcss-animate**

```bash
npm install tailwindcss-animate
```

- [ ] **Step 6: Configure Vite with path aliases and TanStack Router plugin**

Replace `vite.config.ts` with:

```typescript
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import path from "node:path"

export default defineConfig({
  plugins: [
    tanstackRouter({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 7: Configure TypeScript with strict mode and path aliases**

Replace `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "env.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Replace `tsconfig.node.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": [
    "vite.config.ts",
    "tailwind.config.ts",
    "eslint.config.js",
    "commitlint.config.ts",
    "vitest.config.ts",
    "playwright.config.ts"
  ]
}
```

- [ ] **Step 8: Create env.d.ts**

Create `src/env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 9: Create globals.css with theme token structure**

Create `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  h1, h2, h3 {
    @apply tracking-tight;
  }
}
```

- [ ] **Step 10: Create minimal app.tsx and main.tsx**

Create `src/app.tsx`:

```tsx
export function App() {
  return <div>Web Template</div>
}
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./app"
import "./styles/globals.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 11: Update index.html**

Replace `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web Template</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <script>
      (function () {
        const theme = localStorage.getItem("theme") || "default";
        const mode = localStorage.getItem("mode") || "system";
        const resolved = mode === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
          : mode;
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-mode", resolved);
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 12: Update .gitignore**

Replace `.gitignore` with:

```
node_modules
dist
dist-ssr
*.local
.env
.env.*
!.env.example
*.tsbuildinfo
coverage
test-results
playwright-report
storybook-static
src/routeTree.gen.ts
.superpowers
```

- [ ] **Step 13: Verify the dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts without errors on http://localhost:5173.

- [ ] **Step 14: Initialize git and commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite + React + TypeScript + Tailwind project"
```

---

### Task 2: Configure ESLint + Prettier + Git hooks

**Files:**
- Create: `eslint.config.js`, `.prettierrc`, `.prettierignore`, `commitlint.config.ts`, `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`

- [ ] **Step 1: Install ESLint + Prettier dependencies**

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-config-prettier prettier
```

- [ ] **Step 2: Create eslint.config.js**

Create `eslint.config.js`:

```javascript
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import prettier from "eslint-config-prettier"

export default tseslint.config(
  { ignores: ["dist", "src/routeTree.gen.ts"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  prettier,
)
```

- [ ] **Step 3: Create .prettierrc and .prettierignore**

Create `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Create `.prettierignore`:

```
dist
node_modules
src/routeTree.gen.ts
coverage
storybook-static
pnpm-lock.yaml
```

- [ ] **Step 4: Install Prettier Tailwind plugin**

```bash
npm install -D prettier-plugin-tailwindcss
```

- [ ] **Step 5: Install Husky + lint-staged + commitlint**

```bash
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
```

- [ ] **Step 6: Create commitlint.config.ts**

Create `commitlint.config.ts`:

```typescript
export default {
  extends: ["@commitlint/config-conventional"],
}
```

- [ ] **Step 7: Configure lint-staged in package.json**

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

- [ ] **Step 8: Configure Husky hooks**

Create `.husky/pre-commit`:

```bash
npx lint-staged
```

Create `.husky/commit-msg`:

```bash
npx --no -- commitlint --edit "$1"
```

Create `.husky/pre-push`:

```bash
npx tsc --noEmit
```

- [ ] **Step 9: Add scripts to package.json**

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "typecheck": "tsc --noEmit",
    "build:analyze": "vite build --mode analyze"
  }
}
```

- [ ] **Step 10: Verify lint and format work**

```bash
npm run lint
npm run format
```

Expected: No errors. Files formatted.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "chore: configure ESLint, Prettier, Husky, and commitlint"
```

---

### Task 3: Configure Vitest + Playwright

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`, `src/test/setup.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test
```

- [ ] **Step 2: Create vitest.config.ts**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react-swc"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/routeTree.gen.ts",
        "src/test/**",
        "src/**/*.stories.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 3: Create test setup file**

Create `src/test/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 4: Create playwright.config.ts**

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 5: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 6: Add test scripts to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ci": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 7: Create a smoke E2E test**

Create `e2e/smoke.spec.ts`:

```typescript
import { test, expect } from "@playwright/test"

test("app loads", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle("Web Template")
})
```

- [ ] **Step 8: Verify tests run**

```bash
npm run test -- --run
npm run test:e2e
```

Expected: Vitest finds 0 tests (no unit tests yet). Playwright smoke test passes.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "chore: configure Vitest and Playwright"
```

---

### Task 4: Configure Storybook

**Files:**
- Create: `.storybook/main.ts`, `.storybook/preview.tsx`

- [ ] **Step 1: Initialize Storybook**

```bash
npx storybook@latest init --builder vite --skip-install
npm install
```

- [ ] **Step 2: Replace .storybook/main.ts**

Replace `.storybook/main.ts` with:

```typescript
import type { StorybookConfig } from "@storybook/react-vite"
import path from "node:path"

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "../src"),
    }
    return config
  },
}

export default config
```

- [ ] **Step 3: Replace .storybook/preview.tsx**

Replace `.storybook/preview.tsx` (or create if `.storybook/preview.ts` exists — rename it) with:

```tsx
import type { Preview } from "@storybook/react"
import "../src/styles/globals.css"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: ["default", "emerald", "rose", "amber", "violet"],
        dynamicTitle: true,
      },
    },
    mode: {
      description: "Light or dark mode",
      toolbar: {
        title: "Mode",
        icon: "moon",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "default",
    mode: "light",
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "default"
      const mode = context.globals.mode || "light"
      document.documentElement.setAttribute("data-theme", theme)
      document.documentElement.setAttribute("data-mode", mode)
      return <Story />
    },
  ],
}

export default preview
```

- [ ] **Step 4: Add Storybook scripts to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build:storybook": "storybook build"
  }
}
```

- [ ] **Step 5: Remove any default Storybook example stories**

Delete any files in `src/stories/` that Storybook init may have created.

- [ ] **Step 6: Verify Storybook starts**

```bash
npm run storybook
```

Expected: Storybook opens in browser on port 6006. No stories shown yet (that's fine).

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: configure Storybook with theme and mode toolbar"
```

---

## Phase 2: Core Theme System

### Task 5: Initialize shadcn/ui and install base components

**Files:**
- Create: `components.json`, `src/core/lib/utils.ts`
- Install components into: `src/core/components/ui/`

- [ ] **Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes
- CSS file: `src/styles/globals.css`
- Tailwind config: `tailwind.config.ts`
- Components alias: `@/core/components`
- Utils alias: `@/core/lib/utils`
- React Server Components: No

- [ ] **Step 2: Verify components.json was created**

Check that `components.json` exists and the aliases point to `@/core/components` and `@/core/lib/utils`.

- [ ] **Step 3: Install essential shadcn/ui components**

```bash
npx shadcn@latest add button input label badge separator card dialog dropdown-menu popover command tooltip sheet tabs avatar scroll-area select checkbox switch radio-group textarea accordion skeleton sonner
```

- [ ] **Step 4: Verify components installed in correct directory**

Run: `ls src/core/components/ui/`

Expected: All installed component files present (button.tsx, input.tsx, label.tsx, etc.).

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(core): initialize shadcn/ui and install base components"
```

---

### Task 6: Create theme token CSS and five color themes

**Files:**
- Create: `src/core/theme/primitives.css`, `src/core/theme/themes/default.css`, `src/core/theme/themes/emerald.css`, `src/core/theme/themes/rose.css`, `src/core/theme/themes/amber.css`, `src/core/theme/themes/violet.css`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Create primitives.css with raw HSL palette**

Create `src/core/theme/primitives.css`:

```css
:root {
  /* Gray */
  --gray-50: 210 40% 98%;
  --gray-100: 210 40% 96%;
  --gray-200: 214 32% 91%;
  --gray-300: 213 27% 84%;
  --gray-400: 215 20% 65%;
  --gray-500: 215 16% 47%;
  --gray-600: 215 19% 35%;
  --gray-700: 215 25% 27%;
  --gray-800: 217 33% 17%;
  --gray-900: 222 47% 11%;
  --gray-950: 229 84% 5%;

  /* Blue */
  --blue-50: 214 100% 97%;
  --blue-100: 214 95% 93%;
  --blue-200: 213 97% 87%;
  --blue-300: 212 96% 78%;
  --blue-400: 213 94% 68%;
  --blue-500: 217 91% 60%;
  --blue-600: 221 83% 53%;
  --blue-700: 224 76% 48%;
  --blue-800: 226 71% 40%;
  --blue-900: 224 64% 33%;
  --blue-950: 226 57% 21%;

  /* Green */
  --green-50: 152 81% 96%;
  --green-100: 149 80% 90%;
  --green-200: 152 76% 80%;
  --green-300: 156 72% 67%;
  --green-400: 158 64% 52%;
  --green-500: 160 84% 39%;
  --green-600: 161 94% 30%;
  --green-700: 163 94% 24%;
  --green-800: 163 88% 20%;
  --green-900: 164 86% 16%;
  --green-950: 166 91% 9%;

  /* Red */
  --red-50: 355 100% 97%;
  --red-100: 356 100% 95%;
  --red-200: 353 96% 90%;
  --red-300: 354 96% 82%;
  --red-400: 351 95% 71%;
  --red-500: 349 89% 60%;
  --red-600: 346 77% 50%;
  --red-700: 345 83% 41%;
  --red-800: 343 80% 35%;
  --red-900: 342 75% 30%;
  --red-950: 343 88% 16%;

  /* Amber */
  --amber-50: 48 100% 96%;
  --amber-100: 48 96% 89%;
  --amber-200: 48 97% 77%;
  --amber-300: 46 97% 65%;
  --amber-400: 43 96% 56%;
  --amber-500: 38 92% 50%;
  --amber-600: 32 95% 44%;
  --amber-700: 26 90% 37%;
  --amber-800: 23 83% 31%;
  --amber-900: 22 78% 26%;
  --amber-950: 21 92% 14%;

  /* Violet */
  --violet-50: 250 100% 98%;
  --violet-100: 251 91% 95%;
  --violet-200: 251 95% 92%;
  --violet-300: 252 95% 85%;
  --violet-400: 255 92% 76%;
  --violet-500: 258 90% 66%;
  --violet-600: 262 83% 58%;
  --violet-700: 263 70% 50%;
  --violet-800: 263 69% 42%;
  --violet-900: 264 67% 35%;
  --violet-950: 261 73% 23%;

  /* Rose */
  --rose-50: 356 100% 97%;
  --rose-100: 356 100% 95%;
  --rose-200: 353 96% 90%;
  --rose-300: 353 95% 82%;
  --rose-400: 351 95% 71%;
  --rose-500: 350 89% 60%;
  --rose-600: 347 77% 50%;
  --rose-700: 345 83% 41%;
  --rose-800: 343 80% 35%;
  --rose-900: 342 75% 30%;
  --rose-950: 343 88% 16%;

  --radius: 0.5rem;
}
```

- [ ] **Step 2: Create default (blue) theme**

Create `src/core/theme/themes/default.css`:

```css
[data-theme="default"] {
  --primary: var(--blue-500);
  --primary-foreground: 0 0% 100%;

  --chart-1: var(--blue-500);
  --chart-2: var(--green-500);
  --chart-3: var(--amber-500);
  --chart-4: var(--violet-500);
  --chart-5: var(--red-500);
}

[data-theme="default"][data-mode="light"] {
  --background: var(--gray-50);
  --foreground: var(--gray-900);

  --card: var(--gray-50);
  --card-foreground: var(--gray-900);
  --popover: 0 0% 100%;
  --popover-foreground: var(--gray-900);

  --secondary: var(--gray-100);
  --secondary-foreground: var(--gray-900);
  --muted: var(--gray-100);
  --muted-foreground: var(--gray-500);
  --accent: var(--gray-100);
  --accent-foreground: var(--gray-900);
  --destructive: var(--red-500);
  --destructive-foreground: 0 0% 100%;

  --border: var(--gray-200);
  --input: var(--gray-200);
  --ring: var(--blue-500);

  --surface-base: var(--gray-50);
  --surface-raised: 0 0% 100%;
  --surface-overlay: 0 0% 100%;
  --surface-sunken: var(--gray-100);
  --surface-sidebar: var(--gray-900);
  --surface-header: 0 0% 100%;
  --border-subtle: var(--gray-100);
  --border-default: var(--gray-200);
}

[data-theme="default"][data-mode="dark"] {
  --background: var(--gray-950);
  --foreground: var(--gray-50);

  --card: var(--gray-900);
  --card-foreground: var(--gray-50);
  --popover: var(--gray-900);
  --popover-foreground: var(--gray-50);

  --secondary: var(--gray-800);
  --secondary-foreground: var(--gray-50);
  --muted: var(--gray-800);
  --muted-foreground: var(--gray-400);
  --accent: var(--gray-800);
  --accent-foreground: var(--gray-50);
  --destructive: var(--red-600);
  --destructive-foreground: 0 0% 100%;

  --border: var(--gray-800);
  --input: var(--gray-800);
  --ring: var(--blue-400);

  --surface-base: var(--gray-950);
  --surface-raised: var(--gray-900);
  --surface-overlay: var(--gray-800);
  --surface-sunken: 229 84% 3%;
  --surface-sidebar: var(--gray-950);
  --surface-header: var(--gray-900);
  --border-subtle: var(--gray-800);
  --border-default: var(--gray-700);
}
```

- [ ] **Step 3: Create emerald theme**

Create `src/core/theme/themes/emerald.css`:

```css
[data-theme="emerald"] {
  --primary: var(--green-500);
  --primary-foreground: 0 0% 100%;

  --chart-1: var(--green-500);
  --chart-2: var(--blue-500);
  --chart-3: var(--amber-500);
  --chart-4: var(--violet-500);
  --chart-5: var(--red-500);
}

[data-theme="emerald"][data-mode="light"] {
  --background: var(--gray-50);
  --foreground: var(--gray-900);
  --card: var(--gray-50);
  --card-foreground: var(--gray-900);
  --popover: 0 0% 100%;
  --popover-foreground: var(--gray-900);
  --secondary: var(--gray-100);
  --secondary-foreground: var(--gray-900);
  --muted: var(--gray-100);
  --muted-foreground: var(--gray-500);
  --accent: var(--green-50);
  --accent-foreground: var(--green-900);
  --destructive: var(--red-500);
  --destructive-foreground: 0 0% 100%;
  --border: var(--gray-200);
  --input: var(--gray-200);
  --ring: var(--green-500);
  --surface-base: var(--gray-50);
  --surface-raised: 0 0% 100%;
  --surface-overlay: 0 0% 100%;
  --surface-sunken: var(--gray-100);
  --surface-sidebar: var(--green-950);
  --surface-header: 0 0% 100%;
  --border-subtle: var(--gray-100);
  --border-default: var(--gray-200);
}

[data-theme="emerald"][data-mode="dark"] {
  --background: var(--gray-950);
  --foreground: var(--gray-50);
  --card: var(--gray-900);
  --card-foreground: var(--gray-50);
  --popover: var(--gray-900);
  --popover-foreground: var(--gray-50);
  --secondary: var(--gray-800);
  --secondary-foreground: var(--gray-50);
  --muted: var(--gray-800);
  --muted-foreground: var(--gray-400);
  --accent: var(--green-950);
  --accent-foreground: var(--green-50);
  --destructive: var(--red-600);
  --destructive-foreground: 0 0% 100%;
  --border: var(--gray-800);
  --input: var(--gray-800);
  --ring: var(--green-400);
  --surface-base: var(--gray-950);
  --surface-raised: var(--gray-900);
  --surface-overlay: var(--gray-800);
  --surface-sunken: 229 84% 3%;
  --surface-sidebar: var(--green-950);
  --surface-header: var(--gray-900);
  --border-subtle: var(--gray-800);
  --border-default: var(--gray-700);
}
```

- [ ] **Step 4: Create rose theme**

Create `src/core/theme/themes/rose.css`:

```css
[data-theme="rose"] {
  --primary: var(--rose-500);
  --primary-foreground: 0 0% 100%;

  --chart-1: var(--rose-500);
  --chart-2: var(--blue-500);
  --chart-3: var(--amber-500);
  --chart-4: var(--green-500);
  --chart-5: var(--violet-500);
}

[data-theme="rose"][data-mode="light"] {
  --background: var(--gray-50);
  --foreground: var(--gray-900);
  --card: var(--gray-50);
  --card-foreground: var(--gray-900);
  --popover: 0 0% 100%;
  --popover-foreground: var(--gray-900);
  --secondary: var(--gray-100);
  --secondary-foreground: var(--gray-900);
  --muted: var(--gray-100);
  --muted-foreground: var(--gray-500);
  --accent: var(--rose-50);
  --accent-foreground: var(--rose-900);
  --destructive: var(--red-500);
  --destructive-foreground: 0 0% 100%;
  --border: var(--gray-200);
  --input: var(--gray-200);
  --ring: var(--rose-500);
  --surface-base: var(--gray-50);
  --surface-raised: 0 0% 100%;
  --surface-overlay: 0 0% 100%;
  --surface-sunken: var(--gray-100);
  --surface-sidebar: var(--rose-950);
  --surface-header: 0 0% 100%;
  --border-subtle: var(--gray-100);
  --border-default: var(--gray-200);
}

[data-theme="rose"][data-mode="dark"] {
  --background: var(--gray-950);
  --foreground: var(--gray-50);
  --card: var(--gray-900);
  --card-foreground: var(--gray-50);
  --popover: var(--gray-900);
  --popover-foreground: var(--gray-50);
  --secondary: var(--gray-800);
  --secondary-foreground: var(--gray-50);
  --muted: var(--gray-800);
  --muted-foreground: var(--gray-400);
  --accent: var(--rose-950);
  --accent-foreground: var(--rose-50);
  --destructive: var(--red-600);
  --destructive-foreground: 0 0% 100%;
  --border: var(--gray-800);
  --input: var(--gray-800);
  --ring: var(--rose-400);
  --surface-base: var(--gray-950);
  --surface-raised: var(--gray-900);
  --surface-overlay: var(--gray-800);
  --surface-sunken: 229 84% 3%;
  --surface-sidebar: var(--rose-950);
  --surface-header: var(--gray-900);
  --border-subtle: var(--gray-800);
  --border-default: var(--gray-700);
}
```

- [ ] **Step 5: Create amber theme**

Create `src/core/theme/themes/amber.css`:

```css
[data-theme="amber"] {
  --primary: var(--amber-500);
  --primary-foreground: var(--amber-950);

  --chart-1: var(--amber-500);
  --chart-2: var(--blue-500);
  --chart-3: var(--green-500);
  --chart-4: var(--violet-500);
  --chart-5: var(--red-500);
}

[data-theme="amber"][data-mode="light"] {
  --background: var(--gray-50);
  --foreground: var(--gray-900);
  --card: var(--gray-50);
  --card-foreground: var(--gray-900);
  --popover: 0 0% 100%;
  --popover-foreground: var(--gray-900);
  --secondary: var(--gray-100);
  --secondary-foreground: var(--gray-900);
  --muted: var(--gray-100);
  --muted-foreground: var(--gray-500);
  --accent: var(--amber-50);
  --accent-foreground: var(--amber-900);
  --destructive: var(--red-500);
  --destructive-foreground: 0 0% 100%;
  --border: var(--gray-200);
  --input: var(--gray-200);
  --ring: var(--amber-500);
  --surface-base: var(--gray-50);
  --surface-raised: 0 0% 100%;
  --surface-overlay: 0 0% 100%;
  --surface-sunken: var(--gray-100);
  --surface-sidebar: var(--amber-950);
  --surface-header: 0 0% 100%;
  --border-subtle: var(--gray-100);
  --border-default: var(--gray-200);
}

[data-theme="amber"][data-mode="dark"] {
  --background: var(--gray-950);
  --foreground: var(--gray-50);
  --card: var(--gray-900);
  --card-foreground: var(--gray-50);
  --popover: var(--gray-900);
  --popover-foreground: var(--gray-50);
  --secondary: var(--gray-800);
  --secondary-foreground: var(--gray-50);
  --muted: var(--gray-800);
  --muted-foreground: var(--gray-400);
  --accent: var(--amber-950);
  --accent-foreground: var(--amber-50);
  --destructive: var(--red-600);
  --destructive-foreground: 0 0% 100%;
  --border: var(--gray-800);
  --input: var(--gray-800);
  --ring: var(--amber-400);
  --surface-base: var(--gray-950);
  --surface-raised: var(--gray-900);
  --surface-overlay: var(--gray-800);
  --surface-sunken: 229 84% 3%;
  --surface-sidebar: var(--amber-950);
  --surface-header: var(--gray-900);
  --border-subtle: var(--gray-800);
  --border-default: var(--gray-700);
}
```

- [ ] **Step 6: Create violet theme**

Create `src/core/theme/themes/violet.css`:

```css
[data-theme="violet"] {
  --primary: var(--violet-500);
  --primary-foreground: 0 0% 100%;

  --chart-1: var(--violet-500);
  --chart-2: var(--blue-500);
  --chart-3: var(--green-500);
  --chart-4: var(--amber-500);
  --chart-5: var(--red-500);
}

[data-theme="violet"][data-mode="light"] {
  --background: var(--gray-50);
  --foreground: var(--gray-900);
  --card: var(--gray-50);
  --card-foreground: var(--gray-900);
  --popover: 0 0% 100%;
  --popover-foreground: var(--gray-900);
  --secondary: var(--gray-100);
  --secondary-foreground: var(--gray-900);
  --muted: var(--gray-100);
  --muted-foreground: var(--gray-500);
  --accent: var(--violet-50);
  --accent-foreground: var(--violet-900);
  --destructive: var(--red-500);
  --destructive-foreground: 0 0% 100%;
  --border: var(--gray-200);
  --input: var(--gray-200);
  --ring: var(--violet-500);
  --surface-base: var(--gray-50);
  --surface-raised: 0 0% 100%;
  --surface-overlay: 0 0% 100%;
  --surface-sunken: var(--gray-100);
  --surface-sidebar: var(--violet-950);
  --surface-header: 0 0% 100%;
  --border-subtle: var(--gray-100);
  --border-default: var(--gray-200);
}

[data-theme="violet"][data-mode="dark"] {
  --background: var(--gray-950);
  --foreground: var(--gray-50);
  --card: var(--gray-900);
  --card-foreground: var(--gray-50);
  --popover: var(--gray-900);
  --popover-foreground: var(--gray-50);
  --secondary: var(--gray-800);
  --secondary-foreground: var(--gray-50);
  --muted: var(--gray-800);
  --muted-foreground: var(--gray-400);
  --accent: var(--violet-950);
  --accent-foreground: var(--violet-50);
  --destructive: var(--red-600);
  --destructive-foreground: 0 0% 100%;
  --border: var(--gray-800);
  --input: var(--gray-800);
  --ring: var(--violet-400);
  --surface-base: var(--gray-950);
  --surface-raised: var(--gray-900);
  --surface-overlay: var(--gray-800);
  --surface-sunken: 229 84% 3%;
  --surface-sidebar: var(--violet-950);
  --surface-header: var(--gray-900);
  --border-subtle: var(--gray-800);
  --border-default: var(--gray-700);
}
```

- [ ] **Step 7: Update globals.css to import theme CSS files**

Replace `src/styles/globals.css` with:

```css
@import "../core/theme/primitives.css";
@import "../core/theme/themes/default.css";
@import "../core/theme/themes/emerald.css";
@import "../core/theme/themes/rose.css";
@import "../core/theme/themes/amber.css";
@import "../core/theme/themes/violet.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  h1, h2, h3 {
    @apply tracking-tight;
  }
}
```

- [ ] **Step 8: Verify the dev server still starts with themes applied**

```bash
npm run dev
```

Expected: Dev server starts. The page should show the "Web Template" text with theme colors applied.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat(core): add three-layer theme tokens and five color themes"
```

---

### Task 7: Build theme provider, useTheme hook, and ThemeSwitcher

**Files:**
- Create: `src/core/theme/types.ts`, `src/core/theme/use-theme.ts`, `src/core/theme/theme-provider.tsx`, `src/core/theme/theme-switcher.tsx`, `src/core/theme/index.ts`
- Test: `src/core/theme/use-theme.test.ts`

- [ ] **Step 1: Write the test for useTheme**

Create `src/core/theme/use-theme.test.ts`:

```typescript
import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { useTheme } from "./use-theme"
import { ThemeProvider } from "./theme-provider"
import type { ReactNode } from "react"

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute("data-theme")
    document.documentElement.removeAttribute("data-mode")
  })

  it("returns default theme and light mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("default")
    expect(result.current.mode).toBe("system")
  })

  it("setTheme updates theme attribute", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme("emerald"))
    expect(result.current.theme).toBe("emerald")
    expect(document.documentElement.getAttribute("data-theme")).toBe("emerald")
  })

  it("setMode updates mode attribute", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setMode("dark"))
    expect(result.current.mode).toBe("dark")
    expect(document.documentElement.getAttribute("data-mode")).toBe("dark")
  })

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme("rose"))
    expect(localStorage.getItem("theme")).toBe("rose")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/core/theme/use-theme.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create theme types**

Create `src/core/theme/types.ts`:

```typescript
export const THEMES = ["default", "emerald", "rose", "amber", "violet"] as const
export type Theme = (typeof THEMES)[number]

export const MODES = ["light", "dark", "system"] as const
export type Mode = (typeof MODES)[number]

export type ResolvedMode = "light" | "dark"

export interface ThemeContextValue {
  theme: Theme
  mode: Mode
  resolvedMode: ResolvedMode
  setTheme: (theme: Theme) => void
  setMode: (mode: Mode) => void
}
```

- [ ] **Step 4: Create useTheme hook**

Create `src/core/theme/use-theme.ts`:

```typescript
import { useContext } from "react"
import { ThemeContext } from "./theme-provider"
import type { ThemeContextValue } from "./types"

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
```

- [ ] **Step 5: Create ThemeProvider**

Create `src/core/theme/theme-provider.tsx`:

```tsx
import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import type { Theme, Mode, ResolvedMode, ThemeContextValue } from "./types"

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemMode(): ResolvedMode {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function resolveMode(mode: Mode): ResolvedMode {
  return mode === "system" ? getSystemMode() : mode
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme")
    return (stored as Theme) || "default"
  })

  const [mode, setModeState] = useState<Mode>(() => {
    const stored = localStorage.getItem("mode")
    return (stored as Mode) || "system"
  })

  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(() =>
    resolveMode(mode),
  )

  const applyTheme = useCallback((t: Theme, m: ResolvedMode) => {
    document.documentElement.setAttribute("data-theme", t)
    document.documentElement.setAttribute("data-mode", m)
  }, [])

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t)
      localStorage.setItem("theme", t)
      applyTheme(t, resolvedMode)
    },
    [applyTheme, resolvedMode],
  )

  const setMode = useCallback(
    (m: Mode) => {
      const resolved = resolveMode(m)
      setModeState(m)
      setResolvedMode(resolved)
      localStorage.setItem("mode", m)
      applyTheme(theme, resolved)
    },
    [applyTheme, theme],
  )

  useEffect(() => {
    applyTheme(theme, resolvedMode)
  }, [applyTheme, theme, resolvedMode])

  useEffect(() => {
    if (mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const resolved = getSystemMode()
      setResolvedMode(resolved)
      applyTheme(theme, resolved)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [mode, theme, applyTheme])

  const value = useMemo(
    () => ({ theme, mode, resolvedMode, setTheme, setMode }),
    [theme, mode, resolvedMode, setTheme, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
```

- [ ] **Step 6: Create ThemeSwitcher component**

Create `src/core/theme/theme-switcher.tsx`:

```tsx
import { Moon, Sun, Monitor, Palette } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { useTheme } from "./use-theme"
import { THEMES, MODES } from "./types"
import type { Mode } from "./types"

const modeIcons: Record<Mode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function ThemeSwitcher() {
  const { theme, mode, setTheme, setMode } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mode</DropdownMenuLabel>
        {MODES.map((m) => {
          const Icon = modeIcons[m]
          return (
            <DropdownMenuItem
              key={m}
              onClick={() => setMode(m)}
              className={mode === m ? "bg-accent" : ""}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span className="capitalize">{m}</span>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color</DropdownMenuLabel>
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t}
            onClick={() => setTheme(t)}
            className={theme === t ? "bg-accent" : ""}
          >
            <span className="capitalize">{t}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 7: Create barrel export**

Create `src/core/theme/index.ts`:

```typescript
export { ThemeProvider } from "./theme-provider"
export { ThemeSwitcher } from "./theme-switcher"
export { useTheme } from "./use-theme"
export { THEMES, MODES } from "./types"
export type { Theme, Mode, ResolvedMode, ThemeContextValue } from "./types"
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run src/core/theme/use-theme.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat(core): add ThemeProvider, useTheme hook, and ThemeSwitcher component"
```

---

## Phase 3: Core Utilities and Providers

### Task 8: Create core hooks, lib, and providers

**Files:**
- Create: `src/core/hooks/use-media-query.ts`, `src/core/hooks/use-breakpoint.ts`, `src/core/hooks/index.ts`, `src/core/lib/api-client.ts`, `src/core/lib/index.ts`, `src/core/providers/app-providers.tsx`, `src/core/providers/index.ts`
- Test: `src/core/hooks/use-media-query.test.ts`

- [ ] **Step 1: Write test for useMediaQuery**

Create `src/core/hooks/use-media-query.test.ts`:

```typescript
import { renderHook } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useMediaQuery } from "./use-media-query"

describe("useMediaQuery", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns false when media query does not match", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"))
    expect(result.current).toBe(false)
  })

  it("returns true when media query matches", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"))
    expect(result.current).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/core/hooks/use-media-query.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create useMediaQuery hook**

Create `src/core/hooks/use-media-query.ts`:

```typescript
import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener("change", handler)
    setMatches(mq.matches)
    return () => mq.removeEventListener("change", handler)
  }, [query])

  return matches
}
```

- [ ] **Step 4: Create useBreakpoint hook**

Create `src/core/hooks/use-breakpoint.ts`:

```typescript
import { useMediaQuery } from "./use-media-query"

const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const

type Breakpoint = keyof typeof breakpoints

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]})`)
}
```

- [ ] **Step 5: Create hooks barrel export**

Create `src/core/hooks/index.ts`:

```typescript
export { useMediaQuery } from "./use-media-query"
export { useBreakpoint } from "./use-breakpoint"
```

- [ ] **Step 6: Create api-client**

Create `src/core/lib/api-client.ts`:

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ""
  const { body, headers: customHeaders, ...rest } = options

  const token = localStorage.getItem("auth-token")

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  }

  if (token) {
    ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await response.text())
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}
```

- [ ] **Step 7: Create lib barrel export**

Create `src/core/lib/index.ts`:

```typescript
export { cn } from "./utils"
export { apiClient, ApiError } from "./api-client"
```

- [ ] **Step 8: Create AppProviders**

Create `src/core/providers/app-providers.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/core/theme"
import { Toaster } from "@/core/components/ui/sonner"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

Create `src/core/providers/index.ts`:

```typescript
export { AppProviders } from "./app-providers"
```

- [ ] **Step 9: Run tests**

```bash
npx vitest run src/core/hooks/use-media-query.test.ts
```

Expected: All tests PASS.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat(core): add hooks, api-client, and AppProviders"
```

---

## Phase 4: Core Layout System

### Task 9: Create layout types, PageHeader, and shared layout components

**Files:**
- Create: `src/core/layout/types.ts`, `src/core/layout/page-header.tsx`, `src/core/layout/search-command.tsx`, `src/core/layout/user-menu.tsx`, `src/core/layout/notification-bell.tsx`, `src/core/layout/mobile-drawer.tsx`, `src/core/layout/index.ts`

- [ ] **Step 1: Create layout types**

Create `src/core/layout/types.ts`:

```typescript
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
  badge?: string
  children?: NavItem[]
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export interface LayoutProps {
  children: ReactNode
  nav: NavGroup[]
  headerSlot?: ReactNode
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface TabItem {
  label: string
  value: string
  href: string
}

export interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
  title: string
  description?: string
  actions?: ReactNode
  tabs?: TabItem[]
}
```

- [ ] **Step 2: Create PageHeader component**

Create `src/core/layout/page-header.tsx`:

```tsx
import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import type { PageHeaderProps } from "./types"

export function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
  tabs,
}: PageHeaderProps) {
  return (
    <div className="space-y-4 pb-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="transition-colors duration-150 hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {tabs && tabs.length > 0 && (
        <nav className="flex gap-4 border-b border-border">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              to={tab.href}
              className="border-b-2 border-transparent px-1 pb-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground [&.active]:border-primary [&.active]:text-foreground"
              activeProps={{ className: "active" }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create SearchCommand component**

Create `src/core/layout/search-command.tsx`:

```tsx
import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Search } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/components/ui/command"
import { Button } from "@/core/components/ui/button"

interface SearchCommandProps {
  navItems?: Array<{ label: string; href: string }>
}

export function SearchCommand({ navItems = [] }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start gap-2 text-sm text-muted-foreground md:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none ml-auto hidden rounded border bg-muted px-1.5 font-mono text-xs sm:inline-block">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {navItems.length > 0 && (
            <CommandGroup heading="Navigation">
              {navItems.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => {
                    navigate({ to: item.href })
                    setOpen(false)
                  }}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
```

- [ ] **Step 4: Create UserMenu component**

Create `src/core/layout/user-menu.tsx`:

```tsx
import { LogOut, Settings, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { Button } from "@/core/components/ui/button"

interface UserMenuProps {
  user?: { name: string; email: string }
  onLogout?: () => void
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {user && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 5: Create NotificationBell component**

Create `src/core/layout/notification-bell.tsx`:

```tsx
import { Bell } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"

interface NotificationBellProps {
  count?: number
}

export function NotificationBell({ count = 0 }: NotificationBellProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="text-center text-sm text-muted-foreground py-6">
          No new notifications
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 6: Create MobileDrawer component**

Create `src/core/layout/mobile-drawer.tsx`:

```tsx
import { Menu } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/core/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/components/ui/sheet"
import type { NavGroup } from "./types"

interface MobileDrawerProps {
  nav: NavGroup[]
}

export function MobileDrawer({ nav }: MobileDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1">
          {nav.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 hover:bg-accent [&.active]:bg-accent [&.active]:text-accent-foreground"
                  activeProps={{ className: "active" }}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 7: Create layout barrel export**

Create `src/core/layout/index.ts`:

```typescript
export { PageHeader } from "./page-header"
export { SearchCommand } from "./search-command"
export { UserMenu } from "./user-menu"
export { NotificationBell } from "./notification-bell"
export { MobileDrawer } from "./mobile-drawer"
export type {
  NavItem,
  NavGroup,
  LayoutProps,
  BreadcrumbItem,
  TabItem,
  PageHeaderProps,
} from "./types"
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(core): add layout types, PageHeader, and shared layout components"
```

---

### Task 10: Build Sidebar layout

**Files:**
- Create: `src/core/layout/sidebar-layout.tsx`
- Modify: `src/core/layout/index.ts`

- [ ] **Step 1: Create SidebarLayout**

Create `src/core/layout/sidebar-layout.tsx`:

```tsx
import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { PanelLeftClose, PanelLeft } from "lucide-react"
import { cn } from "@/core/lib/utils"
import { Button } from "@/core/components/ui/button"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"
import { ThemeSwitcher } from "@/core/theme"
import { SearchCommand } from "./search-command"
import { UserMenu } from "./user-menu"
import { NotificationBell } from "./notification-bell"
import { MobileDrawer } from "./mobile-drawer"
import type { LayoutProps } from "./types"

export function SidebarLayout({ children, nav, headerSlot }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "hidden flex-col border-r border-border-default bg-surface-sidebar text-gray-300 transition-all duration-300 md:flex",
            collapsed ? "w-16" : "w-64",
          )}
        >
          {/* Logo */}
          <div
            className={cn(
              "flex h-14 items-center border-b border-white/10 px-4",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <div className="h-8 w-8 rounded-md bg-primary" />
            ) : (
              <span className="text-lg font-medium text-white">App</span>
            )}
          </div>

          {/* Nav */}
          <ScrollArea className="flex-1 py-4">
            <nav className="flex flex-col gap-1 px-2">
              {nav.map((group, gi) => (
                <div key={gi} className={gi > 0 ? "mt-4" : ""}>
                  {group.label && !collapsed && (
                    <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      {group.label}
                    </p>
                  )}
                  {group.items.map((item) => {
                    const linkContent = (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 hover:bg-white/10 hover:text-white [&.active]:bg-white/10 [&.active]:text-white",
                          collapsed && "justify-center px-0",
                        )}
                        activeProps={{ className: "active" }}
                      >
                        {item.icon && (
                          <item.icon className="h-4 w-4 shrink-0" />
                        )}
                        {!collapsed && <span>{item.label}</span>}
                        {!collapsed && item.badge && (
                          <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }
                    return linkContent
                  })}
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Collapse toggle */}
          <div className="border-t border-white/10 p-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-full text-gray-400 hover:bg-white/10 hover:text-white"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Global header */}
          <header className="flex h-14 items-center gap-2 border-b border-border bg-surface-header px-4">
            <MobileDrawer nav={nav} />
            <SearchCommand navItems={flatNavItems} />
            <div className="ml-auto flex items-center gap-1">
              {headerSlot}
              <ThemeSwitcher />
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: Add SidebarLayout to barrel export**

Add to `src/core/layout/index.ts`:

```typescript
export { SidebarLayout } from "./sidebar-layout"
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(core): add SidebarLayout component"
```

---

### Task 11: Build TopNavLayout, StackedLayout, and SplitPanelLayout

**Files:**
- Create: `src/core/layout/top-nav-layout.tsx`, `src/core/layout/stacked-layout.tsx`, `src/core/layout/split-panel-layout.tsx`
- Modify: `src/core/layout/index.ts`

- [ ] **Step 1: Create TopNavLayout**

Create `src/core/layout/top-nav-layout.tsx`:

```tsx
import { Link } from "@tanstack/react-router"
import { cn } from "@/core/lib/utils"
import { ThemeSwitcher } from "@/core/theme"
import { SearchCommand } from "./search-command"
import { UserMenu } from "./user-menu"
import { NotificationBell } from "./notification-bell"
import { MobileDrawer } from "./mobile-drawer"
import type { LayoutProps } from "./types"

export function TopNavLayout({ children, nav, headerSlot }: LayoutProps) {
  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-14 items-center gap-4 border-b border-border bg-surface-header px-4">
        <MobileDrawer nav={nav} />
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <span className="text-sm font-medium text-primary-foreground">A</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.flatMap((group) =>
            group.items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground [&.active]:bg-accent [&.active]:text-accent-foreground",
                )}
                activeProps={{ className: "active" }}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            )),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchCommand navItems={flatNavItems} />
          {headerSlot}
          <ThemeSwitcher />
          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Create StackedLayout**

Create `src/core/layout/stacked-layout.tsx`:

```tsx
import { useState } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@/core/lib/utils"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"
import { ThemeSwitcher } from "@/core/theme"
import { SearchCommand } from "./search-command"
import { UserMenu } from "./user-menu"
import { NotificationBell } from "./notification-bell"
import { MobileDrawer } from "./mobile-drawer"
import type { LayoutProps } from "./types"

export function StackedLayout({ children, nav, headerSlot }: LayoutProps) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const activeGroupIndex = nav.findIndex((group) =>
    group.items.some((item) => currentPath.startsWith(item.href)),
  )
  const activeGroup = nav[activeGroupIndex >= 0 ? activeGroupIndex : 0]

  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden">
        {/* Icon sidebar */}
        <aside className="hidden w-16 flex-col items-center border-r border-border-default bg-surface-sidebar py-4 md:flex">
          <div className="mb-6 h-8 w-8 rounded-md bg-primary" />
          <nav className="flex flex-1 flex-col items-center gap-2">
            {nav.map((group, gi) => {
              const firstItem = group.items[0]
              if (!firstItem) return null
              const Icon = firstItem.icon
              const isActive = gi === activeGroupIndex

              return (
                <Tooltip key={gi}>
                  <TooltipTrigger asChild>
                    <Link
                      to={firstItem.href}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md text-gray-400 transition-colors duration-150 hover:bg-white/10 hover:text-white",
                        isActive && "bg-white/10 text-white",
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {group.label || firstItem.label}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
        </aside>

        {/* Sub-nav panel */}
        {activeGroup && (
          <aside className="hidden w-56 flex-col border-r border-border bg-background md:flex">
            {activeGroup.label && (
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {activeGroup.label}
                </p>
              </div>
            )}
            <ScrollArea className="flex-1 py-2">
              <nav className="flex flex-col gap-0.5 px-2">
                {activeGroup.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
                    activeProps={{ className: "active" }}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </ScrollArea>
          </aside>
        )}

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center gap-2 border-b border-border bg-surface-header px-4">
            <MobileDrawer nav={nav} />
            <SearchCommand navItems={flatNavItems} />
            <div className="ml-auto flex items-center gap-1">
              {headerSlot}
              <ThemeSwitcher />
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
```

- [ ] **Step 3: Create SplitPanelLayout**

Create `src/core/layout/split-panel-layout.tsx`:

```tsx
import { useState, useCallback } from "react"
import { cn } from "@/core/lib/utils"
import { ThemeSwitcher } from "@/core/theme"
import { SearchCommand } from "./search-command"
import { UserMenu } from "./user-menu"
import { NotificationBell } from "./notification-bell"
import { MobileDrawer } from "./mobile-drawer"
import type { LayoutProps } from "./types"
import type { ReactNode } from "react"

interface SplitPanelLayoutProps extends LayoutProps {
  panel: ReactNode
  defaultPanelWidth?: number
  minPanelWidth?: number
  maxPanelWidth?: number
}

export function SplitPanelLayout({
  children,
  nav,
  headerSlot,
  panel,
  defaultPanelWidth = 320,
  minPanelWidth = 240,
  maxPanelWidth = 480,
}: SplitPanelLayoutProps) {
  const [panelWidth, setPanelWidth] = useState(defaultPanelWidth)
  const [isDragging, setIsDragging] = useState(false)

  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
    const handleMouseMove = (e: MouseEvent) => {
      const width = Math.min(
        Math.max(e.clientX, minPanelWidth),
        maxPanelWidth,
      )
      setPanelWidth(width)
    }
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }, [minPanelWidth, maxPanelWidth])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-14 items-center gap-4 border-b border-border bg-surface-header px-4">
        <MobileDrawer nav={nav} />
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <span className="text-sm font-medium text-primary-foreground">A</span>
        </div>
        <SearchCommand navItems={flatNavItems} />
        <div className="ml-auto flex items-center gap-1">
          {headerSlot}
          <ThemeSwitcher />
          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* List panel */}
        <div
          className="flex-shrink-0 overflow-y-auto border-r border-border"
          style={{ width: panelWidth }}
        >
          {panel}
        </div>

        {/* Resize handle */}
        <div
          className={cn(
            "w-1 cursor-col-resize bg-transparent transition-colors hover:bg-primary/20",
            isDragging && "bg-primary/30",
          )}
          onMouseDown={handleMouseDown}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update barrel export**

Add to `src/core/layout/index.ts`:

```typescript
export { TopNavLayout } from "./top-nav-layout"
export { StackedLayout } from "./stacked-layout"
export { SplitPanelLayout } from "./split-panel-layout"
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(core): add TopNav, Stacked, and SplitPanel layout variants"
```

---

## Phase 5: Auth Feature

### Task 12: Build auth types, adapter, store, and route guards

**Files:**
- Create: `src/features/auth/types.ts`, `src/features/auth/adapter.ts`, `src/features/auth/store.ts`, `src/features/auth/hooks/use-auth.ts`, `src/features/auth/index.ts`
- Test: `src/features/auth/store.test.ts`

- [ ] **Step 1: Write test for auth store**

Create `src/features/auth/store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "./store"

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it("starts unauthenticated", () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it("setAuth updates state and localStorage", () => {
    const user = { id: "1", name: "Test", email: "test@example.com" }
    useAuthStore.getState().setAuth({ user, token: "abc123" })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(user)
    expect(state.token).toBe("abc123")
    expect(localStorage.getItem("auth-token")).toBe("abc123")
  })

  it("logout clears state and localStorage", () => {
    useAuthStore.getState().setAuth({
      user: { id: "1", name: "Test", email: "test@example.com" },
      token: "abc123",
    })
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(localStorage.getItem("auth-token")).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/features/auth/store.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create auth types**

Create `src/features/auth/types.ts`:

```typescript
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface AuthAdapter {
  login(credentials: LoginCredentials): Promise<AuthResponse>
  register(credentials: RegisterCredentials): Promise<AuthResponse>
  logout(): Promise<void>
  refreshToken(token: string): Promise<AuthResponse>
  forgotPassword(email: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
}
```

- [ ] **Step 4: Create auth adapter with mock implementation**

Create `src/features/auth/adapter.ts`:

```typescript
import type { AuthAdapter, AuthResponse, LoginCredentials, RegisterCredentials } from "./types"

const mockUser = {
  id: "1",
  name: "Demo User",
  email: "demo@example.com",
}

export const mockAuthAdapter: AuthAdapter = {
  async login(_credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 500))
    return { user: mockUser, token: "mock-jwt-token" }
  },
  async register(_credentials: RegisterCredentials): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 500))
    return { user: mockUser, token: "mock-jwt-token" }
  },
  async logout(): Promise<void> {
    await new Promise((r) => setTimeout(r, 200))
  },
  async refreshToken(_token: string): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 200))
    return { user: mockUser, token: "mock-refreshed-token" }
  },
  async forgotPassword(_email: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 500))
  },
  async resetPassword(_token: string, _password: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 500))
  },
}

export let authAdapter: AuthAdapter = mockAuthAdapter

export function setAuthAdapter(adapter: AuthAdapter) {
  authAdapter = adapter
}
```

- [ ] **Step 5: Create auth store**

Create `src/features/auth/store.ts`:

```typescript
import { create } from "zustand"
import type { User } from "./types"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (payload: { user: User; token: string }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("auth-token"),
  isAuthenticated: !!localStorage.getItem("auth-token"),

  setAuth: ({ user, token }) => {
    localStorage.setItem("auth-token", token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem("auth-token")
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
```

- [ ] **Step 6: Create useAuth hook**

Create `src/features/auth/hooks/use-auth.ts`:

```typescript
import { useCallback } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuthStore } from "../store"
import { authAdapter } from "../adapter"
import type { LoginCredentials, RegisterCredentials } from "../types"

export function useAuth() {
  const { user, isAuthenticated, setAuth, logout: clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authAdapter.login(credentials)
      setAuth(response)
      navigate({ to: "/" })
    },
    [setAuth, navigate],
  )

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const response = await authAdapter.register(credentials)
      setAuth(response)
      navigate({ to: "/" })
    },
    [setAuth, navigate],
  )

  const logout = useCallback(async () => {
    await authAdapter.logout()
    clearAuth()
    navigate({ to: "/login" })
  }, [clearAuth, navigate])

  const forgotPassword = useCallback(async (email: string) => {
    await authAdapter.forgotPassword(email)
  }, [])

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      await authAdapter.resetPassword(token, password)
      navigate({ to: "/login" })
    },
    [navigate],
  )

  return { user, isAuthenticated, login, register, logout, forgotPassword, resetPassword }
}
```

- [ ] **Step 7: Create barrel export**

Create `src/features/auth/index.ts`:

```typescript
export { useAuth } from "./hooks/use-auth"
export { useAuthStore } from "./store"
export { authAdapter, setAuthAdapter, mockAuthAdapter } from "./adapter"
export type {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AuthAdapter,
} from "./types"
```

- [ ] **Step 8: Run tests**

```bash
npx vitest run src/features/auth/store.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat(auth): add auth types, adapter, store, and useAuth hook"
```

---

### Task 13: Build auth pages and auth layout

**Files:**
- Create: `src/features/auth/components/auth-layout.tsx`, `src/features/auth/components/login-form.tsx`, `src/features/auth/components/register-form.tsx`, `src/features/auth/components/forgot-password-form.tsx`, `src/features/auth/components/reset-password-form.tsx`

- [ ] **Step 1: Create AuthLayout**

Create `src/features/auth/components/auth-layout.tsx`:

```tsx
import type { ReactNode } from "react"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">{children}</div>
      </div>
      <div className="hidden flex-1 bg-primary/5 lg:block">
        <div className="flex h-full items-center justify-center">
          <div className="h-32 w-32 rounded-2xl bg-primary/10" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create LoginForm**

Create `src/features/auth/components/login-form.tsx`:

```tsx
import { Link } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { useAuth } from "../hooks/use-auth"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export function LoginForm() {
  const { login } = useAuth()

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      await login(value)
    },
  })

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-medium">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to sign in
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <form.Field
          name="email"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                type="email"
                placeholder="name@example.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => (
                  <p key={err.message} className="text-xs text-destructive">
                    {err.message}
                  </p>
                ))}
            </div>
          )}
        />

        <form.Field
          name="password"
          children={(field) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => (
                  <p key={err.message} className="text-xs text-destructive">
                    {err.message}
                  </p>
                ))}
            </div>
          )}
        />

        <form.Subscribe
          selector={(s) => [s.canSubmit, s.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          )}
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 3: Create RegisterForm**

Create `src/features/auth/components/register-form.tsx`:

```tsx
import { Link } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { useAuth } from "../hooks/use-auth"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export function RegisterForm() {
  const { register } = useAuth()

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: { onChange: registerSchema },
    onSubmit: async ({ value }) => {
      await register(value)
    },
  })

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-medium">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <form.Field
          name="name"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                placeholder="Your name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => (
                  <p key={err.message} className="text-xs text-destructive">
                    {err.message}
                  </p>
                ))}
            </div>
          )}
        />

        <form.Field
          name="email"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                type="email"
                placeholder="name@example.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => (
                  <p key={err.message} className="text-xs text-destructive">
                    {err.message}
                  </p>
                ))}
            </div>
          )}
        />

        <form.Field
          name="password"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Password</Label>
              <Input
                id={field.name}
                type="password"
                placeholder="At least 8 characters"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => (
                  <p key={err.message} className="text-xs text-destructive">
                    {err.message}
                  </p>
                ))}
            </div>
          )}
        />

        <form.Subscribe
          selector={(s) => [s.canSubmit, s.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          )}
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 4: Create ForgotPasswordForm**

Create `src/features/auth/components/forgot-password-form.tsx`:

```tsx
import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { useAuth } from "../hooks/use-auth"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
})

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuth()
  const [sent, setSent] = useState(false)

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await forgotPassword(value.email)
      setSent(true)
    },
  })

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-medium">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a password reset link to your email address.
        </p>
        <Link to="/login">
          <Button variant="outline" className="mt-4">
            Back to sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-medium">Forgot password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send a reset link
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <form.Field
          name="email"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                type="email"
                placeholder="name@example.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => (
                  <p key={err.message} className="text-xs text-destructive">
                    {err.message}
                  </p>
                ))}
            </div>
          )}
        />

        <form.Subscribe
          selector={(s) => [s.canSubmit, s.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          )}
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 5: Create ResetPasswordForm**

Create `src/features/auth/components/reset-password-form.tsx`:

```tsx
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { useAuth } from "../hooks/use-auth"

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { resetPassword } = useAuth()

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await resetPassword(token, value.password)
    },
  })

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-medium">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <form.Field
          name="password"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>New password</Label>
              <Input
                id={field.name}
                type="password"
                placeholder="At least 8 characters"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => (
                  <p key={err.message} className="text-xs text-destructive">
                    {err.message}
                  </p>
                ))}
            </div>
          )}
        />

        <form.Field
          name="confirmPassword"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Confirm password</Label>
              <Input
                id={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => (
                  <p key={err.message} className="text-xs text-destructive">
                    {err.message}
                  </p>
                ))}
            </div>
          )}
        />

        <form.Subscribe
          selector={(s) => [s.canSubmit, s.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
          )}
        />
      </form>
    </>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(auth): add auth layout and form pages"
```

---

## Phase 6: Routes and Integration

### Task 14: Set up TanStack Router routes with auth guards and demo pages

**Files:**
- Create: `src/routes/__root.tsx`, `src/routes/_authenticated.tsx`, `src/routes/_authenticated/index.tsx`, `src/routes/_authenticated/settings.tsx`, `src/routes/_guest.tsx`, `src/routes/_guest/login.tsx`, `src/routes/_guest/register.tsx`, `src/routes/_guest/forgot-password.tsx`, `src/routes/_guest/reset-password.tsx`
- Modify: `src/app.tsx`, `src/main.tsx`

- [ ] **Step 1: Create root route**

Create `src/routes/__root.tsx`:

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { AppProviders } from "@/core/providers"

export const Route = createRootRoute({
  component: () => (
    <AppProviders>
      <Outlet />
    </AppProviders>
  ),
})
```

- [ ] **Step 2: Create authenticated layout route with guard**

Note: There is no `routes/index.tsx`. The `_authenticated` layout's `beforeLoad` redirects unauthenticated users to `/login`. Authenticated users visiting `/` get the dashboard page from `_authenticated/index.tsx`.

Create `src/routes/_authenticated.tsx`:

```tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Home, Settings } from "lucide-react"
import { SidebarLayout } from "@/core/layout"
import { PageHeader } from "@/core/layout"
import { useAuthStore } from "@/features/auth"
import type { NavGroup } from "@/core/layout/types"

const nav: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/", icon: Home },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: () => (
    <SidebarLayout nav={nav}>
      <Outlet />
    </SidebarLayout>
  ),
})
```

- [ ] **Step 4: Create authenticated dashboard page**

Create `src/routes/_authenticated/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        description="Welcome to your dashboard"
        actions={<Button>New Project</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-6"
          >
            <p className="text-sm text-muted-foreground">Metric {i + 1}</p>
            <p className="mt-1 text-2xl font-medium">--</p>
          </div>
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 5: Create settings page**

Create `src/routes/_authenticated/settings.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Settings" },
        ]}
        title="Settings"
        description="Manage your account settings"
      />
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Settings content goes here.</p>
      </div>
    </>
  )
}
```

- [ ] **Step 6: Create guest layout route with guard**

Create `src/routes/_guest.tsx`:

```tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { useAuthStore } from "@/features/auth"

export const Route = createFileRoute("/_guest")({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/" })
    }
  },
  component: () => (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  ),
})
```

- [ ] **Step 7: Create guest auth pages**

Create `src/routes/_guest/login.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { LoginForm } from "@/features/auth/components/login-form"

export const Route = createFileRoute("/_guest/login")({
  component: LoginForm,
})
```

Create `src/routes/_guest/register.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { RegisterForm } from "@/features/auth/components/register-form"

export const Route = createFileRoute("/_guest/register")({
  component: RegisterForm,
})
```

Create `src/routes/_guest/forgot-password.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const Route = createFileRoute("/_guest/forgot-password")({
  component: ForgotPasswordForm,
})
```

Create `src/routes/_guest/reset-password.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"

export const Route = createFileRoute("/_guest/reset-password")({
  component: () => <ResetPasswordForm token="mock-token" />,
})
```

- [ ] **Step 8: Update app.tsx to use router**

Replace `src/app.tsx` with:

```tsx
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export function App() {
  return <RouterProvider router={router} />
}
```

- [ ] **Step 9: Verify the app runs end-to-end**

```bash
npm run dev
```

Expected: Dev server starts. Navigating to `http://localhost:5173` redirects to `/login`. The login page renders with the auth layout. Clicking "Sign in" (with any input) logs in and redirects to the dashboard with the sidebar layout.

- [ ] **Step 10: Run all existing tests**

```bash
npx vitest run
npm run test:e2e
```

Expected: All unit tests pass. Smoke E2E test passes.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: wire up TanStack Router with auth guards and demo pages"
```

---

## Phase 7: Remaining Feature Modules

> **Note for implementer:** The remaining feature modules (forms, data-table, charts, dashboard) follow the same structural pattern established in the auth feature. Each task below provides the complete component code. These tasks are independent of each other and can be implemented in parallel by separate agents.

### Task 15: Build forms feature module

**Files:** All files in `src/features/forms/` as listed in the file structure above.

This task implements the forms feature following the spec: TanStack Form + Zod field components wrapping shadcn/ui primitives, plus FormSection and FormActions pattern components.

- [ ] **Step 1: Create forms types**

Create `src/features/forms/types.ts`:

```typescript
import type { AnyFieldApi } from "@tanstack/react-form"

export interface FieldWrapperProps {
  field: AnyFieldApi
  label: string
  description?: string
}

export interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

export interface FormActionsProps {
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
}
```

- [ ] **Step 2: Create FieldWrapper base component**

Create `src/features/forms/components/field-wrapper.tsx`:

```tsx
import { Label } from "@/core/components/ui/label"
import type { AnyFieldApi } from "@tanstack/react-form"

interface FieldWrapperProps {
  field: AnyFieldApi
  label: string
  description?: string
  children: React.ReactNode
}

export function FieldWrapper({
  field,
  label,
  description,
  children,
}: FieldWrapperProps) {
  const errors = field.state.meta.isTouched ? field.state.meta.errors : []

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
      {errors.map((err) => (
        <p key={err.message} className="text-xs text-destructive">
          {err.message}
        </p>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create TextField, TextareaField, NumberField**

Create `src/features/forms/components/text-field.tsx`:

```tsx
import { Input } from "@/core/components/ui/input"
import { FieldWrapper } from "./field-wrapper"
import type { AnyFieldApi } from "@tanstack/react-form"

interface TextFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
  placeholder?: string
  type?: "text" | "email" | "password" | "url"
}

export function TextField({
  field,
  label,
  description,
  placeholder,
  type = "text",
}: TextFieldProps) {
  return (
    <FieldWrapper field={field} label={label} description={description}>
      <Input
        id={field.name}
        type={type}
        placeholder={placeholder}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
    </FieldWrapper>
  )
}
```

Create `src/features/forms/components/textarea-field.tsx`:

```tsx
import { Textarea } from "@/core/components/ui/textarea"
import { FieldWrapper } from "./field-wrapper"
import type { AnyFieldApi } from "@tanstack/react-form"

interface TextareaFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
  placeholder?: string
  rows?: number
}

export function TextareaField({
  field,
  label,
  description,
  placeholder,
  rows = 3,
}: TextareaFieldProps) {
  return (
    <FieldWrapper field={field} label={label} description={description}>
      <Textarea
        id={field.name}
        placeholder={placeholder}
        rows={rows}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
    </FieldWrapper>
  )
}
```

Create `src/features/forms/components/number-field.tsx`:

```tsx
import { Input } from "@/core/components/ui/input"
import { FieldWrapper } from "./field-wrapper"
import type { AnyFieldApi } from "@tanstack/react-form"

interface NumberFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export function NumberField({
  field,
  label,
  description,
  placeholder,
  min,
  max,
  step,
}: NumberFieldProps) {
  return (
    <FieldWrapper field={field} label={label} description={description}>
      <Input
        id={field.name}
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        value={field.state.value as number}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(Number(e.target.value))}
      />
    </FieldWrapper>
  )
}
```

- [ ] **Step 4: Create SelectField, CheckboxField, SwitchField, RadioGroupField**

Create `src/features/forms/components/select-field.tsx`:

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select"
import { FieldWrapper } from "./field-wrapper"
import type { AnyFieldApi } from "@tanstack/react-form"

interface SelectFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
  placeholder?: string
  options: Array<{ label: string; value: string }>
}

export function SelectField({
  field,
  label,
  description,
  placeholder,
  options,
}: SelectFieldProps) {
  return (
    <FieldWrapper field={field} label={label} description={description}>
      <Select
        value={field.state.value as string}
        onValueChange={(v) => field.handleChange(v)}
      >
        <SelectTrigger id={field.name} onBlur={field.handleBlur}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  )
}
```

Create `src/features/forms/components/checkbox-field.tsx`:

```tsx
import { Checkbox } from "@/core/components/ui/checkbox"
import { Label } from "@/core/components/ui/label"
import type { AnyFieldApi } from "@tanstack/react-form"

interface CheckboxFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
}

export function CheckboxField({
  field,
  label,
  description,
}: CheckboxFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={field.name}
        checked={field.state.value as boolean}
        onCheckedChange={(checked) => field.handleChange(checked)}
        onBlur={field.handleBlur}
      />
      <div className="space-y-1">
        <Label htmlFor={field.name}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}
```

Create `src/features/forms/components/switch-field.tsx`:

```tsx
import { Switch } from "@/core/components/ui/switch"
import { Label } from "@/core/components/ui/label"
import type { AnyFieldApi } from "@tanstack/react-form"

interface SwitchFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
}

export function SwitchField({ field, label, description }: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="space-y-0.5">
        <Label htmlFor={field.name}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={field.name}
        checked={field.state.value as boolean}
        onCheckedChange={(checked) => field.handleChange(checked)}
        onBlur={field.handleBlur}
      />
    </div>
  )
}
```

Create `src/features/forms/components/radio-group-field.tsx`:

```tsx
import {
  RadioGroup,
  RadioGroupItem,
} from "@/core/components/ui/radio-group"
import { Label } from "@/core/components/ui/label"
import { FieldWrapper } from "./field-wrapper"
import type { AnyFieldApi } from "@tanstack/react-form"

interface RadioGroupFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
  options: Array<{ label: string; value: string }>
}

export function RadioGroupField({
  field,
  label,
  description,
  options,
}: RadioGroupFieldProps) {
  return (
    <FieldWrapper field={field} label={label} description={description}>
      <RadioGroup
        value={field.state.value as string}
        onValueChange={(v) => field.handleChange(v)}
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} />
            <Label htmlFor={`${field.name}-${opt.value}`}>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </FieldWrapper>
  )
}
```

- [ ] **Step 5: Create FormSection and FormActions**

Create `src/features/forms/components/form-section.tsx`:

```tsx
import type { ReactNode } from "react"

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
```

Create `src/features/forms/components/form-actions.tsx`:

```tsx
import { Button } from "@/core/components/ui/button"

interface FormActionsProps {
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
}

export function FormActions({
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onCancel,
  isSubmitting = false,
  canSubmit = true,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  )
}
```

- [ ] **Step 6: Create barrel export**

Create `src/features/forms/index.ts`:

```typescript
export { FieldWrapper } from "./components/field-wrapper"
export { TextField } from "./components/text-field"
export { TextareaField } from "./components/textarea-field"
export { NumberField } from "./components/number-field"
export { SelectField } from "./components/select-field"
export { CheckboxField } from "./components/checkbox-field"
export { SwitchField } from "./components/switch-field"
export { RadioGroupField } from "./components/radio-group-field"
export { FormSection } from "./components/form-section"
export { FormActions } from "./components/form-actions"
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(forms): add form field components and form patterns"
```

> **Follow-up:** The spec also lists ComboboxField, MultiSelectField, DatePickerField, DateRangeField, FileUploadField, a multi-step wizard pattern, and an inline editing pattern. Each follows the same FieldWrapper approach established above. Install additional shadcn/ui dependencies as needed (`npx shadcn@latest add popover calendar`). Implement these after the core template is verified working.

---

### Task 16: Build data-table feature module

**Files:** All files in `src/features/data-table/`

- [ ] **Step 1: Create data-table types**

Create `src/features/data-table/types.ts`:

```typescript
import type { ColumnDef, Table } from "@tanstack/react-table"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  searchKey?: string
  searchPlaceholder?: string
}

export interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey?: string
  searchPlaceholder?: string
}

export interface DataTablePaginationProps<TData> {
  table: Table<TData>
}
```

- [ ] **Step 2: Create DataTable component**

Create `src/features/data-table/components/data-table.tsx`:

```tsx
import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table"
import { DataTableToolbar } from "./data-table-toolbar"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableSkeleton } from "./data-table-skeleton"
import { DataTableEmpty } from "./data-table-empty"
import type { DataTableProps } from "../types"

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  searchKey,
  searchPlaceholder,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  })

  if (isLoading) return <DataTableSkeleton columnCount={columns.length} />

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
      />
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <DataTableEmpty />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
```

- [ ] **Step 3: Create ColumnHeader**

Create `src/features/data-table/components/column-header.tsx`:

```tsx
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import type { Column } from "@tanstack/react-table"

interface ColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
}

export function ColumnHeader<TData, TValue>({
  column,
  title,
}: ColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span>{title}</span>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )
}
```

- [ ] **Step 4: Create DataTableToolbar, DataTablePagination, ColumnVisibility**

Create `src/features/data-table/components/data-table-toolbar.tsx`:

```tsx
import { X } from "lucide-react"
import { Input } from "@/core/components/ui/input"
import { Button } from "@/core/components/ui/button"
import { ColumnVisibility } from "./column-visibility"
import type { DataTableToolbarProps } from "../types"

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn(searchKey)?.setFilterValue(e.target.value)
            }
            className="h-9 w-64"
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            className="h-9 px-2"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <ColumnVisibility table={table} />
    </div>
  )
}
```

Create `src/features/data-table/components/data-table-pagination.tsx`:

```tsx
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select"
import type { DataTablePaginationProps } from "../types"

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <p className="text-sm">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

Create `src/features/data-table/components/column-visibility.tsx`:

```tsx
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import type { Table } from "@tanstack/react-table"

interface ColumnVisibilityProps<TData> {
  table: Table<TData>
}

export function ColumnVisibility<TData>({
  table,
}: ColumnVisibilityProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((col) => col.getCanHide())
          .map((col) => (
            <DropdownMenuCheckboxItem
              key={col.id}
              className="capitalize"
              checked={col.getIsVisible()}
              onCheckedChange={(v) => col.toggleVisibility(!!v)}
            >
              {col.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 5: Create DataTableSkeleton, DataTableEmpty, RowActions, and export-csv**

Create `src/features/data-table/components/data-table-skeleton.tsx`:

```tsx
import { Skeleton } from "@/core/components/ui/skeleton"

interface DataTableSkeletonProps {
  columnCount: number
  rowCount?: number
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 5,
}: DataTableSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="rounded-md border border-border">
        <div className="border-b border-border p-4">
          <div className="flex gap-4">
            {Array.from({ length: columnCount }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="border-b border-border p-4 last:border-0">
            <div className="flex gap-4">
              {Array.from({ length: columnCount }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Create `src/features/data-table/components/data-table-empty.tsx`:

```tsx
import { Inbox } from "lucide-react"

export function DataTableEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Inbox className="mb-2 h-10 w-10" />
      <p className="text-sm">No results found</p>
    </div>
  )
}
```

Create `src/features/data-table/components/row-actions.tsx`:

```tsx
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"

interface Action {
  label: string
  onClick: () => void
  variant?: "default" | "destructive"
}

interface RowActionsProps {
  actions: Action[]
}

export function RowActions({ actions }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={action.onClick}
            className={
              action.variant === "destructive" ? "text-destructive" : ""
            }
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

Create `src/features/data-table/export-csv.ts`:

```typescript
export function exportToCsv<TData extends Record<string, unknown>>(
  data: TData[],
  filename: string,
  columns: Array<{ key: keyof TData; header: string }>,
) {
  const header = columns.map((c) => c.header).join(",")
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key]
        const str = String(val ?? "")
        return str.includes(",") || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      })
      .join(","),
  )

  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 6: Create barrel export**

Create `src/features/data-table/index.ts`:

```typescript
export { DataTable } from "./components/data-table"
export { ColumnHeader } from "./components/column-header"
export { RowActions } from "./components/row-actions"
export { DataTableSkeleton } from "./components/data-table-skeleton"
export { DataTableEmpty } from "./components/data-table-empty"
export { exportToCsv } from "./export-csv"
```

- [ ] **Step 7: Install shadcn/ui table component if not already installed**

```bash
npx shadcn@latest add table
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(data-table): add DataTable with sorting, filtering, pagination"
```

---

### Task 17: Build charts feature module

**Files:** All files in `src/features/charts/`

- [ ] **Step 1: Create chart types and useChartColors hook**

Create `src/features/charts/types.ts`:

```typescript
import type { ReactNode } from "react"

export interface ChartCardProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}
```

Create `src/features/charts/hooks/use-chart-colors.ts`:

```typescript
import { useMemo } from "react"

export function useChartColors(): string[] {
  return useMemo(() => {
    const root = getComputedStyle(document.documentElement)
    return [1, 2, 3, 4, 5].map((i) => {
      const hsl = root.getPropertyValue(`--chart-${i}`).trim()
      return `hsl(${hsl})`
    })
  }, [])
}
```

- [ ] **Step 2: Create ChartTooltip and ChartCard**

Create `src/features/charts/components/chart-tooltip.tsx`:

```tsx
import type { TooltipProps } from "recharts"

export function ChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-popover-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}
```

Create `src/features/charts/components/chart-card.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import type { ChartCardProps } from "../types"

export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create chart wrapper components**

Create `src/features/charts/components/area-chart.tsx`:

```tsx
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { useChartColors } from "../hooks/use-chart-colors"
import { ChartTooltip } from "./chart-tooltip"

interface AreaChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  height?: number
  stacked?: boolean
}

export function AreaChart({
  data,
  xKey,
  yKeys,
  height = 300,
  stacked = false,
}: AreaChartProps) {
  const colors = useChartColors()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey={xKey} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip content={<ChartTooltip />} />
        {yKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId={stacked ? "stack" : undefined}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.1}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
```

Create `src/features/charts/components/bar-chart.tsx`:

```tsx
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { useChartColors } from "../hooks/use-chart-colors"
import { ChartTooltip } from "./chart-tooltip"

interface BarChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  height?: number
  stacked?: boolean
}

export function BarChart({
  data,
  xKey,
  yKeys,
  height = 300,
  stacked = false,
}: BarChartProps) {
  const colors = useChartColors()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey={xKey} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip content={<ChartTooltip />} />
        {yKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId={stacked ? "stack" : undefined}
            fill={colors[i % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
```

Create `src/features/charts/components/line-chart.tsx`:

```tsx
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { useChartColors } from "../hooks/use-chart-colors"
import { ChartTooltip } from "./chart-tooltip"

interface LineChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  height?: number
}

export function LineChart({
  data,
  xKey,
  yKeys,
  height = 300,
}: LineChartProps) {
  const colors = useChartColors()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey={xKey} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip content={<ChartTooltip />} />
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
```

Create `src/features/charts/components/pie-chart.tsx`:

```tsx
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { useChartColors } from "../hooks/use-chart-colors"
import { ChartTooltip } from "./chart-tooltip"

interface PieChartProps {
  data: Array<{ name: string; value: number }>
  height?: number
  innerRadius?: number
}

export function PieChart({
  data,
  height = 300,
  innerRadius = 0,
}: PieChartProps) {
  const colors = useChartColors()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={80}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 4: Create barrel export**

Create `src/features/charts/index.ts`:

```typescript
export { AreaChart } from "./components/area-chart"
export { BarChart } from "./components/bar-chart"
export { LineChart } from "./components/line-chart"
export { PieChart } from "./components/pie-chart"
export { ChartCard } from "./components/chart-card"
export { ChartTooltip } from "./components/chart-tooltip"
export { useChartColors } from "./hooks/use-chart-colors"
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(charts): add theme-aware Recharts wrappers and ChartCard"
```

---

### Task 18: Build dashboard feature module

**Files:** All files in `src/features/dashboard/`

- [ ] **Step 1: Create dashboard types**

Create `src/features/dashboard/types.ts`:

```typescript
import type { LucideIcon } from "lucide-react"

export interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: { value: number; isPositive: boolean }
}

export interface KPICardProps {
  label: string
  value: string | number
  comparison?: string
  sparklineData?: number[]
}

export interface ActivityItem {
  id: string
  user: { name: string; avatar?: string }
  action: string
  timestamp: string
}

export interface ProgressCardProps {
  label: string
  value: number
  target: number
  unit?: string
}
```

- [ ] **Step 2: Create StatCard, KPICard, ProgressCard**

Create `src/features/dashboard/components/stat-card.tsx`:

```tsx
import { TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/core/components/ui/card"
import { cn } from "@/core/lib/utils"
import type { StatCardProps } from "../types"

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <p className="mt-2 text-2xl font-medium">{value}</p>
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                trend.isPositive ? "text-green-500" : "text-red-500",
              )}
            >
              {trend.value}%
            </span>
            <span className="text-muted-foreground">from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

Create `src/features/dashboard/components/kpi-card.tsx`:

```tsx
import { Card, CardContent } from "@/core/components/ui/card"
import type { KPICardProps } from "../types"

export function KPICard({
  label,
  value,
  comparison,
  sparklineData,
}: KPICardProps) {
  const max = sparklineData ? Math.max(...sparklineData) : 0
  const min = sparklineData ? Math.min(...sparklineData) : 0
  const range = max - min || 1

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-2xl font-medium">{value}</p>
            {comparison && (
              <p className="text-xs text-muted-foreground">{comparison}</p>
            )}
          </div>
          {sparklineData && sparklineData.length > 1 && (
            <svg
              viewBox={`0 0 ${sparklineData.length * 8} 32`}
              className="h-8 w-20"
            >
              <polyline
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                points={sparklineData
                  .map(
                    (d, i) =>
                      `${i * 8},${32 - ((d - min) / range) * 28 - 2}`,
                  )
                  .join(" ")}
              />
            </svg>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

Create `src/features/dashboard/components/progress-card.tsx`:

```tsx
import { Card, CardContent } from "@/core/components/ui/card"
import type { ProgressCardProps } from "../types"

export function ProgressCard({
  label,
  value,
  target,
  unit = "",
}: ProgressCardProps) {
  const percentage = Math.min((value / target) * 100, 100)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {value}{unit} / {target}{unit}
          </p>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create ActivityFeed and MetricGrid**

Create `src/features/dashboard/components/activity-feed.tsx`:

```tsx
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card"
import type { ActivityItem } from "../types"

interface ActivityFeedProps {
  items: ActivityItem[]
  title?: string
}

export function ActivityFeed({ items, title = "Recent Activity" }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {item.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{item.user.name}</span>{" "}
                  {item.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

Create `src/features/dashboard/components/metric-grid.tsx`:

```tsx
import { cn } from "@/core/lib/utils"
import type { ReactNode } from "react"

interface MetricGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function MetricGrid({
  children,
  columns = 4,
  className,
}: MetricGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "md:grid-cols-2",
        columns === 3 && "md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "md:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Create barrel export**

Create `src/features/dashboard/index.ts`:

```typescript
export { StatCard } from "./components/stat-card"
export { KPICard } from "./components/kpi-card"
export { ProgressCard } from "./components/progress-card"
export { ActivityFeed } from "./components/activity-feed"
export { MetricGrid } from "./components/metric-grid"
export type { StatCardProps, KPICardProps, ProgressCardProps, ActivityItem } from "./types"
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(dashboard): add StatCard, KPICard, ActivityFeed, ProgressCard, MetricGrid"
```

---

## Phase 8: Final Verification

### Task 19: Verify full build and run all tests

- [ ] **Step 1: Run TypeScript type check**

```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 2: Run linter**

```bash
npm run lint
```

Expected: No lint errors (warnings acceptable).

- [ ] **Step 3: Run unit tests**

```bash
npx vitest run
```

Expected: All tests pass (useTheme, useMediaQuery, auth store).

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Run E2E smoke test**

```bash
npm run test:e2e
```

Expected: Smoke test passes.

- [ ] **Step 6: Verify Storybook builds**

```bash
npm run build:storybook
```

Expected: Build succeeds.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: verify full build, tests, and Storybook"
```
