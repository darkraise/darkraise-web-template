# Four-Axis Theme System — Design Specification

Redesign the template's theming system from five hardcoded themes into four independent, combinable axes: mode (light/dark/system), accent color (17 Tailwind chromatic palettes), surface color (12 neutral palettes), and surface style (12 visual patterns). This produces nearly 5,000 unique theme combinations from a compact, maintainable data set.

## Goals

- Replace the current five static CSS theme files with a runtime token generation engine
- Make accent color, surface color, and surface style independently selectable
- Support all Tailwind CSS chromatic colors as accent options
- Provide 12 neutral surface color palettes spanning cool to warm tones
- Provide 12 surface style recipes that control visual depth, borders, shadows, and effects
- Keep the same CSS variable interface so shadcn/ui components and Tailwind config need no changes
- Persist all four selections to localStorage and prevent flash of unstyled content

## The Four Axes

### Axis 1: Mode

Controls light/dark appearance. Three options: `light`, `dark`, `system` (follows OS preference).

Applied as `data-mode="light"` or `data-mode="dark"` on `<html>`. The mode determines which end of the color scale is used — light mode maps backgrounds to the 50-100 range, dark mode maps them to the 900-950 range.

### Axis 2: Accent Color (17 options)

The primary/brand color. All 17 chromatic color families from Tailwind CSS:

| #   | Name    | Tailwind Class Prefix |
| --- | ------- | --------------------- |
| 1   | Red     | `red`                 |
| 2   | Orange  | `orange`              |
| 3   | Amber   | `amber`               |
| 4   | Yellow  | `yellow`              |
| 5   | Lime    | `lime`                |
| 6   | Green   | `green`               |
| 7   | Emerald | `emerald`             |
| 8   | Teal    | `teal`                |
| 9   | Cyan    | `cyan`                |
| 10  | Sky     | `sky`                 |
| 11  | Blue    | `blue`                |
| 12  | Indigo  | `indigo`              |
| 13  | Violet  | `violet`              |
| 14  | Purple  | `purple`              |
| 15  | Fuchsia | `fuchsia`             |
| 16  | Pink    | `pink`                |
| 17  | Rose    | `rose`                |

The five Tailwind gray families (slate, gray, zinc, neutral, stone) are excluded — they belong to the surface color axis.

Each accent color is stored as a full HSL palette (shades 50 through 950). The engine uses shade 500 for `--primary` in light mode, shade 400 in dark mode. For `--primary-foreground`, it uses white (`0 0% 100%`) for most colors, but dark foreground (shade 950) for light accent colors (amber, yellow, lime) to maintain contrast.

Chart colors (`--chart-1` through `--chart-5`) are derived by selecting 5 evenly spaced chromatic palettes starting from the accent color. For example, if the accent is blue (index 10 in the 17-color list), the chart colors are blue-500, green-500, rose-500, amber-500, and violet-500 — skipping roughly 3-4 positions each step and wrapping around. The `--ring` token matches `--primary`.

### Axis 3: Surface Color (12 options)

The neutral/gray family used for backgrounds, cards, borders, muted text, and all non-accent surfaces. Ordered from coolest to warmest tone:

| #   | Name     | Source             | Undertone                 |
| --- | -------- | ------------------ | ------------------------- |
| 1   | Slate    | Tailwind `slate`   | Blue-gray                 |
| 2   | Gray     | Tailwind `gray`    | Slightly blue-green       |
| 3   | Cool     | Custom             | Pure cool gray            |
| 4   | Zinc     | Tailwind `zinc`    | Violet tint               |
| 5   | Neutral  | Tailwind `neutral` | True achromatic           |
| 6   | Iron     | Custom             | Slight warm shift         |
| 7   | Mauve    | Custom             | Purple-pink undertone     |
| 8   | Graphite | Custom             | Dense, slightly warm      |
| 9   | Stone    | Tailwind `stone`   | Light warm undertone      |
| 10  | Sand     | Custom             | Yellow-warm               |
| 11  | Olive    | Custom             | Green-warm tint           |
| 12  | Sepia    | Custom             | Strongest warm, parchment |

The five Tailwind built-ins (slate, gray, zinc, neutral, stone) use their actual Tailwind HSL values. The seven custom palettes are hand-crafted HSL scales following the same 50-950 step pattern with consistent lightness progression.

Each surface color provides a full 50-950 HSL scale. The engine maps scale steps to semantic tokens based on the resolved mode:

