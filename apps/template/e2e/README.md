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
pnpm test:e2e:visual                  # screenshot baseline (Linux Chromium); add --update-snapshots to re-record
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
  test; Vite and React DevTools messages are allowlisted.

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

| Axis                 | Values                         | Verified through                                                                                             |
| -------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Preset               | default, glass                 | `data-preset`, own-axis attributes set, other presets' attributes cleared, reload persistence                |
| Preset axes          | glass opacity/blur             | `data-<preset>-<axis>` for all 7 axis × value combinations                                                   |
| Mode                 | light, dark, system            | `data-mode`; `system` checked against both emulated `prefers-color-scheme` values                            |
| Accent               | all 19, including neutral      | `--primary` set, and all 19 distinct                                                                         |
| Surface              | all 12                         | `--background` set, and all 12 distinct in dark mode                                                         |
| Background           | solid, gradient                | `data-background-style`                                                                                      |
| Background intensity | neutral → intense              | `data-background-intensity`, `--canvas-blob-scale` increases monotonically, `--background` saturation capped |
| Gradient pattern     | blobs, aurora, spotlight, mesh | `data-gradient-pattern`                                                                                      |
| Density              | compact → spacious             | `data-density`, `--btn-px` increases monotonically                                                           |
| Font size            | small → extra-large            | `data-font-size`, `--text-base` increases monotonically                                                      |
| Dark accent chroma   | calm, standard, vivid          | `data-dark-accent-chroma`; `--primary-fill` differs between calm and vivid in dark, and stays put in light   |
| Elevation            | flat → high                    | `data-elevation`, `--elevation-current`                                                                      |
| Button elevation     | flat → high                    | `data-button-elevation`, `--shadow-button` (flat ⇒ transparent)                                              |
| Contrast             | low, standard, high            | `data-contrast`; the light page `--background` differs between low and high                                  |
| Tint with accent     | off, on                        | `data-tint-with-accent`; the switcher hides the control under the neutral accent                             |
| Radius               | sharp, subtle, rounded, pill   | `data-radius`, exact `--radius`, pill ⇒ `--radius-control: 9999px`                                           |

Plus one hand-built cross-axis combination for the glass preset and a
full round-trip test that every axis survives reload and navigation.

### 04 · Theme switcher UI (`04-theme-switcher.spec.ts`)

Everything above again, this time through the popover a user actually operates:

- Opens from the header, closes on Escape; the default preset shows all eighteen
  common-axis sections in order.
- Each of the 2 presets is selectable and persists across reload.
- Neither preset hides a common axis (`HIDDEN_COMMON_AXES` is empty for both),
  and glass offers its own opacity and blur axes.
- Mode radios, including System against an emulated dark scheme.
- All 19 accent and all 12 surface swatches: clicked, `data-active` confirmed,
  and each one produces a distinct token. Choosing the neutral accent hides Tint
  With Accent.
- Background toggle reveals and hides the intensity and pattern controls; all
  four gradient patterns are selectable.
- The five 4-value axes (density, font size, elevation, button elevation,
  radius) render as stepped sliders and are walked value by value
  **with the keyboard**, since a slider has no clickable cell.
- Preset-specific axis controls for both presets, plus a check that per-preset
  axis values are remembered when switching away and back.
- Two end-to-end proofs that switcher changes restyle real components: radius
  changes a button's computed `border-radius`, font size changes body copy.

### 05 · Component × preset matrix (`05-component-preset-matrix.spec.ts`)

All 97 component routes × 2 presets × 2 modes. Per page: the theme attributes applied, the expected heading, no error
boundary, no horizontal overflow, and a clean console. This is the check that
catches a component that only breaks under one preset.

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
- The dashboard shell under each of the 2 presets.

### 10 · Accessibility (`10-accessibility.spec.ts`)

- Skip link focus and activation.
- Dialog focus trap over 12 Tab presses and focus restoration on close.
- Arrow-key navigation for dropdown menu, tabs and toggle group (roving
  tabindex).
