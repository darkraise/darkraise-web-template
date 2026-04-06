# darkraise-web-template

A React 19 + TypeScript starter with 47 themed UI components, 38 hooks, multiple layout variants, error boundaries, and an interactive scaffolding CLI.

## Quick Start

```bash
npm create darkraise-web-template my-app
cd my-app
npm run dev
```

The CLI walks you through choosing a layout, theme defaults, theme switcher visibility, and whether to include the auth flow. Pass `-y` to accept all defaults.

### CLI Flags

All options can also be passed as flags to skip prompts:

```bash
npm create darkraise-web-template my-app \
  --layout sidebar \
  --accent blue \
  --surface-color slate \
  --surface-style default \
  --background solid \
  --font default \
  --mode system \
  --theme-switcher \
  --theme-axes mode,accentColor,surfaceColor,surfaceStyle,backgroundStyle,fontFamily \
  --no-auth \
  --host localhost \
  --port 5173
```

| Flag                                       | Values                                                    | Default       |
| ------------------------------------------ | --------------------------------------------------------- | ------------- |
| `--layout`                                 | `sidebar`, `stacked`, `top-nav`, `split-panel`            | `sidebar`     |
| `--accent`                                 | 17 colors (`red` through `rose`)                          | `blue`        |
| `--surface-color`                          | `slate` + 17 colors                                       | `slate`       |
| `--surface-style`                          | `default`, `glassmorphism`                                | `default`     |
| `--background`                             | `solid`, `gradient`                                       | `solid`       |
| `--font`                                   | `default`, `editorial`, `modern`, `humanist`, `technical` | `default`     |
| `--mode`                                   | `light`, `dark`, `system`                                 | `system`      |
| `--theme-switcher` / `--no-theme-switcher` | boolean                                                   | enabled       |
| `--theme-axes`                             | comma-separated axis names                                | all axes      |
| `--no-auth`                                | boolean                                                   | auth included |
| `--host`                                   | hostname or IP                                            | `localhost`   |
| `--port`                                   | `1`-`65535`                                               | `5173`        |
| `-y`                                       | skip all prompts, use defaults                            |               |

## What's Included

### UI Components

47 components in `src/core/components/ui/` built on Radix UI and styled with Tailwind CSS:

Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, Context Menu, Dialog, Drawer, Dropdown Menu, Field, Hover Card, Input, Input OTP, Label, Menubar, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Skeleton, Slider, Sonner (toast), Switch, Table, Tabs, Textarea, Time Picker, Toggle, Toggle Group, Tooltip.

### Hooks

38 hooks in `src/core/hooks/` covering common UI and application patterns:

| Category     | Hooks                                                                                                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lifecycle    | `useMountEffect`, `useUnmountEffect`, `useUpdateEffect`, `useIntervalEffect`, `useTimeoutEffect`, `useFirstMountState`, `useIsMounted`                                                                                 |
| Callback     | `useDebouncedCallback`, `useThrottledCallback`, `useRafCallback`                                                                                                                                                       |
| State        | `useToggle`, `useCounter`, `useList`, `useMediatedState`, `useRafState`, `usePrevious`, `useRerender`                                                                                                                  |
| Effect       | `useCustomCompareEffect`, `useDeepCompareEffect`, `useValidator`                                                                                                                                                       |
| DOM / Sensor | `useEventListener`, `useClickOutside`, `useKeyboardEvent`, `useMediaQuery`, `useBreakpoint`, `useWindowSize`, `useDocumentVisibility`, `useNetworkState`, `useResizeObserver`, `useMeasure`, `useIntersectionObserver` |
| Async        | `useAsync`, `useAsyncAbortable`                                                                                                                                                                                        |
| Storage      | `useLocalStorageValue`, `useSessionStorageValue`                                                                                                                                                                       |
| Ref          | `useSyncedRef`, `useHookableRef`                                                                                                                                                                                       |

Ported from [react-hookz/web](https://github.com/react-hookz/web) and adapted for React 19 (no external dependency required).

### Theming

A 6-axis theming system controlled by `src/core/theme/theme.config.ts`:

- **Accent color** -- 17 color options
- **Surface color** -- neutral slate or tinted surfaces
- **Surface style** -- default or glassmorphism
- **Background** -- solid or gradient
- **Font** -- 5 font stacks (Inter, Playfair Display, Geist, DM Sans, JetBrains Mono)
- **Mode** -- light, dark, or system

The `ThemeSwitcher` component renders controls for whichever axes are enabled in the config. The `ThemeProvider` accepts an optional `onChange` callback for persisting theme settings to a backend. Theme defaults and axis visibility are set at scaffold time and can be changed later by editing `theme.config.ts`.

### Layouts

4 layout variants in `src/core/layout/`:

- **Sidebar** -- collapsible sidebar with nav groups
- **Stacked** -- full-width header with stacked content
- **Top Nav** -- horizontal navigation bar
- **Split Panel** -- resizable two-pane layout

### Error Pages

Full-screen error states in `src/core/errors/`:

- **404 Not Found** -- wired as `defaultNotFoundComponent` on the TanStack Router
- **Error Boundary** -- wired as `defaultErrorComponent`, displays the error message with retry
- **500 Server Error** -- exported for use in data loaders or API error handling
- **Maintenance** -- exported for use with feature flags

All error pages share an `ErrorLayout` component and support light/dark themes.

### Auth (optional)

An auth feature module in `src/features/auth/` with login, register, forgot password, and reset password forms, a Zustand store, and an adapter pattern for plugging in your auth backend.

## Development

```bash
npm run dev          # Start dev server
npm run storybook    # Browse component library
npm run test         # Run tests
npm run test:e2e     # Playwright end-to-end tests
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

## Tech Stack

React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Radix UI, TanStack Router, TanStack React Query, Zustand, Zod, Storybook, Vitest, Playwright, ESLint, Prettier, Husky, commitlint.

## License

MIT
