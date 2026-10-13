# Upgrading to darkraise-ui 7.0

7.0 renames presets to styles, adds presets as named variants of a style, rebuilds the colour engine and rebuilds the `create-darkraise-ui` scaffold. Most stored user settings migrate on first load, so users keep what they chose.

## Theme config

A removed key in `defaults` or `switcher.axes` is ignored. It also warns once per distinct config, naming the replacement, outside production builds.

| 6.x key                    | 7.0                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `surfaceIntensity`         | `contrast`                                                                                      |
| `borderIntensity`          | `contrast`                                                                                      |
| `accentIntensity`          | `darkAccentChroma`                                                                              |
| `controlDepth`             | removed, no replacement                                                                         |
| `buttonElevation`          | removed, no replacement                                                                         |
| `shellStyle`               | the layout's `defaultShellStyle` prop                                                           |
| `preset` naming a style    | `style`; `preset` now selects a preset of the style, so a style name there warns and is ignored |
| `switcher.axes.presetAxes` | removed; glass transparency and blur are the `glassTransparency` and `glassBlur` axes           |

`labels.theme.axisLabels.presetAxes` is removed from the labels type as well. `ThemeConfig.defaults` is now a partial map: a key left out falls back to the registry default.

## Stored settings

The kit rewrites these browser storage keys once per browser, in the pre-render script when the app uses it and otherwise when the provider loads.

- `theme-preset`: `default` becomes `quiet`, `glassmorphism` becomes `glass`, and `scifi` is removed (the user gets the configured default style).
- The style then moves from `theme-preset` to `theme-style`, which also covers a style stored by a 7.0 pre-release. `theme-preset` is removed and from then on holds the preset.
- `theme-surface-intensity`: `flat` becomes `theme-contrast` `low`, `bold` becomes `high`, `subtle` and `balanced` become `standard`; the old key is removed.
- `theme-accent-intensity`: `calm` becomes `theme-dark-accent-chroma` `calm`, `balanced` becomes `standard`, `vivid` and `intense` become `vivid`; the old key is removed.
- Exceptions: a user whose stored preset is glass or sci-fi keeps no contrast or dark accent chroma from the two keys above, because those presets painted both intensities at the config default whatever was stored.
- `theme-control-depth` and `theme-button-elevation` are removed.
- `theme-elevation`: `low` and `medium` become `standard`.
- `theme-surface-color`: a stored accent name (the 6.x accent surfaces) becomes `zinc`, and `theme-tint-with-accent` is set to `on` unless a valid tint is already stored, which keeps the tint.
- `theme-bg-style`: `solid` under the glass preset becomes `gradient`, because glass painted a gradient.
- `theme-glassmorphism-opacity` and `theme-glassmorphism-blur` move to `theme-glass-opacity` and `theme-glass-blur`; a stored `medium` in either is removed, because 6.x wrote it as a default rather than a choice.
- `theme-glass-opacity` keeps its key and stores the `glassTransparency` axis: `subtle` becomes `low` and `strong` becomes `high`, `medium` stays. The old names ran the other way: `strong` was the most see-through, as `high` is now.
- `theme-canvas-tint` becomes `theme-bg-intensity`, `theme-accent-vibrancy` goes through the accent intensity mapping above, and `theme-glass-halo` becomes `theme-outer-glow` (`soft` to `balanced`, `pronounced` to `vivid`).
- `theme-scifi-intensity` and `theme-scifi-frame` are removed.

Synced payloads migrate the same way. A payload without a version is treated as saved by 6.x, and the provider saves the migrated payload back once through `persistence.save` with `version` 7.

## Removed tokens

