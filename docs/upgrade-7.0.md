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
| `--fog-05`, `--fog-10`, `--fog-15`, `--fog-20`, `--fog-30`, `--fog-50` and the `glass`, `glass-thin`, `glass-strong` and `card-surface` utilities                                                                                                  | nothing: they painted nothing outside `.dr-surface`; use `rounded-[var(--radius)]` (the changelog has the transition)              |
| `.dr-surface`, `.dr-surface--flat` and the `dr-surface-{brand,cyan,success,warning,danger,info}` classes                                                                                                                                           | nothing: no kit component applied them                                                                                             |
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

Below 768px the layout header hides the `BrandLogo` that `TopNavLayout` and `SplitPanelLayout` place directly in it. A `BrandLogo` you pass in `headerSlot` stays visible; hide it below 768px yourself if your header runs out of room.

## Controls

`CascadeSelect` and `TimePicker` triggers are fields, not outline buttons: they render a plain `<button>` with `.dr-cascade-trigger` or `.dr-time-picker-trigger` and no `.dr-btn`. A stylesheet that targeted `.dr-btn` inside them must target those classes. Add a width utility to widen a trigger; it sizes to its content.

`FileUploadTrigger` renders with Button's default look (`.dr-btn`, `data-variant="default"`, `data-size="default"`); it takes no `variant` or `size` prop. Restyle it through `className`; rules that set its size, radius, fill or hover on `.dr-file-upload-trigger` now compete with `.dr-btn`.

Disabled controls keep receiving pointer events and show `cursor: not-allowed`. If your code put a handler on a disabled kit element and relied on `pointer-events: none` to silence it, check the disabled state in the handler. This includes `TreeViewItem` and `TreeViewBranchControl`, whose `onClick` now runs on a disabled row. The one exception is `Button asChild` with `disabled`: it swallows the click, so a disabled link does not navigate.

A disabled compound control fades once, at its root; its parts, and the controls inside a disabled `Fieldset`, no longer fade a second time. Remove any rule you added to fade such a part again.

`Alert`'s default fill is `--muted`. `.dr-badge` lays out its children with a 4px gap; remove `mr-1` or `ml-1` spacers from icons inside `Badge`.

`NavigationMenu` drops `orientation`, `delayDuration`, `skipDelayDuration` and the `NavigationMenuOrientation` type; delete them where you pass them. Items no longer open on keyboard focus: press ArrowDown, Enter or Space on a trigger. Tests that waited for a panel after tabbing to a trigger must press one of those keys. `NavigationMenuViewport` is removed: it rendered an always-hidden element, so delete it where you render it.

`TimePicker`: rename `onChange` to `onValueChange`. An uncontrolled picker takes `defaultValue` and keeps the user's picks.

`QrCode` is black on white with a 4-module quiet zone by default. For the 6.x look pass `fgColor="currentColor" bgColor="transparent" margin={0}`, but a light-on-dark code scans poorly. Pass `fallback` and `onError` to handle a value longer than the encoder holds (119 bytes at level H, 213 at the default M). The quiet zone is carved out of `size`, so a logo overlay covers more of the code than before: use level H with `QrCodeOverlay`.

`Calendar` no longer accepts `components`; remove it.

`ScrollArea`'s `type` and `scrollHideDelay` now work. If you passed `type="scroll"` or `type="hover"` while they were ignored, the scrollbars used to stay visible and now hide until the user scrolls or hovers; remove `type`, or pass `type="auto"`, to keep the old look.

The `outline` variant of `Listbox` and `TreeView` now rings the selected row instead of filling it, and `Pagination`'s outline variant edges its links. Use `variant="filled"` (the default) for the checked fill.

`TreeView` rows indent through `--tree-depth`; a `style` prop that set `paddingInlineStart` on a row to indent it should set `--tree-view-indent` on the tree instead. Remove spacer elements added to line leaves up with branches. A tree of leaves only now indents each leaf by an indicator's width plus its gap, even with no branch beside it.

`TagsInputClearTrigger` carries `.dr-tags-input-clear-trigger` instead of `.dr-tags-input-item-delete-trigger`. Move any rule that styled the clear trigger through the delete trigger's class to the new class; rules on `.dr-tags-input-item-delete-trigger` now reach only the delete buttons inside tags.

`ToggleGroup` sizes to its items and starts at the inline-start edge instead of filling its row with the items centred. Add `className="w-full justify-center"` to a group that should keep the old full-width, centred row.

## Overlays

`ComboboxContent` (and `MultiSelect`'s list) renders in a portal at the end of `<body>`. Stylesheets that styled the list through its field, for example `.dr-combobox .dr-combobox-content`, must select `.dr-combobox-content` directly or pass a `className` to `ComboboxContent`.

`SheetContent` now scrolls when its content is too tall, and top and bottom sheets are capped at the viewport height minus 2rem. If you wrapped the middle of a sheet in a `flex-1 overflow-y-auto` element to pin the header and footer, it keeps working; `SheetBody` does the same with less markup.

`FloatingPanel` z-indexes stay between 10 and 49, ordered by recency, so dialogs, sheets and popups always cover panels. If a panel must stay above them, set `style={{ zIndex: … }}` on it.

`.overlay-surface` is now a Tailwind utility that applies the overlay recipe: `background: var(--overlay-bg)`, its blend mode, `border-color: var(--overlay-border)` and the overlay backdrop filter. It no longer sets a border width, radius or shadow, so if you apply it to your own markup, add those yourself. Every kit popup applies it. It also sets `--field-edge: var(--field-edge-lifted)`, as elevated cards do, so an override of `--field-edge` on `:root` or an ancestor no longer reaches fields inside popups and elevated cards: override `--field-edge-lifted` too. Your own surfaces that take a dark lifted shadow (`--card-elevation-*`, `--elevation-*`, `--shadow-low/medium/high`) should set `--field-edge: var(--field-edge-lifted)` the same way.

## Right to left and forced colours

Components read their direction from the DOM. Put `dir="rtl"` on `<html>` (`AppI18nProvider` does this for a right-to-left locale when `syncDocument` is set) or on the element that wraps a right-to-left region; a component's `dir` prop is only needed to override its surroundings. `Tabs` no longer forces `ltr`, `Calendar` no longer copies `UiI18nProvider`'s direction, and a locale pack without `dir` no longer makes portals left-to-right. If you relied on a component staying left-to-right inside a right-to-left page, pass `dir="ltr"` to it.

`SheetContent`, `Toaster`, `BadgeAnchor` and `VirtualizedTimeline` default to the logical `end` side or corner, which is the same as before in a left-to-right page. Pass `"right"`, `"bottom-right"` or `"top-right"` to keep a physical placement in both directions. A default sheet now carries `data-side="end"` and a default `BadgeAnchor` `data-position="top-end"`, so selectors on `"right"` or `"top-right"` stop matching them. New `start`/`end` values exist for every side and position prop; prefer them in code that must work in both directions.

In a right-to-left page, horizontal arrow keys, sliders, progress bars, resizable handles, carousels and submenus follow the reading order. Tests that press `ArrowRight` to move forward in a right-to-left fixture must press `ArrowLeft`.

In forced-colours mode chosen items are painted `Highlight`. A stylesheet that set its own background on a selected kit item inside `@media (forced-colors: active)` competes with the kit's unlayered rules there; select the item with at least the kit's specificity, or remove the override.

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
