# darkraise-web-template

A React 19 + TypeScript starter with 90+ themed UI components, 60+ hooks, multiple layout variants, error boundaries, and an interactive scaffolding CLI. The components ship from the `darkraise-ui` package; scaffolded projects import from it rather than vendoring the source.

## Quick Start

```bash
npm create darkraise-ui my-app
cd my-app
npm run dev
```

The CLI walks you through choosing a layout, theme defaults, and theme switcher visibility. Pass `-y` to accept all defaults.

### CLI Flags

All options can also be passed as flags to skip prompts:

```bash
npm create darkraise-ui my-app \
  --layout sidebar \
  --accent blue \
  --surface-color slate \
  --preset glass \
  --background solid \
  --background-intensity balanced \
  --gradient-pattern blobs \
  --mode system \
  --density cozy \
  --elevation medium \
  --button-elevation flat \
  --radius rounded \
  --font-size medium \
  --accent-vibrancy balanced \
  --theme-switcher \
  --theme-axes mode,accentColor,surfaceColor,preset,backgroundStyle,density,elevation,radius,fontSize,accentVibrancy \
  --host localhost \
  --port 5173
```

| Flag                                       | Values                                                      | Default     |
| ------------------------------------------ | ----------------------------------------------------------- | ----------- |
| `--layout`                                 | `sidebar`, `stacked`, `top-nav`, `split-panel`              | `sidebar`   |
| `--accent`                                 | 17 colors (`red` through `rose`)                            | `blue`      |
| `--surface-color`                          | `slate` + 17 accent colors                                  | `slate`     |
| `--preset`                                 | `default`, `glass`, `neon`, `terminal`, `scifi`, `playful`  | `default`   |
| `--background`                             | `solid`, `gradient`                                         | `solid`     |
| `--background-intensity`                   | `subtle`, `balanced`, `vivid`, `intense`                    | `balanced`  |
| `--gradient-pattern`                       | `blobs`, `aurora`, `spotlight`, `mesh`                      | `blobs`     |
| `--mode`                                   | `light`, `dark`, `system`                                   | `system`    |
| `--density`                                | `compact`, `cozy`, `comfortable`, `spacious`                | `cozy`      |
| `--elevation`                              | `flat`, `low`, `medium`, `high`                             | `medium`    |
| `--button-elevation`                       | `flat`, `low`, `medium`, `high`                             | `flat`      |
| `--radius`                                 | `sharp`, `subtle`, `rounded`, `pill`                        | `rounded`   |
| `--font-size`                              | `small`, `medium`, `large`, `extra-large`                   | `medium`    |
| `--accent-vibrancy`                        | `calm`, `balanced`, `vivid`, `intense`                      | `balanced`  |
| `--theme-switcher` / `--no-theme-switcher` | boolean                                                     | enabled     |
| `--theme-axes`                             | comma-separated axis names (see Theming for the valid keys) | all axes    |
| `--host`                                   | hostname or IP                                              | `localhost` |
| `--port`                                   | `1`-`65535`                                                 | `5173`      |
| `-y`                                       | skip all prompts, use defaults                              |             |

## What's Included

### UI Components

90+ components exported from the `darkraise-ui` package and styled with Tailwind CSS 4. The library has no runtime UI dependencies — it does not use Radix UI (all primitives are implemented in-house). The live demo app browses every component with copyable code snippets:

Accordion, Alert, Alert Dialog, Angle Slider, Aspect Ratio, Avatar, Background Page, Badge, Banner, Breadcrumb, Button, Button Group, Calendar, Card, Carousel, Cascade Select, Chart, Checkbox, Clipboard, Collapsible, Color Picker, Combobox, Command, Context Menu, Date Input, Date Picker, Dialog, Download Trigger, Drawer, Dropdown Menu, Editable, Empty State, Field, Fieldset, File Upload, Floating Panel, Frame, Highlight, Hover Card, Image Cropper, Image Editor, Input, Input OTP, JSON Tree View, Kbd, Label, Listbox, Marquee, Menubar, Multi Select, Navigation Menu, Number Input, Pagination, Password Input, Popover, Progress, QR Code, Radio Group, Rating Group, Resizable, Scroll Area, Segment Group, Select, Separator, Sheet, Signature Pad, Skeleton, Slider, Sonner (toast), Spinner, Stat, Steps, Swap, Switch, Table, Tabs, Tags Input, Textarea, Time Picker, Timer, Toggle, Toggle Group, Toolbar, Tooltip, Tour, Tree View, Virtualized Dropdown Menu.