| Removed                                                                                                                                                                                                                                            | Use instead                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground` and their Tailwind utilities                                                                  | the status pairs `--<status>-subtle`, `-edge`, `-text`, `-solid`, `-solid-foreground`                                                        |
| `--control-well-subtle`, `--control-well-deep`                                                                                                                                                                                                     | `--control-well`                                                                                                                             |
| `--density-cell`, `--density-cell-base`, `--density-cell-sm`, `--density-cell-lg`                                                                                                                                                                  | `--control-height` and its scale `--control-height-xs` … `--control-height-xl`, `--control-height-default`, `--control-height-min`           |
| `--density-button-px`, `--density-button-py` and their `-sm` / `-lg` forms                                                                                                                                                                         | `--btn-height`, `--btn-px`, `--btn-px-tight`                                                                                                 |
| `--density-input-px`, `--density-input-py`                                                                                                                                                                                                         | `--field-px`, `--field-py`                                                                                                                   |
| `--radius-button`                                                                                                                                                                                                                                  | `--radius-control`                                                                                                                           |
| the `focus-ring-tight` utility                                                                                                                                                                                                                     | `focus-ring-inset` (draws 2px inside the element)                                                                                            |
| `--shell-region-border`                                                                                                                                                                                                                            | `--chrome-edge`                                                                                                                              |
| `--shadow-button` and the `shadow-button` utility                                                                                                                                                                                                  | the control tokens (`--btn-*`)                                                                                                               |
| `--backdrop-filter`, `--backdrop-blur`                                                                                                                                                                                                             | `--overlay-backdrop` on overlay surfaces and scrims                                                                                          |
| `--surface-opacity`                                                                                                                                                                                                                                | nothing: fills that read it are opaque                                                                                                       |
| `--glass-overlay-base-alpha`, `--inset-hi`, `--inset-hi-strong`, `--inset-hi-button`, `--glass-halo-raised`, `--glass-halo-overlay`, `--glass-halo-modal`, `--glass-state-hover-glow`, `--glass-state-active-inset`, `--glass-state-selected-fill` | nothing; set the `outerGlow` axis for a halo                                                                                                 |
| `--shadow-card`, `--glow-surface`                                                                                                                                                                                                                  | nothing (no stylesheet read them)                                                                                                            |
| the `sidebar-gradient-overlay` and `header-gradient-overlay` classes                                                                                                                                                                               | `--chrome-canvas`                                                                                                                            |
| `data-preset` on `<html>` naming the style                                                                                                                                                                                                         | `data-style`; `data-preset` now names the preset (`base` for the style alone), so `[data-preset="glass"]` must become `[data-style="glass"]` |
| `data-shell-style` on `<html>`                                                                                                                                                                                                                     | the same attribute on each layout's root                                                                                                     |
| `data-sidebar-active-bar` on `<html>`                                                                                                                                                                                                              | `useTheme().sidebarSelection`                                                                                                                |
| `--fog-05`, `--fog-10`, `--fog-15`, `--fog-20`, `--fog-30`, `--fog-50` and the `glass`, `glass-thin`, `glass-strong` and `card-surface` utilities                                                                                                  | nothing: they painted nothing outside `.dr-surface`; use `rounded-[var(--radius)]` (the changelog has the transition)                        |
| `.dr-surface`, `.dr-surface--flat` and the `dr-surface-{brand,cyan,success,warning,danger,info}` classes                                                                                                                                           | nothing: no kit component applied them                                                                                                       |
| `data-elevation` on `Card` and card-variant `AccordionItem`                                                                                                                                                                                        | `data-card-elevation`                                                                                                                        |
| `data-preset` on `ImageEditorPreset`                                                                                                                                                                                                               | `data-filter-preset`; `data-preset` now names the theme preset, whose tokens reach any element carrying it                                   |
| `--glass-fog-1` … `--glass-fog-6`, `--glass-inset`, `--glass-inset-strong`                                                                                                                                                                         | nothing: no built-in style painted them; derive translucency from `--surface-alpha` (see the custom styles guide)                            |

## Presets become styles

The `preset` axis is now `style`, with the values `flat`, `quiet`, `tactile` and `glass`.

- `useTheme()` returns `style` and `setStyle` where 6.x returned `preset` and `setPreset`; the `preset` and `setPreset` of 7.0 belong to the new preset axis (below). `activePreset`, `presetAxisValues` and `setPresetAxis` are gone.
- `ThemeSettings` and synced payloads carry `style`; `ThemeConfig` takes `defaults.style` and `switcher.axes.style`; `labels.theme.axisLabels.preset` is `axisLabels.style`.
- Stylesheets that select `[data-preset="glass"]` must select `[data-style="glass"]`.
- The default style is `quiet`, whose rebuilt look is described under Rebuilt styles and the style vocabulary below. The default neutral is `zinc` (was `slate`); a user who stored `slate` keeps it, and an app that wants `slate` sets `defaults.surfaceColor`.
- Nothing under Glass glows unless the user sets the outer glow axis.
- The Sci-fi preset is removed; a config naming `"scifi"` fails to type-check.

Style tokens sit in cascade layers. `darkraise-ui/styles.css` opens with `@layer properties, theme, base, style.base, style.mode, style.when, style.preset, style.fallback, components, utilities, overrides;`, and each style writes its tokens (`--btn-shadow`, `--card-edge`, `--chrome-rail-bg`, `--overlay-backdrop` and the rest) into the `style.*` layers. A rule in `@layer overrides` that sets one of these tokens on the root element, such as `@layer overrides { :root { --btn-shadow: none; } }`, now wins over the active style, and so does one in `components` or `utilities`. Style rules used to be unlayered, so such an override had to be unlayered too and out-specify the style's selector; an unlayered override still wins, but it can move into `@layer overrides`. Importing the kit stylesheet inside a layer of your own (`@import "darkraise-ui/styles.css" layer(vendor)`) moves all of the kit's layers under that layer and is not supported.

## Style storage key and the preset axis

The style is stored under `theme-style`; `theme-preset`, its 6.x key, now stores a new `preset` axis. A preset is a named variant of a style; `base`, the default, is the style alone, and `<html>` carries the active preset's name in `data-preset` (`data-preset="base"` for the style alone). `useTheme()` returns `preset` and `setPreset` for it, `ThemeSettings` and synced payloads carry it, and `ThemeConfig` takes `defaults.preset` and `switcher.axes.preset`. The kit ships sixteen presets and the switcher offers them (see Built-in presets below). `create-darkraise-ui` has no flag for the axis: `--preset` exits with an error naming `--style`. Code that reads `localStorage` directly must read `theme-style` for the style.

## Rebuilt styles and the style vocabulary

The four built-in styles keep their names and change their look. Quiet is a ledger: tint steps and 1px rules instead of shadows, chrome on the card tone, light page titles and figures. Flat is a set of tool panels with no shadow anywhere, a solid accent row in menus and dark tooltips. Tactile bevels every raised surface under a dark, full-width top bar. Glass is glass where content passes under it: cards, menus, popovers and dialogs let a blurred view of the page through, the top bar veils what scrolls beneath it, and the rail stays solid, over a dot canvas; `glassTransparency` and `glassBlur` reach cards, popups, dialogs and the scrim, and no longer the sidebar. None of them sets an accent, surface, font, radius or density, so your `defaults` for those axes apply under every style; a built-in preset does set some of them (see Built-in presets below). Review each screen under the style you ship.

A style or preset definition can now set 82 paint tokens and 24 signatures (the enumerated choices such as `navSelection`, `barTone` or `fieldBorder`); `darkraise-ui/theme-config` exports both lists as `PAINT_TOKENS` and `SIGNATURES`. To keep part of a 6.x look, define a style that extends the built-in one and sets the tokens or signatures back, for example `defineStyle({ label: "Quiet, raised", extends: "quiet", tokens: { shared: { buttonShadow: "0 1px 2px rgb(0 0 0 / 0.1)" } } })`.

Paints that a stylesheet used to set on an element are internal now. Replace `--sidebar-chip`, `--sidebar-tint` and `--sidebar-frost` with `--nav-selection-fill`; `--sidebar-chip-edge` and `--sidebar-frost-edge` with `--nav-selection-edge`; `--sidebar-chip-shadow`, `--sidebar-tile-shadow` and `--sidebar-frost-highlight` with `--nav-selection-shadow`; `--sidebar-active-glow` with `--nav-selection-glow`; and `--shell-region-shadow` with `--shell-shadow`, each set on `:root` or in a style definition. The flat and inset shells no longer rebind `--chrome-rail-bg` and `--chrome-bar-bg` on their regions, so a rule that relied on that rebinding should set `--chrome-flat-fill`.

New axes: `headingFont` (`body` or a font name, key `theme-heading-font`) and `signalColor` (`none` or an accent name, key `theme-signal-color`). `gradientPattern` gains `dots` and `grain`. An exhaustive `switch` over `SidebarSelection` or `GradientPattern` needs the new cases.

## Glass transparency

Glass's Opacity setting is Transparency. The axis `glassOpacity` is `glassTransparency`, with the values `low`, `medium` and `high`, where `high` is the most see-through (the old `strong`). `<html>` carries `data-glass-transparency` instead of `data-glass-opacity`, `useTheme()` returns `glassTransparency` and `setGlassTransparency`, `ThemeConfig` takes `defaults.glassTransparency` and `switcher.axes.glassTransparency`, synced payloads carry `glassTransparency`, and `GLASS_OPACITIES` and `GlassOpacity` are `GLASS_TRANSPARENCIES` and `GlassTransparency`. `labels.theme.axisLabels` is keyed by axis name, so a label override for `glassOpacity` must move to `glassTransparency`. Stored values migrate (see Stored settings); the key `theme-glass-opacity` is unchanged.

Each glass look now declares how much of the page its cards and its popups and dialogs let through at Medium, with `surfaceFillAlpha` and the new `overlayFillAlpha`, and the setting scales that share. Base Glass's cards and dialogs are translucent and blurred. Blur reaches cards and chrome as well as popups. A style that extends Glass and set `overlayFillBase` per opacity step drops those entries and declares `overlayFillAlpha`; the custom styles guide's Transparency and blur section has the rules. Glass's gradient art now lives in `shellGroundGradient`, so a Glass look under Solid shows a plain ground.

## Built-in presets

The kit ships sixteen presets. Each belongs to one built-in style and sets paint tokens, signatures and some axes over it; its colours come from the kit's existing accent and neutral ramps.

| Style     | Preset            | Label            | Shell style |
| --------- | ----------------- | ---------------- | ----------- |
| `quiet`   | `paper-ink`       | Paper & Ink      | `flat`      |
| `quiet`   | `linen-teal`      | Linen & Teal     | `flat`      |
| `quiet`   | `red-graphite`    | Red Graphite     | not set     |
| `quiet`   | `studio-green`    | Studio Green     | not set     |
| `flat`    | `pastel-soft`     | Pastel Soft-Flat | `flat`      |
| `flat`    | `forest-lime`     | Forest & Lime    | `framed`    |
| `tactile` | `braun-panel`     | Braun Panel      | `framed`    |
| `tactile` | `dark-instrument` | Dark Instrument  | not set     |
| `tactile` | `card-stock`      | Card Stock       | `inset`     |
| `glass`   | `mica-desk`       | Mica Desk        | `inset`     |
| `glass`   | `smoked-obsidian` | Smoked Obsidian  | not set     |
| `glass`   | `milk-glass`      | Milk Glass       | `flat`      |
| `glass`   | `aurora-night`    | Aurora Night     | `flat`      |
| `glass`   | `coral-space`     | Coral Space      | `inset`     |
| `glass`   | `dusk-haze`       | Dusk Haze        | `flat`      |
| `glass`   | `soft-glass`      | Soft Glass       | `island`    |

Nothing changes until an app or a user picks one: the default preset is `base`. To start an app on a preset, name it together with its style in the theme config:

```ts
import type { ThemeConfig } from "darkraise-ui/theme"

