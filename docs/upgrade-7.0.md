# Upgrading to darkraise-ui 7.0

7.0 renames presets to styles, rebuilds the colour engine and rebuilds the `create-darkraise-ui` scaffold. Most stored user settings migrate on first load, so users keep what they chose.

## Theme config

A removed key in `defaults` or `switcher.axes` is ignored. It also warns once per distinct config, naming the replacement, outside production builds.

| 6.x key                    | 7.0                                                                         |
| -------------------------- | --------------------------------------------------------------------------- |
| `surfaceIntensity`         | `contrast`                                                                  |
| `borderIntensity`          | `contrast`                                                                  |
| `accentIntensity`          | `darkAccentChroma`                                                          |
| `controlDepth`             | removed, no replacement                                                     |
| `buttonElevation`          | removed, no replacement                                                     |
| `shellStyle`               | the layout's `defaultShellStyle` prop                                       |
| `preset`                   | `style`                                                                     |
| `switcher.axes.presetAxes` | removed; glass opacity and blur are the `glassOpacity` and `glassBlur` axes |

`labels.theme.axisLabels.presetAxes` is removed from the labels type as well. `ThemeConfig.defaults` is now a partial map: a key left out falls back to the registry default.

## Stored settings

The kit rewrites these browser storage keys once per browser, in the pre-render script when the app uses it and otherwise when the provider loads.

- `theme-preset`: `default` becomes `quiet`, `glassmorphism` becomes `glass`, and `scifi` is removed (the user gets the configured default style).
- `theme-surface-intensity`: `flat` becomes `theme-contrast` `low`, `bold` becomes `high`, `subtle` and `balanced` become `standard`; the old key is removed.
- `theme-accent-intensity`: `calm` becomes `theme-dark-accent-chroma` `calm`, `balanced` becomes `standard`, `vivid` and `intense` become `vivid`; the old key is removed.
- Exceptions: a user whose stored preset is glass or sci-fi keeps no contrast or dark accent chroma from the two keys above, because those presets painted both intensities at the config default whatever was stored.
- `theme-control-depth` and `theme-button-elevation` are removed.
- `theme-elevation`: `low` and `medium` become `standard`.
- `theme-surface-color`: a stored accent name (the 6.x accent surfaces) becomes `zinc`, and `theme-tint-with-accent` is set to `on` unless a valid tint is already stored, which keeps the tint.
- `theme-bg-style`: `solid` under the glass preset becomes `gradient`, because glass painted a gradient.
- `theme-glassmorphism-opacity` and `theme-glassmorphism-blur` move to `theme-glass-opacity` and `theme-glass-blur`; a stored `medium` in either is removed, because 6.x wrote it as a default rather than a choice.
- `theme-canvas-tint` becomes `theme-bg-intensity`, `theme-accent-vibrancy` goes through the accent intensity mapping above, and `theme-glass-halo` becomes `theme-outer-glow` (`soft` to `balanced`, `pronounced` to `vivid`).
- `theme-scifi-intensity` and `theme-scifi-frame` are removed.

Synced payloads migrate the same way. A payload without a version is treated as saved by 6.x, and the provider saves the migrated payload back once through `persistence.save` with `version` 7.

## Removed tokens

