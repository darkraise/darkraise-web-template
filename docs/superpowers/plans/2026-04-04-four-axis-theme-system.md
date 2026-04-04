# Four-Axis Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the five static CSS theme files with a four-axis runtime token generation engine (mode × accent color × surface color × surface style).

**Architecture:** HSL color palettes and style recipes stored as TypeScript objects. A `generateTokens()` engine function combines the four axis selections into a flat CSS variable record. ThemeProvider applies the result to `document.documentElement.style` at runtime.

**Tech Stack:** React, TypeScript, Tailwind CSS v3 HSL color values, CSS custom properties

**Spec:** `docs/superpowers/specs/2026-04-04-four-axis-theme-system-design.md`

---

## File Structure

```
src/core/theme/
├── palettes/
│   ├── accent-colors.ts       — 17 chromatic HSL palettes (50-950)
│   └── surface-colors.ts      — 12 neutral HSL palettes (50-950)
├── styles/
│   └── surface-styles.ts      — 12 style recipe definitions
├── engine/
│   ├── generate-tokens.ts     — combines axes → CSS variable record
│   └── generate-tokens.test.ts — unit tests for token generation
├── theme-provider.tsx          — React context, localStorage, applies tokens
├── theme-switcher.tsx          — UI with dropdowns/pickers for all 4 axes
├── use-theme.ts                — consumer hook
├── use-theme.test.tsx          — hook tests
├── types.ts                    — AccentColor, SurfaceColor, SurfaceStyle, Mode types
└── index.ts                    — barrel export
```

### Files to delete (Task 10):

```
src/core/theme/primitives.css
src/core/theme/themes/default.css
src/core/theme/themes/emerald.css
src/core/theme/themes/rose.css
src/core/theme/themes/amber.css
src/core/theme/themes/violet.css
```

---

## CSS Variables Contract

The token generation engine must produce all of these CSS variable names. The `tailwind.config.ts` file references them via `hsl(var(--name))` and **must not be modified**.

**Accent-derived tokens:**

- `--primary`, `--primary-foreground`, `--ring`
- `--chart-1`, `--chart-2`, `--chart-3`, `--chart-4`, `--chart-5`

**Surface-color-derived tokens:**

- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`

**Surface-style-derived tokens:**

- `--surface-base`, `--surface-raised`, `--surface-overlay`, `--surface-sunken`
- `--surface-sidebar`, `--surface-header`
- `--border-subtle`, `--border-default`
- `--radius`
- `--shadow-card`, `--shadow-dropdown`
- `--backdrop-blur`, `--surface-opacity`

---

## Task 1: New types

**Files:**

- Rewrite: `src/core/theme/types.ts`

- [ ] **Step 1: Replace `src/core/theme/types.ts` with the following content**

```typescript
export const ACCENT_COLORS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const
export type AccentColor = (typeof ACCENT_COLORS)[number]

export const SURFACE_COLORS = [
  "slate",
  "gray",
  "cool",
  "zinc",
  "neutral",
  "iron",
  "mauve",
  "graphite",
  "stone",
  "sand",
  "olive",
  "sepia",
] as const
export type SurfaceColor = (typeof SURFACE_COLORS)[number]

export const SURFACE_STYLES = [
  "default",
  "flat",
  "bordered",
  "elevated",
  "layered",
  "glassmorphism",
  "high-contrast",
  "muted",
  "compact",
  "translucent",
  "tinted",
  "bold",
] as const
export type SurfaceStyle = (typeof SURFACE_STYLES)[number]

export const MODES = ["light", "dark", "system"] as const
export type Mode = (typeof MODES)[number]

export type ResolvedMode = "light" | "dark"

export type ColorScale = Record<
  50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950,
  string
>

export interface SurfaceStyleRecipe {
  name: SurfaceStyle
  label: string
  description: string
  tokens: {
    surfaceRaised: (
      scale: ColorScale,
      mode: ResolvedMode,
      accentScale?: ColorScale,
    ) => string
    surfaceOverlay: (scale: ColorScale, mode: ResolvedMode) => string
    surfaceSunken: (scale: ColorScale, mode: ResolvedMode) => string
    surfaceSidebar: (scale: ColorScale, mode: ResolvedMode) => string
    surfaceHeader: (scale: ColorScale, mode: ResolvedMode) => string
    borderSubtle: (scale: ColorScale, mode: ResolvedMode) => string
    borderDefault: (scale: ColorScale, mode: ResolvedMode) => string
  }
  overrides: {
    radius: string
    shadowCard: string
    shadowDropdown: string
    backdropBlur: string
    surfaceOpacity: string
    borderWidth?: string
    foreground?: (scale: ColorScale, mode: ResolvedMode) => string
    border?: (scale: ColorScale, mode: ResolvedMode) => string
    input?: (scale: ColorScale, mode: ResolvedMode) => string
    accent?: (
      scale: ColorScale,
      mode: ResolvedMode,
      accentScale?: ColorScale,
    ) => string
    accentForeground?: (
      scale: ColorScale,
      mode: ResolvedMode,
      accentScale?: ColorScale,
    ) => string
  }
}

export interface ThemeContextValue {
  accentColor: AccentColor
  surfaceColor: SurfaceColor
  surfaceStyle: SurfaceStyle
  mode: Mode
  resolvedMode: ResolvedMode
  setAccentColor: (color: AccentColor) => void
  setSurfaceColor: (color: SurfaceColor) => void
  setSurfaceStyle: (style: SurfaceStyle) => void
  setMode: (mode: Mode) => void
}
```

---

## Task 2: Accent color palettes

**Files:**

- Create: `src/core/theme/palettes/accent-colors.ts`

All values are Tailwind CSS v3 HSL strings (space-separated `H S% L%` without the `hsl()` wrapper, matching the pattern used by shadcn/ui). Each palette has 11 shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950.

- [ ] **Step 1: Create `src/core/theme/palettes/accent-colors.ts`**

```typescript
import type { AccentColor, ColorScale } from "../types"

const red: ColorScale = {
  50: "0 86% 97%",
  100: "0 93% 94%",
  200: "0 96% 89%",
  300: "0 94% 82%",
  400: "0 91% 71%",
  500: "0 84% 60%",
  600: "0 72% 51%",
  700: "0 74% 42%",
  800: "0 70% 35%",
  900: "0 63% 31%",
  950: "0 75% 15%",
}

