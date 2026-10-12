# darkraise-web-template

A React 19 + TypeScript starter with 90+ themed UI components, 60+ hooks, multiple layout variants, error boundaries, and an interactive scaffolding CLI. The components ship from the `darkraise-ui` package; scaffolded projects import from it rather than vendoring the source.

## Quick Start

```bash
npm create darkraise-ui my-app
cd my-app
npm run dev
```

The CLI walks you through choosing a layout, the brand axes (mode, accent, surface, tint, font, radius, density and font size), the style, and theme switcher visibility. Pass `-y` to accept all defaults, and `--help` to list every flag.

Add `--multilingual` to generate English/Vietnamese switching, persisted language
preferences, and app-owned translations using the optional `darkraise-ui` adapter.
The plain starter keeps translation-engine dependencies out. Consumers can
override individual UI messages or register additional languages; see the
[package localization API](packages/ui/README.md#translating-component-text).

`--no-install` and `--no-git` leave installation and repository initialization to
you. `--ui-version` accepts a package version or local tarball for consumer checks.

Upgrading a 6.x app? Follow the [7.0 upgrade guide](https://github.com/darkraise/darkraise-web-template/blob/master/docs/upgrade-7.0.md).

### CLI Flags

Every theme axis has a flag, and a flag skips its prompt:

```bash
npm create darkraise-ui my-app \
  --layout sidebar \
  --accent blue \
  --surface-color zinc \
  --style quiet \
  --font inter \
  --mode system \
  --density cozy \
  --radius rounded \
  --contrast standard \
  --theme-switcher \
  --theme-axes mode,accentColor,surfaceColor,style,font,density,radius,fontSize \
  --host localhost \
  --port 5173
```

| Flag                                       | Values                                         | Default     |
| ------------------------------------------ | ---------------------------------------------- | ----------- |
| `--layout`                                 | `sidebar`, `stacked`, `top-nav`, `split-panel` | `sidebar`   |
| `--<axis>`                                 | one per theme axis; see below                  | kit default |
| `--multilingual` / `--no-multilingual`     | boolean                                        | off         |
| `--theme-switcher` / `--no-theme-switcher` | boolean                                        | enabled     |
| `--theme-axes`                             | comma-separated axis keys (see Theming)        | all axes    |
| `--host`                                   | hostname or IP                                 | `localhost` |
| `--port`                                   | `1`-`65535`                                    | `5173`      |
| `--ui-version`                             | a `darkraise-ui` version or tarball            | latest      |
| `--no-install`, `--no-git`                 | skip `npm install` or `git init`               |             |
| `-y`                                       | skip all prompts, use defaults                 |             |
| `-h`, `--help`                             | print every flag with its values and defaults  |             |

An axis flag is the axis key in kebab case (`--surface-color`, `--font-size`, `--dark-accent-chroma`), except `--accent` for `accentColor` and `--background` for `backgroundStyle`. The generated `src/theme.config.ts` lists only the axes you chose, by prompt or by flag. A style's own defaults still win over a flag for users with nothing stored: under `--style glass` the background stays a gradient even with `--background solid`. The 6.x flags `--preset`, `--surface-intensity`, `--accent-intensity`, `--shell-style`, `--control-depth` and `--button-elevation` exit with an error naming their replacement.

## What's Included

### UI Components

90+ components exported from the `darkraise-ui` package and styled with Tailwind CSS 4. The library implements its own primitives, with Floating UI for positioning and TanStack Table for table behavior; it does not use Radix UI. The live demo app browses every component with copyable code snippets:

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

A 23-axis theming system in three layers. Scaffolded projects configure it through `src/theme.config.ts`, which imports the `ThemeConfig` type from `darkraise-ui/theme`; in this monorepo the type and defaults live in `packages/ui/src/theme/themeConfig.ts`.

Brand:

- **Mode** (`mode`) -- light, dark, or system
- **Accent color** (`accentColor`) -- 18 colors plus `neutral` (near-black in light, near-white in dark); blue by default
- **Surface color** (`surfaceColor`) -- one of 12 neutral palettes; zinc by default
- **Tint with accent** (`tintWithAccent`) -- off or on (tints the neutral surfaces toward the accent; hidden under the neutral accent)
- **Signal color** (`signalColor`) -- none or any accent color (a second accent for marks; its control shows once a preset, a style or the user sets one)
- **Font** (`font`) -- Inter, Geist, IBM Plex Sans, or the serif Newsreader (body and heading text)
- **Heading font** (`headingFont`) -- body or any font (a separate face for headings; body keeps the body face)
- **Radius** (`radius`) -- sharp, subtle, rounded, or pill
- **Density** (`density`) -- compact, cozy, comfortable, or spacious
- **Font size** (`fontSize`) -- small, medium, large, or extra-large (scales type, icons, and minimum control heights)

Style:

- **Style** (`style`) -- flat, quiet, tactile, or glass; quiet by default. Glass frosts the shell chrome and overlays.
- **Preset** (`preset`) -- base (the style alone) or one of the active style's presets; the kit ships fifteen across the four styles, and a theme config can define more
- **Glass opacity** (`glassOpacity`) and **glass blur** (`glassBlur`) -- shown under the Style control while Glass is chosen

Advanced:

- **Contrast** (`contrast`) -- low, standard, or high (how far apart the page, card and edge steps sit)
- **Dark accent chroma** (`darkAccentChroma`) -- calm, standard, or vivid (dark mode only; how saturated the accent fills and marks render)
- **Elevation** (`elevation`) -- flat, standard, or high (surface shadows)
- **Outer glow** and **inner glow** (`outerGlow`, `innerGlow`) -- none, subtle, balanced, or vivid
- **Background style** (`backgroundStyle`) -- solid or gradient
- **Background intensity** (`backgroundIntensity`) -- neutral, subtle, balanced, vivid, or intense
- **Gradient pattern** (`gradientPattern`) -- blobs, aurora, spotlight, or mesh
- **Sidebar selection** (`sidebarSelection`) -- auto, chip, pill, tile, or frosted

An axis left out of `theme.config.ts` keeps the kit's default, and a style's own defaults (Glass's gradient background, for example) and the active preset's values win over the config's for users with nothing stored. An axis left out of `switcher.axes` is shown, and `switcher.advanced: false` removes the Advanced part of the panel.

Monospace text always uses JetBrains Mono. Font size is adjustable via the axis above. The five font families ship as woff2 files with `darkraise-ui/styles.css`, so no font request leaves the app's origin and no font link is needed in `index.html`.

The `ThemeSwitcher` component renders controls for whichever axes are enabled in the config. The `ThemeProvider` accepts an optional `onChange` callback for persisting theme settings to a backend. Theme defaults and axis visibility are set at scaffold time and can be changed later by editing `theme.config.ts`.

See [`packages/ui/README.md`](./packages/ui/README.md) for translating component text via `UiLabelsProvider`.

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

### Developing against the kit

The demo app imports `darkraise-ui` from `packages/ui/dist`, not from source. Build the kit once (`pnpm build`), then run `pnpm dev` (the kit in watch mode) beside `pnpm --filter darkraise-web-template dev`. The watch rebuilds the JavaScript and `dist/styles.css` on any change under `packages/ui/src`, including CSS that only `theme.css` imports. It does not regenerate the `.d.ts` files: after changing an exported type, run `pnpm --filter darkraise-ui run build:types`.

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

React 19, TypeScript 6, Vite 8, Tailwind CSS 4, TanStack Router, TanStack React Query, TanStack React Form, Zustand, Zod, Recharts. The `darkraise-ui` component library uses Floating UI and TanStack Table alongside its own primitives. Monorepo tooling includes Storybook, Vitest, Playwright, ESLint, Prettier, Husky, and commitlint.

## License

MIT