export const themeConfig: ThemeConfig = {
  defaults: { style: "glass", preset: "mica-desk" },
  switcher: { enabled: true },
}
```

`defaults.preset` applies only to a preset of the default style, so `style` is needed for every preset outside Quiet. With the Vite plugin a preset of another style fails the build; without it the provider warns and uses `base`.

While a preset is active, an axis the user never set takes the preset's value before the style's default and your config default. Every built-in preset sets `accentColor`, `surfaceColor`, `tintWithAccent`, `signalColor`, `font` and `headingFont`, so your `defaults` for those six axes do not apply under one. Some presets also set `radius`, `density`, `darkAccentChroma`, `gradientPattern`, `backgroundIntensity`, `glassTransparency` or `glassBlur`. A preset's shell style applies to the four layouts unless the user picked one or the layout pins `shellStyle`, and it beats `defaultShellStyle`.

A value the user stored still wins over the preset's, so a user who chose an accent in 6.x keeps it under every preset. While such a value exists the switcher shows a Reset to preset button under the Preset control; `useTheme().resetToPreset()` does the same from code, and `useTheme().canResetToPreset` says whether there is anything to clear.

The theme switcher gains a Preset control under the Style control, listing `base` and the presets of the active style. Set `switcher.axes.preset: false` to leave it out, or `switcher.presets`, for example `["paper-ink", "linen-teal"]`, to offer only the presets you name.

Three things can need a change in your code:

- A style, preset or font in your theme config may not take the name of a built-in preset, and a font may not be named `newsreader`. The registry reports `"<name>" is a built-in preset name` or `"newsreader" is a built-in font name`, and the Vite plugin fails the build. Rename the definition.
- `labels.theme` gains `presets` (`base` and the sixteen preset names) and `resetToPreset`, and `labels.themeOptions` gains `newsreader` and `hanken-grotesk`. Partial labels need no change: a missing key falls back to the kit's own string. An object typed as the whole of `UiLabels` or `UiMessages` must add them.
- `ThemeContextValue` gains `canResetToPreset` and `resetToPreset`, and the `useLayoutStore` state gains `clearShellStyle`. A test that mocks `useTheme` with a whole context value, or replaces the layout store's whole state, must add them.

The [custom styles and presets guide](custom-styles.md) describes how to define your own styles, presets and fonts.

## Sidebar selection

`sidebarActiveBar` is now `sidebarSelection`, with the looks `auto`, `chip`, `pill`, `tile`, `frosted`, `tint`, `accent`, `rule`, `key` and `tab`; `auto` follows the active preset, then the style. Stored values migrate on first load. Rename the props: `activeBar` → `selection` on `SidebarLayout`, `SidebarNav` and `MobileDrawer`, and `sidebarActiveBar` → `sidebarSelection` on `LayoutHeader`. Remove `showActiveBarToggle`, `defaultActiveBar` and `onActiveBarChange`; the theme panel offers the setting. The kit no longer passes `activeClassName` to the router's `Link`, so a stylesheet that relies on `.dr-sidebar-nav-item.active` should select `.dr-sidebar-nav-current`, and a `SidebarItem` used outside `SidebarNav` and `StackedLayout` marks no row.

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

`useListbox` returns `focusedId` and `setFocusedId(id)` instead of `focusedIndex` and `setFocusedIndex(index)`. Where you read the focused index, look the item up instead: `items().find((item) => item.id === focusedId)`. Where you set it, pass the item's `id`, or `null` to clear focus.

The cleanup that `useListbox`'s `registerItem` returns now removes the item at once and moves focus off it if it was focused. A custom item that returned that cleanup from an effect which re-runs when its fields change should instead unregister with `unregisterItem(id)` in a separate effect keyed on its `id`, and pass its node as `element` so `items()` follows document order.

`TreeView` rows indent through `--tree-depth`; a `style` prop that set `paddingInlineStart` on a row to indent it should set `--tree-view-indent` on the tree instead. Remove spacer elements added to line leaves up with branches. A tree of leaves only now indents each leaf by an indicator's width plus its gap, even with no branch beside it.

`TagsInputClearTrigger` carries `.dr-tags-input-clear-trigger` instead of `.dr-tags-input-item-delete-trigger`. Move any rule that styled the clear trigger through the delete trigger's class to the new class; rules on `.dr-tags-input-item-delete-trigger` now reach only the delete buttons inside tags.

`ToggleGroup` sizes to its items and starts at the inline-start edge instead of filling its row with the items centred. Add `className="w-full justify-center"` to a group that should keep the old full-width, centred row.

## Overlays

`ComboboxContent` (and `MultiSelect`'s list) renders in a portal at the end of `<body>`. Stylesheets that styled the list through its field, for example `.dr-combobox .dr-combobox-content`, must select `.dr-combobox-content` directly or pass a `className` to `ComboboxContent`.

`SheetContent` now scrolls when its content is too tall, and top and bottom sheets are capped at the viewport height minus 2rem. If you wrapped the middle of a sheet in a `flex-1 overflow-y-auto` element to pin the header and footer, it keeps working; `SheetBody` does the same with less markup.

`FloatingPanel` z-indexes stay between 10 and 49, ordered by recency, so dialogs, sheets and popups always cover panels. If a panel must stay above them, set `style={{ zIndex: … }}` on it.

`.overlay-surface` is now a Tailwind utility that applies the overlay recipe: `background: var(--overlay-bg)`, its blend mode, `border-color: var(--overlay-border)` and the overlay backdrop filter. It no longer sets a border width, radius or shadow, so if you apply it to your own markup, add those yourself. Every kit popup applies it. It also sets `--field-edge: var(--field-edge-lifted)`, as elevated cards do, so an override of `--field-edge` on `:root` or an ancestor no longer reaches fields inside popups and elevated cards: override `--field-edge-lifted` too. Your own surfaces that take a dark lifted shadow (`--card-elevation-*`, `--elevation-*`, `--shadow-low/medium/high`) should set `--field-edge: var(--field-edge-lifted)` the same way.

`VirtualizedDropdownMenuContent` now takes its trigger's width, never under 8rem, where it used to take the popover's 18rem, so a menu opened from an icon button narrows and clips longer labels. Pass a width class such as `w-72` to keep the old width. The `menuitem` role moved from `VirtualizedDropdownMenuItem` to its row, so a selector or test that queries `[role=menuitem]` now matches the row wrapper.

`useDropdownMenu`, `useContextMenu`, `useMenubar`, `useSelect` and `useNavigationMenu` track focus by item id: read `focusedId` and call `setFocusedId(id)` where you used `focusedIndex` and `setFocusedIndex(index)`, and look an item up in `items()` by its `id` where you called `getItemAt(index)`. Records passed to `registerItem` need a stable `id`, and `typeahead` returns the matched item's id or `null`. Code that only renders the menu components needs no change.

`TooltipContent` wraps its children in a `<div class="dr-tooltip-body">`, so a layout class on `TooltipContent`, such as `flex items-center gap-1`, now lays out that single wrapper instead of the children. Move layout classes to an element inside `TooltipContent`; padding, width and colour classes still apply on `TooltipContent`.

A `PopoverContent` or `TooltipContent` that holds a `PopoverArrow` or `TooltipArrow` sits further from its trigger by the arrow's `height` less the popup's border width (3px for the default arrow), since the side offset now adds it. To keep a popup where it was, subtract that from `sideOffset`.

`DialogContent`, `DrawerContent`, `SheetContent` and `AlertDialogContent` placed inside their own `XPortal` render no backdrop and no second portal; the content lands in the portal's `container`. Content used alone is unchanged. If you wrap content in a portal, to pick a `container` or set `forceMount`, add the overlay yourself: `<DialogPortal container={el}><DialogOverlay /><DialogContent>…</DialogContent></DialogPortal>`.

## Hooks

`usePreviousDistinct` returns the previous distinct value in the render where the value changes, not one render later. Remove any extra render or effect you added to wait for it.

## Reduced motion

Under `prefers-reduced-motion: reduce` transitions take `0s`, so no transition starts and `transitionend` never fires. Code that waits for `transitionend` to finish a state change must also finish it when the user prefers reduced motion; read the preference with `useReducedMotion` or check `getComputedStyle(element).transitionDuration`. Animations still run for `0.01ms` and fire `animationend`.

## Right to left and forced colours

Components read their direction from the DOM. Put `dir="rtl"` on `<html>` (`AppI18nProvider` does this for a right-to-left locale when `syncDocument` is set) or on the element that wraps a right-to-left region; a component's `dir` prop is only needed to override its surroundings. `Tabs` no longer forces `ltr`, `Calendar` no longer copies `UiI18nProvider`'s direction, and a locale pack without `dir` no longer makes portals left-to-right. If you relied on a component staying left-to-right inside a right-to-left page, pass `dir="ltr"` to it.

`SheetContent`, `Toaster`, `BadgeAnchor` and `VirtualizedTimeline` default to the logical `end` side or corner, which is the same as before in a left-to-right page. Pass `"right"`, `"bottom-right"` or `"top-right"` to keep a physical placement in both directions. A default sheet now carries `data-side="end"`, a default `BadgeAnchor` `data-position="top-end"` and a default `VirtualizedTimeline` `data-scrubber-side="end"`, so selectors on `"right"` or `"top-right"` stop matching them. New `start`/`end` values exist for every side and position prop; prefer them in code that must work in both directions.

In a right-to-left page, horizontal arrow keys, sliders, progress bars, resizable handles, carousels and submenus follow the reading order. Tests that press `ArrowRight` to move forward in a right-to-left fixture must press `ArrowLeft`.

In forced-colours mode chosen items are painted `Highlight`. A stylesheet that set its own background on a selected kit item inside `@media (forced-colors: active)` competes with the kit's unlayered rules there; select the item with at least the kit's specificity, or remove the override.

## Fonts

The `font` axis takes `inter`, `geist`, `ibm-plex-sans`, `hanken-grotesk` or `newsreader`, with `hanken-grotesk` the default, plus any font a theme config registers under `fonts`; the `headingFont` axis sets a separate family for headings and takes `body` or any of the same fonts. An app or user that never chose a font now sees Hanken Grotesk; set `defaults.font: "inter"` to keep Inter. Newsreader is the kit's serif and ships upright with its weight axis only. The six faces the kit uses (Inter, Geist, IBM Plex Sans, Hanken Grotesk, Newsreader and JetBrains Mono) ship as woff2 files declared in `darkraise-ui/styles.css`, and no font request leaves the app's origin. Delete any Google Fonts link for these families from `index.html`. A font registered in a theme config may not be named `newsreader` or `hanken-grotesk`. `FONTS` and the `Font` type gain `"hanken-grotesk"` and `"newsreader"`, so a `Record<Font, …>` or an exhaustive `switch` over `Font` needs the new members.

## Pre-render script

Replace a hand-written theme script in `index.html` with the Vite plugin. In `vite.config.ts`:

```ts
import { darkraisePrerender } from "darkraise-ui/vite"
import { themeConfig } from "./src/theme.config"