const orange: ColorScale = {
  50: "33 100% 96%",
  100: "34 100% 92%",
  200: "32 98% 83%",
  300: "31 97% 72%",
  400: "27 96% 61%",
  500: "25 95% 53%",
  600: "21 90% 48%",
  700: "17 88% 40%",
  800: "15 79% 34%",
  900: "15 75% 28%",
  950: "13 81% 15%",
}

const amber: ColorScale = {
  50: "48 100% 96%",
  100: "48 96% 89%",
  200: "48 97% 77%",
  300: "46 97% 65%",
  400: "43 96% 56%",
  500: "38 92% 50%",
  600: "32 95% 44%",
  700: "26 90% 37%",
  800: "23 83% 31%",
  900: "22 78% 26%",
  950: "21 92% 14%",
}

const yellow: ColorScale = {
  50: "55 92% 95%",
  100: "55 97% 88%",
  200: "53 98% 77%",
  300: "50 98% 64%",
  400: "48 96% 53%",
  500: "45 93% 47%",
  600: "41 96% 40%",
  700: "35 92% 33%",
  800: "32 81% 29%",
  900: "28 73% 26%",
  950: "26 83% 14%",
}

const lime: ColorScale = {
  50: "78 92% 95%",
  100: "80 89% 89%",
  200: "81 88% 80%",
  300: "82 85% 67%",
  400: "83 78% 55%",
  500: "84 81% 44%",
  600: "85 85% 35%",
  700: "86 78% 27%",
  800: "86 69% 23%",
  900: "88 61% 20%",
  950: "89 80% 10%",
}

const green: ColorScale = {
  50: "138 76% 97%",
  100: "141 84% 93%",
  200: "141 79% 85%",
  300: "142 77% 73%",
  400: "142 69% 58%",
  500: "142 71% 45%",
  600: "142 76% 36%",
  700: "142 72% 29%",
  800: "143 64% 24%",
  900: "144 61% 20%",
  950: "145 80% 10%",
}

const emerald: ColorScale = {
  50: "152 81% 96%",
  100: "149 80% 90%",
  200: "152 76% 80%",
  300: "156 72% 67%",
  400: "158 64% 52%",
  500: "160 84% 39%",
  600: "161 94% 30%",
  700: "163 94% 24%",
  800: "163 88% 20%",
  900: "164 86% 16%",
  950: "166 91% 9%",
}

const teal: ColorScale = {
  50: "166 76% 97%",
  100: "167 85% 89%",
  200: "168 84% 78%",
  300: "171 77% 64%",
  400: "172 66% 50%",
  500: "173 80% 40%",
  600: "175 84% 32%",
  700: "175 77% 26%",
  800: "176 69% 22%",
  900: "176 61% 19%",
  950: "179 84% 10%",
}

const cyan: ColorScale = {
  50: "183 100% 96%",
  100: "185 96% 90%",
  200: "186 94% 82%",
  300: "187 92% 69%",
  400: "188 86% 53%",
  500: "189 94% 43%",
  600: "192 91% 36%",
  700: "193 82% 31%",
  800: "194 70% 27%",
  900: "196 64% 24%",
  950: "197 79% 15%",
}

const sky: ColorScale = {
  50: "204 100% 97%",
  100: "204 94% 94%",
  200: "201 94% 86%",
  300: "199 95% 74%",
  400: "198 93% 60%",
  500: "199 89% 48%",
  600: "200 98% 39%",
  700: "201 96% 32%",
  800: "201 90% 27%",
  900: "202 80% 24%",
  950: "204 80% 16%",
}

const blue: ColorScale = {
  50: "214 100% 97%",
  100: "214 95% 93%",
  200: "213 97% 87%",
  300: "212 96% 78%",
  400: "213 94% 68%",
  500: "217 91% 60%",
  600: "221 83% 53%",
  700: "224 76% 48%",
  800: "226 71% 40%",
  900: "224 64% 33%",
  950: "226 57% 21%",
}

const indigo: ColorScale = {
  50: "226 100% 97%",
  100: "226 100% 94%",
  200: "228 96% 89%",
  300: "230 94% 82%",
  400: "234 89% 74%",
  500: "239 84% 67%",
  600: "243 75% 59%",
  700: "245 58% 51%",
  800: "244 55% 41%",
  900: "242 47% 34%",
  950: "244 47% 20%",
}

const violet: ColorScale = {
  50: "250 100% 98%",
  100: "251 91% 95%",
  200: "251 95% 92%",
  300: "252 95% 85%",
  400: "255 92% 76%",
  500: "258 90% 66%",
  600: "262 83% 58%",
  700: "263 70% 50%",
  800: "263 69% 42%",
  900: "264 67% 35%",
  950: "261 73% 23%",
}

const purple: ColorScale = {
  50: "270 100% 98%",
  100: "269 100% 95%",
  200: "269 100% 92%",
  300: "269 97% 85%",
  400: "270 95% 75%",
  500: "271 91% 65%",
  600: "271 81% 56%",
  700: "272 72% 47%",
  800: "273 67% 39%",
  900: "274 66% 32%",
  950: "274 87% 21%",
}

const fuchsia: ColorScale = {
  50: "289 100% 98%",
  100: "287 100% 95%",
  200: "288 96% 91%",
  300: "291 93% 83%",
  400: "292 91% 73%",
  500: "292 84% 61%",
  600: "293 69% 49%",
  700: "295 72% 40%",
  800: "295 70% 33%",
  900: "297 64% 28%",
  950: "297 90% 16%",
}

const pink: ColorScale = {
  50: "327 73% 97%",
  100: "326 78% 95%",
  200: "326 85% 90%",
  300: "327 87% 82%",
  400: "329 86% 70%",
  500: "330 81% 60%",
  600: "333 71% 51%",
  700: "335 78% 42%",
  800: "336 74% 35%",
  900: "336 69% 30%",
  950: "336 84% 17%",
}

const rose: ColorScale = {
  50: "356 100% 97%",
  100: "356 100% 95%",
  200: "353 96% 90%",
  300: "353 95% 82%",
  400: "351 95% 71%",
  500: "350 89% 60%",
  600: "347 77% 50%",
  700: "345 83% 41%",
  800: "343 80% 35%",
  900: "342 75% 30%",
  950: "343 88% 16%",
}

export const accentColors: Record<AccentColor, ColorScale> = {
  red,
  orange,
  amber,
  yellow,
  lime,
  green,
  emerald,
  teal,
  cyan,
  sky,
  blue,
  indigo,
  violet,
  purple,
  fuchsia,
  pink,
  rose,
}