- Theme switcher fully operable by keyboard.
- Landmarks (`banner`, `main`, `complementary`), accessible names on every
  icon-only header button, labels on every non-hidden form input.
- WCAG AA contrast for `--foreground` on `--background`, computed from the raw
  HSL tokens, for every preset × both modes.
- The app renders under `prefers-reduced-motion: reduce`.

### 16 · Control contract (`16-control-contract.spec.ts`)

Runs against the standalone fixture `e2e/fixtures/control-contract.html`.

- Every button variant, toggle, input, select, combobox, multi-select, date
  input, number input, OTP slot and segment item measures exactly
  `--control-height`, for every preset × both modes × every density × the
  `medium` and `extra-large` font sizes.
- With `hasTouch` (which makes Chromium match `pointer: coarse`), the same
  controls measure at least `--control-height-xl` at compact and cozy, and so
  does every square on the app's collapsed sidebar rail (brand slot, toggle,
  search trigger, nav links and group triggers).
- A field's bottom edge reaches 3:1 against the page and against a card,
  sampled from rendered pixels, for every preset and for strong glass
  opacity × both modes.
- Under the default preset with a gradient background, the top 300px of the
  content area (the canvas strip) is sampled at 1440px with the content
  hidden: the field edge, `--primary` and `--focus-ring` clear 3:1 and muted
  and accent text 4.5:1 against its lowest-contrast pixel, for slate and
  violet × both modes × balanced and intense with the blobs pattern, plus
  aurora, mesh and spotlight on slate at intense. Narrower viewports are not
  checked: the blobs crowd together there and the dark field edge falls
  below 3:1, a known gap the kit CHANGELOG records.
- The glass switch thumb sits the same distance from each end of its track.

### 17 · Selection and overlays (`17-selection-overlays.spec.ts`)

Runs against the standalone fixture `e2e/fixtures/selection-overlays.html`.

- At a 375px viewport the AlertDialog's stacked Cancel and Action buttons sit
  8px apart, the footer gap alone, under both presets.
- A right Sheet squares its two right-hand corners and draws no right border,
  under both presets.
- The selected default Tabs pill is not the accent fill; under the default
  preset it is the view-switch pill (`--selected-view-bg`). Under glass in
  light mode, the selected label reads at 4.5:1 on its pill, sampled from
  rendered pixels.
- Under glass, grouped OTP slots share one 1px seam and the combobox draws one
  border, on its control.
- A hovered idle sidebar link and the active link have different backgrounds,
  in both modes.
- A dropdown menu opened with `defaultOpen` (from
  `e2e/fixtures/baseline-overlays.html`) holds focus on its container and draws
  no outline there.

## Regression tests for fixed defects

`11-review-regressions.spec.ts` checks supported layout choices, settings form
subscriptions, and virtual-table row height, end-of-list scrolling, and filtering.
The virtual-table fixture deliberately includes long cell content.

`12-i18n.spec.ts` covers switching and persistence, translated existing validation
errors, retained form drafts and table filters, language in portal content,
showcase headings, root error pages, and mobile language controls.

Pull-request and release workflows run suites `01`, `06`, `08`, `11`, and `12` against
a fresh UI build. The full browser suite remains available separately.

These three earlier tests also guard fixed defects:

| Test                                                  | Guards                                                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `02-routes` → `/components/data-table`                | The expandable-table example must key its rows via `<Fragment key>`; a bare `<>` makes React log a missing-`key` error on every render.                      |
| `02-routes` → `/components/image-editor`              | `ImageEditorAnnotationColor` must not nest `ColorPickerSwatch` (a button) inside `ColorPickerTrigger` (also a button) — that is invalid HTML and ~58 errors. |
| `08-data-display` → `dashboard charts size correctly` | `ChartContainer` must seed `ResponsiveContainer` with a positive `initialDimension`; the recharts default of `-1 × -1` warns once per chart on first render. |

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