**Light mode mapping:**

- `--background`: step 50
- `--foreground`: step 900
- `--card` / `--popover`: white (0 0% 100%)
- `--card-foreground` / `--popover-foreground`: step 900
- `--secondary`: step 100
- `--secondary-foreground`: step 900
- `--muted`: step 100
- `--muted-foreground`: step 500
- `--accent`: step 100
- `--accent-foreground`: step 900
- `--destructive`: red-500 (hardcoded)
- `--destructive-foreground`: white
- `--border`: step 200
- `--input`: step 200

**Dark mode mapping:**

- `--background`: step 950
- `--foreground`: step 50
- `--card` / `--popover`: step 900
- `--card-foreground` / `--popover-foreground`: step 50
- `--secondary`: step 800
- `--secondary-foreground`: step 50
- `--muted`: step 800
- `--muted-foreground`: step 400
- `--accent`: step 800
- `--accent-foreground`: step 50
- `--destructive`: red-600 (hardcoded)
- `--destructive-foreground`: white
- `--border`: step 800
- `--input`: step 800

### Axis 4: Surface Style (12 options)

Visual patterns that control how surfaces, borders, shadows, and effects are rendered. Each style is a "recipe" — a set of token mappings and CSS property overrides.

#### Style Definitions

**1. Default** — Subtle elevation through background color shifts. No shadows. Clean and neutral.

- surface-raised: white (light) / step 900 (dark)
- shadow: none
- border-width: 1px
- radius: 0.5rem
- backdrop-blur: none
- surface-opacity: 1

**2. Flat** — No visual distinction between surface levels. Borders do all separation work.

- surface-raised: same as base (no lift)
- shadow: none
- border-width: 1px
- radius: 0.5rem
- backdrop-blur: none
- surface-opacity: 1

**3. Bordered** — Flat surfaces with prominent borders. Strong grid/panel feel.

- surface-raised: same as base
- shadow: none
- border-width: 2px
- radius: 0.375rem
- backdrop-blur: none
- surface-opacity: 1

**4. Elevated** — Soft shadows for layering. Cards float above the background.

- surface-raised: white (light) / step 900 (dark)
- shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
- border-width: 1px
- radius: 0.5rem
- backdrop-blur: none
- surface-opacity: 1

**5. Layered** — More aggressive depth with stacked shadow layers. Clear visual hierarchy.

- surface-raised: white (light) / step 900 (dark)
- shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
- border-width: 0
- radius: 0.75rem
- backdrop-blur: none
- surface-opacity: 1

**6. Glassmorphism** — Frosted glass effect with backdrop-blur, semi-transparent surfaces.

- surface-raised: white (light) / step 900 (dark)
- shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1)
- border-width: 1px
- radius: 0.75rem
- backdrop-blur: 12px
- surface-opacity: 0.8

**7. High Contrast** — Maximum separation between surface levels. Sharp borders, bold differences.

- surface-raised: white (light) / step 950 (dark)
- shadow: none
- border-width: 2px
- radius: 0.375rem
- backdrop-blur: none
- surface-opacity: 1
- Special: uses step 950 for foreground in light mode (instead of 900), step 50 for foreground in dark mode. Borders use step 300 (light) / step 600 (dark) for stronger contrast.

**8. Muted** — Very low contrast between surfaces. Soft, calm feel.

- surface-raised: step 50 (light) / step 900 (dark)
- shadow: none
- border-width: 1px
- radius: 0.5rem
- backdrop-blur: none
- surface-opacity: 1
- Special: borders use step 100 (light) / step 800 (dark) for minimal contrast.

**9. Compact** — Tighter radius, dense information display.

- surface-raised: white (light) / step 900 (dark)
- shadow: none
- border-width: 1px
- radius: 0.25rem
- backdrop-blur: none
- surface-opacity: 1

**10. Translucent** — Semi-transparent surfaces without blur. Light, airy feel.

- surface-raised: white (light) / step 900 (dark)
- shadow: none
- border-width: 1px
- radius: 0.5rem
- backdrop-blur: none
- surface-opacity: 0.85

**11. Tinted** — Surfaces lightly tinted with the accent color. Brand-forward.

- surface-raised: accent-50 (light) / accent-950 (dark)
- shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)
- border-width: 1px
- radius: 0.5rem
- backdrop-blur: none
- surface-opacity: 1
- Special: this is the only style that crosses axes — it reads from the accent color palette to tint surface backgrounds. The `--accent` and `--accent-foreground` tokens also use the accent palette instead of the surface palette.

