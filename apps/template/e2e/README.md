# darkraise-ui end-to-end test plan

Executable coverage of the `darkraise-ui` package as exercised through the
`darkraise-web-template` demo app. Every item in this plan is implemented as a
Playwright test in this directory — running the suite _is_ running the plan.

## Running it

```bash
pnpm --filter darkraise-ui build      # the demo consumes dist/, not src/
cd apps/template
pnpm test:e2e                         # the whole plan
pnpm test:e2e:baseline                # skips anything tagged @known-issue
pnpm test:e2e:report                  # open the HTML report
```

`playwright.config.ts` starts the dev server on `http://localhost:5176` and
reuses one that is already running. Workers are capped at 4 because the whole
suite drives a single Vite dev server; above that its transform queue, not the
app, becomes the thing under test.

Rebuild `darkraise-ui` before a run whenever package sources changed. The demo
imports the built `dist/`, so a stale build silently tests old component code.

**Use a fresh dev server for each full run.** A long-lived one accumulates
memory across ~1300 page loads (~700 MB after several runs), and once it starts
thrashing, tests fail on navigation timeouts that look exactly like real
defects. Letting Playwright own the server — no dev server already running when
you start — avoids this. If a run reports a scattered set of failures that pass
individually, restart the server before believing them.

## How the suite talks to the app

- **Auth** is seeded through `localStorage` (`auth-token`, `auth-user`) by
  `helpers/app.ts::seedApp`, which registers an init script so state exists
  before the first paint. `01-auth.spec.ts` covers the real login form.
- **Theme** is seeded the same way, using the exact keys `ThemeProvider` reads
  (`theme-preset`, `mode`, `theme-accent`, `theme-<preset>-<axis>`, …). This
  covers the boot-time read path, which UI-driven switching never touches.
  `seedApp` deliberately **never overwrites** an existing key, so persistence
  assertions stay meaningful; use `applyTheme` to walk several values inside one
  test.
- **Assertions on theming** read the `data-*` attributes `ThemeProvider` writes
  on `<html>` and the resolved CSS custom properties, then confirm the tokens
  reach real rendered components.
- **Console output** is captured per test by `watchConsole`. Errors fail the
  test; Vite, React DevTools and the expected `[ThemeProvider] Preset … requires
mode` notice are allowlisted.

## Coverage

### 01 · Authentication (`01-auth.spec.ts`)

| Area           | Checks                                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Route guards   | Unauthenticated visits to `/` and a component route redirect to `/login` |
| Guest routes   | `/login`, `/register`, `/forgot-password`, `/reset-password` render      |
| Login flow     | Real form submit signs in, lands on the dashboard, writes the token      |
| Password field | Visibility toggle flips `type` between `password` and `text`             |
| Not found      | Unknown route renders the 404 page                                       |

### 02 · Route inventory (`02-routes.spec.ts`)

- All 9 application routes render with the expected `h1`, no error boundary and
  no horizontal overflow.
- All 97 component showcase routes, driven from `fixtures/component-routes.ts`
  (regenerate it when pages are added — see _Maintenance_).
- `/components/image-editor-playground` and `/inbox`, which have no showcase
  header, get their own shape-specific checks.
- Detail routes are reached the way a user reaches them: the row-action menu on
  `/products`, `/orders` and `/customers`.
- Sidebar integrity: every sidebar link resolves to a known route, and clicking
  one navigates client-side without a full reload.

### 03 · Theme axes (`03-theme-axes.spec.ts`)

Every value of every axis, seeded at boot and verified on `<html>` plus the
token it drives:

| Axis                 | Values                                            | Verified through                                                                              |
| -------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Preset               | default, glass, scifi                             | `data-preset`, own-axis attributes set, other presets' attributes cleared, reload persistence |
| Preset axes          | glass opacity/blur/halo, scifi intensity/frame    | `data-<preset>-<axis>` for all 11 axis × value combinations                                   |
| Mode                 | light, dark, system                               | `data-mode`; `system` checked against both emulated `prefers-color-scheme` values             |
| Accent               | all 17                                            | `--primary` set, and all 17 distinct                                                          |
| Surface              | all 18                                            | `--background` set, and all 18 distinct in dark mode                                          |
| Background           | solid, gradient                                   | `data-background-style`                                                                       |
| Background intensity | subtle → intense                                  | `data-background-intensity`, `--canvas-blob-scale` increases monotonically                    |
| Gradient pattern     | blobs, aurora, spotlight, mesh                    | `data-gradient-pattern`                                                                       |
| Density              | compact → spacious                                | `data-density`, `--density-button-px` increases monotonically                                 |
| Font size            | small → extra-large                               | `data-font-size`, `--text-base` increases monotonically                                       |
| Accent intensity     | calm, balanced, vivid, intense (dark mode only)   | `--primary-fill` / `--primary` token values, like Accent and Surface — no `data-*` attribute  |
| Canvas tint          | neutral, subtle, balanced, vivid (dark mode only) | `--background` token values, like Accent Vibrancy — no `data-*` attribute                     |
| Elevation            | flat → high                                       | `data-elevation`, `--elevation-current`                                                       |
| Button elevation     | flat → high                                       | `data-button-elevation`, `--shadow-button` (flat ⇒ transparent)                               |
| Surface intensity    | flat, subtle, balanced, bold                      | `data-surface-intensity`                                                                      |
| Radius               | sharp, subtle, rounded, pill                      | `data-radius`, exact `--radius`, pill ⇒ `--radius-button: 9999px`                             |

Plus five hand-built cross-axis combinations (one per non-default preset) and a
full round-trip test that every axis survives reload and navigation.

### 04 · Theme switcher UI (`04-theme-switcher.spec.ts`)

