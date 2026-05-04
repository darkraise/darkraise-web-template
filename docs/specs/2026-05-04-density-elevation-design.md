# Density and Elevation Theme Axes

**Date:** 2026-05-04
**Status:** Design — pending review

## Overview

Add three new theme axes to the existing system in `packages/ui/src/theme`: `density`, `elevation`, and `buttonElevation`. Each has four levels. They work as global theming knobs that the user can toggle from the `ThemeSwitcher` panel, persist to localStorage, and round-trip through any configured `ThemePersistenceAdapter`. Density retroactively reskins control sizes, container padding, and vertical rhythm across existing components and layouts. Elevation drives drop shadows on overlay and modal surfaces. Button elevation is a separate axis so the modern flat-button default can coexist with users who prefer raised buttons.

## Background and motivation

The theme already supports `accentColor`, `surfaceColor`, `surfaceStyle`, `backgroundStyle`, and `mode`. Users are asking for two additional dimensions of control:

1. **Density.** GitHub, Linear, Notion, and Gmail all expose density as a first-class user preference. Different products have different vertical-rhythm needs; today's `darkraise-ui` is opinionated toward dense (button height `h-8`, tight nav items) with no escape hatch.
2. **Elevation.** The current `--shadow-card` and `--shadow-dropdown` tokens are tied to the `surfaceStyle` recipe (default vs. glass). Elevation should be a global axis the user can dial up or down independent of glass-vs-default, so the entire UI can feel flat-and-bordered, subtle, normal, or dramatic without changing the surface style.

The audit captured here drove the decision to make elevation hierarchy-aware (only overlay-class components get shadows by default), to keep buttons flat by default and put their elevation behind a separate axis, and to use attribute-scoped CSS variables (rather than JS-emitted token values) for both new axes — matching the pattern that already exists for `data-mode` and `data-surface-style`.

## Goals

- Two new theme axes (`density` and `elevation`) plus a third button-specific axis (`buttonElevation`) plug into the existing `accentColor` / `surfaceColor` / etc. pattern with minimal new abstractions.
- Density retroactively resizes controls and reflows container padding across existing components without requiring callers to opt in.
- Elevation maps to real visual hierarchy (overlay surfaces, modal surfaces) and stays global. Buttons stay flat by default.
- All token values are exposed to consumers: density tokens as raw CSS variables for use in Tailwind arbitrary values (`p-[var(--density-container-p)]`), elevation tokens as both raw CSS variables and Tailwind utility classes (`shadow-medium`, `shadow-button`).
- `cozy` density and `medium` elevation reproduce today's UI as closely as possible, so existing apps don't visually shift on upgrade.

## Non-goals

- A full glass-style refactor. The current button glass shadows (chromatic outer glow on `.btn-glass-hue`, etc.) get simplified to use the new `--shadow-button` token; reintroducing a polished glass aesthetic on top of elevation is left to a follow-up.
- Typography scale. Density does not change font sizes; this avoids breaking layouts that were tuned around `text-sm` and overlapping with browser zoom.
- Dark-mode shadow tinting. A future enhancement could give `[data-mode="dark"]` softer or color-mixed shadows; this spec keeps elevation values mode-independent.
- Per-axis pinning at the role level (e.g. "this card always has `--shadow-modal` regardless of user setting"). The simplified token model means the four `--elevation-*` tokens shift with the user's setting; truly pinned shadows require hardcoding the literal shadow string.

## Type system and config

`packages/ui/src/theme/types.ts` gains:

```ts
export const DENSITIES = ["compact", "cozy", "comfortable", "spacious"] as const
export type Density = (typeof DENSITIES)[number]

export const ELEVATIONS = ["flat", "low", "medium", "high"] as const
export type Elevation = (typeof ELEVATIONS)[number]
```

`ThemeSettings` and `ThemeContextValue` extend with `density: Density`, `elevation: Elevation`, `buttonElevation: Elevation`. The context exposes `setDensity`, `setElevation`, `setButtonElevation` setters following the existing pattern. The persistence adapter's `load` and `save` methods round-trip these three new fields automatically because they are part of `ThemeSettings`.

`ThemeConfig` defaults:

```ts
defaults: {
  density: "cozy",
  elevation: "medium",
  buttonElevation: "flat",
}
switcher: {
  axes: {
    density: true,
    elevation: true,
    buttonElevation: true,
  }
}
```