export const LIGHT_ACCENT_COLORS: ReadonlySet<AccentColor> = new Set([
  "amber",
  "yellow",
  "lime",
])
```

---

## Task 3: Surface color palettes

**Files:**

- Create: `src/core/theme/palettes/surface-colors.ts`

The 5 Tailwind v3 gray families (slate, gray, zinc, neutral, stone) use their real HSL values. The 7 custom palettes have hand-crafted HSL scales with consistent lightness progression and the described undertones.

- [ ] **Step 1: Create `src/core/theme/palettes/surface-colors.ts`**

```typescript
import type { SurfaceColor, ColorScale } from "../types"

const slate: ColorScale = {
  50: "210 40% 98%",
  100: "210 40% 96%",
  200: "214 32% 91%",
  300: "213 27% 84%",
  400: "215 20% 65%",
  500: "215 16% 47%",
  600: "215 19% 35%",
  700: "215 25% 27%",
  800: "217 33% 17%",
  900: "222 47% 11%",
  950: "229 84% 5%",
}

const gray: ColorScale = {
  50: "210 20% 98%",
  100: "220 14% 96%",
  200: "220 13% 91%",
  300: "216 12% 84%",
  400: "218 11% 65%",
  500: "220 9% 46%",
  600: "215 14% 34%",
  700: "217 19% 27%",
  800: "215 28% 17%",
  900: "221 39% 11%",
  950: "224 71% 4%",
}

const cool: ColorScale = {
  50: "210 20% 98%",
  100: "210 18% 96%",
  200: "210 16% 91%",
  300: "210 14% 84%",
  400: "210 11% 65%",
  500: "210 9% 47%",
  600: "210 12% 35%",
  700: "210 16% 27%",
  800: "210 22% 17%",
  900: "210 30% 11%",
  950: "210 50% 5%",
}

const zinc: ColorScale = {
  50: "0 0% 98%",
  100: "240 5% 96%",
  200: "240 6% 90%",
  300: "240 5% 84%",
  400: "240 5% 65%",
  500: "240 4% 46%",
  600: "240 5% 34%",
  700: "240 5% 26%",
  800: "240 4% 16%",
  900: "240 6% 10%",
  950: "240 10% 4%",
}

const neutral: ColorScale = {
  50: "0 0% 98%",
  100: "0 0% 96%",
  200: "0 0% 90%",
  300: "0 0% 83%",
  400: "0 0% 64%",
  500: "0 0% 45%",
  600: "0 0% 32%",
  700: "0 0% 25%",
  800: "0 0% 15%",
  900: "0 0% 9%",
  950: "0 0% 4%",
}

const iron: ColorScale = {
  50: "30 10% 98%",
  100: "30 8% 96%",
  200: "28 7% 90%",
  300: "26 6% 83%",
  400: "24 5% 64%",
  500: "22 4% 46%",
  600: "20 6% 34%",
  700: "18 8% 26%",
  800: "16 10% 16%",
  900: "14 12% 10%",
  950: "12 16% 5%",
}

const mauve: ColorScale = {
  50: "300 10% 98%",
  100: "300 8% 96%",
  200: "296 6% 90%",
  300: "292 5% 83%",
  400: "288 4% 64%",
  500: "284 3% 46%",
  600: "280 5% 34%",
  700: "276 7% 26%",
  800: "272 10% 16%",
  900: "268 14% 10%",
  950: "264 20% 5%",
}

const graphite: ColorScale = {
  50: "210 6% 97%",
  100: "210 5% 94%",
  200: "210 4% 86%",
  300: "210 4% 76%",
  400: "210 3% 56%",
  500: "210 3% 40%",
  600: "210 5% 30%",
  700: "210 7% 23%",
  800: "210 10% 15%",
  900: "210 14% 9%",
  950: "210 20% 4%",
}

const stone: ColorScale = {
  50: "60 9% 98%",
  100: "60 5% 96%",
  200: "20 6% 90%",
  300: "24 6% 83%",
  400: "24 5% 64%",
  500: "25 5% 45%",
  600: "33 5% 32%",
  700: "30 6% 25%",
  800: "12 6% 15%",
  900: "24 10% 10%",
  950: "20 14% 4%",
}

const sand: ColorScale = {
  50: "46 25% 97%",
  100: "44 20% 94%",
  200: "42 16% 87%",
  300: "40 13% 78%",
  400: "38 10% 60%",
  500: "36 8% 44%",
  600: "34 10% 33%",
  700: "32 12% 26%",
  800: "30 14% 17%",
  900: "28 16% 11%",
  950: "26 22% 5%",
}

const olive: ColorScale = {
  50: "80 15% 97%",
  100: "78 12% 94%",
  200: "76 10% 87%",
  300: "74 8% 78%",
  400: "72 6% 60%",
  500: "70 5% 44%",
  600: "68 7% 33%",
  700: "66 9% 26%",
  800: "64 12% 17%",
  900: "62 15% 11%",
  950: "60 20% 5%",
}

const sepia: ColorScale = {
  50: "36 35% 97%",
  100: "34 28% 93%",
  200: "32 22% 85%",
  300: "30 18% 75%",
  400: "28 14% 58%",
  500: "26 12% 42%",
  600: "24 14% 32%",
  700: "22 16% 25%",
  800: "20 18% 16%",
  900: "18 20% 10%",
  950: "16 26% 5%",
}

export const surfaceColors: Record<SurfaceColor, ColorScale> = {
  slate,
  gray,
  cool,
  zinc,
  neutral,
  iron,
  mauve,
  graphite,
  stone,
  sand,
  olive,
  sepia,
}
```

---

## Task 4: Surface style recipes

**Files:**

- Create: `src/core/theme/styles/surface-styles.ts`

Each recipe provides token-mapping functions that receive the surface color scale and mode, and return the HSL value for that token. The `overrides` object holds static CSS values for radius, shadow, blur, and opacity.

- [ ] **Step 1: Create `src/core/theme/styles/surface-styles.ts`**

```typescript
import type {
  SurfaceStyle,
  SurfaceStyleRecipe,
  ColorScale,
  ResolvedMode,
} from "../types"

const WHITE = "0 0% 100%"

function lightDark(
  scale: ColorScale,
  mode: ResolvedMode,
  lightStep: keyof ColorScale,
  darkStep: keyof ColorScale,
): string {
  return mode === "light" ? scale[lightStep] : scale[darkStep]
}

const defaultStyle: SurfaceStyleRecipe = {
  name: "default",
  label: "Default",
  description:
    "Subtle elevation through background color shifts. No shadows. Clean and neutral.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
  },
}

