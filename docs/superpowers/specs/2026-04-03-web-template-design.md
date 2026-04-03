# Web Template — Design Specification

A consistent, opinionated frontend starter template for React dashboard and SaaS applications. Eliminates per-project theming drift by providing a standardized foundation with modular, opt-in feature sets.

## Goals

- Consistent theming, layout, typography, and component styling across all projects
- Fast project bootstrapping — clone, remove unused feature modules, start building
- Clean separation between always-present core and opt-in feature modules
- Full DX tooling pre-configured so new projects never start from scratch

## Tech Stack

| Layer | Choice |
|---|---|
| Build tool | Vite + React SWC plugin |
| Framework | React 18+ with TypeScript strict mode |
| Routing | TanStack Router (file-based) |
| Server state | TanStack Query |
| Client state | Zustand |
| Forms | TanStack Form + Zod |
| UI components | shadcn/ui + Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Animations | Tailwind CSS only (no Framer Motion) |

## Architecture — Layered Template with Feature Modules

The project is organized into a thin core that every project keeps and feature modules that are opt-in. Removing a feature means deleting its folder and removing its route import.

```
src/
├── core/                          # always present
│   ├── theme/                     # CSS vars, surfaces, color themes, switcher
│   ├── layout/                    # sidebar, top-nav, stacked, split-panel shells
│   ├── typography/                # font scale, heading hierarchy, prose styles
│   ├── components/                # shared primitives (shadcn/ui base components)
│   ├── hooks/                     # useTheme, useMediaQuery, useBreakpoint
│   ├── lib/                       # utils, cn(), api client, zustand stores
│   └── providers/                 # QueryClient, theme, toast providers
├── features/                      # opt-in modules
│   ├── auth/                      # login, register, forgot-password, guards
│   ├── data-table/                # TanStack Table + sort, filter, paginate
│   ├── charts/                    # Recharts wrappers, theme-aware
│   ├── dashboard/                 # stat cards, KPIs, activity feed
│   └── forms/                     # TanStack Form + Zod patterns, field components
├── routes/                        # TanStack Router file-based routes
├── styles/                        # global CSS, Tailwind config, theme tokens
└── app.tsx
```

### Feature Module Convention

Every feature module follows the same internal structure:

```
features/<module>/
├── components/      # UI components scoped to this feature
├── hooks/           # feature-specific hooks
├── types.ts         # TypeScript types for this feature
├── api.ts           # TanStack Query hooks for API calls
├── store.ts         # Zustand slice (if client state needed)
└── index.ts         # public exports (barrel file)
```

### Dependency Rule

Features depend on `core/` only. Features never import from each other. The one exception is that `dashboard/` may import from `charts/`, since dashboard components naturally embed chart visualizations.

## Theming System

### Three-Layer Token Architecture

1. **Primitive palette** — raw HSL color values (blue-50 through blue-950, gray-50 through gray-950, etc.). Never referenced directly by components.