The same defaults appear in `apps/template/src/theme.config.ts`. The CLI scaffolders (`scripts/init.mjs`, `create-app/bin/create.mjs`) accept three new flags (`--density`, `--elevation`, `--button-elevation`), validate them against the level lists, and generate the new fields into newly-scaffolded `theme.config.ts` files.

`packages/ui/src/theme/index.ts` exports `DENSITIES`, `ELEVATIONS`, `Density`, `Elevation` alongside the existing exports.

## Density tokens

Eight CSS variables, padding-driven (heights emerge from `padding × 2 + line-height` rather than being set directly):

| Token                   | Purpose                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--density-button-px`   | Button horizontal padding                                                                                                                                                  |
| `--density-button-py`   | Button vertical padding                                                                                                                                                    |
| `--density-input-px`    | Input/Select horizontal padding                                                                                                                                            |
| `--density-input-py`    | Input/Select/Textarea vertical padding                                                                                                                                     |
| `--density-cell`        | Square cell size for icon-only interactive cells (Button `icon` variant, Calendar day, Calendar nav, Pagination link, Breadcrumb ellipsis, InputOTP slot, Carousel arrows) |
| `--density-container-p` | Card content padding, FormSection padding                                                                                                                                  |
| `--density-row-py`      | Table row, Sidebar nav item, MenuItem vertical padding                                                                                                                     |
| `--density-stack-gap`   | Vertical gap between stacked rows                                                                                                                                          |

Per-level values, with **cozy reproducing today's button (32px) and input (36px) heights** at the current `text-sm` line-height (20px):

| Token                   | compact  | **cozy (today)** | comfortable | spacious |
| ----------------------- | -------- | ---------------- | ----------- | -------- |
| `--density-button-px`   | 0.5rem   | **0.75rem**      | 1rem        | 1.25rem  |
| `--density-button-py`   | 0.25rem  | **0.375rem**     | 0.5rem      | 0.625rem |
| `--density-input-px`    | 0.5rem   | **0.625rem**     | 0.875rem    | 1.125rem |
| `--density-input-py`    | 0.375rem | **0.5rem**       | 0.625rem    | 0.75rem  |
| `--density-cell`        | 1.75rem  | **2rem**         | 2.25rem     | 2.5rem   |
| `--density-container-p` | 0.75rem  | **1rem**         | 1.25rem     | 1.5rem   |
| `--density-row-py`      | 0.25rem  | **0.375rem**     | 0.5rem      | 0.625rem |
| `--density-stack-gap`   | 0.375rem | **0.5rem**       | 0.75rem     | 1rem     |

Button `sm` and `lg` size variants and the `icon` variant derive from these tokens:

- `sm` reduces both `py` and `px` by `0.125rem`.
- `lg` adds `0.25rem` to `py` and `0.5rem` to `px`.
- `icon` uses `aspect-square` with width fixed to `var(--density-cell)`.

These derivations keep the size variants tracking density without needing their own tokens.

### Density token implementation

Values are scoped via attribute selectors in `theme.css`. JavaScript only sets the `data-density` attribute on `documentElement`:

```css
:root {
  /* defaults match data-density="cozy" */
  --density-button-px: 0.75rem;
  --density-button-py: 0.375rem;
  /* ... eight tokens ... */
}

[data-density="compact"] {
  --density-button-px: 0.5rem;
  --density-button-py: 0.25rem;
  /* ... */
}