const flat: SurfaceStyleRecipe = {
  name: "flat",
  label: "Flat",
  description:
    "No visual distinction between surface levels. Borders do all separation work.",
  tokens: {
    surfaceRaised: (scale, mode) => lightDark(scale, mode, 50, 950),
    surfaceOverlay: (scale, mode) => lightDark(scale, mode, 50, 900),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 50, 950),
    surfaceHeader: (scale, mode) => lightDark(scale, mode, 50, 950),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
  },
}

const bordered: SurfaceStyleRecipe = {
  name: "bordered",
  label: "Bordered",
  description: "Flat surfaces with prominent borders. Strong grid/panel feel.",
  tokens: {
    surfaceRaised: (scale, mode) => lightDark(scale, mode, 50, 950),
    surfaceOverlay: (scale, mode) => lightDark(scale, mode, 50, 900),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 50, 950),
    surfaceHeader: (scale, mode) => lightDark(scale, mode, 50, 950),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 200, 700),
    borderDefault: (scale, mode) => lightDark(scale, mode, 300, 600),
  },
  overrides: {
    radius: "0.375rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    borderWidth: "2px",
  },
}

const elevated: SurfaceStyleRecipe = {
  name: "elevated",
  label: "Elevated",
  description: "Soft shadows for layering. Cards float above the background.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    shadowDropdown:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
  },
}

const layered: SurfaceStyleRecipe = {
  name: "layered",
  label: "Layered",
  description:
    "More aggressive depth with stacked shadow layers. Clear visual hierarchy.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 100, 800),
  },
  overrides: {
    radius: "0.75rem",
    shadowCard:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    shadowDropdown:
      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    borderWidth: "0",
  },
}

const glassmorphism: SurfaceStyleRecipe = {
  name: "glassmorphism",
  label: "Glassmorphism",
  description:
    "Frosted glass effect with backdrop-blur, semi-transparent surfaces.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 200, 700),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.75rem",
    shadowCard: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
    shadowDropdown:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    backdropBlur: "12px",
    surfaceOpacity: "0.8",
  },
}

const highContrast: SurfaceStyleRecipe = {
  name: "high-contrast",
  label: "High Contrast",
  description:
    "Maximum separation between surface levels. Sharp borders, bold differences.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[950]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 950, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[950]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 200, 700),
    borderDefault: (scale, mode) => lightDark(scale, mode, 300, 600),
  },
  overrides: {
    radius: "0.375rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    borderWidth: "2px",
    foreground: (scale, mode) => (mode === "light" ? scale[950] : scale[50]),
    border: (scale, mode) => lightDark(scale, mode, 300, 600),
    input: (scale, mode) => lightDark(scale, mode, 300, 600),
  },
}

const muted: SurfaceStyleRecipe = {
  name: "muted",
  label: "Muted",
  description: "Very low contrast between surfaces. Soft, calm feel.",
  tokens: {
    surfaceRaised: (scale, mode) => lightDark(scale, mode, 50, 900),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 100, 900),
    surfaceHeader: (scale, mode) => lightDark(scale, mode, 50, 900),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 100, 800),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    border: (scale, mode) => lightDark(scale, mode, 100, 800),
    input: (scale, mode) => lightDark(scale, mode, 100, 800),
  },
}

const compact: SurfaceStyleRecipe = {
  name: "compact",
  label: "Compact",
  description: "Tighter radius, dense information display.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.25rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
  },
}

const translucent: SurfaceStyleRecipe = {
  name: "translucent",
  label: "Translucent",
  description: "Semi-transparent surfaces without blur. Light, airy feel.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "0.85",
  },
}

const tinted: SurfaceStyleRecipe = {
  name: "tinted",
  label: "Tinted",
  description: "Surfaces lightly tinted with the accent color. Brand-forward.",
  tokens: {
    surfaceRaised: (_scale, mode, accentScale) =>
      accentScale
        ? mode === "light"
          ? accentScale[50]
          : accentScale[950]
        : mode === "light"
          ? WHITE
          : _scale[900],
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode, accentScale) =>
      accentScale
        ? mode === "light"
          ? accentScale[50]
          : accentScale[950]
        : mode === "light"
          ? WHITE
          : _scale[900],
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    accent: (_scale, mode, accentScale) =>
      accentScale
        ? mode === "light"
          ? accentScale[100]
          : accentScale[900]
        : mode === "light"
          ? _scale[100]
          : _scale[800],
    accentForeground: (_scale, mode, accentScale) =>
      accentScale
        ? mode === "light"
          ? accentScale[900]
          : accentScale[100]
        : mode === "light"
          ? _scale[900]
          : _scale[50],
  },
}

const bold: SurfaceStyleRecipe = {
  name: "bold",
  label: "Bold",
  description:
    "Dark sidebar and header regardless of mode. Vibrant accent usage.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale) => scale[900],
    surfaceHeader: (scale) => scale[950],
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 700),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 600),
  },
  overrides: {
    radius: "0.75rem",
    shadowCard: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    borderWidth: "0",
  },
}

export const surfaceStyles: Record<SurfaceStyle, SurfaceStyleRecipe> = {
  default: defaultStyle,
  flat,
  bordered,
  elevated,
  layered,
  glassmorphism,
  "high-contrast": highContrast,
  muted,
  compact,
  translucent,
  tinted,
  bold,
}
```

---

## Task 5: Token generation engine

**Files:**

- Create: `src/core/theme/engine/generate-tokens.ts`
- Create: `src/core/theme/engine/generate-tokens.test.ts`

The engine function accepts all four axis selections and returns a flat `Record<string, string>` mapping CSS variable names (without the `--` prefix) to their HSL values (or other CSS values for shadow/radius/blur/opacity).

- [ ] **Step 1: Create `src/core/theme/engine/generate-tokens.ts`**

```typescript
import type {
  AccentColor,
  SurfaceColor,
  SurfaceStyle,
  ResolvedMode,
  ColorScale,
} from "../types"
import { accentColors, LIGHT_ACCENT_COLORS } from "../palettes/accent-colors"
import { surfaceColors } from "../palettes/surface-colors"
import { surfaceStyles } from "../styles/surface-styles"
import { ACCENT_COLORS } from "../types"

export interface GenerateTokensInput {
  accentColor: AccentColor
  surfaceColor: SurfaceColor
  surfaceStyle: SurfaceStyle
  mode: ResolvedMode
}

