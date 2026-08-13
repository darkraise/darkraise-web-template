# darkraise-ui

React 19 UI kit with 65 themed components, 38 hooks, 6-axis theming, and
layout variants. Components ship with no runtime UI dependencies — no
Radix UI, all primitives implemented in-house — and are styled with
Tailwind CSS 4.

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
