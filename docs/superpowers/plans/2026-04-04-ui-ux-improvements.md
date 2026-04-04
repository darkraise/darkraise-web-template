# UI/UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ten targeted UI/UX improvements to the web template that enhance theme transitions, interactivity, visual polish, and customization depth.

**Tech Stack:** React, TypeScript, Tailwind CSS v3, shadcn/ui, Recharts, Google Fonts, CSS custom properties

**Dependencies between tasks:** Tasks 1-7 are independent of each other. Task 8 (font family axis) and Task 10 (density axis) both modify the theme system types, context, provider, switcher, and generate-tokens engine, so they share a dependency surface but can be done in either order. Task 9 is a standalone refactor of the components page.

---

## File Structure (new/modified files)

```
src/styles/globals.css                                    — Tasks 1, 10
src/features/dashboard/components/stat-card.tsx            — Task 2
src/features/dashboard/components/kpi-card.tsx             — Task 2
src/features/auth/components/auth-layout.tsx               — Task 3
src/core/theme/types.ts                                    — Tasks 8, 10
src/core/theme/theme-provider.tsx                          — Tasks 8, 10
src/core/theme/theme-switcher.tsx                          — Tasks 8, 10
src/core/theme/engine/generate-tokens.ts                   — Tasks 4, 8, 10
src/core/theme/index.ts                                    — Tasks 8, 10
src/core/layout/sidebar-layout.tsx                         — Task 4
src/routes/_authenticated/components.tsx                   — Tasks 5, 6, 9
src/features/charts/components/area-chart.tsx              — Task 7
src/features/charts/components/bar-chart.tsx               — Task 7
src/features/charts/components/line-chart.tsx              — Task 7
src/features/charts/components/chart-tooltip.tsx           — Task 7
src/features/charts/hooks/use-chart-colors.ts              — Task 7
src/core/theme/palettes/font-families.ts                   — Task 8 (new)
src/core/theme/engine/font-loader.ts                       — Task 8 (new)
index.html                                                 — Task 8
tailwind.config.ts                                         — Tasks 8, 10
```

---

## Task 1: Smooth theme transition animations

**Goal:** Add CSS transitions to body, card surfaces, and overlay surfaces so theme switching feels polished instead of jarring.

**Files modified:**

- `src/styles/globals.css`

### Step 1.1 — Add transition declarations

- [ ] In `src/styles/globals.css`, add transition properties to `body`, `.card-surface`, `.overlay-surface`, and the sidebar/header layout selectors.

In the `@layer base` block, modify the existing `body` rule (the second one, starting at line 76) and the `.card-surface` and `.overlay-surface` rules:

```css
/* Replace the second body rule (line 75-78) with: */
body {
  background: var(--bg-gradient, none);
  background-color: hsl(var(--background));
  transition:
    background-color 150ms ease-in-out,
    color 150ms ease-in-out;
}

/* Replace .card-surface (lines 84-89) with: */
.card-surface {
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--backdrop-filter, none);
  -webkit-backdrop-filter: var(--backdrop-filter, none);
  transition:
    background-color 150ms ease-in-out,
    color 150ms ease-in-out,
    border-color 150ms ease-in-out,
    box-shadow 150ms ease-in-out;
}

/* Replace .overlay-surface (lines 91-96) with: */
.overlay-surface {
  border-radius: var(--radius);
  box-shadow: var(--shadow-dropdown);
  backdrop-filter: var(--backdrop-filter, none);
  -webkit-backdrop-filter: var(--backdrop-filter, none);
  transition:
    background-color 150ms ease-in-out,
    color 150ms ease-in-out,
    border-color 150ms ease-in-out,
    box-shadow 150ms ease-in-out;
}
```

Add a new rule after `.overlay-surface` for the layout shell elements:

```css
.theme-transition {
  transition:
    background-color 150ms ease-in-out,
    color 150ms ease-in-out,
    border-color 150ms ease-in-out;
}
```

### Step 1.2 — Apply the transition class to layout shell

- [ ] In `src/core/layout/sidebar-layout.tsx`, add `theme-transition` class to the `<aside>` element (sidebar) and the `<header>` element.

On the `<aside>` element (line 32), append `theme-transition` to the className:

```tsx
<aside
  className={cn(
    "hidden flex-col border-r border-border-default bg-surface-sidebar text-gray-300 transition-all duration-300 theme-transition md:flex",
    collapsed ? "w-16" : "w-64",
  )}
>
```

On the `<header>` element (line 121), append `theme-transition`:

```tsx
<header className="flex h-14 items-center gap-2 border-b border-border bg-surface-header px-4 theme-transition">
```

### Step 1.3 — Verify

- [ ] Run `npx tsc --noEmit` to confirm no type errors.
- [ ] Start the dev server, switch between light/dark mode and accent colors. Background, card, and sidebar colors should animate smoothly over 150ms instead of snapping instantly.

### Commit

```
feat(theme): add smooth transition animations for theme switching
```

---

## Task 2: Dashboard card hover states

**Goal:** Add hover effects to StatCard and KPICard: subtle translate-y lift, shadow increase, and smooth transition. Makes the dashboard feel interactive.

**Files modified:**

- `src/features/dashboard/components/stat-card.tsx`
- `src/features/dashboard/components/kpi-card.tsx`

### Step 2.1 — Add hover effect to StatCard

- [ ] In `src/features/dashboard/components/stat-card.tsx`, add hover-related Tailwind classes to the `<Card>` component.

Replace the current `<Card>` (line 8) with:

```tsx
<Card className="transition-all duration-200 hover:-translate-y-px hover:shadow-md">
```

The full updated component:

```tsx
import { TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/core/components/ui/card"
import { cn } from "@/core/lib/utils"
import type { StatCardProps } from "../types"

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-px hover:shadow-md">
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

### Step 2.2 — Add hover effect to KPICard

- [ ] In `src/features/dashboard/components/kpi-card.tsx`, add the same hover classes to the `<Card>`.

Replace the `<Card>` (line 15) with:

```tsx
<Card className="transition-all duration-200 hover:-translate-y-px hover:shadow-md">
```

The full updated component:

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
    <Card className="transition-all duration-200 hover:-translate-y-px hover:shadow-md">
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
                    (d, i) => `${i * 8},${32 - ((d - min) / range) * 28 - 2}`,
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

### Step 2.3 — Verify

- [ ] Run `npx tsc --noEmit`.
- [ ] Open the dashboard page. Hover over stat cards and KPI cards. Each should lift 1px upward and gain a medium shadow, then smoothly return on mouse out.

### Commit

```
feat(dashboard): add hover lift and shadow to stat and KPI cards
```

---

## Task 3: Login page visual enhancement

**Goal:** Replace the empty right panel in the auth layout with a visually rich gradient mesh panel that responds to the current theme via CSS variables.

**Files modified:**

- `src/features/auth/components/auth-layout.tsx`

### Step 3.1 — Create the decorative panel

- [ ] Replace the entire `auth-layout.tsx` with a version that has a rich right panel.

The right panel uses the current theme's CSS custom properties so it responds to accent color, mode, and background style changes. It renders a gradient mesh background with floating geometric shapes.

```tsx
import type { ReactNode } from "react"