function getChartColors(
  accentColor: AccentColor,
  mode: ResolvedMode,
): string[] {
  const index = ACCENT_COLORS.indexOf(accentColor)
  const count = ACCENT_COLORS.length
  const step = Math.floor(count / 5)
  const shade = mode === "light" ? 500 : 400

  return Array.from({ length: 5 }, (_, i) => {
    const colorIndex = (index + i * step) % count
    const colorName = ACCENT_COLORS[colorIndex]
    return accentColors[colorName][shade]
  })
}

export function generateTokens(
  input: GenerateTokensInput,
): Record<string, string> {
  const { accentColor, surfaceColor, surfaceStyle, mode } = input

  const accent: ColorScale = accentColors[accentColor]
  const surface: ColorScale = surfaceColors[surfaceColor]
  const recipe = surfaceStyles[surfaceStyle]

  const isLightAccent = LIGHT_ACCENT_COLORS.has(accentColor)

  const primaryShade = mode === "light" ? 500 : 400
  const primaryForeground = isLightAccent ? accent[950] : "0 0% 100%"
  const ringValue = accent[primaryShade]

  const chartColors = getChartColors(accentColor, mode)

  const foreground = recipe.overrides.foreground
    ? recipe.overrides.foreground(surface, mode)
    : mode === "light"
      ? surface[900]
      : surface[50]

  const border = recipe.overrides.border
    ? recipe.overrides.border(surface, mode)
    : mode === "light"
      ? surface[200]
      : surface[800]

  const inputValue = recipe.overrides.input
    ? recipe.overrides.input(surface, mode)
    : border

  const accentToken = recipe.overrides.accent
    ? recipe.overrides.accent(surface, mode, accent)
    : mode === "light"
      ? surface[100]
      : surface[800]

  const accentForeground = recipe.overrides.accentForeground
    ? recipe.overrides.accentForeground(surface, mode, accent)
    : mode === "light"
      ? surface[900]
      : surface[50]

  const tokens: Record<string, string> = {
    "--primary": accent[primaryShade],
    "--primary-foreground": primaryForeground,
    "--ring": ringValue,

    "--chart-1": chartColors[0],
    "--chart-2": chartColors[1],
    "--chart-3": chartColors[2],
    "--chart-4": chartColors[3],
    "--chart-5": chartColors[4],

    "--background": mode === "light" ? surface[50] : surface[950],
    "--foreground": foreground,

    "--card": mode === "light" ? "0 0% 100%" : surface[900],
    "--card-foreground": mode === "light" ? surface[900] : surface[50],

    "--popover": mode === "light" ? "0 0% 100%" : surface[900],
    "--popover-foreground": mode === "light" ? surface[900] : surface[50],

    "--secondary": mode === "light" ? surface[100] : surface[800],
    "--secondary-foreground": mode === "light" ? surface[900] : surface[50],

    "--muted": mode === "light" ? surface[100] : surface[800],
    "--muted-foreground": mode === "light" ? surface[500] : surface[400],

    "--accent": accentToken,
    "--accent-foreground": accentForeground,

    "--destructive": mode === "light" ? "0 84% 60%" : "0 72% 51%",
    "--destructive-foreground": "0 0% 100%",

    "--border": border,
    "--input": inputValue,

    "--surface-base": mode === "light" ? surface[50] : surface[950],
    "--surface-raised": recipe.tokens.surfaceRaised(surface, mode, accent),
    "--surface-overlay": recipe.tokens.surfaceOverlay(surface, mode),
    "--surface-sunken": recipe.tokens.surfaceSunken(surface, mode),
    "--surface-sidebar": recipe.tokens.surfaceSidebar(surface, mode),
    "--surface-header": recipe.tokens.surfaceHeader(surface, mode, accent),

    "--border-subtle": recipe.tokens.borderSubtle(surface, mode),
    "--border-default": recipe.tokens.borderDefault(surface, mode),

    "--radius": recipe.overrides.radius,
    "--shadow-card": recipe.overrides.shadowCard,
    "--shadow-dropdown": recipe.overrides.shadowDropdown,
    "--backdrop-blur": recipe.overrides.backdropBlur,
    "--surface-opacity": recipe.overrides.surfaceOpacity,
  }

  return tokens
}
```

- [ ] **Step 2: Create `src/core/theme/engine/generate-tokens.test.ts`**

```typescript
import { describe, it, expect } from "vitest"
import { generateTokens } from "./generate-tokens"

