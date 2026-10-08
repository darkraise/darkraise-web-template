# darkraise-ui end-to-end test plan

Executable coverage of the `darkraise-ui` package as exercised through the
`darkraise-web-template` demo app. Every item in this plan is implemented as a
Playwright test in this directory — running the suite _is_ running the plan.

## Running it

```bash
pnpm --filter darkraise-ui build      # the demo consumes dist/, not src/
cd apps/template
pnpm test:e2e                         # the whole plan
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

**Keep temporary files on disk.** Playwright and Chromium write their
temporary files under `TMPDIR`. Where `/tmp` is a small tmpfs, as on the
development host, Chromium crashes on every navigation once it fills, so point
`TMPDIR` at a directory on disk:

```bash
mkdir -p /root/.cache/pw-tmp
TMPDIR=/root/.cache/pw-tmp pnpm test:e2e
```

`e2e/global-setup.ts` stops the run before any test starts when the
temporary directory has less than 1 GiB free.

**Warm-up.** Vite transforms a route chunk only when the router first imports
it, so on a cold server the first tests spend their time compiling. `pnpm
test:e2e` sets `E2E_WARM=1`, and `e2e/global-setup.ts` then drives one page
through every guest route, app route, showcase route and standalone fixture
before the tests start. The route lists come from `fixtures/app-routes.ts` and
`fixtures/component-routes.ts`, the fixtures from every `fixtures/*.html` file,
and the setup logs the fixtures it warms. Runs that call `playwright test`
directly, such as a single spec, skip the warm-up unless `E2E_WARM=1` is set;
`18` warms the routes it captures in its own `beforeAll`.

**Projects.** `21-mobile-layout.spec.ts` runs only in the `mobile` project
(390×844, touch); every other spec runs in `chromium`.

**Flaky failures.** Local runs retry a failed test once (CI twice), and a test
that passes on retry is reported as flaky. The known source of local flakes is
host network churn: when Docker adds or removes a container's network
interface, Chromium aborts in-flight requests with `net::ERR_NETWORK_CHANGED`,
and a page whose module load was cut never renders. The one retry covers it.

**Traces.** Local runs record a trace only on the retry (`on-first-retry`),
so a test that fails once and then passes leaves no trace of the failure. Set
`E2E_TRACE=1` to keep the trace of every first failed attempt instead
(`retain-on-first-failure`, always on in CI), and open it with
`pnpm exec playwright show-trace <test-results/.../trace.zip>`:

```bash
E2E_TRACE=1 TMPDIR=/root/.cache/pw-tmp pnpm test:e2e
```

## How the suite talks to the app

- **Auth** is seeded through `localStorage` (`auth-token`, `auth-user`) by
  `helpers/app.ts::seedApp`, which registers an init script so state exists
  before the first paint. `01-auth.spec.ts` covers the real login form.
- **Theme** is seeded the same way, using the exact keys `ThemeProvider` reads
  (`theme-preset` for the style, `mode`, `theme-accent`, `theme-glass-opacity`,
  …). This covers the boot-time read path, which UI-driven switching never
  touches.
  `seedApp` seeds **once per tab**: its init script writes only keys that are
  absent, and only on the tab's first load (a `sessionStorage` flag marks it
  done), so whatever the app stores or erases afterwards survives reloads and
  same-origin navigations, which persistence assertions depend on. A second
  `seedApp` call in the same tab has no effect; use `applyTheme` to walk
  several values inside one test.
- **Assertions on theming** read the `data-*` attributes `ThemeProvider` writes
  on `<html>` and the resolved CSS custom properties, then confirm the tokens
  reach real rendered components.
- **Console output** is captured per test by `watchConsole`. `assertClean()`
  fails the test on any console error or page error; warnings are collected
  for the tests that check them. Only the React DevTools prompt is
  allowlisted: a `[vite]` error fails the test like any other.

## Coverage

### 00 · Helpers (`00-helpers.spec.ts`)

| Helper         | Checks                                                                              |
| -------------- | ----------------------------------------------------------------------------------- |
| `settle`       | Throws at its 5,000 ms deadline even when the page produces no frames               |
| `watchConsole` | Records a `[vite]` console error, ignores a `[vite]` debug message                  |
| `seedApp`      | Seeds once per tab, so a sign-out survives a reload; a failing iframe is not seeded |

### 01 · Authentication (`01-auth.spec.ts`)

| Area           | Checks                                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Route guards   | Unauthenticated visits to `/` and a component route redirect to `/login` |
| Guest routes   | `/login`, `/register`, `/forgot-password`, `/reset-password` render      |
| Login flow     | Real form submit signs in, lands on the dashboard, writes the token      |
| Seeded session | A seeded token reaches the dashboard directly                            |
| Password field | Visibility toggle flips `type` between `password` and `text`             |
| Not found      | Unknown route renders the 404 page                                       |

### 02 · Route inventory (`02-routes.spec.ts`)

- All 13 application routes in `fixtures/app-routes.ts` render with the
  expected `h1` (`/inbox` has none until a message opens), no error boundary
  and no horizontal overflow.
- All 100 component routes, driven from `fixtures/component-routes.ts`
  (regenerate it when pages are added — see _Maintenance_), including
  `/components/image-editor-playground`.
- `/inbox` gets its own shape-specific check.
- `/components/kitchen-sink` fits one 1440×900 viewport with its focused text
  field still focused, because the style screenshots in `18` capture it whole.
- Detail routes are reached the way a user reaches them: the row-action menu on
  `/products`, `/orders` and `/customers`.
- Sidebar integrity: every sidebar link resolves to a known route, and clicking
  one navigates client-side without a full reload.

### 03 · Theme axes (`03-theme-axes.spec.ts`)

Every value of every axis, seeded at boot and verified on `<html>` plus the
token it drives:

| Axis                 | Values                         | Verified through                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Style                | flat, quiet, tactile, glass    | `data-style` and never `data-preset`; each style's exact `--btn-shadow`, `--field-shadow` and `--chrome-backdrop`, and its default elevation and background; the glass axes stamped under every style; content tokens identical across styles; reload persistence |
| Glass axes           | opacity, blur                  | Under light glass the nav's luminance spread, read from pixels with its content hidden, grows from subtle to strong; each blur value sets the exact `backdrop-filter` on the nav and the bar                                                                      |
| Mode                 | light, dark, system            | `data-mode`; `system` checked against both emulated `prefers-color-scheme` values; light and dark differ in `--background`                                                                                                                                        |
| Accent               | all 19, including neutral      | `--primary` set, and all 19 distinct                                                                                                                                                                                                                              |
| Surface              | all 12                         | stored and stamped as `data-surface`; each moves `--background` away from a reference surface, and all 12 are distinct in dark mode                                                                                                                               |
| Background           | solid, gradient                | `data-background-style`; solid paints no body background image                                                                                                                                                                                                    |
| Background intensity | neutral → intense              | `data-background-intensity`, the exact `--canvas-blob-scale` per step, increasing monotonically; five steps give four distinct dark `--background` values (vivid and intense are both uncapped), and the step moves it in light too                               |
| Gradient pattern     | blobs, aurora, spotlight, mesh | `data-gradient-pattern` and the pattern's first body background layer                                                                                                                                                                                             |
| Density              | compact → spacious             | `data-density`, the exact `--btn-px`, increasing monotonically                                                                                                                                                                                                    |
| Font size            | small → extra-large            | `data-font-size`, `--text-base` increases monotonically                                                                                                                                                                                                           |
| Dark accent chroma   | calm, standard, vivid          | `data-dark-accent-chroma`; `--primary-fill` differs between calm and vivid in dark, and stays put in light                                                                                                                                                        |
| Elevation            | flat → high                    | `data-elevation`; the theme-following card's drop-shadow blurs (none, 20/8px, 72/36px); the retired `--shadow-button` token is gone                                                                                                                               |
| Contrast             | low, standard, high            | `data-contrast`; the light page `--background` differs between low and high                                                                                                                                                                                       |
| Tint with accent     | off, on                        | `data-tint-with-accent`; turning it on changes the page `--background`                                                                                                                                                                                            |
| Radius               | sharp, subtle, rounded, pill   | `data-radius`, exact `--radius`, pill ⇒ `--radius-control: 9999px`                                                                                                                                                                                                |

Plus one hand-built cross-axis combination under glass and a full round-trip
test that every axis, the glass axes included, survives a reload and a
navigation away and back, both on `<html>` and in `localStorage`.

### 04 · Theme switcher UI (`04-theme-switcher.spec.ts`)

Everything above again, this time through the popover a user actually operates:

- Opens from the header, closes on Escape; under Quiet it shows the nine
  Brand sections in order, then the eight Advanced sections once the Advanced
  disclosure is opened (`openAdvanced` in `helpers/app.ts`).
- Each of the 4 styles is selectable and persists across reload.
- The glass Opacity and Backdrop Blur controls render right after the Style
  control under glass, and under no other style.
- Mode radios, including System against an emulated dark scheme.
- All 19 accent and all 12 surface swatches: clicked, `data-active` confirmed,
  and each one produces a distinct token. Choosing the neutral accent hides Tint
  With Accent.
- Background toggle reveals and hides the intensity and pattern controls; all
  four gradient patterns are selectable.
- The three 4-value Brand axes (density, font size, radius) render as stepped
  sliders and are walked value by value **with the keyboard**, since a
  slider has no clickable cell. Elevation, contrast and dark accent chroma
  render as three-cell toggle groups under Advanced and are clicked in turn.
- The glass axis controls: Opacity as a toggle group and Backdrop Blur as a
  stepped slider, plus a check that both values survive switching to another
  style and back and stay stamped on `<html>` meanwhile.
- Two end-to-end proofs that switcher changes restyle real components: radius
  changes a button's computed `border-radius`, font size changes body copy.

### 05 · Component × style matrix (`05-component-preset-matrix.spec.ts`)

All 100 component routes × 2 styles (`MATRIX_STYLES`: quiet, glass) × 2 modes.
Per page: the theme attributes applied, the expected heading, no error
boundary, no horizontal overflow, and a clean console. This is the check that
catches a page that only breaks inside Glass's frosted chrome. Flat and Tactile
change only control shadows, which `16` and the kitchen sink baseline cover.

### 06 · Overlays and menus (`06-overlays.spec.ts`)

Accordion, collapsible, dialog (open → focus inside → Tab and Shift+Tab wrap →
Escape), alert dialog (Cancel and Continue both return focus to the trigger,
and confirming a delete on `/categories` removes the row), drawer, sheet,
popover, tooltip, hover card, floating panel, dropdown menu, context menu
(right click), menubar, navigation menu (and its arrow-key, ArrowDown and
Escape handling), virtualized dropdown menu (asserts the list is actually
windowed), the global ⌘/Ctrl-K command palette and its filter, the command
showcase filter, Sonner toasts, banner dismissal, and the guided tour (step
counter and Previous state).

### 07 · Forms and inputs (`07-forms-inputs.spec.ts`)

Text input, textarea, password toggle, number input stepper, OTP, editable
(its edit trigger centred on the value row), tags input; checkbox, switch,
radio group, toggle, toggle group, segment group, rating group, swap; select,
combobox, multi select, cascade select, listbox; calendar, date picker (the
picked day lands in the input), date input, time picker; slider and angle
slider by keyboard, color picker; validation on the form-fields showcase and on
`/products/new`; the Field example's description and error reaching the input's
accessible description, with `aria-invalid` only while the value is invalid;
file upload, signature pad (verified by reading canvas pixels), clipboard copy.

### 08 · Data display (`08-data-display.spec.ts`)

Table, data table sorting, product search filtering, pagination; tabs, steps,
carousel, tree view, JSON tree view, scroll area, resizable (real mouse drag);
progress, timer, spinner, skeleton; charts, dashboard chart sizing, contribution
graph, QR code, virtualized timeline (rows windowed, ticks centred on their
dates and clear of the labels on either rail side, and the group checkbox's
gap); breadcrumb, avatar (initials for a broken image), highlight, empty state,
download trigger, image cropper (its dimensions badge shows at rest).

### 09 · Layout and responsive (`09-layout-responsive.spec.ts`)

- All 3 layout variants (sidebar, top navigation, stacked): switched through the
  header menu, persisted, and still able to navigate after reload.
- 4 viewports (390, 834, 1280, 1920): dashboard and a dense component page must
  render with no horizontal overflow.
- Mobile: desktop sidebar hidden, drawer opens the nav, theme popover stays
  inside the viewport.
- Sidebar collapse, active-route marking, search opening the palette.
- The dashboard shell under each of the 4 styles.

### 10 · Accessibility (`10-accessibility.spec.ts`)

- Skip link focus and activation.
- Dialog focus trap over 12 Tab presses and focus restoration on close.
- Arrow keys move focus item by item in a dropdown menu, between tabs and
  across a toggle group.
- Theme switcher reachable by Tab and operable by keyboard: Mode switched to
  Dark with the arrow keys and Enter.
- Landmarks (`banner`, `main`, the `Primary` complementary region), an
  accessible name on every visible header button, and a label on every visible
  form-fields input that is not just its placeholder.
- WCAG AA contrast for `--foreground` on `--background`, computed from the raw
  HSL tokens, for quiet and glass × both modes; in both modes, the Sign up,
  Sign in and Back to sign in links on the auth pages read at 4.5:1, and the
  alert dialog's destructive action paints like its trigger and reads at 4.5:1.
- Under `prefers-reduced-motion: reduce`, every animated element on
  `/components/animation` (at least 17) runs no animation or transition longer
  than 0.01ms (transitions take 0s), and a tab change on `/components/tabs`
  starts no CSS transition: read in the same task as the click, the
  indicator's transition duration is 0s and `getAnimations()` holds no
  `CSSTransition`.

### 11 · Card and accordion variants (`11-card-accordion-variants.spec.ts`)

Under quiet and glass × both modes, on `/components/cards` and
`/components/accordion`:

- A divided card draws a 1px solid rule under its header and restores the
  content's top padding.
- A `high` card does not redefine `--elevation-medium` for its content.
- Border variants: `none` is transparent and the default paints a colour;
  `strong` and `accent` differ and draw 1px solid; all three cards keep one
  width.
- The accordion `card` variant is a flex column with a gap, its items are
  cards, its triggers pad every side, and an open trigger draws a divider once
  its transition settles; a default-variant accordion on the same page keeps
  zero inline padding.

### 11 · Review regressions (`11-review-regressions.spec.ts`)

- The layout menu offers no Split Panel, and a chosen Stacked layout is still
  marked active after reload.
- Settings: Save changes is disabled while Store Name is empty and while saving
  (`Saving…`), then enabled again.
- On the virtual-table fixture (long cell content, spacious density): rows are
  40px tall, scrolling reaches item 490 and the last row, and filtering to one
  row resets the scroll to the top.
- Virtual-table cells follow `meta.align`: a right-aligned cell's text ends
  where its header's does.

### 12 · Internationalisation (`12-i18n.spec.ts`)

Switching to Vietnamese through the language picker:

- keeps a typed product filter and its empty state, and a portalled column menu
  carries `lang="vi"`;
- translates showcase headings and copy, and the root 404 page;
- translates the kitchen sink title, breadcrumb and sidebar label;
- keeps the picker usable on a 390px phone with no horizontal overflow;
- shows each language's flag in the trigger and the options, sets
  `<html lang="vi">`, translates settings and navigation, survives a reload,
  and switches back to English;
- keeps a login draft and translates its existing validation error.

### 12 · Settings matrix (`12-settings-preset-matrix.spec.ts`)

`/settings`, which `05` never visits, under quiet and glass × both modes: the
theme attributes applied, the Settings heading, no error boundary, no
horizontal overflow and a clean console.

### 13 · Sidebar selection (`13-sidebar-selection.spec.ts`)

- Each look (chip, pill, tile, frosted) on the active row, under every style ×
  both modes × the blue and neutral accents, read from pixels: the row's
  surface or its edge reaches 1.2:1 against the rail, and its cue (icon, tile
  or pill) 3:1 against the surface.
- In the collapsed rail's group popover, under quiet light and glass dark, the
  current entry's label uses neither nav label colour and reaches 3:1 against
  its surface.
- The moving indicator lands on the row after navigation, slides to the next
  row with a `transform` transition, follows the row when a group above it
  opens and closes, follows the sidebar's collapse without a transition, and
  never transitions under reduced motion.
- Pill's marker sits on the nav's edge in the collapsed rail and the stacked
  rail; the stacked rail draws chip's and tile's icon cues from the primary
  tokens.
- `/orders/ord-1`, `/customers/cust-1` and `/categories` keep exactly one
  active nav row, with one `aria-current="page"` link.
- A stored legacy `theme-sidebar-active-bar` migrates to the pill look.

### 14 · Theme settings fit (`14-theme-settings-fit.spec.ts`)

- At 1024, 1280 and 1600px, in Vietnamese at 1024 and 1280px, and at spacious
  density at 1024px, the appearance panel on `/settings` (gradient background,
  so the four-value Gradient Pattern row renders, 2x2 like every four-value
  group on that page): no toggle item, toggle group or swatch grid is wider
  than its box, and every toggle label sits at least 6px from both edges of
  its cell.
- The theme switcher popover, with Advanced open, has no overflowing control
  either.

### 15 · Shell styles (`15-shell-styles.spec.ts`)

- Classic is the default (no gap, no padding); island gutters the shell by
  8px and rounds every region.
- A mounted shell follows the stored choice: setting `data-shell-style` on
  `<html>` does not move it, and `<html>` never carries it. The layout switcher
  checks the painted and the stored style, and the choice survives a reload.
- Under each of the six styles × both modes, the dashboard's nav fill, nav and
  content border widths, radii and separation shadow match that style's
  recipe, and the content region keeps its own scroll.
- Under island, floating and framed the chrome edge stands apart from the
  gutter (1.1:1, from pixels); under island with an intense gradient the
  content's gradient strip clips to the rounded corner; every structure on
  `/components/shell-styles` keeps its regions, in order and rounded.
- Flat in light mode, under every style: the nav's tone reaches 1.2:1 against
  the content, from pixels, and stays below the contrast the same theme's
  classic nav border reaches against the content.
- Geometry: inset leaves no seam border in the nav; floating runs the content
  full-bleed and clears a collapsed sidebar by 1.5rem; island's content edge is
  a real border, not an inset shadow; framed insets the whole shell behind an
  outset ring.
- Sidebar selection: Auto follows the style (quiet chip, flat pill, tactile
  tile, glass frosted), a stored look reaches the sidebar, and the theme panel
  switches it live.

### 16 · Control contract (`16-control-contract.spec.ts`)

Runs against the standalone fixture `e2e/fixtures/control-contract.html`,
except where a page is named.

- Every button variant, toggle, input, select, cascade select and time picker
  trigger, file upload trigger, combobox, multi-select, date input, number
  input, OTP slot, segment item and password field measures exactly
  `--control-height`, for every style × both modes × every density × the
  `medium` and `extra-large` font sizes.
- With `hasTouch` (which makes Chromium match `pointer: coarse`), the same
  controls measure at least `--control-height-xl` at compact and cozy, and so
  does every square on the app's collapsed sidebar rail (brand slot, toggle,
  search trigger, nav links and group triggers); calendar days keep their cell
  width instead.
- Data table rows measure `--control-height` plus 8px under quiet and glass ×
  both modes × every density, and a sortable header's label lines up with the
  cell text and matches a plain header's font and colour.
- A field's bottom edge reaches 3:1 against the page and against a card,
  sampled from rendered pixels, for every style and for glass with a vivid
  fuchsia accent, a sand surface, an intense gradient, and subtle and strong
  opacity × both modes; in dark
  also on low, medium and high cards, in a popover, a dialog and a muted
  dialog.
- A card paints the plane its `surface` prop names (card, page, muted, none,
  and card again inside a muted ancestor), under quiet and glass × both modes.
- At sharp and pill radius, the password input keeps the control height with
  its reveal button filling the field's inline end, and the textarea takes the
  field edge and `--radius` rather than `--radius-control`.
- Under Quiet with a gradient background, the top 300px of the content area
  (the canvas strip) is sampled with the content hidden: `--field-edge-color`,
  `--primary` and `--focus-ring` clear 3:1 and `--muted-foreground` and
  `--primary-text` 4.5:1 against its lowest-contrast pixel. At 1440px: slate
  and mauve × both modes × balanced and intense with the blobs pattern, plus
  aurora, mesh and spotlight on slate at intense. At 390 and 768px: blobs and
  mesh on slate at intense × both modes.
- The switch thumb sits the same distance from each end of its track, and
  centred vertically when off and on, under every style.
- On the kitchen sink, under every style, probe values set on `<html>` reach
  the computed shadows: `--glow-outer` and `--glow-inner` on a filled button,
  `--affordance-glow` on a checked checkbox and the active tab pill, and
  `--field-shadow` on a focused field, under its 1px focus ring.
- An invalid OTP's active slot keeps the `--affordance-glow` probe next to its
  destructive ring.

### 17 · Selection and overlays (`17-selection-overlays.spec.ts`)

Runs against the standalone fixture `e2e/fixtures/selection-overlays.html`.

- At a 375px viewport the AlertDialog's stacked Cancel and Action buttons sit
  8px apart, the footer gap alone, under quiet and glass.
- A right Sheet squares its two right-hand corners and draws no right border,
  under quiet and glass.
- The selected default Tabs pill is not the accent fill but the view-switch
  pill (`--selected-view-bg`), and its label reads at 4.5:1 on it, sampled
  from rendered pixels for blue, yellow and lime × both modes, under quiet and
  glass.
- Grouped OTP slots share one 1px seam, under quiet and glass.
- The combobox draws one border, on its input, and none on the control around
  it, under every style.
- A hovered idle sidebar link and the active link have different backgrounds,
  in both modes.
- When the arrow keys scroll a CascadeSelect column, the pointer resting over
  it does not pull keyboard focus back.
- A dropdown menu opened with `defaultOpen` (from
  `e2e/fixtures/baseline-overlays.html`) holds focus on its container, matches
  `:focus-visible`, and draws no outline there.

### 18 · Visual baseline (`18-baseline.spec.ts`)

Runs only with `BASELINE=1` (`pnpm test:e2e:visual`). Linux Chromium
screenshots at 1440×900 in UTC and `en-US`, taken once Inter and JetBrains Mono
have loaded and no skeleton remains.

- Under quiet and glass × both modes: dashboard, orders, an order detail,
  settings and analytics once their data has drawn, each grown to the full
  height of its main region; the split panel scrolled to its end; and a dialog,
  a menu and a popover from the baseline-overlays fixture.
- Under every style × both modes: the buttons, inputs, checkbox, tabs, badges
  and data-table showcases at full height, and the kitchen sink for three
  accent and surface pairs (blue on zinc, green on neutral, neutral on stone),
  each checked to fit one viewport first.
- The shell-styles page under quiet × both modes, at a tighter 0.05 threshold.
- The sidebar's active row (Auto under every style × both modes, each explicit
  look on quiet light), the angle slider knob, the Kbd keycap, and the glass
  dark login decoration.
- A page taller than 16384px, Chromium's largest screenshot, throws rather
  than recording a clipped image.

### 19 · Pre-render script (`19-prerender.spec.ts`)

With the app bundle (`/src/main.tsx`) blocked, only the pre-render script can
paint:

- Every attribute axis in `create-app/bin/axes.json`, seeded with its last
  non-default value (mode dark), is stamped on `<html>` after a reload, with
  the same inline `--primary` the app wrote.
- Five stored 6.x states (glass on a solid canvas, sci-fi, accent vibrancy,
  glass axes stored at medium, a browser already at revision 1) are migrated
  before the app mounts: the painted attributes, the keys removed and kept,
  and `theme-settings-version` set to the kit's `LEGACY_REVISION`.

### 20 · Fonts (`20-fonts.spec.ts`)

- Body text paints in Inter Variable by default. Choosing Geist in the theme
  switcher repaints it in Geist Variable, `document.fonts` reports the face
  loaded, and its woff2 file comes from the app's own origin with a 200.
- A stored Geist or IBM Plex Sans font renders at boot, its woff2 file served
  from the app's own origin with a 200.
- No request during the session leaves the app's origin.

### 21 · Mobile layout (`21-mobile-layout.spec.ts`)

Runs in the `mobile` project: 390×844 with touch.

- Every app and guest route fits once its data has loaded: the visible content
  and panel regions and every card stay inside the viewport, not just the
  document.
- The orders table scrolls sideways behind an edge fade with every cell on one
  line, and its pagination buttons stay on screen.
- The header keeps every control on screen in the sidebar, top-nav, stacked
  and split-panel shells; at 700px search shrinks to an icon and the brand
  hides.
- The inbox bar does not scroll sideways under the floating and island shells.
  The header's layout switcher is hidden, and the user menu's Layout submenu
  changes the layout and the shell style instead.
- Inbox: opening a message hides the list and focuses the message, and Back
  returns focus to the list; the skip link lands on the list.
- Order detail steps stack on a phone and lie in one row from 640px.
- Under the floating shell, the dashboard and an opened message keep only
  their 1.5rem phone padding, and the inbox list its 0.75rem float inset.
- A long top or bottom sheet fits the phone and scrolls to its last row.

### 22 · Table layout (`22-table-layout.spec.ts`)

- On the table showcase: the many-column table keeps each cell on one line and
  scrolls sideways; the plain and the sticky table's footers are opaque; the
  sticky table's demo data varies, its footer sums the Stock column, and it is
  identical after a reload.
- The `/orders` pagination controls stay on one row on a desktop.

### 23 · Control states (`23-control-states.spec.ts`)

Runs against the control-contract fixture, one `data-probe` per case.

- Field triggers: a long Select value ends in an ellipsis clear of the
  chevron; CascadeSelect and an empty TimePicker trigger carry
  `data-placeholder` and paint like the Select trigger; DateInput segments
  show YYYY, MM and DD in the muted colour; the file upload trigger paints like
  a default button.
- Edges and indicators, in both modes and under every style where the edge is
  a style token: colour swatches and their active ring and the angle slider's
  dial reach 3:1 against what they sit on, and the knob is round; chips
  separate from a card's field well; the switch's off thumb reaches 2.5:1
  against its track and the thumb transitions its colour; an indeterminate
  checkbox takes the checked fill and a minus; a vertical slider is upright and
  its range spans its thumbs.
- Geometry: number input steppers draw `--icon-size-sm` icons and `--input`
  dividers that read alike in both modes, and fill the field's inner height at
  compact; a badge's leading icon sits 4px before its label; Alert and Banner
  share fill, start edge and icon colour per variant; Kbd draws the field edge
  along its bottom; an invalid grouped Input draws the destructive edge and
  ring.
- Disabled: every disabled probe and compound control has an effective
  opacity of `--disabled-opacity` (the product of its own and its ancestors'
  opacity) and `cursor: not-allowed`; a disabled input group fades once, as
  one surface; a read-only Editable does not fade; an `aria-disabled` Button
  `asChild` link fades and shows no hover or press wash, while enabled buttons
  still do.

### 24 · Overlay geometry (`24-overlay-geometry.spec.ts`)

Each case is its own load of the overlay-geometry fixture.

- A popover keeps its offset from its trigger when its scroll box scrolls or
  the viewport resizes; popovers opened above or below scale from the
  trigger's edge; a popper Select is at least as wide as its trigger.
- A long menu, its submenu and a long menubar menu stay inside the viewport and
  scroll.
- A Combobox at the bottom of a dialog and a MultiSelect in a short scroll box
  open above their input, uncut.
- After a hundred pointer presses, floating panels stay below z-index 50 and a
  dialog opened over them is on top.
- Long top and bottom sheets fit the viewport and reach their last row; a sheet
  with a pinned header scrolls only its body.
- The tour popover stays on screen for targets at the right and bottom edges.
- Under glass × both modes, floating panels, the tour popover, chart and
  contribution-graph tooltips and the timeline scrubber label paint the same
  fill, image and border as a popover.

### 25 · Demo app (`25-demo-app.spec.ts`)

- Customers: the Orders column aligns like Total Spent.
- Status badges on orders, an order, products, categories and a customer follow
  one status-to-variant map.
- Charts: Orders & Visitors has a two-item legend; Revenue Trend is the same
  area chart in the same colour on the dashboard and on analytics; revenue
  keeps one colour across charts and quantity another.
- Dashboard: at 1440px the sales target card keeps its natural height, the
  other KPI cards stack below it and Recent Orders sits beside them; the
  average order value sparkline has a translucent area and one baseline.
- Products: thumbnails are local two-character initials at 12px or more, with
  no placeholder-image request.
- Product form: each section's fields sit in one card, price and compare-at
  price share a row, and the status switch is described by its hint.
- Settings: each of the four General cards with typed fields has a submit
  button; saving the profile shows the demo toast; the autosave interval reads
  as one phrase in English and Vietnamese.
- Auth: on `/login` and `/register` at 1440 and 390px the language picker sits
  in the form column's top corner, above the heading; the decoration renders
  its mesh, four shapes and its edge under every style.
- Inbox: the list is 360px wide and its scrollbar clears the unread dots by
  8px; under quiet and glass unread rows keep the read rows' background and
  set the sender in bold.
- Order stepper: a delivered order shows every step complete; a processing
  order marks its current step with `aria-current="step"`; a completed step's
  accessible text says it is complete.

### 26 · Style tokens (`26-style-tokens.spec.ts`)

- `<html>` declares `color-scheme` per mode, and a dark date input paints a
  light calendar indicator.
- Dark Frame text reads at 4.5:1 against the card behind it, and the frame's
  document is dark too.
- Dark elevation: under quiet and tactile, flat, low, medium and high cards
  step lighter (at least 1.04:1 each) and the highest stands 1.3:1 off the
  page; light cards keep one fill; a dark popover paints lighter than its own
  fill.
- Tactile raises cards and recesses tab tracks where quiet keeps both flat;
  muted text on the brightest tactile dark card stays at 4.5:1.
- Glass light: the canvas shows through the rail and bar, sidebar labels read
  at 4.5:1 on blue, violet, green and neutral canvases, and
  `prefers-contrast: more` turns the chrome canvas off.
- The neutral swatch reaches 3:1 against the panel in dark, and so does its
  active ring.
- Hovering a toast action keeps its label at 4.5:1 or more and no lower than
  at rest, for five toasts × both modes.
- A sidebar group's height passes through in-between values as it opens.

### 27 · Controls behaviour (`27-controls-behaviour.spec.ts`)

Runs against the controls-behaviour fixture (`fixtures/controls-behaviour.html`),
one `data-probe` per case.

- Tree view: a leaf's text lines up with a sibling branch's text, a nested
  leaf's text sits 16px further in, and depth-0 rows keep an inline-start
  inset of at least 7.5px.
- A vertical toolbar is as wide as its widest item.
- Outline variants, in both modes: the selected Listbox and TreeView row's ring
  reaches 3:1 against the row's fill, and Pagination's link edge reaches 3:1
  against the page.

### 28 · Right to left (`28-rtl.spec.ts`)

Runs against the rtl fixture, whose `<html>` carries `dir="rtl"`, so no
component is given a `dir` prop.

- Inline icons, breadcrumb and pagination chevrons, carousel arrows, and tree
  and sidebar group chevrons mirror.
- Tabs inherit the direction, mirror their arrow keys and keep the indicator
  on the active tab after scrolling; ArrowLeft moves Steps to the visually next
  step; dragging or arrowing a Resizable handle left grows the right panel.
- Scroll area puts its vertical bar on the left and moves the horizontal thumb
  left as content scrolls; slider ranges and progress values fill from the
  right; a table fades the edge its content overflows toward.
- Dropdown, context and menubar submenus open to the left, and an inset menu
  item's indicator sits at the inline start.
- The collapsed rail's pill sits on its right edge, the mobile drawer opens
  from the right, a badge anchors to the top left by default, and the skip
  link lands at the top right.
- Edges: the switch thumb stays inside its track, a button group squares its
  joins, the input prefix divider faces the field, the vertical enclosed tab
  seam sits on the panel side, the rail border faces the content, and inset
  and floating content keep their gutters on the mirrored side.
- The virtualized timeline mirrors its grid, chevron and rails; carousel next
  moves to slide 2; a theme switcher slider value hugs the inline end; the
  mesh and spotlight backgrounds' glow follows the physical pointer x.

### 29 · Forced colours (`29-forced-colours.spec.ts`)

Runs against the forced-colors fixture with forced colours active, in light and
dark schemes, comparing pixels with reference probes painted in the system
colours themselves.

- The chosen item is marked apart from the others in every Tabs variant,
  SegmentGroup, filled and outline Listbox and TreeView, Toggle, ToggleGroup,
  Pagination and Switch, and chosen labels stay legible; switch thumbs read on
  their tracks; tab reserved borders paint Canvas; the enclosed tab baseline
  opens under the active tab and the underline baseline runs under every tab.
- The selected calendar day, focused menu and menubar rows, an open
  sub-trigger, a selected timeline tile and the sidebar current row are
  marked; chosen rows stay legible; invalid number and date inputs dash their
  edge.
- Separators, slider and progress tracks, the scroll thumb, the resizable
  handle, an upcoming step separator and a skeleton differ from Canvas; slider
  ranges, progress values and completed step separators paint Highlight; the
  scroll bar's reserved edge and the spinner gap paint Canvas.
- A colour swatch keeps its colour, and a highlight match paints Mark.
- A focused chosen item keeps a visible ring (tree, calendar, toggle, sidebar,
  enclosed tab, listbox); secondary text and menubar shortcuts in a chosen row
  take the row colour.

### 30 · Showcase (`30-showcase.spec.ts`)

Showcase pages under quiet at 1440px, grown to the full height of the main
region; a page taller than 16384px throws.

- The sweep, over every showcase route and the image editor playground: no
  demo preview or variant matrix wrapper scrolls sideways (rule A); no control
  inside a preview is clipped by an ancestor or lies outside the preview,
  except in marquee tracks, carousel content and iframes (rule B); no matrix
  cell spills (rule C).
- Marquee motion: all seven marquees, forwards and reversed, cover their
  container at 0, 50 and 99% of a loop and move exactly one copy per loop, in
  left-to-right and right-to-left documents.
- Layout checks the sweep cannot express: matrix columns fit their content, the
  tags input clear label fits its trigger, the toggle bar starts at the content
  edge, carousel arrows stay inside their card, dual-series charts use the plot
  height, stacked avatars keep their initials whole, the app-scope floating
  panel starts closed, shell-style previews render their structure's regions,
  the signature pad's Clear button sits at least 8px below its canvas, kitchen-sink
  radios centre on checkbox rows, custom calendar cells are wider, and menubar
  matrix cells fit their trigger.
- Content checks: the dashboard progress card shows currency, date-picker
  fields share one width, aspect-ratio boxes share one fill, transition demos
  read as hover targets, ticker deltas use subtle status badges with arrows,
  the password strength meter shows at rest with empty segments that read
  against the card (and keeps their borders under forced colours), same-origin
  frame text reads at 4.5:1 in both modes and the design-system frame mirrors
  the host theme, the tree view's Empty placeholder lines up with leaf text,
  and a half star fills its inline-start side in both directions.

## Regression tests for fixed defects

`11-review-regressions.spec.ts` holds tests for defects fixed in review (see
its section above), with a virtual-table fixture that deliberately includes
long cell content.

Pull-request and release workflows run `01-auth`, `06-overlays`,
`08-data-display`, `11-review-regressions` and `12-i18n` against a fresh UI
build. The full browser suite remains available separately.

These three earlier tests also guard fixed defects:

| Test                                                  | Guards                                                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `02-routes` → `/components/data-table`                | The expandable-table example must key its rows via `<Fragment key>`; a bare `<>` makes React log a missing-`key` error on every render.                      |
| `02-routes` → `/components/image-editor`              | `ImageEditorAnnotationColor` must not nest `ColorPickerSwatch` (a button) inside `ColorPickerTrigger` (also a button) — that is invalid HTML and ~58 errors. |
| `08-data-display` → `dashboard charts size correctly` | `ChartContainer` must seed `ResponsiveContainer` with a positive `initialDimension`; the recharts default of `-1 × -1` warns once per chart on first render. |

**Known defects.** When a test fails because the app or kit is wrong, not the
test, it stays as written and is marked
`test.fail(true, "row N: <one-line reason>")`, where N is the defect's row in
the review register. The run passes while the defect is present and fails once
it is fixed, which is the cue to remove the marker.

## Maintenance

- **New component page** → regenerate the fixture:

  ```bash
  cd apps/template/src/routes/_authenticated/components
  for f in *.tsx; do … done > ../../../../e2e/fixtures/component-routes.ts
  ```

  Or add the `{ path, title }` entry by hand. `02`, `05`, `30` and the
  warm-up pick it up automatically, and the sidebar-integrity test fails if a
  link has no entry.

- **New app or guest route** → add it to `e2e/fixtures/app-routes.ts`, and an
  app route's heading to `HEADINGS` in `02-routes.spec.ts`.

- **New theme axis or style** → add it to `e2e/fixtures/theme.ts`. `03`, `04`,
  `05`, `09`, `10`, `11-card-accordion-variants`, `12-settings-preset-matrix`,
  `13`, `15`, `16`, `17`, `18`, `20`, `23` and `25` import from that file, as
  does `helpers/app.ts`.
- **New localStorage key in `ThemeProvider`** → add it to `LS_KEYS` in
  `fixtures/theme.ts`, and to `ThemeSeed` and the `storageEntries` map in
  `helpers/app.ts`.
