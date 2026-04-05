# darkraise-web-template

A React + TypeScript starter with a themed UI kit, multiple layout variants, and an interactive scaffolding CLI.

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

### UI Primitives

24 components in `src/core/components/ui/` built on Radix UI and styled with Tailwind CSS:

Accordion, Avatar, Badge, Button, Card, Checkbox, Command, Dialog, Dropdown Menu, Input, Label, Popover, Radio Group, Scroll Area, Select, Separator, Sheet, Skeleton, Sonner (toast), Switch, Table, Tabs, Textarea, Tooltip.

### Theming

A 6-axis theming system controlled by `src/core/theme/theme.config.ts`:

- **Accent color** -- 17 color options
- **Surface color** -- neutral slate or tinted surfaces
- **Surface style** -- default or glassmorphism
- **Background** -- solid or gradient
- **Font** -- 5 font stacks (Inter, Playfair Display, Geist, DM Sans, JetBrains Mono)
- **Mode** -- light, dark, or system

The `ThemeSwitcher` component renders controls for whichever axes are enabled in the config. Theme defaults and axis visibility are set at scaffold time and can be changed later by editing `theme.config.ts`.

### Layouts

4 layout variants in `src/core/layout/`:

- **Sidebar** -- collapsible sidebar with nav groups
- **Stacked** -- full-width header with stacked content
- **Top Nav** -- horizontal navigation bar
- **Split Panel** -- two-pane layout

### Auth (optional)

An auth feature module in `src/features/auth/` with login, register, forgot password, and reset password forms, a Zustand store, and an adapter pattern for plugging in your auth backend.

## Development

```bash
npm run dev          # Start dev server
npm run storybook    # Browse component library
npm run test         # Run tests
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

## Tech Stack

React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Storybook, Vitest, ESLint, Prettier, Husky, commitlint.

## License

MIT