**12. Bold** — Dark sidebar and header regardless of mode. Vibrant accent usage.

- surface-raised: white (light) / step 800 (dark)
- shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)
- border-width: 0
- radius: 0.75rem
- backdrop-blur: none
- surface-opacity: 1
- Special: surface-sidebar and surface-header always use step 900/950 even in light mode.

#### Surface Style Token Mapping

Each style recipe maps these tokens, referencing the surface color scale:

| Token               | Description                       |
| ------------------- | --------------------------------- |
| `--surface-base`    | Page background                   |
| `--surface-raised`  | Cards, sections                   |
| `--surface-overlay` | Modals, popovers, dropdowns       |
| `--surface-sunken`  | Inset areas, well backgrounds     |
| `--surface-sidebar` | Sidebar navigation chrome         |
| `--surface-header`  | Top header bar                    |
| `--border-subtle`   | Light separators                  |
| `--border-default`  | Standard borders                  |
| `--radius`          | Border radius for components      |
| `--shadow-card`     | Box shadow for cards              |
| `--shadow-dropdown` | Box shadow for dropdowns/popovers |
| `--backdrop-blur`   | Backdrop filter blur amount       |
| `--surface-opacity` | Opacity for raised surfaces       |

## Architecture

### File Structure

```
src/core/theme/
├── palettes/
│   ├── accent-colors.ts       — 17 chromatic HSL palettes (50-950)
│   └── surface-colors.ts      — 12 neutral HSL palettes (50-950)
├── styles/
│   └── surface-styles.ts      — 12 style recipe definitions
├── engine/
│   └── generate-tokens.ts     — combines axes → CSS variable record
├── theme-provider.tsx          — React context, localStorage, applies tokens
├── theme-switcher.tsx          — UI with dropdowns/pickers for all 4 axes
├── use-theme.ts                — consumer hook
├── types.ts                    — AccentColor, SurfaceColor, SurfaceStyle, Mode types
└── index.ts                    — barrel export
```

### Palette Data Format

Each palette is a record mapping shade numbers to HSL strings:

```typescript
type ColorScale = Record<
  50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950,
  string
>

// Example:
const blue: ColorScale = {
  50: "214 100% 97%",
  100: "214 95% 93%",
  // ...
  900: "224 64% 33%",
  950: "226 57% 21%",
}
```

### Style Recipe Format

```typescript
interface SurfaceStyleRecipe {
  name: string
  label: string
  description: string
  tokens: {
    surfaceRaised: (scale: ColorScale, mode: "light" | "dark") => string
    surfaceOverlay: (scale: ColorScale, mode: "light" | "dark") => string
    surfaceSunken: (scale: ColorScale, mode: "light" | "dark") => string
    surfaceSidebar: (scale: ColorScale, mode: "light" | "dark") => string
    surfaceHeader: (scale: ColorScale, mode: "light" | "dark") => string
    borderSubtle: (scale: ColorScale, mode: "light" | "dark") => string
    borderDefault: (scale: ColorScale, mode: "light" | "dark") => string
  }
  overrides: {
    radius: string
    shadowCard: string
    shadowDropdown: string
    backdropBlur: string
    surfaceOpacity: string
    borderWidth?: string
  }
}
```

The token functions receive the surface color scale and mode, and return the HSL value to use. This allows styles to pick different scale steps per mode and per token. The "Tinted" style also receives the accent palette to tint surfaces.

### Token Generation Engine

```typescript
interface GenerateTokensInput {
  accentColor: AccentColor
  surfaceColor: SurfaceColor
  surfaceStyle: SurfaceStyle
  mode: "light" | "dark"
}

function generateTokens(input: GenerateTokensInput): Record<string, string>
```

This function:

1. Looks up the accent color palette from `accent-colors.ts`
2. Looks up the surface color palette from `surface-colors.ts`
3. Looks up the style recipe from `surface-styles.ts`
4. Generates accent tokens (--primary, --ring, --chart-1..5)
5. Generates surface color tokens (--background, --foreground, --card, --muted, --border, etc.)
6. Generates surface style tokens (--surface-_, --radius, --shadow-_, --backdrop-blur, --surface-opacity)
7. Returns a flat `Record<string, string>` of all CSS variable values

### ThemeProvider Changes