Everything above again, this time through the popover a user actually operates:

- Opens from the header, closes on Escape; the default preset shows all thirteen
  common-axis sections in order.
- Each of the 6 presets is selectable and persists across reload.
- Each preset hides exactly the axes it takes over (`hiddenCommonAxes`) and the
  three dark-only presets hide the Mode section entirely.
- Mode radios, including System against an emulated dark scheme.
- All 17 accent and all 18 surface swatches: clicked, `data-active` confirmed,
  and each one produces a distinct token.
- Background toggle reveals and hides the intensity and pattern controls; all
  four gradient patterns are selectable.
- The six 4-value axes render as stepped sliders and are walked value by value
  **with the keyboard**, since a slider has no clickable cell.
- Preset-specific axis controls for all 6 presets, plus a check that per-preset
  axis values are remembered when switching away and back.
- Two end-to-end proofs that switcher changes restyle real components: radius
  changes a button's computed `border-radius`, font size changes body copy.

### 05 · Component × preset matrix (`05-component-preset-matrix.spec.ts`)

All 97 component routes × 6 presets × each preset's supported modes = **873
tests**. Per page: the theme attributes applied, the expected heading, no error
boundary, no horizontal overflow, and a clean console. This is the check that
catches a component that only breaks under Terminal or Sci-fi.

### 06 · Overlays and menus (`06-overlays.spec.ts`)

Accordion, collapsible, dialog (open → focus inside → Escape), alert dialog,
drawer, sheet, popover, tooltip, hover card, floating panel, dropdown menu,
context menu (right click), menubar, navigation menu, virtualized dropdown menu
(asserts the list is actually windowed), the global ⌘/Ctrl-K command palette,
the command showcase filter, Sonner toasts, banner dismissal, and the guided
tour.

### 07 · Forms and inputs (`07-forms-inputs.spec.ts`)

Text input, textarea, password toggle, number input stepper, OTP, editable,
tags input; checkbox, switch, radio group, toggle, toggle group, segment group,
rating group, swap; select, combobox, multi select, cascade select, listbox;
calendar, date picker, date input, time picker; slider and angle slider by
keyboard, color picker; validation on the form-fields showcase and on
`/products/new`; label/input association; file upload, signature pad (verified
by reading canvas pixels), clipboard copy.

### 08 · Data display (`08-data-display.spec.ts`)

Table, data table sorting, product search filtering, pagination; tabs, steps,
carousel, tree view, JSON tree view, scroll area, resizable (real mouse drag);
progress, timer, spinner, skeleton; charts, dashboard chart sizing, contribution
graph, QR code, virtualized timeline, marquee; breadcrumb, avatar, highlight,
empty state, download trigger, image cropper.

### 09 · Layout and responsive (`09-layout-responsive.spec.ts`)

- All 3 layout variants (sidebar, top navigation, stacked): switched through the
  header menu, persisted, and still able to navigate after reload.
- 4 viewports (390, 834, 1280, 1920): dashboard and a dense component page must
  render with no horizontal overflow.
- Mobile: desktop sidebar hidden, drawer opens the nav, theme popover stays
  inside the viewport.
- Sidebar collapse, active-route marking, search opening the palette.
- The dashboard shell under each of the 6 presets.

### 10 · Accessibility (`10-accessibility.spec.ts`)

- Skip link focus and activation.
- Dialog focus trap over 12 Tab presses and focus restoration on close.
- Arrow-key navigation for dropdown menu, tabs and toggle group (roving
  tabindex).
- Theme switcher fully operable by keyboard.
- Landmarks (`banner`, `main`, `complementary`), accessible names on every
  icon-only header button, labels on every non-hidden form input.
- WCAG AA contrast for `--foreground` on `--background`, computed from the raw
  HSL tokens, for every preset × supported mode.
- The app renders under `prefers-reduced-motion: reduce`.

## Regression tests for fixed defects

The suite is green. These four tests were written against real defects the first
run surfaced; each now guards the fix, so treat a failure here as a regression
rather than a flake.

| Test                                                        | Guards                                                                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `02-routes` → `/components/data-table`                      | The expandable-table example must key its rows via `<Fragment key>`; a bare `<>` makes React log a missing-`key` error on every render.                      |
| `02-routes` → `/components/image-editor`                    | `ImageEditorAnnotationColor` must not nest `ColorPickerSwatch` (a button) inside `ColorPickerTrigger` (also a button) — that is invalid HTML and ~58 errors. |
| `03-theme-axes` → `preset "scifi" forces dark mode at boot` | `supportedModes` must be enforced on the boot path too, not only in `setPreset`; otherwise a dark-only preset paints its recipes onto a near-white rail.     |
| `08-data-display` → `dashboard charts size correctly`       | `ChartContainer` must seed `ResponsiveContainer` with a positive `initialDimension`; the recharts default of `-1 × -1` warns once per chart on first render. |

If a future defect can't be fixed immediately, tag its test `@known-issue` so
`pnpm test:e2e:baseline` stays green while `pnpm test:e2e` still reports it.

## Maintenance

- **New component page** → regenerate the fixture:

  ```bash
  cd apps/template/src/routes/_authenticated/components
  for f in *.tsx; do … done > ../../../../e2e/fixtures/component-routes.ts
  ```

  Or add the `{ path, title }` entry by hand. `02` and `05` pick it up
  automatically, and the sidebar-integrity test fails if a link has no entry.

- **New theme axis or preset** → add it to `e2e/fixtures/theme.ts`. `03`, `04`,
  `05`, `09` and `10` all derive their matrices from that file.
- **New localStorage key in `ThemeProvider`** → add it to `LS_KEYS` and to
  `ThemeSeed` in `helpers/app.ts`.