### Hooks

60+ hooks exported from `darkraise-ui/hooks` covering common UI and application patterns:

| Category     | Hooks                                                                                                                                                                                                                                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lifecycle    | `useMountEffect`, `useUnmountEffect`, `useUpdateEffect`, `useIntervalEffect`, `useTimeoutEffect`, `useFirstMountState`, `useIsMounted`, `useIsomorphicLayoutEffect`                                                                                                                                                                    |
| Callback     | `useDebouncedCallback`, `useThrottledCallback`, `useRafCallback`                                                                                                                                                                                                                                                                       |
| State        | `useToggle`, `useCounter`, `useList`, `useMap`, `useSet`, `useQueue`, `useMediatedState`, `useRafState`, `usePrevious`, `usePreviousDistinct`, `useDebouncedState`, `useThrottledState`, `useRerender`, `useDisclosure`                                                                                                                |
| Effect       | `useCustomCompareEffect`, `useDeepCompareEffect`, `useConditionalEffect`, `useDebouncedEffect`, `useThrottledEffect`, `useRafEffect`, `useValidator`                                                                                                                                                                                   |
| Memo         | `useDeepCompareMemo`, `useCustomCompareMemo`                                                                                                                                                                                                                                                                                           |
| DOM / Sensor | `useEventListener`, `useClickOutside`, `useKeyboardEvent`, `useHotkey`, `useMediaQuery`, `useBreakpoint`, `useWindowSize`, `useDocumentVisibility`, `useNetworkState`, `useResizeObserver`, `useMeasure`, `useIntersectionObserver`, `useIdle`, `useScreenOrientation`, `usePermission`, `useVibrate`, `useFocusTrap`, `useScrollLock` |
| Async        | `useAsync`, `useAsyncAbortable`                                                                                                                                                                                                                                                                                                        |
| Storage      | `useLocalStorageValue`, `useSessionStorageValue`, `useCookieValue`, `useClipboard`                                                                                                                                                                                                                                                     |
| Ref          | `useSyncedRef`, `useHookableRef`                                                                                                                                                                                                                                                                                                       |