describe("generateTokens", () => {
  it("produces all expected token keys for the default combination", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      mode: "light",
    })

    const expectedKeys = [
      "--primary",
      "--primary-foreground",
      "--ring",
      "--chart-1",
      "--chart-2",
      "--chart-3",
      "--chart-4",
      "--chart-5",
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--muted-foreground",
      "--accent",
      "--accent-foreground",
      "--destructive",
      "--destructive-foreground",
      "--border",
      "--input",
      "--surface-base",
      "--surface-raised",
      "--surface-overlay",
      "--surface-sunken",
      "--surface-sidebar",
      "--surface-header",
      "--border-subtle",
      "--border-default",
      "--radius",
      "--shadow-card",
      "--shadow-dropdown",
      "--backdrop-blur",
      "--surface-opacity",
    ]

    for (const key of expectedKeys) {
      expect(tokens).toHaveProperty(key)
      expect(tokens[key]).toBeTruthy()
    }
  })

  it("uses shade 500 for primary in light mode and shade 400 in dark mode", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      mode: "light",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      mode: "dark",
    })

    expect(light["--primary"]).toBe("217 91% 60%")
    expect(dark["--primary"]).toBe("213 94% 68%")
  })

  it("uses dark foreground for light accent colors (amber, yellow, lime)", () => {
    const amber = generateTokens({
      accentColor: "amber",
      surfaceColor: "slate",
      surfaceStyle: "default",
      mode: "light",
    })
    expect(amber["--primary-foreground"]).toBe("21 92% 14%")

    const blue = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      mode: "light",
    })
    expect(blue["--primary-foreground"]).toBe("0 0% 100%")
  })

  it("dark mode flips background to step 950 and foreground to step 50", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      mode: "dark",
    })

    expect(tokens["--background"]).toBe("229 84% 5%")
    expect(tokens["--foreground"]).toBe("210 40% 98%")
  })

  it("tinted style uses accent palette for surface-raised", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "tinted",
      mode: "light",
    })

    expect(tokens["--surface-raised"]).toBe("214 100% 97%")
  })

  it("tinted style uses accent palette for accent token", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "tinted",
      mode: "light",
    })

    expect(tokens["--accent"]).toBe("214 95% 93%")
    expect(tokens["--accent-foreground"]).toBe("224 64% 33%")
  })

  it("derives chart colors from evenly spaced accent palettes", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      mode: "light",
    })

    expect(tokens["--chart-1"]).toBeTruthy()
    expect(tokens["--chart-2"]).toBeTruthy()
    expect(tokens["--chart-3"]).toBeTruthy()
    expect(tokens["--chart-4"]).toBeTruthy()
    expect(tokens["--chart-5"]).toBeTruthy()

    const allDifferentOrValid = new Set([
      tokens["--chart-1"],
      tokens["--chart-2"],
      tokens["--chart-3"],
      tokens["--chart-4"],
      tokens["--chart-5"],
    ])
    expect(allDifferentOrValid.size).toBe(5)
  })

  it("high-contrast style uses step 950 foreground in light mode", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "high-contrast",
      mode: "light",
    })

    expect(tokens["--foreground"]).toBe("229 84% 5%")
  })

  it("bold style uses dark sidebar in both modes", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "bold",
      mode: "light",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "bold",
      mode: "dark",
    })

    expect(light["--surface-sidebar"]).toBe("222 47% 11%")
    expect(dark["--surface-sidebar"]).toBe("222 47% 11%")
  })

  it("glassmorphism style sets backdrop-blur and reduced opacity", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "glassmorphism",
      mode: "light",
    })

    expect(tokens["--backdrop-blur"]).toBe("12px")
    expect(tokens["--surface-opacity"]).toBe("0.8")
  })

  it("destructive uses red-500 for light and red-600 for dark", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      mode: "light",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      mode: "dark",
    })

    expect(light["--destructive"]).toBe("0 84% 60%")
    expect(dark["--destructive"]).toBe("0 72% 51%")
  })
})
```

---

## Task 6: Update ThemeProvider

**Files:**

- Rewrite: `src/core/theme/theme-provider.tsx`

The provider manages four state values (accentColor, surfaceColor, surfaceStyle, mode), persists each to localStorage, calls `generateTokens()` on every change, and applies the resulting CSS variables to `document.documentElement.style`. It also sets `data-mode` for Tailwind's dark mode selector. It no longer sets `data-theme`.

- [ ] **Step 1: Replace `src/core/theme/theme-provider.tsx` with the following content**

```typescript
import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import type {
  AccentColor,
  SurfaceColor,
  SurfaceStyle,
  Mode,
  ResolvedMode,
  ThemeContextValue,
} from "./types"
import { generateTokens } from "./engine/generate-tokens"

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const LS_ACCENT = "theme-accent"
const LS_SURFACE = "theme-surface"
const LS_STYLE = "theme-style"
const LS_MODE = "mode"

function getSystemMode(): ResolvedMode {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function resolveMode(mode: Mode): ResolvedMode {
  return mode === "system" ? getSystemMode() : mode
}

function applyTokens(tokens: Record<string, string>) {
  const style = document.documentElement.style
  for (const [key, value] of Object.entries(tokens)) {
    style.setProperty(key, value)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const stored = localStorage.getItem(LS_ACCENT)
    return (stored as AccentColor) || "blue"
  })

  const [surfaceColor, setSurfaceColorState] = useState<SurfaceColor>(() => {
    const stored = localStorage.getItem(LS_SURFACE)
    return (stored as SurfaceColor) || "slate"
  })

  const [surfaceStyle, setSurfaceStyleState] = useState<SurfaceStyle>(() => {
    const stored = localStorage.getItem(LS_STYLE)
    return (stored as SurfaceStyle) || "default"
  })

  const [mode, setModeState] = useState<Mode>(() => {
    const stored = localStorage.getItem(LS_MODE)
    return (stored as Mode) || "system"
  })

  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(() =>
    resolveMode(mode),
  )

  const applyTheme = useCallback(
    (
      accent: AccentColor,
      surface: SurfaceColor,
      style: SurfaceStyle,
      resolved: ResolvedMode,
    ) => {
      document.documentElement.setAttribute("data-mode", resolved)
      const tokens = generateTokens({
        accentColor: accent,
        surfaceColor: surface,
        surfaceStyle: style,
        mode: resolved,
      })
      applyTokens(tokens)
    },
    [],
  )

  const setAccentColor = useCallback(
    (color: AccentColor) => {
      setAccentColorState(color)
      localStorage.setItem(LS_ACCENT, color)
      applyTheme(color, surfaceColor, surfaceStyle, resolvedMode)
    },
    [applyTheme, surfaceColor, surfaceStyle, resolvedMode],
  )

  const setSurfaceColor = useCallback(
    (color: SurfaceColor) => {
      setSurfaceColorState(color)
      localStorage.setItem(LS_SURFACE, color)
      applyTheme(accentColor, color, surfaceStyle, resolvedMode)
    },
    [applyTheme, accentColor, surfaceStyle, resolvedMode],
  )

  const setSurfaceStyle = useCallback(
    (style: SurfaceStyle) => {
      setSurfaceStyleState(style)
      localStorage.setItem(LS_STYLE, style)
      applyTheme(accentColor, surfaceColor, style, resolvedMode)
    },
    [applyTheme, accentColor, surfaceColor, resolvedMode],
  )

  const setMode = useCallback(
    (m: Mode) => {
      const resolved = resolveMode(m)
      setModeState(m)
      setResolvedMode(resolved)
      localStorage.setItem(LS_MODE, m)
      applyTheme(accentColor, surfaceColor, surfaceStyle, resolved)
    },
    [applyTheme, accentColor, surfaceColor, surfaceStyle],
  )

  useEffect(() => {
    applyTheme(accentColor, surfaceColor, surfaceStyle, resolvedMode)
  }, [applyTheme, accentColor, surfaceColor, surfaceStyle, resolvedMode])

  useEffect(() => {
    if (mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const resolved = getSystemMode()
      setResolvedMode(resolved)
      applyTheme(accentColor, surfaceColor, surfaceStyle, resolved)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [mode, accentColor, surfaceColor, surfaceStyle, applyTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      accentColor,
      surfaceColor,
      surfaceStyle,
      mode,
      resolvedMode,
      setAccentColor,
      setSurfaceColor,
      setSurfaceStyle,
      setMode,
    }),
    [
      accentColor,
      surfaceColor,
      surfaceStyle,
      mode,
      resolvedMode,
      setAccentColor,
      setSurfaceColor,
      setSurfaceStyle,
      setMode,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
```

---

## Task 7: Update useTheme hook and tests

**Files:**

- Rewrite: `src/core/theme/use-theme.ts`
- Rewrite: `src/core/theme/use-theme.test.tsx`

The hook itself barely changes (it still reads from ThemeContext), but the return type changes to `ThemeContextValue` from the new types. The tests must be rewritten for the four-axis API.

- [ ] **Step 1: Replace `src/core/theme/use-theme.ts` with the following content**

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

- [ ] **Step 2: Replace `src/core/theme/use-theme.test.tsx` with the following content**

```typescript
import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { useTheme } from "./use-theme"
import { ThemeProvider } from "./theme-provider"
import type { ReactNode } from "react"

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

const storageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      store = Object.fromEntries(
        Object.entries(store).filter(([k]) => k !== key),
      )
    },
    clear: () => {
      store = {}
    },
  }
})()