The provider state expands from `{ theme, mode }` to `{ accentColor, surfaceColor, surfaceStyle, mode }`. All four values persist to localStorage. On mount (and on any change), it calls `generateTokens()` and applies the result by setting `style` properties on `document.documentElement`.

The `data-mode` attribute is still set for Tailwind's `darkMode: ["selector", '[data-mode="dark"]']` support. The `data-theme` attribute is removed since themes are no longer a single selector.

### ThemeContext API

```typescript
interface ThemeContextValue {
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

### ThemeSwitcher UI

The existing dropdown-based ThemeSwitcher is replaced with a richer component containing four sections:

1. **Mode toggle** — Three-button toggle (light / dark / system) with icons
2. **Accent color picker** — Grid of 17 color swatches showing each accent at shade 500
3. **Surface color picker** — Grid of 12 neutral swatches showing each surface at shade 500
4. **Surface style selector** — Dropdown or grid of 12 style names with short descriptions

The switcher can be rendered as a popover from a toolbar button (same as current) or as a full settings panel.

### Flash of Unstyled Content Prevention

The inline `<script>` in `index.html` reads all four values from localStorage and calls a minimal token generation function to set CSS variables before React hydrates. This script must be kept small — it only needs the default token values for the stored combination, not the full palette data.

Approach: a `<style>` tag in `index.html` hardcodes the CSS variables for the default combination (blue accent, slate surface, default style, light mode) as `:root` values. The inline `<script>` reads the four stored values from localStorage and sets `data-mode` on `<html>`. When the ThemeProvider mounts, it calls `generateTokens()` and overwrites the CSS variables via `document.documentElement.style`. If the user has customized their theme, there is a sub-100ms flash from the default CSS to their selection — acceptable for a client-rendered SPA.

## What Changes from Current System

| Current                                         | New                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `primitives.css` — HSL values in CSS            | `palettes/accent-colors.ts` + `palettes/surface-colors.ts` — HSL values in TypeScript |
| `themes/*.css` — 5 static theme files           | `styles/surface-styles.ts` — 12 style recipes in TypeScript                           |
| CSS selectors `[data-theme="x"][data-mode="y"]` | Runtime JS injection via `document.documentElement.style`                             |
| `data-theme` attribute (5 values)               | `data-mode` attribute only (light/dark). Theme state in JS context.                   |
| `Theme` type = 5 fixed names                    | `AccentColor` (17) + `SurfaceColor` (12) + `SurfaceStyle` (12) types                  |
| `ThemeSwitcher` — simple dropdown               | `ThemeSwitcher` — multi-section picker with color grids                               |
| `globals.css` imports 6 CSS files               | `globals.css` — just Tailwind directives and base layer                               |

### Files Deleted

- `src/core/theme/primitives.css`
- `src/core/theme/themes/default.css`
- `src/core/theme/themes/emerald.css`
- `src/core/theme/themes/rose.css`
- `src/core/theme/themes/amber.css`
- `src/core/theme/themes/violet.css`

### Files Created

- `src/core/theme/palettes/accent-colors.ts`
- `src/core/theme/palettes/surface-colors.ts`
- `src/core/theme/styles/surface-styles.ts`
- `src/core/theme/engine/generate-tokens.ts`

### Files Modified

- `src/core/theme/types.ts` — new type definitions
- `src/core/theme/theme-provider.tsx` — four-axis state, runtime token injection
- `src/core/theme/theme-switcher.tsx` — multi-section UI
- `src/core/theme/use-theme.ts` — updated context type
- `src/core/theme/index.ts` — updated exports
- `src/styles/globals.css` — remove theme CSS imports, add minimal CSS fallback
- `index.html` — update inline script for four-axis localStorage
- `src/core/theme/use-theme.test.tsx` — update tests for new API
- `.storybook/preview.tsx` — update Storybook toolbar for four axes

### No Changes Required

- `tailwind.config.ts` — still references `hsl(var(--primary))` etc., unchanged
- All shadcn/ui components — they consume CSS variables, unchanged
- All layout components — they consume CSS variables, unchanged
- All feature modules — they consume CSS variables, unchanged
- All demo pages — they consume CSS variables, unchanged
- The `Sidebar` color utility in Tailwind config uses `hsl(var(--surface-sidebar))`, unchanged

### Impact on Existing Demo

The e-commerce admin demo continues to work without changes. The default combination (blue accent, slate surface, default style, light mode) produces the same visual result as the current "default" theme. The ThemeSwitcher in the header now offers the full four-axis picker instead of the simple theme/mode dropdown.