Several hooks are adapted from [react-hookz/web](https://github.com/react-hookz/web) for React 19, alongside additional in-house hooks. No external hook dependency is required.

### Theming

A 14-axis theming system. Scaffolded projects configure it through `src/theme.config.ts`, which imports the `ThemeConfig` type from `darkraise-ui/theme`; in this monorepo the type and defaults live in `packages/ui/src/theme/themeConfig.ts`. The axes are:

- **Mode** -- light, dark, or system
- **Accent color** -- 17 color options
- **Surface color** -- neutral slate or one of 17 tinted surfaces
- **Preset** -- `default`, `glass`, `neon`, `terminal`, `scifi`, or `playful` (glassmorphism is the `glass` preset)
- **Background style** -- solid or gradient
- **Background intensity** -- subtle, balanced, vivid, or intense
- **Gradient pattern** -- blobs, aurora, spotlight, or mesh
- **Density** -- compact, cozy, comfortable, or spacious
- **Elevation** -- flat, low, medium, or high (surface shadows)
- **Button elevation** -- flat, low, medium, or high (button-specific shadows)
- **Surface intensity** -- flat, subtle, balanced, or bold (how strongly card, popover, and overlay fills wash toward the page or foreground)
- **Radius** -- sharp, subtle, rounded, or pill
- **Font size** -- small, medium, large, or extra-large (scales type, icons, and minimum control heights)
- **Accent vibrancy** -- calm, balanced, vivid, or intense (dark mode only; controls how loud the brand accent renders)

The switcher config also exposes a `presetAxes` master toggle that controls whether preset-specific controls (for example neon glow or sci-fi intensity and frame) appear in the switcher panel.

Font family is fixed: Inter for sans/heading, JetBrains Mono for monospace. Font size is adjustable via the axis above.

The `ThemeSwitcher` component renders controls for whichever axes are enabled in the config. The `ThemeProvider` accepts an optional `onChange` callback for persisting theme settings to a backend. Theme defaults and axis visibility are set at scaffold time and can be changed later by editing `theme.config.ts`.

See [`packages/ui/README.md`](./packages/ui/README.md) for the Sci-fi preset's
font behavior and for translating component text via `UiLabelsProvider`.

### Layouts

4 layout variants exported from `darkraise-ui/layout`. The CLI wires the chosen one into the generated `src/app.tsx`:

- **Sidebar** -- collapsible sidebar with nav groups
- **Stacked** -- full-width header with stacked content
- **Top Nav** -- horizontal navigation bar
- **Split Panel** -- resizable two-pane layout

### Error Pages

Full-screen error states exported from `darkraise-ui/errors`:

- **404 Not Found** -- wired as `defaultNotFoundComponent` on the TanStack Router
- **Error Boundary** -- wired as `defaultErrorComponent`, displays the error message with retry
- **500 Server Error** -- exported for use in data loaders or API error handling
- **Maintenance** -- exported for use with feature flags

All error pages share an `ErrorLayout` component and support light/dark themes.

### Auth

The demo app in this repository (`apps/template/src/features/auth/`) ships login, register, forgot password, and reset password forms backed by a Zustand store with an adapter pattern for plugging in your own auth backend. This is reference code in the monorepo demo; the scaffolding CLI does not generate an auth module, so copy what you need from the demo into a new project.

## Development

A scaffolded project ships with these scripts:

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Type-check then production build
npm run preview      # Preview the production build
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run lint         # ESLint
```

This monorepo additionally provides `pnpm storybook` (browse the component library), `pnpm test` (Vitest), and `pnpm typecheck`/`pnpm lint`/`pnpm format` across the workspace.

## Releasing

Two packages are published, `darkraise-ui` and `create-darkraise-ui`, and
they share one version line — a release always ships both at the same
number, whichever one changed. One workflow, `.github/workflows/release.yml`,
does it. It runs the full gates — typecheck, lint, the Vitest suite, then the
build — before anything reaches npm, closes the CHANGELOG's `[Unreleased]`
section under the new version, and opens a GitHub Release from it.

Publishing uses npm **trusted publishing** (OIDC), so no npm token is stored
in this repository. The workflow proves its identity to npm with a
short-lived GitHub token, and npm attaches a provenance attestation
automatically.

**Push to `master`** — releases when commits since the last `v*` tag touched
`packages/ui/**` or `create-app/**`; if none did, the run stops early. The
version comes from those commits: a `feat` makes it a minor, anything else a
patch. A commit marked breaking (`type!:` or a `BREAKING CHANGE:` footer)
**fails the run** rather than guessing a major.

**Push a `vX.Y.Z` tag** — releases exactly that version, then writes it and
the rolled CHANGELOG back to `master`. This is the path for a major, or any
release whose number is a judgement call:

```bash
git tag v7.0.0 && git push origin v7.0.0
```

To rehearse without touching npm, run the _Release_ workflow manually — its
`dry_run` input defaults to true.

### First-time setup

**1. Both packages must exist on npm.** A trusted publisher is configured in
a package's settings, so the package has to be there first — OIDC cannot make
a package's very first publish. `darkraise-ui` already exists;
`create-darkraise-ui` does not, so publish it once by hand from `create-app/`
before wiring anything up.

**2. Configure the trusted publisher** for each package at
npmjs.com → the package → Settings → Trusted publishing, or with `npm trust`.
Both get the same values:

| Field    | Value                    |
| -------- | ------------------------ |
| Owner    | `darkraise`              |
| Repo     | `darkraise-web-template` |
| Workflow | `release.yml`            |

npm allows one trusted publisher per package and matches it against the
_calling_ workflow's filename. That is why both triggers live in the single
`release.yml` rather than a caller plus a reusable workflow — a split would
need one npm configuration per caller, and only one is allowed.

**3. Cut a one-time baseline tag.** The master flow derives its version from
the range since the last `v*` tag, so until one exists there is no range.
Runs before that point end green with a notice naming the command rather
than failing, so master stays clean while the setup above is pending.
Cutting the tag is itself the first release:

```bash
git tag v6.0.0 && git push origin v6.0.0
```

## Tech Stack

React 19, TypeScript 6, Vite 8, Tailwind CSS 4, TanStack Router, TanStack React Query, TanStack React Form, Zustand, Zod, Recharts. The `darkraise-ui` component library has no runtime UI dependencies (no Radix UI). Monorepo tooling includes Storybook, Vitest, Playwright, ESLint, Prettier, Husky, and commitlint.

## License

MIT