export default defineConfig({
  plugins: [darkraisePrerender({ config: themeConfig }), react()],
})
```

Passing the `themeConfig` the app gives `ThemeProvider` lets an axis the user never set resolve as the provider resolves it: the preset's value, then the active style's default, then the config default, then the registry default. When the config defines `styles` or `presets`, the plugin also injects their CSS in a `<style data-darkraise-theme>` element before the script, so they paint on first load, and the build fails on a definition error. Pass `nonce` to put a CSP nonce on both elements; the plugin writes it once at build time, so a server that issues a nonce per response must rewrite it in the HTML it serves. `darkraisePrerender({ defaults: themeConfig.defaults })` still works but injects no styles and is deprecated. `vite` is an optional peer dependency (`>=6.0.0`).

## React Server Components

Every kit entry except `darkraise-ui/lib`, `darkraise-ui/locales/en`, `darkraise-ui/locales/vi`, `darkraise-ui/theme-config` and `darkraise-ui/vite` starts with `"use client"`. A server component can render kit components and pass them serialisable props, but cannot call kit hooks such as `useTheme`, read values such as `generateTokens` or `ACCENT_COLORS` imported from `darkraise-ui/theme` (a client entry exports them as opaque references), or pass functions to kit components; move that code into a file of your own that starts with `"use client"`. Import helpers such as `cn` from `darkraise-ui/lib`, which is safe on the server.

## create-darkraise-ui

The scaffold asks only for the brand axes and the style, every theme axis except `preset` has a flag, and `--help` lists them. The generated `theme.config.ts` lists only the choices made; to start a new app on a built-in preset, add `style` and `preset` to its `defaults` (see Built-in presets above). These 6.x flags now exit with an error naming the replacement:

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