| Removed                                                                                                                                                                                                                                            | Use instead                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground` and their Tailwind utilities                                                                  | the status pairs `--<status>-subtle`, `-edge`, `-text`, `-solid`, `-solid-foreground`                                              |
| `--control-well-subtle`, `--control-well-deep`                                                                                                                                                                                                     | `--control-well`                                                                                                                   |
| `--density-cell`, `--density-cell-base`, `--density-cell-sm`, `--density-cell-lg`                                                                                                                                                                  | `--control-height` and its scale `--control-height-xs` … `--control-height-xl`, `--control-height-default`, `--control-height-min` |
| `--density-button-px`, `--density-button-py` and their `-sm` / `-lg` forms                                                                                                                                                                         | `--btn-height`, `--btn-px`, `--btn-px-tight`                                                                                       |
| `--density-input-px`, `--density-input-py`                                                                                                                                                                                                         | `--field-px`, `--field-py`                                                                                                         |
| `--radius-button`                                                                                                                                                                                                                                  | `--radius-control`                                                                                                                 |
| the `focus-ring-tight` utility                                                                                                                                                                                                                     | `focus-ring-inset` (draws 2px inside the element)                                                                                  |
| `--shell-region-border`                                                                                                                                                                                                                            | `--chrome-edge`                                                                                                                    |
| `--shadow-button` and the `shadow-button` utility                                                                                                                                                                                                  | the control tokens (`--btn-*`)                                                                                                     |
| `--backdrop-filter`, `--backdrop-blur`                                                                                                                                                                                                             | `--overlay-backdrop` on overlay surfaces and scrims                                                                                |
| `--surface-opacity`                                                                                                                                                                                                                                | nothing: fills that read it are opaque                                                                                             |
| `--glass-overlay-base-alpha`, `--inset-hi`, `--inset-hi-strong`, `--inset-hi-button`, `--glass-halo-raised`, `--glass-halo-overlay`, `--glass-halo-modal`, `--glass-state-hover-glow`, `--glass-state-active-inset`, `--glass-state-selected-fill` | nothing; set the `outerGlow` axis for a halo                                                                                       |
| `--shadow-card`, `--card-border`, `--glow-surface`                                                                                                                                                                                                 | nothing (no stylesheet read them)                                                                                                  |
| the `sidebar-gradient-overlay` and `header-gradient-overlay` classes                                                                                                                                                                               | `--chrome-canvas`                                                                                                                  |
| `data-preset` on `<html>`                                                                                                                                                                                                                          | `data-style`                                                                                                                       |
| `data-shell-style` on `<html>`                                                                                                                                                                                                                     | the same attribute on each layout's root                                                                                           |
| `data-sidebar-active-bar` on `<html>`                                                                                                                                                                                                              | `useTheme().sidebarSelection`                                                                                                      |
| `data-elevation` on `Card` and card-variant `AccordionItem`                                                                                                                                                                                        | `data-card-elevation`                                                                                                              |

## Presets become styles

The `preset` axis is now `style`, with the values `flat`, `quiet`, `tactile` and `glass`.

- `useTheme()` returns `style` and `setStyle` instead of `preset` and `setPreset`. `activePreset`, `presetAxisValues` and `setPresetAxis` are gone.
- `ThemeSettings` and synced payloads carry `style`; `ThemeConfig` takes `defaults.style` and `switcher.axes.style`; `labels.theme.axisLabels.preset` is `axisLabels.style`.
- Stylesheets that select `[data-preset="glass"]` must select `[data-style="glass"]`.
- The default style is `quiet`, which is 6.x's default look with a soft edge and a light shadow on buttons. The default neutral is `zinc` (was `slate`); a user who stored `slate` keeps it, and an app that wants `slate` sets `defaults.surfaceColor`.
- Glass frosts only the shell chrome and overlays. Content under Glass follows Quiet, and nothing under Glass glows unless the user sets the outer glow axis.
- The Sci-fi preset is removed; a config naming `"scifi"` fails to type-check.

## Sidebar selection

`sidebarActiveBar` is now `sidebarSelection`, with the looks `auto`, `chip`, `pill`, `tile` and `frosted`. Stored values migrate on first load. Rename the props: `activeBar` → `selection` on `SidebarLayout`, `SidebarNav` and `MobileDrawer`, and `sidebarActiveBar` → `sidebarSelection` on `LayoutHeader`. Remove `showActiveBarToggle`, `defaultActiveBar` and `onActiveBarChange`; the theme panel offers the setting. The kit no longer passes `activeClassName` to the router's `Link`, so a stylesheet that relies on `.dr-sidebar-nav-item.active` should select `.dr-sidebar-nav-current`, and a `SidebarItem` used outside `SidebarNav` and `StackedLayout` marks no row.

## Tables and the split panel

Table heads and cells no longer wrap; a wide table scrolls sideways. Add `whitespace-normal` to a `TableHead` or `TableCell` whose column should wrap.

Below 768px `SplitPanelLayout` shows its panel first. Pass `contentActive` when the user opens an item, and `onBack` to show a Back button that returns to the panel; an app that passes neither shows only the panel on phones.

## Controls

`CascadeSelect` and `TimePicker` triggers are fields, not outline buttons: they render a plain `<button>` with `.dr-cascade-trigger` or `.dr-time-picker-trigger` and no `.dr-btn`. A stylesheet that targeted `.dr-btn` inside them must target those classes. Add a width utility to widen a trigger; it sizes to its content.

`FileUploadTrigger` renders with Button's default look (`.dr-btn`, `data-variant="default"`, `data-size="default"`); it takes no `variant` or `size` prop. Restyle it through `className`; rules that set its size, radius, fill or hover on `.dr-file-upload-trigger` now compete with `.dr-btn`.

Disabled controls keep receiving pointer events and show `cursor: not-allowed`. If your code put a handler on a disabled kit element and relied on `pointer-events: none` to silence it, check the disabled state in the handler.

A disabled compound control fades once, at its root; its parts, and the controls inside a disabled `Fieldset`, no longer fade a second time. Remove any rule you added to fade such a part again.

`Alert`'s default fill is `--muted`. `.dr-badge` lays out its children with a 4px gap; remove `mr-1` or `ml-1` spacers from icons inside `Badge`.

## Fonts

The `font` axis takes `inter`, `geist` or `ibm-plex-sans`, with `inter` the default. The four faces the kit uses (Inter, Geist, IBM Plex Sans and JetBrains Mono) ship as woff2 files declared in `darkraise-ui/styles.css`, and no font request leaves the app's origin. Delete any Google Fonts link for these families from `index.html`.

## Pre-render script

Replace a hand-written theme script in `index.html` with the Vite plugin. In `vite.config.ts`:

```ts
import { darkraisePrerender } from "darkraise-ui/vite"
import { themeConfig } from "./src/theme.config"

export default defineConfig({
  plugins: [darkraisePrerender({ defaults: themeConfig.defaults }), react()],
})
```

Passing `themeConfig.defaults` lets an axis the user never set resolve as the provider resolves it: the active style's default, then the config default, then the registry default. `vite` is an optional peer dependency (`>=6.0.0`).

## create-darkraise-ui

The scaffold asks only for the brand axes and the style, every theme axis has a flag, and `--help` lists them. The generated `theme.config.ts` lists only the choices made. These 6.x flags now exit with an error naming the replacement:

| 6.x flag                                | 7.0                                                   |
| --------------------------------------- | ----------------------------------------------------- |
| `--preset`                              | `--style` (`--preset default` is now `--style quiet`) |
| `--surface-intensity`                   | `--contrast`                                          |
| `--accent-intensity`                    | `--dark-accent-chroma`                                |
| `--shell-style`                         | the layout's `defaultShellStyle` prop                 |
| `--control-depth`, `--button-elevation` | removed, no replacement                               |

The same names are rejected inside `--theme-axes`, with their camelCase form (for example `preset`, `surfaceIntensity`).

Some flags kept their name but lost 6.x values:

- `--elevation low` and `--elevation medium`: use `--elevation standard`.
- `--surface-color` given an accent name: use a neutral such as `zinc`, plus `--tint-with-accent on`.