2. **Semantic tokens** — purpose-driven aliases that change per theme. These are what components reference: `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--destructive`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--border`, `--input`, `--ring`.

3. **Surface tokens** — elevation-based tokens for visual depth and layering:
   - `--surface-base` — page background
   - `--surface-raised` — cards, sections
   - `--surface-overlay` — modals, popovers, dropdowns
   - `--surface-sunken` — inset areas, well backgrounds
   - `--surface-sidebar` — sidebar navigation chrome
   - `--surface-header` — top header bar
   - `--border-subtle` — light separators
   - `--border-default` — standard borders

**Relationship to shadcn/ui tokens:** shadcn/ui defines its own `--card`, `--popover`, and `--background` tokens. The surface tokens extend this system with additional elevation levels. During implementation, shadcn/ui's tokens are aliased to surface tokens so they stay in sync: `--card` maps to `--surface-raised`, `--popover` maps to `--surface-overlay`, `--background` maps to `--surface-base`. This ensures shadcn/ui components automatically respect the surface hierarchy without modification.

### Two Independent Axes

Themes are controlled by two orthogonal data attributes on `<html>`:

- `data-theme` — selects the color palette (default, emerald, rose, amber, violet)
- `data-mode` — selects light or dark appearance

Every theme defines all semantic and surface tokens for both light and dark modes. Adding a new brand theme requires creating one CSS block that maps primitive values to semantic tokens.

### Starter Themes

Five themes ship with the template:

| Theme | Primary Color | Description |
|---|---|---|
| Default | Blue (#3b82f6) | Standard professional blue |
| Emerald | Green (#10b981) | Fresh, nature-oriented |
| Rose | Pink (#f43f5e) | Bold, energetic |
| Amber | Warm (#f59e0b) | Warm, approachable |
| Violet | Purple (#8b5cf6) | Creative, modern |

### Theme Switcher

A `useTheme` hook and `ThemeSwitcher` component provide:

- Toggle between light, dark, and system preference modes
- Switch between color themes
- Persist selection to localStorage
- Apply `data-theme` and `data-mode` attributes to `<html>`
- Prevent flash of unstyled content on page load via an inline script in `index.html`

### Chart Palette

Each theme defines `--chart-1` through `--chart-5` CSS variables. Chart components read these tokens automatically, ensuring chart colors always harmonize with the active theme.

## Layout System

Four layout shells that share a common `LayoutProps` interface. Swapping layout means changing one import in the root route file.

### Layout Variants

**A — Sidebar + Header**: Collapsible sidebar with icon-only mode, grouped navigation items. Two distinct horizontal zones:

- Global header (top bar): search box with Cmd+K command palette, notification bell, user avatar dropdown, theme switcher, optional global action shortcuts. Stays the same across all pages.
- Content header (per page): breadcrumbs, page title, optional description, page-level action buttons, tabs for sub-sections. Each route defines its own content header.

**B — Top Navigation**: Horizontal navigation bar with logo, nav links, and user menu. Simpler SaaS product feel. Content area below with optional content header.

**C — Stacked (Sidebar + Sub-nav)**: Icon sidebar for top-level sections plus a secondary text sidebar for sub-navigation within the active section. Ideal for complex apps with deep navigation hierarchies.

**D — Split Panel**: Header bar with a master-detail layout below — a scrollable list panel on the left and a content panel on the right with a resizable divider. Suited for email, messaging, or record-browsing interfaces.

### Shared Layout Contract

```typescript
interface LayoutProps {
  children: ReactNode
  nav: NavItem[]
  headerSlot?: ReactNode
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  title: string
  description?: string
  actions?: ReactNode
  tabs?: TabItem[]
}
```

### Shared Across All Layouts

- `PageHeader` component (breadcrumbs, title, actions, tabs)
- User menu dropdown
- Theme switcher
- Notification bell
- Search command palette (Cmd+K)
- Mobile responsive drawer (collapses navigation on small viewports)

## Feature Module Details

### Auth (`features/auth/`)

**Pages:**
- Login — email/password fields with social login button placeholders
- Register — name, email, password with Zod validation
- Forgot password — email submission, then reset with token
- Email verification placeholder page

**Auth layout:** Centered card with a decorative side panel, separate from the main app layouts.

**Infrastructure:**
- Auth store (Zustand): token, user object, isAuthenticated, login/logout/refresh actions
- Route guards: `ProtectedRoute` (redirects unauthenticated to login), `GuestRoute` (redirects authenticated to dashboard)
- API client with automatic token injection in headers and token refresh on 401
- Pluggable auth adapter interface: defines `login()`, `register()`, `logout()`, `refreshToken()`, `forgotPassword()`, `resetPassword()` — swap backend implementation without changing UI code

### Data Table (`features/data-table/`)

**Components:**
- `DataTable` — main table built on TanStack Table
- `ColumnHeader` — sortable column header with sort direction indicator
- `DataTableToolbar` — search input, filter chips, view toggle (table/grid)
- `DataTablePagination` — page size selector and page navigation
- `ColumnVisibility` — dropdown to show/hide columns
- `RowActions` — per-row dropdown action menu

**Built-in features:**
- Server-side and client-side sorting
- Faceted filters: multi-select, date range, text search
- Row selection: single and bulk with select-all
- Column resizing and reordering
- Empty state and loading skeleton
- CSV export helper function

### Charts (`features/charts/`)

Theme-aware Recharts wrapper components:

- `AreaChart`, `BarChart`, `LineChart`, `PieChart`
- All read color values from CSS theme tokens (`--chart-1` through `--chart-5`)
- Consistent tooltip, legend, and axis styling across all chart types
- `ResponsiveChartContainer` — wrapper with aspect ratio control
- `ChartCard` — chart inside a styled card with title, description, and action buttons

### Dashboard (`features/dashboard/`)

**Components:**
- `StatCard` — displays a value, label, trend indicator (up/down percentage), and icon
- `KPICard` — metric display with inline sparkline chart and period comparison
- `ActivityFeed` — timestamped event list with user avatars and event descriptions
- `ProgressCard` — labeled progress bar with current value and target
- `MetricGrid` — responsive CSS grid that arranges stat and KPI cards

Dashboard may import from `charts/` for sparklines and embedded chart visualizations.

### Forms (`features/forms/`)

**Field components** (each wraps shadcn/ui primitive + TanStack Form + Zod validation):
- `TextField`, `TextareaField`, `NumberField`
- `SelectField`, `ComboboxField`, `MultiSelectField`
- `CheckboxField`, `RadioGroupField`, `SwitchField`
- `DatePickerField`, `DateRangeField`
- `FileUploadField`

**Form patterns:**
- `FormSection` — grouped fields with a heading and optional description
- `FormActions` — standardized submit/cancel/reset button row
- Multi-step form (wizard) pattern with step indicator
- Inline editing pattern (click to edit, save/cancel)
- Consistent error display: field-level inline messages plus toast for submission errors
- Loading and submitting states built into all form components

## Typography System

### Font Stack

- Sans: Inter (with system font fallbacks)
- Monospace: JetBrains Mono (with system font fallbacks)

### Type Scale

Uses Tailwind's default scale, which follows a Major Third (1.250) modular ratio:

| Token | Size | Use |
|---|---|---|
| `text-xs` | 12px | Captions, badges |
| `text-sm` | 14px | Body small, table cells |
| `text-base` | 16px | Body default |
| `text-lg` | 18px | Lead text |
| `text-xl` | 20px | H4 headings |
| `text-2xl` | 24px | H3 headings |
| `text-3xl` | 30px | H2 headings |
| `text-4xl` | 36px | H1 page headings |

### Weight Conventions

- `font-normal` (400) — body text
- `font-medium` (500) — headings, labels, navigation items
- `font-semibold` (600) — emphasis only, used sparingly

### Heading Rules

- `tracking-tight` on `text-2xl` and above
- Line height: 1.2 for headings, 1.5 for body text
- Secondary text uses `text-muted-foreground` semantic token

## Animation & Transition System

Tailwind CSS only — no runtime animation library.

### Duration Scale

| Duration | Use |
|---|---|
| `duration-75` | Micro-interactions: hover states, toggles |
| `duration-150` | Fast: button presses, dropdown open |
| `duration-200` | Normal: modal appear, panel slide |
| `duration-300` | Slow: sidebar collapse, page transitions |

### Easing Convention

- `ease-out` for entrances (elements appearing)
- `ease-in` for exits (elements disappearing)
- `ease-in-out` for state changes (element transforming in place)

### Custom Keyframes (defined in tailwind.config.ts)

| Animation | Use |
|---|---|
| `animate-in` | Fade + scale up — modals, popovers |
| `animate-out` | Fade + scale down — modal/popover dismiss |
| `animate-slide-in-right` | Slide from right — sheets, mobile sidebars |
| `animate-slide-in-bottom` | Slide from bottom — mobile drawers |
| `animate-accordion-down` | Expand — accordion, collapsible sections |
| `animate-accordion-up` | Collapse — accordion close |
| `animate-pulse-subtle` | Gentle pulse — loading skeletons |

## Developer Experience Tooling

### Code Quality

- TypeScript in strict mode (`strict: true` in tsconfig)
- ESLint with flat config format
- Prettier for formatting
- Path aliases: `@/core/*`, `@/features/*`, `@/routes/*`, `@/styles/*`

### Git Hooks (Husky)

- **Pre-commit**: lint-staged runs ESLint and Prettier on staged files only
- **Commit message**: commitlint enforces conventional commit format (`feat(scope): subject`)
- **Pre-push**: full TypeScript type-check

### Testing

- **Unit and component tests**: Vitest + React Testing Library
- **End-to-end tests**: Playwright
- **Coverage**: configured in Vitest, reports generated on CI

### Storybook

- Stories co-located with components (`Component.stories.tsx` alongside `Component.tsx`)
- Theme switcher addon to preview components in all themes and modes
- Viewport addon for responsive testing
- Auto-generated controls and arg tables from TypeScript props

### Vite Configuration

- React SWC plugin for fast compilation
- TanStack Router devtools (dev only)
- Bundle analyzer available via `npm run build:analyze`
- Environment variable typing via `env.d.ts`

### NPM Scripts

| Script | Description |
|---|---|
| `dev` | Start Vite dev server |
| `build` | Production build |
| `preview` | Preview production build locally |
| `test` | Run Vitest in watch mode |
| `test:ci` | Run Vitest once with coverage |
| `test:e2e` | Run Playwright E2E tests |
| `storybook` | Start Storybook dev server |
| `build:storybook` | Build static Storybook |
| `lint` | Run ESLint |
| `format` | Run Prettier |
| `typecheck` | Run TypeScript compiler check |
| `build:analyze` | Production build with bundle analyzer |