function mockMatchMedia(prefersDark = false) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: prefersDark && query.includes("dark"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe("useTheme", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock)
    storageMock.clear()
    mockMatchMedia()
    document.documentElement.removeAttribute("data-mode")
    document.documentElement.style.cssText = ""
  })

  it("returns default axis values", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentColor).toBe("blue")
    expect(result.current.surfaceColor).toBe("slate")
    expect(result.current.surfaceStyle).toBe("default")
    expect(result.current.mode).toBe("system")
  })

  it("setAccentColor updates accent and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setAccentColor("rose"))
    expect(result.current.accentColor).toBe("rose")
    expect(localStorage.getItem("theme-accent")).toBe("rose")
  })

  it("setSurfaceColor updates surface and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setSurfaceColor("zinc"))
    expect(result.current.surfaceColor).toBe("zinc")
    expect(localStorage.getItem("theme-surface")).toBe("zinc")
  })

  it("setSurfaceStyle updates style and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setSurfaceStyle("elevated"))
    expect(result.current.surfaceStyle).toBe("elevated")
    expect(localStorage.getItem("theme-style")).toBe("elevated")
  })

  it("setMode updates mode and applies data-mode attribute", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setMode("dark"))
    expect(result.current.mode).toBe("dark")
    expect(result.current.resolvedMode).toBe("dark")
    expect(document.documentElement.getAttribute("data-mode")).toBe("dark")
  })

  it("applies CSS variables to document.documentElement.style", () => {
    renderHook(() => useTheme(), { wrapper })
    const style = document.documentElement.style
    expect(style.getPropertyValue("--primary")).toBeTruthy()
    expect(style.getPropertyValue("--background")).toBeTruthy()
    expect(style.getPropertyValue("--radius")).toBeTruthy()
  })

  it("throws when used outside ThemeProvider", () => {
    expect(() => {
      renderHook(() => useTheme())
    }).toThrow("useTheme must be used within a ThemeProvider")
  })

  it("reads persisted values from localStorage on mount", () => {
    storageMock.setItem("theme-accent", "emerald")
    storageMock.setItem("theme-surface", "neutral")
    storageMock.setItem("theme-style", "flat")
    storageMock.setItem("mode", "dark")

    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentColor).toBe("emerald")
    expect(result.current.surfaceColor).toBe("neutral")
    expect(result.current.surfaceStyle).toBe("flat")
    expect(result.current.mode).toBe("dark")
  })
})
```

---

## Task 8: Update ThemeSwitcher

**Files:**

- Rewrite: `src/core/theme/theme-switcher.tsx`

The new ThemeSwitcher renders a popover with four sections: mode toggle, accent color grid, surface color grid, and surface style selector. It uses shadcn/ui components that already exist in the template.

- [ ] **Step 1: Replace `src/core/theme/theme-switcher.tsx` with the following content**

```typescript
import { Moon, Sun, Monitor, Palette } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"
import { Label } from "@/core/components/ui/label"
import { Separator } from "@/core/components/ui/separator"
import { cn } from "@/core/lib/utils"
import { useTheme } from "./use-theme"
import {
  ACCENT_COLORS,
  SURFACE_COLORS,
  SURFACE_STYLES,
} from "./types"
import type { Mode, AccentColor, SurfaceColor, SurfaceStyle } from "./types"
import { accentColors } from "./palettes/accent-colors"
import { surfaceColors } from "./palettes/surface-colors"
import { surfaceStyles } from "./styles/surface-styles"

const modeOptions: { value: Mode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
]