[data-density="comfortable"] {
  /* ... */
}
[data-density="spacious"] {
  /* ... */
}
```

`generate-tokens.ts` does not touch density. The provider's `applyTheme` adds `document.documentElement.setAttribute("data-density", density)` next to its existing `data-mode` and `data-surface-style` calls.

### Components migrated to consume density tokens

The following components replace hardcoded Tailwind sizing classes (`h-8`, `px-3`, `py-1`, etc.) with arbitrary-value classes that read the density tokens (`px-[var(--density-button-px)]`, `py-[var(--density-button-py)]`, etc.):

- `button.tsx` — heights drop entirely; `default`, `sm`, `lg` variants use derived padding; `icon` variant uses `aspect-square w-[var(--density-cell)]`.
- `input.tsx`, `select.tsx`, `textarea.tsx` — heights drop; padding tokens drive natural height. Textarea keeps its `min-h-[72px]` floor.
- `card.tsx` — `CardHeader`, `CardContent`, `CardFooter` padding switches from hardcoded `p-4` to `var(--density-container-p)`.
- `field.tsx` — vertical spacing between label/input/description.
- `forms/form-section.tsx`, `forms/form-actions.tsx` — padding and row gap.
- `layout/sidebar-nav.tsx` — nav item vertical padding via `var(--density-row-py)`.
- `layout/page-header.tsx` — vertical padding.
- `table.tsx` — `TableCell` vertical padding via `var(--density-row-py)`; `TableHead` height collapses to padding-driven.
- `menu-primitives.ts` — `MenuItem` vertical padding (covers DropdownMenu, ContextMenu, Menubar, Command items).
- `pagination.tsx`, `breadcrumb.tsx`, `input-otp.tsx`, `calendar.tsx` (day cells, nav buttons), `carousel.tsx` (arrow buttons) — square cells use `var(--density-cell)`.
- `toggle.tsx` — button-shaped control reuses button density tokens.
- `time-picker.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `command.tsx`, `tabs.tsx` — internal sizing replaced or simplified to derive from density tokens.

Components excluded by design (have their own size variants or fixed visual roles):

- Checkbox, RadioGroup, Avatar — explicit size prop / variants are intentional and would fight density.
- Switch (track and handle), Slider (track and thumb), Progress, ScrollArea thumb, Drawer pull handle, Resizable handle — fixed visual elements.
- All `h-4 w-4` icons inside controls.

The deliberate trade-off: Pagination link, Breadcrumb ellipsis, and InputOTP slot all shift from today's 36px to 32px at cozy as a side effect of unifying square cells under one token. This is a small visual regularization; if it reads wrong in the demo, a second `--density-cell-lg` token can be added later.

## Elevation tokens

Five CSS variables — four named per level, plus one alias for buttons:

| Token                | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `--elevation-flat`   | Level 0; always `none`                                             |
| `--elevation-low`    | Level 1 (anchored / clickable card / sticky header)                |
| `--elevation-medium` | Level 2 (overlay / popover / dropdown)                             |
| `--elevation-high`   | Level 3 (modal / sheet / drawer)                                   |
| `--shadow-button`    | Aliases one of the four levels based on the `buttonElevation` axis |

Per-level values (default — i.e., `data-elevation="medium"`):

| Token                | Value                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| `--elevation-flat`   | `none`                                                                  |
| `--elevation-low`    | `0 1px 2px 0 rgb(0 0 0 / 0.05)`                                         |
| `--elevation-medium` | `0 4px 12px -2px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.06)`    |
| `--elevation-high`   | `0 16px 24px -8px rgb(0 0 0 / 0.16), 0 6px 10px -4px rgb(0 0 0 / 0.08)` |

The user's elevation setting shifts these values uniformly through attribute scoping:

- `[data-elevation="flat"]` — all four levels resolve to `none`.
- `[data-elevation="low"]` — softer shadows than the defaults; levels still distinguishable.
- `[data-elevation="medium"]` — defaults (today's anchor).
- `[data-elevation="high"]` — stronger shadows; modal becomes dramatic.

Component CSS rules pick a level by role:

- `.glass-strong` (overlays): `box-shadow: var(--elevation-medium), var(--inset-hi-strong)`.
- `.modal-surface` (modals; new class): `box-shadow: var(--elevation-high), var(--inset-hi-strong)`.
- `.glass`, `.card-surface` (static cards, inputs, calendars, table wrapper, tabs list): no drop shadow — `box-shadow: var(--inset-hi)` only. Cards stay flat per the rule that elevation should map to real hierarchy.

Components that gain elevation by virtue of `.glass-strong` or `.modal-surface`:

- **Overlay (`.glass-strong` → `--elevation-medium`):** Popover, Tooltip, HoverCard, Command, DropdownMenu, ContextMenu, Menubar (popover content), NavigationMenu viewport, Sonner toast, VirtualizedDropdownMenu, Select content, Chart tooltip.
- **Modal (`.modal-surface` → `--elevation-high`):** Dialog, AlertDialog, Sheet, Drawer.

Static cards, inputs, table rows, and form sections do _not_ get drop shadows. The current `.glass` rule's `var(--shadow-md)` is removed; shadows on these components disappear in default surface style. This is a deliberate visual change aligned with the philosophy that "if you remove the shadow and the user can no longer tell what's clickable or what's floating, the elevation was earning its keep."

Decorative shadows that stay (not surface elevation):

- Switch handle (`shadow-lg` on the knob)
- NavigationMenu arrow (`shadow-md` on the pointer triangle)

## Button elevation

A third axis, `buttonElevation: Elevation`, controls drop shadows on button-shaped controls independently of the global elevation setting. Default is `flat` — buttons stay modern-flat by default.

Single token:

| Token             | Default value           |
| ----------------- | ----------------------- |
| `--shadow-button` | `var(--elevation-flat)` |

Bound via attribute selectors:

```css
[data-button-elevation="flat"] {
  --shadow-button: var(--elevation-flat);
}
[data-button-elevation="low"] {
  --shadow-button: var(--elevation-low);
}
[data-button-elevation="medium"] {
  --shadow-button: var(--elevation-medium);
}
[data-button-elevation="high"] {
  --shadow-button: var(--elevation-high);
}
```

Components reading `var(--shadow-button)`:

- `.btn-glass-hue` — outer drop-shadow layer becomes `var(--shadow-button)`. Inset rim and decorative inner ring stay. The colored hue glow is removed.
- `.btn-glass-neutral` — outer drop shadow becomes `var(--shadow-button)`. Inset rim stays.
- `.btn-ghost-glass:hover` — outer drop shadow becomes `var(--shadow-button)`.
- `.tab-glass-hue[data-state="active"]` — outer drop shadow becomes `var(--shadow-button)`.
- Toggle (button-shaped control) — inherits via shared rules.

Why a separate axis instead of folding under `elevation`? Splitting them gives users the full grid: e.g., `elevation: medium` + `buttonElevation: flat` is the modern Linear/Stripe look, while `elevation: medium` + `buttonElevation: medium` is the older Material look. Deriving `buttonElevation` from `elevation` would prevent the most common combination.

## Tailwind utilities

Both axes expose tokens through Tailwind v4's `@theme inline` block:

```css
@theme inline {
  --shadow-flat: var(--elevation-flat);
  --shadow-low: var(--elevation-low);
  --shadow-medium: var(--elevation-medium);
  --shadow-high: var(--elevation-high);
  --shadow-button: var(--shadow-button);
}
```

This generates utility classes `shadow-flat`, `shadow-low`, `shadow-medium`, `shadow-high`, `shadow-button`. Density tokens stay as plain CSS variables consumed via Tailwind arbitrary values (`p-[var(--density-container-p)]`); Tailwind doesn't have a built-in spacing-token namespace.

Consumers use elevation either by role token (`var(--elevation-medium)` or `shadow-medium`) or via raw CSS shadow strings (escape hatch for true pinning that ignores the user setting).

## Theme provider wiring

`packages/ui/src/theme/theme-provider.tsx` gains:

- Three new state slots backed by localStorage keys `theme-density`, `theme-elevation`, `theme-button-elevation`.
- Three new setters (`setDensity`, `setElevation`, `setButtonElevation`) following the existing pattern: state update, localStorage write, attribute change, `notifyChange`, `debouncedSave`.
- Inside `applyTheme`:

```ts
document.documentElement.setAttribute("data-density", density)
document.documentElement.setAttribute("data-elevation", elevation)
document.documentElement.setAttribute("data-button-elevation", buttonElevation)
```

- `applySettings` (used by the persistence adapter load path) sets the same three attributes.

`generate-tokens.ts` does not change for either new axis — both are CSS-attribute-driven.

## Switcher panel

`packages/ui/src/theme/theme-switcher.tsx` gains three new sections, each gated by its `axes` flag, sequenced after Surface Style:

1. **Density** — four labeled buttons (`Compact`, `Cozy`, `Comfortable`, `Spacious`).
2. **Elevation** — four labeled buttons (`Flat`, `Low`, `Medium`, `High`).
3. **Button Elevation** — four labeled buttons (`Flat`, `Low`, `Medium`, `High`).

Each follows the existing Surface Style section's button layout (text labels, no icon). The popover already filters empty sections, so projects that disable all three flags see no panel changes.

## Pre-render initialization

`apps/template/index.html` already has an inline script that reads `theme-mode` from localStorage and sets `data-mode` before React hydrates. The script extends to set the three new attributes:

```js
;["density", "elevation", "button-elevation"].forEach((axis) => {
  const v = localStorage.getItem("theme-" + axis)
  if (v) document.documentElement.setAttribute("data-" + axis, v)
})
```

Without this, a user with non-default density or elevation would see a one-frame flash at the default values on every reload. `create-app/bin/create.mjs` generates the same script for new projects.

## Testing

`packages/ui/src/theme/use-theme.test.tsx` gains:

- One test per new setter asserting state update, localStorage write, and `documentElement` attribute change.
- An extension to the persisted-load fixture covering `density: "spacious"`, `elevation: "high"`, `buttonElevation: "low"` — round-trips through the persistence adapter and reflects on the context value, in localStorage, and in document attributes.
- One test asserting that defaults from `themeConfig` flow through when no localStorage values exist.

`generate-tokens.test.ts` does not need new tests; density and elevation skip generate-tokens entirely.

CSS rule correctness is verified manually via the demo app rather than unit-tested, because jsdom does not reliably resolve attribute-scoped CSS variables. The demo app's `customization.tsx` route gains a section that toggles each axis live across all four levels.

## Visual regressions to expect

These are intentional changes from today, called out so reviewers can confirm they read as improvements:

- Default-style Cards, Inputs, Selects, Textareas, Calendars (standalone), Tables, and Tabs lists lose their subtle drop shadow. They become border-only.
- Buttons lose their colored outer glow (the `0 10px 32px color-mix(in oklab, var(--hue) 40%, transparent)` layer on `.btn-glass-hue`). Inset rim and decorative inner ring stay.
- Pagination link, Breadcrumb ellipsis, and InputOTP slot shift from 36px to 32px square at cozy density.
- Tabs trigger active state loses its inline `shadow-sm`; active state still reads through color and border.
- Today's UI overall (default style + cozy density + medium elevation + flat buttonElevation) looks visually close to what shipped — buttons and inputs match heights, overlay shadows match magnitude. Static cards and form controls becoming flat is the most visible change.

## Files touched

**Theme core:**

- `packages/ui/src/theme/types.ts`
- `packages/ui/src/theme/theme.config.ts`
- `packages/ui/src/theme/theme-provider.tsx`
- `packages/ui/src/theme/theme-switcher.tsx`
- `packages/ui/src/theme/index.ts`
- `packages/ui/src/theme/use-theme.test.tsx`
- `apps/template/src/theme.config.ts`

**CSS:**

- `packages/ui/src/styles/theme.css`

**Components consuming density tokens:**

- `button.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`, `card.tsx`, `field.tsx`, `table.tsx`, `toggle.tsx`, `pagination.tsx`, `breadcrumb.tsx`, `input-otp.tsx`, `calendar.tsx`, `time-picker.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `carousel.tsx`, `command.tsx`, `tabs.tsx`, `menu-primitives.ts`
- `forms/form-section.tsx`, `forms/form-actions.tsx`
- `layout/sidebar-nav.tsx`, `layout/page-header.tsx`

**Components adding `modal-surface` class:**

- `dialog.tsx`, `alert-dialog.tsx` (also drops inline `shadow-lg`), `sheet.tsx`, `drawer.tsx`

**Pre-render init:**

- `apps/template/index.html`

**Scaffolding:**

- `scripts/init.mjs`
- `create-app/bin/create.mjs`

**Demo / verification:**

- `apps/template/src/routes/_authenticated/components/customization.tsx`

## Open follow-ups

- **Glass aesthetic refactor.** This spec simplifies button shadows and removes the hue-glow on `.btn-glass-hue`. A polished glass refactor can later layer chromatic effects back on top of the elevation token, conditional on `[data-surface-style="glassmorphism"]`.
- **Dark-mode shadow tinting.** Future work could give `[data-mode="dark"]` softer or color-mixed shadows, since drop shadows barely register on dark backgrounds.
- **Per-level pinning at the role-token level.** If experience shows components frequently need to pin a shadow value that ignores the user's elevation setting, a separate set of static-value tokens (e.g. `--elevation-fixed-high`) can be added. Today's escape hatch is hardcoding the literal shadow string.
- **Possible second `--density-cell-lg` token.** If shrinking Pagination/Breadcrumb/OTP from 36px to 32px reads wrong in the demo, adding a larger square-cell token is a small follow-up.
