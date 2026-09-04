# darkraise-ui

React 19 UI kit with 65 themed components, 38 hooks, 6-axis theming, and
layout variants. Components ship with no runtime UI dependencies — no
Radix UI, all primitives implemented in-house — and are styled with
Tailwind CSS 4.

## Accessibility

The kit does the parts a component library can do on its own, and names the
parts it cannot.

**Handled for you.** Dialog, AlertDialog, Sheet and Drawer trap focus, restore
it on close, lock page scroll and wire `aria-modal` / `aria-labelledby`.
Slider implements the full ARIA slider pattern including Home, End and
PageUp/PageDown. Progress, Spinner and the toast stack carry correct live-region
semantics. Menus, selects, comboboxes and the command palette draw a real focus
ring rather than relying on a background tint. Every pointer target clears the
WCAG 2.2 minimum of 24x24 CSS px, small controls via a transparent hit area that
leaves their visual size alone. Colour contrast is computed rather than eyeballed
— muted text targets 7:1, and focus, primary and status colours are unit-tested
at 3:1 or better across every accent in both modes.

**Motion.** A single guard in `theme.css` neutralises animation and transition
duration under `prefers-reduced-motion`. Motion that CSS cannot reach — smooth
scrolling, Carousel autoplay — reads the preference through the exported
`useReducedMotion` hook.

**Your part.**

- `<ChartContainer description="...">` — a chart is a picture of data with no
  text alternative of its own, and recharts exposes values only on hover. Write
  the insight, not the chart type. `loading` and `empty` replace the axis frame
  recharts would otherwise draw over an empty dataset.
- `<CarouselAutoplayToggle />` — autoplay pauses on hover, focus, a hidden tab
  and reduced motion, but WCAG 2.2.2 asks for a control the reader can operate.
  Place one whenever you pass `autoplay`. It renders nothing when you do not.
- `<FormErrorSummary errors={...} submitCount={...} />` — inline field errors
  stay where they are; this focuses a linked summary after a failed submit.
- `required` on a field marks the label and sets `aria-required` on the control.
- Router adapters must put `aria-current="page"` on the active link. Routers
  that do this themselves (TanStack Router among them) satisfy it as long as
  your adapter spreads its remaining props onto the anchor.
- `<Button loading>` disables the button, marks it `aria-busy` and shows a
  spinner. Under `asChild` the spinner is not injected — Slot renders a single
  child — but the semantics still apply.
- Layouts move focus to `<main id="main-content">` after a route change. Use
  `useRouteFocus` directly if you compose your own layout.

## Dialog sizing and overflow

`DialogContent` caps its height at the viewport and scrolls internally.
Rendering a `<DialogBody>` switches to a pinned layout where the header and
footer hold still and only the body scrolls. `size` takes `sm | default | lg |
xl | full`; `default` is the historical width.

## Translating component text

Components render English by default. To supply your own strings, mount
`UiLabelsProvider` anywhere above them and override only the keys you need:

```tsx
import { UiLabelsProvider } from "darkraise-ui/labels"

const labels = {
  dataTable: { rowsPerPage: "Số dòng mỗi trang", pageInfo: (p, n) => `Trang ${p}/${n}` },
  userMenu: { logout: "Đăng xuất" },
}

<UiLabelsProvider value={labels}>
  <App />
</UiLabelsProvider>
```

Interpolated labels are functions, so a language that orders the operands
differently or needs a plural form expresses that in its own function body.
Nested providers merge over the nearest ancestor, so a subtree can override a
subset. Components render correctly with no provider mounted.

The package ships no translations and has no concept of a locale — it takes
strings, and the app decides which ones.

`theme.axisLabels.presetAxes` is a reserved key with no current effect —
translating it will not change anything rendered today; it is kept so that a
future wiring stays backward-compatible for anyone already providing a
complete `UiLabels`.

## Shell styles

Every app shell structure — `SidebarLayout`, `TopNavLayout`, `StackedLayout`
and `SplitPanelLayout` — is laid out on one CSS grid whose regions carry
`data-region`. The `shellStyle` theme axis repaints those regions without
changing which structure is in use:

| Style      | Treatment                                                               |
| ---------- | ----------------------------------------------------------------------- |
| `classic`  | Regions welded, hairline rules, no gutter. The default.                 |
| `inset`    | Chrome stays welded; only the content area detaches as a rounded panel. |
| `island`   | Every region is a detached card on the app ground.                      |
| `floating` | Content runs full-bleed; chrome hovers over it with blur.               |
| `framed`   | The whole shell insets from the viewport as a window.                   |
| `flat`     | No rules; regions separated by background tone alone.                   |

Set it globally through `themeConfig.defaults.shellStyle` or
`useTheme().setShellStyle`, or pin one shell with the prop:

```tsx
<SidebarLayout nav={nav} shellStyle="island">
  <Outlet />
</SidebarLayout>
```

A layout resolves `prop ?? theme value` and stamps the result on its own root,
so a pinned shell ignores the axis without any CSS specificity fight.

## Server rendering the layout variant

`useLayoutStore` reads `localStorage` when the module initialises. In a
browser-only app the first render is already correct. Under SSR the server has
no `localStorage`, so it returns the default `sidebar` and the client swaps
after hydration. If you server-render, read the persisted variant in your
document template and hand it to `useLayoutStore.setState` before the app
mounts, the way the scaffolder's inline theme script does for theme axes.

## Sci-fi preset font

Orbitron is no longer fetched or bundled. The Sci-fi preset renders it only
when the host system or the consuming app already provides the font;
otherwise it falls through to the rest of the stack (Rajdhani and the
generic families after it). This removes a third-party network request from
every page load of every consuming app. An app that wants Sci-fi's intended
typography must supply Orbitron itself.

## Migrating to 2.0.0

Component DOM now carries `dr-*` classes plus `data-variant` /
`data-size` / state `data-*` attributes. Consumers using
`cn(buttonVariants({ variant, size }), extra)` rewrite as either:

- `<Button variant={...} size={...} className={extra} />`, or
- on a non-button element: `className={cn("dr-btn", extra)}` plus
  `data-variant={...}` and `data-size={...}` attributes directly.

`class-variance-authority` is no longer a dependency of this package.
Consumers that imported it transitively must depend on it directly.