function FloatingShape({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
        ...style,
      }}
    />
  )
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">{children}</div>
      </div>

      <div className="relative hidden flex-1 overflow-hidden lg:block">
        {/* Gradient mesh background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, hsl(var(--primary) / 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, hsl(var(--chart-2) / 0.25) 0%, transparent 50%),
              radial-gradient(ellipse at 40% 80%, hsl(var(--chart-3) / 0.2) 0%, transparent 50%),
              hsl(var(--primary) / 0.05)
            `,
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating geometric shapes */}
        <FloatingShape
          className="animate-pulse-subtle"
          style={{
            top: "15%",
            left: "20%",
            width: "120px",
            height: "120px",
            background: "hsl(var(--primary) / 0.15)",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        />
        <FloatingShape
          className="animate-pulse-subtle"
          style={{
            top: "55%",
            right: "15%",
            width: "180px",
            height: "180px",
            background: "hsl(var(--chart-2) / 0.1)",
            border: "1px solid hsl(var(--chart-2) / 0.15)",
            animationDelay: "1s",
            borderRadius: "70% 30% 30% 70% / 60% 40% 60% 40%",
          }}
        />
        <FloatingShape
          className="animate-pulse-subtle"
          style={{
            bottom: "20%",
            left: "30%",
            width: "80px",
            height: "80px",
            background: "hsl(var(--chart-3) / 0.12)",
            border: "1px solid hsl(var(--chart-3) / 0.18)",
            animationDelay: "0.5s",
            borderRadius: "50%",
          }}
        />
        <FloatingShape
          style={{
            top: "30%",
            right: "30%",
            width: "60px",
            height: "60px",
            background: "hsl(var(--primary) / 0.08)",
            border: "1px solid hsl(var(--primary) / 0.12)",
            borderRadius: "50%",
          }}
        />

        {/* Central decorative element */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div
              className="h-32 w-32 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--chart-2) / 0.2))`,
                border: "1px solid hsl(var(--primary) / 0.15)",
                backdropFilter: "blur(8px)",
              }}
            />
            <div
              className="absolute -bottom-3 -right-3 h-20 w-20 rounded-xl"
              style={{
                background: `linear-gradient(135deg, hsl(var(--chart-2) / 0.15), hsl(var(--chart-3) / 0.15))`,
                border: "1px solid hsl(var(--chart-2) / 0.1)",
              }}
            />
            <div
              className="absolute -left-4 -top-4 h-12 w-12 rounded-lg"
              style={{
                background: `hsl(var(--primary) / 0.12)`,
                border: "1px solid hsl(var(--primary) / 0.08)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Step 3.2 — Verify

- [ ] Run `npx tsc --noEmit`.
- [ ] Navigate to `/login`. The right panel should display a gradient mesh background with floating shapes. Change the accent color via the theme switcher on another page, then return to login. The panel colors should reflect the new accent.
- [ ] Verify the panel is hidden on mobile (`lg:block`).

### Commit

```
feat(auth): replace empty right panel with gradient mesh design
```

---

## Task 4: Gradient visible with all surface styles

**Goal:** The gradient background currently only shows through glassmorphism (transparent cards). For default/flat/tinted styles, apply a subtle gradient accent to the sidebar and/or content area so the gradient investment is visible in all surface styles.

**Files modified:**

- `src/core/theme/engine/generate-tokens.ts`
- `src/styles/globals.css`
- `src/core/layout/sidebar-layout.tsx`

### Step 4.1 — Add gradient-aware CSS variable for sidebar

- [ ] In `src/core/theme/engine/generate-tokens.ts`, add a new token `--sidebar-gradient` that applies a subtle gradient overlay to the sidebar when the background style is set to "gradient" regardless of the surface style. Also add `--header-gradient` for the header area.

Add these after the `--bg-gradient` token assignment inside the `tokens` object (before the `return tokens` line):

```ts
tokens["--sidebar-gradient"] =
  backgroundStyle === "gradient"
    ? `linear-gradient(180deg, hsl(${accent[mode === "light" ? 800 : 900]} / 0.95) 0%, hsl(${accent[mode === "light" ? 900 : 950]} / 0.98) 100%)`
    : "none"

tokens["--content-gradient-overlay"] =
  backgroundStyle === "gradient" && surfaceStyle !== "glassmorphism"
    ? `linear-gradient(135deg, hsl(${accent[mode === "light" ? 100 : 900]} / 0.4) 0%, transparent 60%)`
    : "none"
```

### Step 4.2 — Apply sidebar gradient

- [ ] In `src/core/layout/sidebar-layout.tsx`, add an inline style to the `<aside>` element to use the sidebar gradient when available.

Update the `<aside>` element to include a style prop:

```tsx
<aside
  className={cn(
    "hidden flex-col border-r border-border-default bg-surface-sidebar text-gray-300 transition-all duration-300 theme-transition md:flex",
    collapsed ? "w-16" : "w-64",
  )}
  style={{ background: "var(--sidebar-gradient, none)" }}
>
```

Note: When `--sidebar-gradient` is `none`, the `bg-surface-sidebar` class handles the background. When it has a gradient value, the inline style overrides the Tailwind background. The sidebar needs to fall back to the CSS class default when gradient is not active, so use a conditional approach:

Actually, the inline `style` will always override the Tailwind class. Instead, use a conditional class approach or a CSS rule. A cleaner approach is a CSS rule in globals.css:

```css
/* Add to @layer base in globals.css, after .theme-transition */
aside[data-sidebar] {
  background: var(--sidebar-gradient);
}

aside[data-sidebar][data-sidebar-gradient="none"] {
  background: unset;
}
```

Simpler alternative: Just add a pseudo-element overlay via CSS. In `globals.css`:

```css
.sidebar-gradient-overlay {
  position: relative;
}

.sidebar-gradient-overlay::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--sidebar-gradient, none);
  pointer-events: none;
  z-index: 0;
}

.sidebar-gradient-overlay > * {
  position: relative;
  z-index: 1;
}
```

Then add the class `sidebar-gradient-overlay` to the `<aside>` in `sidebar-layout.tsx`.

### Step 4.3 — Apply content area gradient overlay

- [ ] In `src/styles/globals.css`, add a subtle gradient overlay to the main content area when gradient background is active and surface style is not glassmorphism.

Add to `@layer base`:

```css
main[data-content]::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: var(--content-gradient-overlay, none);
  pointer-events: none;
  z-index: 0;
  mask-image: linear-gradient(to bottom, black, transparent);
  -webkit-mask-image: linear-gradient(to bottom, black, transparent);
}
```

- [ ] In `src/core/layout/sidebar-layout.tsx`, add `data-content` attribute to the `<main>` element:

```tsx
<main className="flex-1 overflow-y-auto p-6" data-content>
  {children}
</main>
```

### Step 4.4 — Verify

- [ ] Run `npx tsc --noEmit`.
- [ ] Set background to "Gradient" and surface style to "Default". The sidebar should show an accent-colored gradient instead of the static dark background. The content area should have a subtle gradient wash at the top.
- [ ] Switch to "Glassmorphism". The sidebar gradient should still apply; the content area gradient overlay should not appear (glassmorphism already shows the full body gradient through transparent cards).
- [ ] Switch background to "Solid". Both overlays should disappear.

### Commit

```
feat(theme): show gradient accents in sidebar and content for all surface styles
```

---

## Task 5: Fix component showcase navigation

**Goal:** Fix scroll ordering (sections should appear from top, Buttons first), fix sticky nav overlapping section headings, and make the nav bar horizontally scrollable instead of wrapping.

**Files modified:**

- `src/routes/_authenticated/components.tsx`

### Step 5.1 — Fix scroll-mt value on section headings

- [ ] The `SectionHeading` component currently uses `scroll-mt-52`. The sticky nav bar is at the top with some padding, totaling roughly the PageHeader height + nav bar height. The actual sticky nav is `top-0` and wraps to multiple lines, pushing content down. Fix by adjusting `scroll-mt` to account for the actual nav height.

In the `SectionHeading` component (around line 279), change `scroll-mt-52` to `scroll-mt-28`:

```tsx
function SectionHeading({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <h2 id={id} className="scroll-mt-28 text-xl font-semibold text-foreground">
      {children}
    </h2>
  )
}
```

The reduced value accounts for the nav bar being a single non-wrapping line after Step 5.2.

### Step 5.2 — Make sticky nav horizontally scrollable

- [ ] Replace the wrapping `flex-wrap` nav bar with a horizontally scrollable single-line container. This prevents multi-line wrapping that causes unpredictable height.

Replace the sticky nav bar (around line 462) from:

```tsx
<div className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-2 rounded-lg border border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
```

To:

```tsx
<div className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto rounded-lg border border-border bg-background/95 px-4 py-3 backdrop-blur scrollbar-none supports-[backdrop-filter]:bg-background/60">
```

Key changes: removed `flex-wrap`, added `overflow-x-auto` and `scrollbar-none` (hides scrollbar but allows scroll).

Also add a `scrollbar-none` utility in globals.css if not already present:

```css
/* Add outside @layer base, at the end of the file */
@layer utilities {
  .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
}
```

### Step 5.3 — Make nav links non-shrinking

- [ ] Add `shrink-0` to each nav link so they don't compress when the container scrolls.

Update the nav link class (around line 467):

```tsx
<a
  key={s.id}
  href={`#${s.id}`}
  className="shrink-0 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
>
  {s.label}
</a>
```

### Step 5.4 — Verify

- [ ] Run `npx tsc --noEmit`.
- [ ] Navigate to the components page. The nav bar should be a single horizontal line that scrolls left/right. Clicking "Buttons" should scroll to the Buttons section with the heading visible below the nav bar (not hidden behind it). All sections should appear in order from top to bottom matching the `SECTIONS` array.

### Commit

```
fix(components): fix sticky nav overlap and make nav horizontally scrollable
```

---

## Task 6: Better surface elevation visualization

**Goal:** Replace the flat grid of same-looking surface color cards in the Colors & Surfaces section with a stacked/layered 3D perspective view that visually demonstrates depth hierarchy.

**Files modified:**

- `src/routes/_authenticated/components.tsx`

### Step 6.1 — Replace the Surface Elevations grid

- [ ] In the `colors` section of the components page (around line 1038), replace the "Surface Elevations" grid with a 3D stacked perspective visualization.

Replace the entire Surface Elevations block (from `<div>` with `<p className="mb-3 ...">Surface Elevations</p>` through its closing `</div>`) with:

```tsx
<div>
  <p className="mb-3 text-sm font-medium text-muted-foreground">
    Surface Elevations
  </p>
  <div className="flex items-center justify-center py-8">
    <div className="relative w-full max-w-lg" style={{ perspective: "800px" }}>
      {[
        {
          token: "bg-surface-sunken",
          label: "sunken",
          desc: "Inset areas, wells",
          offset: 0,
          z: 0,
        },
        {
          token: "bg-surface-base",
          label: "base",
          desc: "Page background",
          offset: 1,
          z: 1,
        },
        {
          token: "bg-surface-raised",
          label: "raised",
          desc: "Cards, panels",
          offset: 2,
          z: 2,
        },
        {
          token: "bg-surface-overlay",
          label: "overlay",
          desc: "Dialogs, popovers",
          offset: 3,
          z: 3,
        },
      ].map(({ token, label, desc, offset, z }) => (
        <div
          key={token}
          className={`${token} relative rounded-lg border border-border px-5 py-4 ring-1 ring-border/50`}
          style={{
            transform: `translateZ(${z * 12}px) translateY(${-offset * 8}px)`,
            boxShadow: `0 ${z * 4}px ${z * 8 + 4}px -${z * 2}px rgb(0 0 0 / ${0.03 + z * 0.04})`,
            marginTop: offset > 0 ? "-2rem" : "0",
            marginLeft: `${offset * 1.5}rem`,
            marginRight: `${offset * 1.5}rem`,
            zIndex: z,
          }}
        >
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-sm font-medium text-foreground">
              {label}
            </p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            var(--surface-{label})
          </p>
        </div>
      ))}
    </div>
  </div>
  {/* Sidebar and Header surfaces shown separately */}
  <div className="mt-4 grid grid-cols-2 gap-3">
    <div className="flex h-20 flex-col justify-end rounded-lg bg-surface-sidebar p-4 ring-1 ring-border">
      <p className="font-mono text-xs font-medium text-white">sidebar</p>
      <p className="font-mono text-[10px] text-white/60">
        var(--surface-sidebar)
      </p>
    </div>
    <div className="flex h-20 flex-col justify-end rounded-lg bg-surface-header p-4 ring-1 ring-border">
      <p className="font-mono text-xs font-medium text-foreground">header</p>
      <p className="font-mono text-[10px] text-muted-foreground">
        var(--surface-header)
      </p>
    </div>
  </div>
</div>
```

### Step 6.2 — Verify

- [ ] Run `npx tsc --noEmit`.
- [ ] Navigate to the components page, scroll to "Colors & Surfaces". The surface elevations should appear as overlapping, stacked layers with depth perspective. Sunken is at the bottom, overlay at the top. Each layer should be slightly inset from the previous and cast a subtle shadow. Sidebar and header are shown as a separate 2-column row below.

### Commit

```
feat(components): replace flat surface grid with 3D elevation visualization
```

---

## Task 7: Chart improvements for dark glassmorphism

**Goal:** Update chart components to use theme-appropriate grid line colors. In dark glassmorphism mode, chart grid lines should be more visible. Also ensure chart tooltip backgrounds use the theme surface tokens properly.

**Files modified:**

- `src/features/charts/hooks/use-chart-colors.ts`
- `src/features/charts/components/area-chart.tsx`
- `src/features/charts/components/bar-chart.tsx`
- `src/features/charts/components/line-chart.tsx`
- `src/features/charts/components/chart-tooltip.tsx`

### Step 7.1 — Add grid color to the chart colors hook

- [ ] Extend `useChartColors` to also return a grid line color derived from CSS variables.

Replace the entire `use-chart-colors.ts`:

```ts
import { useMemo } from "react"

export interface ChartColorSet {
  series: string[]
  gridStroke: string
  tickFill: string
}

export function useChartColors(): ChartColorSet {
  return useMemo(() => {
    const root = getComputedStyle(document.documentElement)
    const series = [1, 2, 3, 4, 5].map((i) => {
      const hsl = root.getPropertyValue(`--chart-${i}`).trim()
      return `hsl(${hsl})`
    })
    const border = root.getPropertyValue("--border").trim()
    const mutedFg = root.getPropertyValue("--muted-foreground").trim()

    return {
      series,
      gridStroke: `hsl(${border})`,
      tickFill: `hsl(${mutedFg})`,
    }
  }, [])
}
```

### Step 7.2 — Update AreaChart to use new color set

- [ ] In `area-chart.tsx`, destructure the new return type and use `gridStroke` for CartesianGrid.

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
  const { series, gridStroke, tickFill } = useChartColors()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey={xKey} className="text-xs" tick={{ fill: tickFill }} />
        <YAxis className="text-xs" tick={{ fill: tickFill }} />
        <Tooltip content={<ChartTooltip />} />
        {yKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId={stacked ? "stack" : undefined}
            stroke={series[i % series.length]}
            fill={series[i % series.length]}
            fillOpacity={0.1}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
```

### Step 7.3 — Update BarChart to use new color set

- [ ] Same pattern for `bar-chart.tsx`:

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
  const { series, gridStroke, tickFill } = useChartColors()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey={xKey} className="text-xs" tick={{ fill: tickFill }} />
        <YAxis className="text-xs" tick={{ fill: tickFill }} />
        <Tooltip content={<ChartTooltip />} />
        {yKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId={stacked ? "stack" : undefined}
            fill={series[i % series.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
```

### Step 7.4 — Update LineChart to use new color set

- [ ] Same pattern for `line-chart.tsx`:

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

export function LineChart({ data, xKey, yKeys, height = 300 }: LineChartProps) {
  const { series, gridStroke, tickFill } = useChartColors()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey={xKey} className="text-xs" tick={{ fill: tickFill }} />
        <YAxis className="text-xs" tick={{ fill: tickFill }} />
        <Tooltip content={<ChartTooltip />} />
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={series[i % series.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
```

### Step 7.5 — Update PieChart for consistency

- [ ] In `pie-chart.tsx`, update to use the `series` property from the new hook:

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
  const { series } = useChartColors()

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
            <Cell key={i} fill={series[i % series.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
```

### Step 7.6 — Improve tooltip theming

- [ ] The `ChartTooltip` already uses `bg-popover` and `text-popover-foreground`, which are correct. Add the `overlay-surface` class to get the backdrop-filter effects in glassmorphism mode.

Update `chart-tooltip.tsx`:

```tsx
interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    color?: string
  }>
  label?: string
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="overlay-surface border border-border bg-popover px-3 py-2 text-sm shadow-md">
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

Key change: replaced `rounded-lg` with the `overlay-surface` class which provides `border-radius`, `box-shadow`, and `backdrop-filter` from the theme.

### Step 7.7 — Verify

- [ ] Run `npx tsc --noEmit`.
- [ ] Set theme to dark mode + glassmorphism + gradient. Navigate to dashboard or components page charts section. Grid lines should be visible against the dark transparent card backgrounds. Tooltip should have frosted glass effect.
- [ ] Switch to light mode + default surface. Charts should still look correct with appropriate light grid lines.

### Commit

```
feat(charts): use theme tokens for grid lines and tooltip surfaces
```

---

## Task 8: Typography system with font choices

**Goal:** Add a `fontFamily` axis to the theme system with 5 curated font pairings. Load fonts dynamically from Google Fonts when selected. Add to ThemeSwitcher UI and persist to localStorage.

**Files created:**

- `src/core/theme/palettes/font-families.ts`
- `src/core/theme/engine/font-loader.ts`

**Files modified:**

- `src/core/theme/types.ts`
- `src/core/theme/theme-provider.tsx`
- `src/core/theme/theme-switcher.tsx`
- `src/core/theme/engine/generate-tokens.ts`
- `src/core/theme/index.ts`
- `index.html`
- `tailwind.config.ts`

### Step 8.1 — Define font family types and palettes

- [ ] Add `FontFamily` type and constant to `src/core/theme/types.ts`.

Add after the `BACKGROUND_STYLES` definition (after line 31):

```ts
export const FONT_FAMILIES = [
  "default",
  "editorial",
  "modern",
  "humanist",
  "technical",
] as const
export type FontFamily = (typeof FONT_FAMILIES)[number]
```

Update the `ThemeContextValue` interface to include the new axis:

```ts
export interface ThemeContextValue {
  accentColor: AccentColor
  surfaceStyle: SurfaceStyle
  backgroundStyle: BackgroundStyle
  fontFamily: FontFamily
  mode: Mode
  resolvedMode: ResolvedMode
  setAccentColor: (color: AccentColor) => void
  setSurfaceStyle: (style: SurfaceStyle) => void
  setBackgroundStyle: (style: BackgroundStyle) => void
  setFontFamily: (font: FontFamily) => void
  setMode: (mode: Mode) => void
}
```

- [ ] Create `src/core/theme/palettes/font-families.ts`:

```ts
import type { FontFamily } from "../types"

export interface FontFamilyDefinition {
  name: FontFamily
  label: string
  description: string
  sans: string
  mono: string
  googleFontsUrl: string | null
}

export const fontFamilies: Record<FontFamily, FontFamilyDefinition> = {
  default: {
    name: "default",
    label: "Default",
    description: "Inter + JetBrains Mono",
    sans: "Inter",
    mono: "JetBrains Mono",
    googleFontsUrl: null,
  },
  editorial: {
    name: "editorial",
    label: "Editorial",
    description: "Playfair Display + Source Sans 3",
    sans: "Playfair Display",
    mono: "Source Code Pro",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&family=Source+Sans+3:wght@400;500;600;700&display=swap",
  },
  modern: {
    name: "modern",
    label: "Modern",
    description: "Geist + Geist Mono",
    sans: "Geist",
    mono: "Geist Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
  },
  humanist: {
    name: "humanist",
    label: "Humanist",
    description: "DM Sans + DM Mono",
    sans: "DM Sans",
    mono: "DM Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap",
  },
  technical: {
    name: "technical",
    label: "Technical",
    description: "JetBrains Mono + Inter",
    sans: "JetBrains Mono",
    mono: "JetBrains Mono",
    googleFontsUrl: null,
  },
}
```

Note: For the "editorial" font pairing, the body text uses Source Sans 3 while headings use Playfair Display. Since Tailwind's `font-sans` applies to the body, and Playfair Display is a serif font better suited for headings, the `sans` value for the "editorial" pairing should use Source Sans 3 for body text. The heading font can be set via a CSS variable.

Update the editorial entry:

```ts
editorial: {
  name: "editorial",
  label: "Editorial",
  description: "Source Sans 3 + Playfair Display headings",
  sans: "Source Sans 3",
  mono: "Source Code Pro",
  googleFontsUrl:
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&family=Source+Sans+3:wght@400;500;600;700&display=swap",
},
```

### Step 8.2 — Create font loader utility

- [ ] Create `src/core/theme/engine/font-loader.ts`:

```ts
import type { FontFamily } from "../types"
import { fontFamilies } from "../palettes/font-families"

const loadedFonts = new Set<FontFamily>(["default"])
const linkElements = new Map<FontFamily, HTMLLinkElement>()

export function loadFont(family: FontFamily): void {
  if (loadedFonts.has(family)) return

  const definition = fontFamilies[family]
  if (!definition.googleFontsUrl) {
    loadedFonts.add(family)
    return
  }

  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = definition.googleFontsUrl
  document.head.appendChild(link)
  linkElements.set(family, link)
  loadedFonts.add(family)
}

export function applyFontFamily(family: FontFamily): void {
  const definition = fontFamilies[family]
  const style = document.documentElement.style
  style.setProperty("--font-sans", definition.sans)
  style.setProperty("--font-mono", definition.mono)
}
```

### Step 8.3 — Update generate-tokens to include font tokens

- [ ] In `src/core/theme/engine/generate-tokens.ts`, update the `GenerateTokensInput` interface and `generateTokens` function to accept and emit font family tokens.

Add `fontFamily` to the input interface:

```ts
import type {
  AccentColor,
  BackgroundStyle,
  SurfaceStyle,
  ResolvedMode,
  ColorScale,
  FontFamily,
} from "../types"
```

```ts
export interface GenerateTokensInput {
  accentColor: AccentColor
  surfaceStyle: SurfaceStyle
  backgroundStyle: BackgroundStyle
  fontFamily: FontFamily
  mode: ResolvedMode
}
```

At the end of the `generateTokens` function, import and use the font families:

Add at the top of the file:

```ts
import { fontFamilies } from "../palettes/font-families"
```

Then in the `tokens` object, add:

```ts
tokens["--font-sans"] = fontFamilies[input.fontFamily].sans
tokens["--font-mono"] = fontFamilies[input.fontFamily].mono
```

### Step 8.4 — Update tailwind.config.ts to use CSS variables for fonts

- [ ] In `tailwind.config.ts`, update the `fontFamily` section to reference CSS custom properties so they respond to runtime changes.

```ts
fontFamily: {
  sans: ["var(--font-sans, Inter)", ...defaultTheme.fontFamily.sans],
  mono: ["var(--font-mono, JetBrains Mono)", ...defaultTheme.fontFamily.mono],
},
```

### Step 8.5 — Update ThemeProvider

- [ ] In `src/core/theme/theme-provider.tsx`, add state, localStorage persistence, and setter for `fontFamily`.

Add imports:

```ts
import type {
  AccentColor,
  BackgroundStyle,
  SurfaceStyle,
  FontFamily,
  Mode,
  ResolvedMode,
  ThemeContextValue,
} from "./types"
import { loadFont, applyFontFamily } from "./engine/font-loader"
```

Add localStorage key:

```ts
const LS_FONT = "theme-font"
```

Inside `ThemeProvider`, add state:

```ts
const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
  const stored = localStorage.getItem(LS_FONT)
  return (stored as FontFamily) || "default"
})
```

Update `applyTheme` to include fontFamily:

```ts
const applyTheme = useCallback(
  (
    accent: AccentColor,
    style: SurfaceStyle,
    bgStyle: BackgroundStyle,
    font: FontFamily,
    resolved: ResolvedMode,
  ) => {
    document.documentElement.setAttribute("data-mode", resolved)
    loadFont(font)
    applyFontFamily(font)
    const tokens = generateTokens({
      accentColor: accent,
      surfaceStyle: style,
      backgroundStyle: bgStyle,
      fontFamily: font,
      mode: resolved,
    })
    applyTokens(tokens)
  },
  [],
)
```

Add setter:

```ts
const setFontFamily = useCallback(
  (font: FontFamily) => {
    setFontFamilyState(font)
    localStorage.setItem(LS_FONT, font)
    applyTheme(accentColor, surfaceStyle, backgroundStyle, font, resolvedMode)
  },
  [applyTheme, accentColor, surfaceStyle, backgroundStyle, resolvedMode],
)
```

Update ALL existing setters to pass `fontFamily` as the new parameter:

```ts
const setAccentColor = useCallback(
  (color: AccentColor) => {
    setAccentColorState(color)
    localStorage.setItem(LS_ACCENT, color)
    applyTheme(color, surfaceStyle, backgroundStyle, fontFamily, resolvedMode)
  },
  [applyTheme, surfaceStyle, backgroundStyle, fontFamily, resolvedMode],
)

const setSurfaceStyle = useCallback(
  (style: SurfaceStyle) => {
    setSurfaceStyleState(style)
    localStorage.setItem(LS_STYLE, style)
    applyTheme(accentColor, style, backgroundStyle, fontFamily, resolvedMode)
  },
  [applyTheme, accentColor, backgroundStyle, fontFamily, resolvedMode],
)

const setBackgroundStyle = useCallback(
  (bgStyle: BackgroundStyle) => {
    setBackgroundStyleState(bgStyle)
    localStorage.setItem(LS_BG_STYLE, bgStyle)
    applyTheme(accentColor, surfaceStyle, bgStyle, fontFamily, resolvedMode)
  },
  [applyTheme, accentColor, surfaceStyle, fontFamily, resolvedMode],
)

const setMode = useCallback(
  (m: Mode) => {
    const resolved = resolveMode(m)
    setModeState(m)
    setResolvedMode(resolved)
    localStorage.setItem(LS_MODE, m)
    applyTheme(accentColor, surfaceStyle, backgroundStyle, fontFamily, resolved)
  },
  [applyTheme, accentColor, surfaceStyle, backgroundStyle, fontFamily],
)
```

Update the initial `useEffect`:

```ts
useEffect(() => {
  applyTheme(
    accentColor,
    surfaceStyle,
    backgroundStyle,
    fontFamily,
    resolvedMode,
  )
}, [
  applyTheme,
  accentColor,
  surfaceStyle,
  backgroundStyle,
  fontFamily,
  resolvedMode,
])
```

Update the system media query `useEffect`:

```ts
useEffect(() => {
  if (mode !== "system") return
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  const handler = () => {
    const resolved = getSystemMode()
    setResolvedMode(resolved)
    applyTheme(accentColor, surfaceStyle, backgroundStyle, fontFamily, resolved)
  }
  mq.addEventListener("change", handler)
  return () => mq.removeEventListener("change", handler)
}, [mode, accentColor, surfaceStyle, backgroundStyle, fontFamily, applyTheme])
```

Update the context value:

```ts
const value = useMemo<ThemeContextValue>(
  () => ({
    accentColor,
    surfaceStyle,
    backgroundStyle,
    fontFamily,
    mode,
    resolvedMode,
    setAccentColor,
    setSurfaceStyle,
    setBackgroundStyle,
    setFontFamily,
    setMode,
  }),
  [
    accentColor,
    surfaceStyle,
    backgroundStyle,
    fontFamily,
    mode,
    resolvedMode,
    setAccentColor,
    setSurfaceStyle,
    setBackgroundStyle,
    setFontFamily,
    setMode,
  ],
)
```

### Step 8.6 — Update ThemeSwitcher UI

- [ ] In `src/core/theme/theme-switcher.tsx`, add a Font Family section.

Add imports:

```ts
import { ACCENT_COLORS, SURFACE_STYLES, FONT_FAMILIES } from "./types"
import type {
  Mode,
  AccentColor,
  BackgroundStyle,
  SurfaceStyle,
  FontFamily,
} from "./types"
import { fontFamilies } from "./palettes/font-families"
```

Destructure `fontFamily` and `setFontFamily` from `useTheme()`:

```ts
const {
  accentColor,
  surfaceStyle,
  backgroundStyle,
  fontFamily,
  mode,
  setAccentColor,
  setSurfaceStyle,
  setBackgroundStyle,
  setFontFamily,
  setMode,
} = useTheme()
```

Add a new section in the popover content, after the Surface Style section and before the closing `</div>`:

```tsx
<Separator />

<div>
  <Label className="text-xs font-medium text-muted-foreground">
    Font
  </Label>
  <div className="mt-1.5 grid grid-cols-1 gap-1">
    {FONT_FAMILIES.map((font: FontFamily) => {
      const def = fontFamilies[font]
      return (
        <button
          key={font}
          type="button"
          className={cn(
            "rounded-md px-2 py-1.5 text-left text-xs transition-colors",
            fontFamily === font
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground",
          )}
          onClick={() => setFontFamily(font)}
        >
          <span className="font-medium">{def.label}</span>
          <span className="ml-2 text-[10px] opacity-70">
            {def.description}
          </span>
        </button>
      )
    })}
  </div>
</div>
```

### Step 8.7 — Update barrel exports

- [ ] In `src/core/theme/index.ts`, add new exports:

```ts
export { fontFamilies } from "./palettes/font-families"
export { FONT_FAMILIES } from "./types"
export type { FontFamily } from "./types"
```

### Step 8.8 — Update index.html preconnects

- [ ] The `index.html` already has Google Fonts preconnects and loads Inter + JetBrains Mono. No changes needed here since the default fonts are already loaded. The dynamic loader handles additional fonts.

### Step 8.9 — Verify

- [ ] Run `npx tsc --noEmit`.
- [ ] Open the app, open the theme switcher popover. A "Font" section should appear with 5 options. Select "Humanist" — the app font should change to DM Sans. Select "Technical" — everything should switch to JetBrains Mono. Select "Default" — back to Inter.
- [ ] Reload the page. The last selected font should persist from localStorage.
- [ ] Check the Network tab: font CSS files should only load when a non-default font is first selected.

### Commit

```
feat(theme): add font family axis with five curated pairings
```

---

## Task 9: Component showcase as design system docs

**Goal:** Reorganize the components page to show code snippets alongside each rendered component with a "Copy code" button. Structure as a proper design system reference.

**Files modified:**

- `src/routes/_authenticated/components.tsx`

### Step 9.1 — Create a ShowcaseExample wrapper component

- [ ] Add a new local component inside `components.tsx` (above `ComponentShowcasePage`) that renders the component preview and a collapsible code snippet with a copy button.

```tsx
function ShowcaseExample({
  code,
  children,
}: {
  code: string
  children: React.ReactNode
}) {
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-card p-6">
        {children}
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCode(!showCode)}
          className="text-xs text-muted-foreground"
        >
          {showCode ? "Hide code" : "View code"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-xs text-muted-foreground"
        >
          {copied ? "Copied!" : "Copy code"}
        </Button>
      </div>
      {showCode && (
        <pre className="overflow-x-auto rounded-lg bg-surface-sunken p-4 text-xs">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
```

You will also need to import `useState` (already imported) at the top of the file.

### Step 9.2 — Update the Section component

- [ ] Modify the existing `Section` component to no longer wrap children in a card, since `ShowcaseExample` provides its own card wrapper.

```tsx
function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <SectionHeading id={id}>{title}</SectionHeading>
      {children}
    </div>
  )
}
```

### Step 9.3 — Wrap existing sections with ShowcaseExample

- [ ] For each section in the components page, wrap the rendered content in a `<ShowcaseExample>` component with the corresponding code string. This is a large but mechanical change. Here is the pattern for the first few sections. The remainder follow the same pattern.

Example for the Buttons section:

```tsx
<Section id="buttons" title="Buttons">
  <ShowcaseExample
    code={`<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`}
  >
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg">Large</Button>
        <Button size="default">Default</Button>
        <Button size="sm">Small</Button>
        <Button size="icon">
          <TrendingUp className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button disabled>Disabled Default</Button>
        <Button variant="outline" disabled>
          Disabled Outline
        </Button>
        <Button variant="destructive" disabled>
          Disabled Destructive
        </Button>
      </div>
    </div>
  </ShowcaseExample>
</Section>
```

Example for the Badge section:

```tsx
<Section id="badges" title="Badges">
  <ShowcaseExample
    code={`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`}
  >
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  </ShowcaseExample>
</Section>
```

Apply this pattern to ALL sections. For sections with complex interactive state (dialogs, dropdowns, forms), include a representative code snippet rather than the full implementation. For sections that are purely visual (colors, typography, surfaces), the `ShowcaseExample` wrapper is optional since they serve as references rather than copyable patterns.

Key code snippets to provide for each section:

| Section                | Code snippet focus                                       |
| ---------------------- | -------------------------------------------------------- |
| Buttons                | All variant and size combinations                        |
| Inputs & Form Controls | One of each: Input, Select, Checkbox, Switch, RadioGroup |
| Cards                  | Basic Card with Header, Content, Footer                  |
| Badges                 | All variants                                             |
| Dialogs & Overlays     | Dialog with trigger, content, footer                     |
| Dropdown Menu          | Basic menu with items and separator                      |
| Accordion              | Single collapsible accordion                             |
| Tabs                   | Basic tabs with 3 panels                                 |
| Avatar                 | Avatar with fallback at different sizes                  |
| Separator              | Horizontal and vertical usage                            |
| Skeleton               | Card skeleton pattern                                    |
| Table                  | Basic table structure                                    |
| Scroll Area            | ScrollArea with content                                  |
| Command Palette        | Command with groups and items                            |
| Dashboard Components   | StatCard and KPICard usage                               |
| Charts                 | ChartCard + AreaChart usage                              |
| Data Table             | DataTable with columns and data                          |
| Form Fields            | TextField and SelectField with form                      |
| Typography             | Heading scale and body text                              |
| Colors & Surfaces      | Keep as-is (visual reference, no code to copy)           |

### Step 9.4 — Verify

- [ ] Run `npx tsc --noEmit`.
- [ ] Navigate to the components page. Each section should show the rendered component followed by "View code" and "Copy code" buttons. Clicking "View code" reveals the code snippet. Clicking "Copy code" copies to clipboard and shows "Copied!" confirmation.
- [ ] The Colors & Surfaces section at the bottom should still render normally (either wrapped or unwrapped).

### Commit

```
feat(components): add code snippets with copy button to showcase page
```

---

## Task 10: Font size / density toggle

**Goal:** Add a `density` axis to the theme system with 3 options: compact, comfortable, spacious. This scales base font size, padding, and gaps via CSS custom properties.

**Files modified:**

- `src/core/theme/types.ts`
- `src/core/theme/theme-provider.tsx`
- `src/core/theme/theme-switcher.tsx`
- `src/core/theme/engine/generate-tokens.ts`
- `src/core/theme/index.ts`
- `src/styles/globals.css`
- `tailwind.config.ts`

### Step 10.1 — Add density type

- [ ] In `src/core/theme/types.ts`, add:

```ts
export const DENSITIES = ["compact", "comfortable", "spacious"] as const
export type Density = (typeof DENSITIES)[number]
```

Update `ThemeContextValue`:

```ts
export interface ThemeContextValue {
  accentColor: AccentColor
  surfaceStyle: SurfaceStyle
  backgroundStyle: BackgroundStyle
  fontFamily: FontFamily
  density: Density
  mode: Mode
  resolvedMode: ResolvedMode
  setAccentColor: (color: AccentColor) => void
  setSurfaceStyle: (style: SurfaceStyle) => void
  setBackgroundStyle: (style: BackgroundStyle) => void
  setFontFamily: (font: FontFamily) => void
  setDensity: (density: Density) => void
  setMode: (mode: Mode) => void
}
```

### Step 10.2 — Define density tokens

- [ ] In `src/core/theme/engine/generate-tokens.ts`, add density to the input and generate density-related CSS variables.

Update the import and interface:

```ts
import type {
  AccentColor,
  BackgroundStyle,
  SurfaceStyle,
  ResolvedMode,
  ColorScale,
  FontFamily,
  Density,
} from "../types"

export interface GenerateTokensInput {
  accentColor: AccentColor
  surfaceStyle: SurfaceStyle
  backgroundStyle: BackgroundStyle
  fontFamily: FontFamily
  density: Density
  mode: ResolvedMode
}
```

Add a density config map and emit tokens. Place this above the `generateTokens` function:

```ts
const DENSITY_SCALES: Record<
  Density,
  {
    fontSize: string
    spacing: string
    cardPadding: string
    headerHeight: string
  }
> = {
  compact: {
    fontSize: "13px",
    spacing: "0.75",
    cardPadding: "1rem",
    headerHeight: "2.75rem",
  },
  comfortable: {
    fontSize: "14px",
    spacing: "1",
    cardPadding: "1.5rem",
    headerHeight: "3.5rem",
  },
  spacious: {
    fontSize: "15px",
    spacing: "1.25",
    cardPadding: "2rem",
    headerHeight: "4rem",
  },
}
```

Inside `generateTokens`, after the existing token assignments, add:

```ts
const densityScale = DENSITY_SCALES[input.density]
tokens["--density-font-size"] = densityScale.fontSize
tokens["--density-spacing"] = densityScale.spacing
tokens["--density-card-padding"] = densityScale.cardPadding
tokens["--density-header-height"] = densityScale.headerHeight
```

### Step 10.3 — Apply density tokens in globals.css

- [ ] In `src/styles/globals.css`, use the density CSS variables to scale base font size and card padding.

Update the first `body` rule (around line 57) to include the density font size:

```css
body {
  @apply bg-background text-foreground antialiased;
  font-size: var(--density-font-size, 14px);
  font-feature-settings:
    "rlig" 1,
    "calt" 1;
}
```

Add a density-aware card padding utility after the existing rules in `@layer base`:

```css
.card-surface {
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--backdrop-filter, none);
  -webkit-backdrop-filter: var(--backdrop-filter, none);
  transition:
    background-color 150ms ease-in-out,
    color 150ms ease-in-out,
    border-color 150ms ease-in-out,
    box-shadow 150ms ease-in-out;
}
```

Note: Card padding is handled by Tailwind classes (e.g., `p-6`), so the density approach uses a CSS scale factor. Add a utility layer rule:

```css
@layer utilities {
  .density-padding {
    padding: var(--density-card-padding, 1.5rem);
  }
}
```

However, since most padding in the app is set via Tailwind classes, a more practical approach is to set the `font-size` on the body and use `em`-based scaling where needed. The font size change alone creates a meaningful density shift. The `--density-spacing` multiplier can be applied to specific gap and padding utilities as a future enhancement.

For the header height, apply it in `globals.css`:

Add in `@layer base`:

```css
header[data-app-header] {
  height: var(--density-header-height, 3.5rem);
}
```

And in `sidebar-layout.tsx`, add `data-app-header` to the `<header>`:

```tsx
<header className="flex items-center gap-2 border-b border-border bg-surface-header px-4 theme-transition" data-app-header>
```

Remove `h-14` from the header className since it's now controlled by the CSS variable.

### Step 10.4 — Update ThemeProvider

- [ ] Follow the same pattern as Task 8. Add state, localStorage, setter, and pass `density` through `applyTheme` and `generateTokens`.

Add localStorage key:

```ts
const LS_DENSITY = "theme-density"
```

Add state:

```ts
const [density, setDensityState] = useState<Density>(() => {
  const stored = localStorage.getItem(LS_DENSITY)
  return (stored as Density) || "comfortable"
})
```

Update `applyTheme` signature to include density:

```ts
const applyTheme = useCallback(
  (
    accent: AccentColor,
    style: SurfaceStyle,
    bgStyle: BackgroundStyle,
    font: FontFamily,
    dens: Density,
    resolved: ResolvedMode,
  ) => {
    document.documentElement.setAttribute("data-mode", resolved)
    loadFont(font)
    applyFontFamily(font)
    const tokens = generateTokens({
      accentColor: accent,
      surfaceStyle: style,
      backgroundStyle: bgStyle,
      fontFamily: font,
      density: dens,
      mode: resolved,
    })
    applyTokens(tokens)
  },
  [],
)
```

Add setter:

```ts
const setDensity = useCallback(
  (dens: Density) => {
    setDensityState(dens)
    localStorage.setItem(LS_DENSITY, dens)
    applyTheme(
      accentColor,
      surfaceStyle,
      backgroundStyle,
      fontFamily,
      dens,
      resolvedMode,
    )
  },
  [
    applyTheme,
    accentColor,
    surfaceStyle,
    backgroundStyle,
    fontFamily,
    resolvedMode,
  ],
)
```

Update ALL other setters to pass `density` as well (every call to `applyTheme` now needs the density parameter). The pattern is the same as Task 8 but with one more parameter.

Update the context value to include `density` and `setDensity`.

### Step 10.5 — Update ThemeSwitcher UI

- [ ] In `src/core/theme/theme-switcher.tsx`, add a Density section.

Add imports:

```ts
import {
  ACCENT_COLORS,
  SURFACE_STYLES,
  FONT_FAMILIES,
  DENSITIES,
} from "./types"
import type {
  Mode,
  AccentColor,
  BackgroundStyle,
  SurfaceStyle,
  FontFamily,
  Density,
} from "./types"
```

Destructure `density` and `setDensity` from `useTheme()`.

Add a section after the Font section:

```tsx
<Separator />

<div>
  <Label className="text-xs font-medium text-muted-foreground">
    Density
  </Label>
  <div className="mt-1.5 flex gap-1">
    {DENSITIES.map((d: Density) => (
      <Button
        key={d}
        variant={density === d ? "default" : "outline"}
        size="sm"
        className="flex-1 capitalize"
        onClick={() => setDensity(d)}
      >
        {d}
      </Button>
    ))}
  </div>
</div>
```

### Step 10.6 — Update barrel exports

- [ ] In `src/core/theme/index.ts`, add:

```ts
export { DENSITIES } from "./types"
export type { Density } from "./types"
```

### Step 10.7 — Verify

- [ ] Run `npx tsc --noEmit`.
- [ ] Open the app and the theme switcher. A "Density" section should appear with three buttons: compact, comfortable, spacious.
- [ ] Select "Compact" — base font size should shrink to 13px, the header should become shorter. Content should feel tighter.
- [ ] Select "Spacious" — base font size should grow to 15px, the header taller. Content should feel roomier.
- [ ] Select "Comfortable" — back to default 14px.
- [ ] Reload the page. The last selected density should persist.

### Commit

```
feat(theme): add density axis with compact, comfortable, spacious options
```