export function ThemeSwitcher() {
  const {
    accentColor,
    surfaceColor,
    surfaceStyle,
    mode,
    setAccentColor,
    setSurfaceColor,
    setSurfaceStyle,
    setMode,
  } = useTheme()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Customize theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Mode
            </Label>
            <div className="mt-1.5 flex gap-1">
              {modeOptions.map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant={mode === value ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setMode(value)}
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Accent Color
            </Label>
            <div className="mt-1.5 grid grid-cols-9 gap-1.5">
              {ACCENT_COLORS.map((color: AccentColor) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                    accentColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{
                    backgroundColor: `hsl(${accentColors[color][500]})`,
                  }}
                  onClick={() => setAccentColor(color)}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Surface Color
            </Label>
            <div className="mt-1.5 grid grid-cols-6 gap-1.5">
              {SURFACE_COLORS.map((color: SurfaceColor) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                    surfaceColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{
                    backgroundColor: `hsl(${surfaceColors[color][500]})`,
                  }}
                  onClick={() => setSurfaceColor(color)}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Surface Style
            </Label>
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              {SURFACE_STYLES.map((style: SurfaceStyle) => {
                const recipe = surfaceStyles[style]
                return (
                  <button
                    key={style}
                    type="button"
                    className={cn(
                      "rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                      surfaceStyle === style
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                    onClick={() => setSurfaceStyle(style)}
                  >
                    {recipe.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

**Important:** Before implementing, verify that the following shadcn/ui components exist in `src/core/components/ui/`:

- `popover.tsx` (Popover, PopoverContent, PopoverTrigger)
- `label.tsx` (Label)
- `separator.tsx` (Separator)
- `button.tsx` (Button) — already confirmed

If any are missing, install them first using `npx shadcn-ui@latest add popover label separator`.

---

## Task 9: Update barrel export, globals.css, index.html, Storybook

**Files:**

- Rewrite: `src/core/theme/index.ts`
- Modify: `src/styles/globals.css`
- Modify: `index.html`
- Rewrite: `.storybook/preview.tsx`

- [ ] **Step 1: Replace `src/core/theme/index.ts` with the following content**

```typescript
export { ThemeProvider } from "./theme-provider"
export { ThemeSwitcher } from "./theme-switcher"
export { useTheme } from "./use-theme"
export { generateTokens } from "./engine/generate-tokens"
export { accentColors } from "./palettes/accent-colors"
export { surfaceColors } from "./palettes/surface-colors"
export { surfaceStyles } from "./styles/surface-styles"
export { ACCENT_COLORS, SURFACE_COLORS, SURFACE_STYLES, MODES } from "./types"
export type {
  AccentColor,
  SurfaceColor,
  SurfaceStyle,
  Mode,
  ResolvedMode,
  ColorScale,
  SurfaceStyleRecipe,
  ThemeContextValue,
} from "./types"
```

- [ ] **Step 2: Replace `src/styles/globals.css` with the following content**

Remove all 6 theme CSS imports. The CSS variable values are now injected by ThemeProvider at runtime. Keep the Tailwind directives and base layer.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 217 91% 60%;
    --radius: 0.5rem;
    --chart-1: 217 91% 60%;
    --chart-2: 142 71% 45%;
    --chart-3: 350 89% 60%;
    --chart-4: 38 92% 50%;
    --chart-5: 258 90% 66%;
    --surface-base: 210 40% 98%;
    --surface-raised: 0 0% 100%;
    --surface-overlay: 0 0% 100%;
    --surface-sunken: 210 40% 96%;
    --surface-sidebar: 222 47% 11%;
    --surface-header: 0 0% 100%;
    --border-subtle: 210 40% 96%;
    --border-default: 214 32% 91%;
    --shadow-card: none;
    --shadow-dropdown:
      0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --backdrop-blur: none;
    --surface-opacity: 1;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings:
      "rlig" 1,
      "calt" 1;
  }

  h1,
  h2,
  h3 {
    @apply tracking-tight;
  }
}
```

The `:root` block provides CSS variable defaults matching the default combination (blue accent, slate surface, default style, light mode). These serve as the initial values before ThemeProvider mounts and overwrites them via inline styles, preventing unstyled content flash.

- [ ] **Step 3: Replace the inline `<script>` in `index.html`**

Replace the entire `<script>` block in the `<head>` of `index.html` with:

```html
<script>
  ;(function () {
    var mode = localStorage.getItem("mode") || "system"
    var resolved =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode
    document.documentElement.setAttribute("data-mode", resolved)
  })()
</script>
```

The full `index.html` should be:

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
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <script>
      ;(function () {
        var mode = localStorage.getItem("mode") || "system"
        var resolved =
          mode === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : mode
        document.documentElement.setAttribute("data-mode", resolved)
      })()
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Replace `.storybook/preview.tsx` with the following content**

The Storybook toolbar now offers four axis selectors. The decorator calls `generateTokens()` and applies the CSS variables to `document.documentElement.style`, matching how ThemeProvider works at runtime.

```tsx
import type { Preview } from "@storybook/react"
import "../src/styles/globals.css"
import { generateTokens } from "../src/core/theme/engine/generate-tokens"
import {
  ACCENT_COLORS,
  SURFACE_COLORS,
  SURFACE_STYLES,
} from "../src/core/theme/types"
import type {
  AccentColor,
  SurfaceColor,
  SurfaceStyle,
  ResolvedMode,
} from "../src/core/theme/types"

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
    accentColor: {
      description: "Accent color",
      toolbar: {
        title: "Accent",
        icon: "paintbrush",
        items: [...ACCENT_COLORS],
        dynamicTitle: true,
      },
    },
    surfaceColor: {
      description: "Surface color",
      toolbar: {
        title: "Surface",
        icon: "photo",
        items: [...SURFACE_COLORS],
        dynamicTitle: true,
      },
    },
    surfaceStyle: {
      description: "Surface style",
      toolbar: {
        title: "Style",
        icon: "component",
        items: [...SURFACE_STYLES],
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
    accentColor: "blue",
    surfaceColor: "slate",
    surfaceStyle: "default",
    mode: "light",
  },
  decorators: [
    (Story, context) => {
      const accentColor = (context.globals.accentColor || "blue") as AccentColor
      const surfaceColor = (context.globals.surfaceColor ||
        "slate") as SurfaceColor
      const surfaceStyle = (context.globals.surfaceStyle ||
        "default") as SurfaceStyle
      const mode = (context.globals.mode || "light") as ResolvedMode

      document.documentElement.setAttribute("data-mode", mode)

      const tokens = generateTokens({
        accentColor,
        surfaceColor,
        surfaceStyle,
        mode,
      })

      for (const [key, value] of Object.entries(tokens)) {
        document.documentElement.style.setProperty(key, value)
      }

      return <Story />
    },
  ],
}

export default preview
```

---

## Task 10: Delete old theme files

**Files:**

- Delete: `src/core/theme/primitives.css`
- Delete: `src/core/theme/themes/default.css`
- Delete: `src/core/theme/themes/emerald.css`
- Delete: `src/core/theme/themes/rose.css`
- Delete: `src/core/theme/themes/amber.css`
- Delete: `src/core/theme/themes/violet.css`
- Delete: `src/core/theme/themes/` (directory, if empty)

- [ ] **Step 1: Delete all old theme CSS files**

Run:

```bash
rm src/core/theme/primitives.css
rm -rf src/core/theme/themes/
```

- [ ] **Step 2: Verify no remaining imports reference deleted files**

Search the codebase for any imports of `primitives.css`, `themes/default.css`, etc. If any are found, remove those import lines. The only file that imported them was `src/styles/globals.css`, which was already updated in Task 9.

---

## Task 11: Final verification

- [ ] **Step 1: Run TypeScript type checking**

```bash
npx tsc --noEmit
```

Fix any type errors. Common issues to watch for:

- Old `Theme` type references anywhere in the codebase
- Old `setTheme` references in components
- Imports of `THEMES` from the theme barrel export

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 3: Run tests**

```bash
npm run test
```

Both `generate-tokens.test.ts` and `use-theme.test.tsx` must pass. Fix any failures.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Build must succeed with zero errors.

- [ ] **Step 5: Search for stale references to the old theme system**

Search the entire codebase for these patterns and update any remaining references:

- `data-theme` — remove any references (except if third-party libraries use it)
- `setTheme` — replace with the appropriate new setter (`setAccentColor`, `setSurfaceColor`, etc.)
- `theme:` or `theme =` where it refers to the old 5-value `Theme` type
- Imports of `THEMES` or `Theme` from `@/core/theme` — replace with the new types
- Any CSS that references `var(--gray-*)`, `var(--blue-*)`, etc. (the old primitive CSS variables) — these no longer exist since `primitives.css` was deleted

Fix all stale references found.
