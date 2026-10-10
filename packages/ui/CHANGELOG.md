# Changelog

All notable changes to `darkraise-ui` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

7.0 is a major release. The [upgrade guide](https://github.com/darkraise/darkraise-web-template/blob/master/docs/upgrade-7.0.md) lists every breaking change with its replacement.

Breaking: `create-darkraise-ui` asks only for the brand axes and the style: mode, accent, surface, tint with accent (skipped under the neutral accent), style, font, radius, density and font size. Every theme axis has a flag, and `--help` lists them with their values and defaults. The 6.x flags `--preset`, `--surface-intensity`, `--accent-intensity`, `--shell-style`, `--control-depth` and `--button-elevation`, and retired names in `--theme-axes`, exit with an error naming the replacement instead of being ignored. The generated `theme.config.ts` lists only the choices made, the generated `vite.config.ts` passes them to `darkraisePrerender({ defaults })`, and `--ui-version 7.0` is kept as written rather than read as a number.

`ThemePersistenceAdapter.save` receives an optional second argument, `{ signal }`. The provider runs one save at a time and gives up on a save after 15 seconds: it aborts the signal, moves on to the newest waiting save, and reports `syncStatus` `error` when none is waiting. An adapter can pass the signal to `fetch` to cancel the request; cancelling stops the client waiting but cannot undo a write the server already received, so an adapter that needs strict ordering must enforce it on the server. Saves requested while one is running collapse into the newest, and `syncStatus` reads `saving` from the moment a change is scheduled to be saved.

Under server rendering, the layout store renders its defaults (the `sidebar` layout, no shell style) until hydration finishes and then applies the stored `layout-variant` and `theme-shell-style`, so hydration no longer mismatches. Client-only apps still show the stored values on their first render.

Breaking: theme presets become styles. The `preset` axis is now `style`, with the values `flat`, `quiet`, `tactile` and `glass` and the default `quiet`. `<html>` carries `data-style` instead of `data-preset`, `useTheme()` returns `style` and `setStyle` instead of `preset` and `setPreset`, `ThemeSettings` and synced payloads carry `style`, `ThemeConfig` takes `defaults.style` and `switcher.axes.style`, and `labels.theme.axisLabels.preset` is `axisLabels.style`. Nothing stored is lost: a stored or synced `default` becomes `quiet` and `glass` stays `glass`, in the pre-render script and in the provider. Stylesheets that select `[data-preset="glass"]` must select `[data-style="glass"]`. In development, a config whose `defaults.preset` names a style warns once and the key is ignored.

Breaking: `activePreset`, `presetAxisValues` and `setPresetAxis` are removed from the theme context, and `presetAxisValues` from `ThemeSettings` and synced payloads. The `ThemePreset`, `PresetName`, `AxisDefinition` and `CommonAxisInput` types are removed, and with `ThemePreset` its fields `surfaceRecipe`, `ownedTokenKeys`, `hiddenCommonAxes`, `commonAxisDefaults`, `shadowDropdown`, `axes` and `generateTokens`: a style is a set of token values in CSS plus defaults for a few axes, and generates no tokens. Glass's opacity and blur, which lived in `presetAxisValues.glass`, are now the `glassOpacity` and `glassBlur` axes (see Added); a synced payload's nested values are lifted into them when it loads.

Breaking: the default style is Quiet and the default neutral is `zinc` (was `slate`), and the colours painted before the provider hydrates are zinc's. Quiet is 6.x's default look with a soft edge and a light shadow on buttons, so a user whose stored preset was `default` sees those on buttons; `flat` keeps 6.x's flat controls and defaults cards to elevation `flat`. A user who stored `slate`, or a synced 6.x user, keeps it; a user who never chose a neutral sees `zinc` unless the app's config sets `defaults.surfaceColor`. A style's defaults beat the config's defaults for an axis the user never set: under Flat a config's `elevation` default does not apply, and under Glass a config's `backgroundStyle` default does not.

Breaking: Glass frosts only the shell chrome (sidebar, header, rails and panels) and overlays (dialogs, sheets, drawers, popovers, menus, tooltips, toasts and their scrims). Content under Glass is Quiet's: cards are opaque, controls use Quiet's recipe, and `--accent`, `--muted`, `--secondary` and their foregrounds, `--border`, `--card` and `--popover` are no longer rebound or made translucent. The engine solves content the same under every style, so under Glass `--primary`, `--ring`, `--primary-fill`, `--primary-text` and `--field-edge-color` take Quiet's values (Glass used one stop darker marks and fills in light mode, one stop lighter in dark, and a 3.5:1 field edge), dark-mode borders take Quiet's steps, and the dark sidebar's hover and active tints follow `--primary`. Glass no longer defaults `outerGlow` to `balanced` and paints no halo of its own, so nothing under Glass glows unless the user sets the outer-glow axis, which applies under every style. Its chrome is unblurred at `glassBlur: "none"` and under reduced transparency, and the `inset` shell no longer gains an extra seam under Glass.

Breaking: these tokens are removed, with no aliases: `--shadow-button` and its `shadow-button` utility, `--backdrop-filter`, `--backdrop-blur`, `--surface-opacity`, `--glass-overlay-base-alpha`, `--inset-hi`, `--inset-hi-strong`, `--inset-hi-button`, `--glass-halo-raised`, `--glass-halo-overlay`, `--glass-halo-modal`, `--glass-state-hover-glow`, `--glass-state-active-inset` and `--glass-state-selected-fill`. Fills that read `--surface-opacity` are opaque, overlay surfaces and scrims take their backdrop filter from `--overlay-backdrop`, and buttons and switch thumbs read the control tokens (see Added). `--shell-region-border` is replaced by `--chrome-edge`.

Breaking: stored Glass settings from 6.x migrate once more. The 6.x provider stored Glass's opacity and blur as `medium` whenever Glass was active, so a stored `medium` is treated as never chosen and removed; the axis then follows the app's config default, then `medium`. Two consequences: a 6.x user who chose `medium` on purpose gets a 7.0 config default such as `glassOpacity: "strong"` instead, and a value other than `medium` that a 6.x app's config made the default is kept as the user's own choice.

Breaking: `ThemeConfig.defaults` is a partial map, and a key left out falls back to the registry default. `ThemeConfig.switcher` is `{ enabled, axes?, advanced? }`: an axis missing from `axes` is shown, and `advanced: false` removes the Advanced part of the theme switcher. `switcher.axes.presetAxes` is removed; Glass's opacity and blur are ordinary axes, shown under the style control while Glass is active. In development, a removed key (`surfaceIntensity`, `borderIntensity`, `accentIntensity`, `controlDepth`, `buttonElevation`, `shellStyle`, `presetAxes`) passed in a config warns once with its replacement and is ignored.

Breaking: `buttonElevation` is removed from `ThemeSettings`, `ThemeConfig`, the context and the switcher, and buttons keep the flat shadow. `elevation` takes `flat`, `standard` or `high`; `standard` is the old `medium` depth and the default, and `low` is gone. Stored and synced `low` and `medium` become `standard`.

Breaking: shell style is a layout setting. `shellStyle` is removed from `ThemeConfig`, `ThemeSettings`, the theme context and synced payloads, and `<html>` no longer carries `data-shell-style`; each layout stamps it on its own root, as before. The layout store persists the choice under the same `theme-shell-style` key, the layouts take a `defaultShellStyle` prop used when nothing is stored, and the `shellStyle` prop still pins the style. The control moves from the theme switcher to the layout switcher, so an app shows it only when it sets `showLayoutSwitcher`.

Breaking: the theme switcher shows two parts, Brand and Advanced, generated from the axis registry. `labels.theme.groupLabels` is `{ brand, advanced }`, `ThemeAxisName` is `AxisKey`, and `axisLabels.buttonElevation`, `axisLabels.shellStyle` and `axisLabels.presetAxes` are removed.

Breaking: synced theme payloads carry `version: 7`. A payload without a version is treated as one saved by 6.x: it is migrated, settings it does not mention keep their local values instead of being cleared, and the provider saves the migrated payload back once through `persistence.save`. Stored settings from 6.x are migrated once per browser, in the pre-render script when the app uses it and otherwise when the provider loads. Every setting a 6.x user had stored stays user-set, so a synced 6.x user keeps `slate` and `elevation: standard` rather than later defaults. The migration cannot see app config, so in an app whose 6.x config defaulted to the glass preset, a user with no stored preset has any stored surface or accent intensity carried into contrast and dark accent chroma, although glass never painted it.

Breaking: the Sci-fi preset is removed, and with it the `supportedModes` field on presets. A config naming `"scifi"` fails to type-check. A user whose stored or synced settings name `scifi` keeps the style stored in the browser, falling back to the configured default style only when none is stored (a stored `scifi` is itself dropped), and keeps its stored mode: dark, unless the user chose System, which follows the OS.

Breaking: `Card` and card-variant `AccordionItem` expose their elevation as `data-card-elevation` instead of `data-elevation`, so a selector such as `.dr-card[data-elevation="high"]` must become `.dr-card[data-card-elevation="high"]`. Also removed: the `--shadow-card`, `--card-border` and `--glow-surface` tokens, `PresetSurfaceRecipe.overrides.shadowCard`, and the `data-sidebar-active-bar` attribute on `<html>`; see Removed.

Breaking: control sizing, radius and focus tokens are renamed, with no aliases. `--density-cell`, `--density-cell-base`, `--density-cell-sm` and `--density-cell-lg` are replaced by `--control-height` (with the scale `--control-height-xs` … `--control-height-xl`, `--control-height-default` set by density and `--control-height-min`, the coarse-pointer floor); `--density-button-px`, `--density-button-py` and their `-sm` / `-lg` forms by `--btn-height`, `--btn-px` and `--btn-px-tight`; `--density-input-px` and `--density-input-py` by `--field-px` and `--field-py`; `--radius-button` by `--radius-control`. The `focus-ring-tight` utility is removed; use `focus-ring-inset`, which now draws 2px inside the element. Badge, Kbd and Spinner size `md` is now `default`, and TreeView and Pagination variant `outlined` is now `outline`.

Breaking: `PaginationLink` marks the current page with `data-active="true"` and stays a ghost button in both variants; the filled variant used to render it as a `data-variant="default"` button, so a selector for the current page such as `.dr-pagination-link[data-variant="default"]` must become `.dr-pagination-link[data-active="true"]`. `Pagination` writes its `variant` on its root as `data-variant`.

Breaking: `TableHead` and `TableCell` take `align?: "start" | "center" | "end"` (type `TableCellAlign`), rendered as `data-align` and styled with logical `text-align`. They no longer pass the HTML `align` attribute (`"left" | "right" | …`) to the DOM; replace `align="right"` with `align="end"`. `darkraise-ui/data-table` also augments `@tanstack/react-table`'s `ColumnMeta` with `align?: TableCellAlign`; an app that declares its own `align` on `ColumnMeta` with a different type must drop that declaration or switch to `DataTableColumnMeta`, and a column whose `meta.align` is `"left"` or `"right"` takes no alignment.

Breaking: every axis of `ThemeSettings` is optional, and `onChange` and a persistence adapter's `save` receive only the axes the user has set. An absent axis means the active style's or the config's default applies. Adapters that read `settings.mode` or any other axis must handle `undefined`; `load` may return the same partial shape. `ThemeSettings` is now a type alias, so augmenting it with `declare module` no longer works.

Breaking: `surfaceIntensity`, `controlDepth` and `accentIntensity` are removed from `ThemeSettings`, `ThemeConfig` (defaults and switcher), the context and the switcher; `contrast` (`low | standard | high`), `darkAccentChroma` (`calm | standard | vivid`) and `tintWithAccent` (`off | on`) are added, and a config passing its own object must add all three. Stored values of the removed axes are ignored until the 7.0 migration.

Breaking: the 18 accent names are no longer surface colours; `neutral` is a new accent.

Breaking: `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground`, `--control-well-subtle` and `--control-well-deep`, with their Tailwind utilities, are removed; use the status pairs `--<status>-subtle | -edge | -text | -solid | -solid-foreground`.

Breaking: the `surfaceIntensity` prop on Card, Tabs and every overlay is replaced by `surface="card" | "page" | "muted" | "none"`, typed by the new `SurfaceFill` export of `darkraise-ui/lib`. `SurfaceIntensityProp` and `PresetSurfaceRecipe` are removed, and so are the `SURFACE_INTENSITIES` and `SurfaceIntensity` exports of `darkraise-ui/theme`.

Breaking: the exported `generateTokens` input drops `accentIntensity` and `preset` and takes `contrast`, `darkAccentChroma`, `tintWithAccent` (a boolean) and `frosted` (a boolean, true under Glass). It no longer returns `--shadow-dropdown`, which the stylesheet declares.

Breaking: the `sidebarActiveBar` theme setting is replaced by `sidebarSelection` (`auto`, `chip`, `pill`, `tile`, `frosted`). `auto`, the default, follows the style: Quiet draws a chip, Flat a pill, Tactile a tile and Glass a frosted chip. Stored values migrate once (`bar` and `both` become `pill`, `ring` becomes `chip`, `default` becomes Auto), and a `themeConfig.defaults.sidebarActiveBar` key warns and is ignored.

Breaking: `SidebarLayout`, `SidebarNav` and `MobileDrawer` take `selection` in place of `activeBar`, and `LayoutHeader` takes `sidebarSelection` in place of `sidebarActiveBar`. `SidebarLayout`'s `showActiveBarToggle`, `defaultActiveBar` and `onActiveBarChange` are removed; the theme panel's Sidebar Selection control replaces the header toggle.

Breaking: `SIDEBAR_ACTIVE_BARS`, `SidebarActiveBarSetting`, `SidebarActiveBar` and `useSidebarActiveBarSetting` are removed; use `SIDEBAR_SELECTIONS`, `SidebarSelectionSetting` and `SidebarSelection`.

Breaking: the kit, not the router adapter, decides the active nav row. `SidebarItem` marks its row current only inside `SidebarNav` or `StackedLayout`, which pick one active item per nav, and the kit no longer passes `activeClassName` to the adapter's `Link`.

Breaking: table heads and cells no longer wrap. A table wider than its container scrolls inside its wrapper, which fades the edge that has columns beyond it. A column that should wrap adds `whitespace-normal`; long unbroken strings in cells widen their column instead of breaking mid-word.

Breaking: below 768px `SplitPanelLayout` shows the panel in the content area and hides the content. Pass `contentActive` once the user opens an item to show the content instead, and `onBack` to render a Back button above it. Focus moves to the content when it opens and back to the panel when it closes.

Breaking: `CascadeSelect` and `TimePicker` triggers render a plain `<button>` styled as a field — the control-well fill, the 3:1 `--field-edge` bottom edge and a muted placeholder — instead of an outline `Button`, so they no longer carry `.dr-btn` or its `data-variant` and `data-size`. They still size to their content; add a width utility to widen them. TimePicker's trigger text sits in a `<span>`.

Breaking: `FileUploadTrigger` renders as a default `Button` (`.dr-btn` with `data-variant="default"` and `data-size="default"`), so it follows density, radius and the style's button edge and shadow. Its own size, radius, fill and hover rules are removed; restyle it as a Button.

Breaking: disabled controls no longer set `pointer-events: none`. They show `cursor: not-allowed` at `--disabled-opacity`, and pointer events (hover, `title` tooltips, consumer handlers) now reach disabled kit elements, which ignore activation themselves. The one exception is `Button asChild` with `disabled`, which swallows the click so a disabled link does not navigate. Code that relied on a disabled kit element swallowing pointer events must check the state itself. Moving the pointer onto a disabled `DropdownMenu` or `ContextMenu` item now closes an open submenu, as moving onto any other item does.

Breaking: a disabled compound control fades once, at its root. Its parts used to fade again inside it, reaching a quarter or an eighth of full opacity. A disabled `Fieldset` still fades as a whole, and the controls inside it no longer fade a second time.

Breaking: `Alert`'s `default` variant fills with `--muted` instead of `--background`, matching `Banner`, so it no longer disappears into the page canvas. `.dr-badge` lays out its children with a 4px gap; remove `mr-1` or `ml-1` spacers from badge icons.

Breaking: `NavigationMenu` no longer takes `orientation`, `delayDuration` or `skipDelayDuration`, and the `NavigationMenuOrientation` type is removed; none of them had any effect. Items no longer open when their trigger takes keyboard focus, and triggers drop `aria-haspopup="menu"` (they keep `aria-expanded` and `aria-controls`). Left and Right (mirrored right to left), Home and End move between top-level items; Enter or Space toggles an item; ArrowDown opens it and focuses its first link; Up and Down move between its links; Escape closes it and returns focus to its trigger; and focus leaving the panel closes it.

Breaking: the `outline` variant of `Listbox` and `TreeView` marks a selected row with a 1px ring and text in `--primary-text` over a transparent row instead of the checked fill, and `Pagination`'s `outline` variant draws the neutral `--field-edge` border around every link but the current page. Each used to look the same as `filled`.

Breaking: `TimePicker`'s `onChange` is renamed `onValueChange`, and `defaultValue` (default `"12:00"`) is added; without `value`, the picker now keeps the time the user picks.

Breaking: `QrCode` draws black modules on white (`fgColor="#000"`, `bgColor="#fff"`) inside a 4-module quiet zone (the new `margin` prop), so it scans in dark mode; pass `fgColor="currentColor" bgColor="transparent" margin={0}` for the 6.x look. A value too long to encode no longer renders an empty code: the frame sets `data-state="error"` and renders `fallback`, `onError` is called, and `QrCodeOverlay` renders nothing.

Breaking: `Calendar`'s `components` prop is removed; it was never read.

Breaking: `ScrollArea`'s `type` and `scrollHideDelay` take effect. Callers that passed `type="scroll"` or `type="hover"` used to get permanently visible scrollbars, because the prop was ignored; those bars now hide until the user scrolls or hovers, and a hidden bar ignores pointer events. Remove `type`, or pass `type="auto"`, to keep the old look.

Breaking: `TreeView` rows indent through a `--tree-depth` custom property instead of an inline `padding-inline-start`. Depth-0 rows gain a 0.5rem inline-start inset, and leaves also clear a branch indicator's width plus its gap, so their text lines up with sibling branches.

Breaking: `ComboboxContent`, and with it `MultiSelect`'s list, renders in a portal at the end of `<body>`, positioned against its field and flipped or shifted to stay on screen. Selectors that reach the list through the field, such as `.dr-combobox .dr-combobox-content` or `.dr-multi-select .dr-combobox-item`, no longer match; select `.dr-combobox-content` directly, or pass a `className`.

Breaking: `SheetContent` scrolls as a whole when its content is taller than the sheet, instead of clipping it, and top and bottom sheets stop at the viewport height minus 2rem. To keep the header and footer pinned, wrap the middle in the new `SheetBody`.

Breaking: `FloatingPanel` z-indexes run from 10 to 49 by recency (the most recently mounted or pressed panel is highest), so popups, dialogs and sheets at z-50 always cover panels. A panel that must rise above them needs an explicit `style.zIndex`.

Breaking: kit components take their direction from the DOM. Keys, pointer math and popup sides read the computed `direction` of the element they act on, so a `dir="rtl"` on `<html>` or on any ancestor is enough, and a `dir` prop only writes the `dir` attribute. `Tabs` no longer writes `dir="ltr"` when the prop is omitted, so a Tabs inside a right-to-left page is right-to-left. `Calendar` (with its year and decade views) no longer defaults its direction to `UiI18nProvider`'s and writes `dir` only when the prop is given. `UiLocaleState.dir` (from `useUiLocale()`) is `"ltr" | "rtl" | undefined`: a locale pack without `dir` inherits the parent provider's direction instead of forcing `"ltr"`, and `Portal` writes no `dir` attribute while it is undefined. The built-in `en` and `vi` packs declare `"ltr"` and are unchanged. Portalled popups follow their trigger's direction, so `align="start"` puts a popup on the right edge of its trigger in a right-to-left page. `useSlider().pointerToValue` measures in `"ltr"` unless it is given a direction.

Breaking: these defaults are logical: `SheetContent` `side` is `"end"` (was `"right"`), `Toaster` `position` is `"bottom-end"` (was `"bottom-right"`), `BadgeAnchor` `position` is `"top-end"` (was `"top-right"`) and `VirtualizedTimeline` `scrubberSide` is `"end"` (was `"right"`). Nothing moves in a left-to-right document; in a right-to-left one they sit on the left. Pass the physical value to keep the old placement everywhere. Toasts with `bottom-right` and `bottom-end` share one stack, and each stack's `data-position` carries the physical corner. A default `SheetContent` now carries `data-side="end"`, a default `BadgeAnchor` carries `data-position="top-end"` and a default `VirtualizedTimeline` carries `data-scrubber-side="end"`, so a selector on `"right"` or `"top-right"` stops matching them; `offset.x` on the `BadgeAnchor` start and end corners follows the reading direction.

Breaking: under `dir="rtl"`, horizontal arrow keys follow the reading order. `ArrowLeft` moves to the next item in Tabs, ToggleGroup, RadioGroup, horizontal Accordion, Steps, Carousel, TagsInput, InputOtp, ContributionGraph, RatingGroup, Calendar days, VirtualizedTimeline tiles, NavigationMenu and the Menubar triggers, and increases a horizontal Slider. It expands a TreeView or JsonTreeView row, opens a CascadeSelect column and opens a submenu in DropdownMenu, ContextMenu and Menubar; `ArrowRight` collapses or closes. Resizable and the SplitPanelLayout handle move the divider in the arrow's direction. A horizontal Slider and Progress fill from the right edge, Resizable and SplitPanelLayout drags follow the pointer, and submenus open to the left.

Breaking: `ToggleGroup` sizes to its content. `.dr-toggle-group` is `inline-flex` without `justify-content: center`, so its items start at the inline-start edge instead of sitting centred in a full-width row. Add `className="w-full justify-center"` to restore the old row. The theme switcher's groups keep their own grid and do not change.

### Added

- Four styles, chosen with the `style` axis: `flat` (no control shadows; cards default to elevation `flat`), `quiet` (the default: a soft edge and a light shadow on buttons), `tactile` (a sheen across the top fifth of filled buttons, stopping above the label because the fill sits at its label's contrast floor; a sheen on outline and secondary buttons; inset wells on fields, checkboxes, radios and switch tracks; and shadows on thumbs and the selected tab or segment pill) and `glass` (frosted chrome and overlays over the gradient canvas, which it defaults to). A style sets only token values, so every component follows it without rules of its own.
- `glassOpacity` (`subtle`, `medium`, `strong`; default `medium`, stored under `theme-glass-opacity`) and `glassBlur` (`none`, `low`, `medium`, `high`; default `medium`, stored under `theme-glass-blur`), with the setters `setGlassOpacity` and `setGlassBlur`. The switcher shows them under the style control while Glass is active. `<html>` carries `data-glass-opacity` and `data-glass-blur` under every style, and only Glass reads them. Like every axis they are persisted only when set and synced as `glassOpacity` and `glassBlur`.
- Control tokens, one family per control kind, which the styles set: `--btn-edge`, `--btn-sheen` and `--btn-shadow` for default and destructive buttons; `--btn-neutral-edge`, `--btn-neutral-sheen` and `--btn-neutral-shadow` for outline and secondary buttons, the default and outline toggles and the current pagination link; `--field-shadow` for fields; `--check-well-shadow` for unchecked checkboxes, radios and switch tracks; `--thumb-shadow` for switch and slider thumbs and the angle-slider pointer. `--selected-view-shadow` now differs by style. Each holds a whole `box-shadow` or `background-image` list and is painted alongside the glow layers rather than in place of them.
- Chrome tokens for the shell: `--chrome-rail-bg` (sidebar, sub-navigation and panel regions; `--surface-sidebar` unless a style or a gradient background changes it), `--chrome-bar-bg` (the header bar; `--surface-header`), `--chrome-edge` (every chrome seam; `--sidebar-border`), `--chrome-shadow`, `--chrome-backdrop` and `--chrome-canvas` (what a region paints behind its fill). The mobile drawer, which opens over page content, keeps its overlay fill (`--overlay-bg`, so it stays opaque over a gradient background) and draws its seams in `--chrome-edge`; the stacked layout's rail now draws its seam in `--sidebar-border` like every other seam.
- `--overlay-backdrop` (default `none`) joins the overlay tokens: the backdrop filter of overlay surfaces and scrims, which Glass sets.
- A `font` axis (`inter`, `geist`, `ibm-plex-sans`; default `inter`), stored under `theme-font` and stamped as `data-font`. The kit ships the four variable faces it uses, Inter, Geist, IBM Plex Sans and JetBrains Mono, as woff2 files in `dist/fonts/` with their OFL licences, declared in `styles.css`. Browsers download a face only when text uses it, and no font request leaves the app's origin; apps can drop any Google Fonts link for these families. `--font-sans` and `--font-heading` read `--font-family-sans`, which `[data-font]` sets.
- `darkraise-ui/vite` exports `darkraisePrerender()`, a Vite plugin that injects the theme pre-render script. Before the app loads it restores the stored mode, every attribute axis and the last painted token set, so returning users see their theme on first paint. Pass the app's theme config, `darkraisePrerender({ config: themeConfig })`, so an axis the user never set resolves as the provider resolves it: the preset's value, then the active style's default, then the config default, then the registry default. A config value that is not valid is dropped with one warning at build time. Add it to `vite.config.ts` and delete any hand-written theme script from `index.html`. `vite` is an optional peer dependency (`>=6.0.0`).
- `useTheme().setAxis(key, value)` sets any theme axis by name; the named setters remain.
- `<html>` carries `data-accent` and `data-surface` with the active accent and neutral.
- `writeClipboardText` in `darkraise-ui/lib`: writes through the async Clipboard API and falls back to a selection copy when that API is missing or rejects.
- `--primary-text` (utility `text-primary-text`): the accent as a text colour, solved to 4.5:1 against the page and the card. The kit's links and other accent-coloured text use it; apps that colour text with `text-primary` should move to `text-primary-text`, since `--primary` itself only clears 3:1.
- `--destructive-solid` and `--destructive-solid-foreground` (utilities `bg-destructive-solid`, `text-destructive-solid-foreground`): a destructive fill that carries a white label at 4.5:1 in both modes. The destructive button, destructive badge and notification count use it.
- `--primary-fill-wash` and `--destructive-solid-wash`: what a hover or press mixes into the matching fill, black under a white label and white under an ink label. Mixing toward them always raises the label's contrast.
- Control tokens: `--btn-height`, `--btn-px`, `--btn-px-tight`, `--btn-radius`; `--field-height`, `--field-px`, `--field-py`, `--field-radius`, `--field-edge`; `--overlay-bg`, `--overlay-border`, `--overlay-shadow`, `--overlay-radius`; `--track-height`; `--disabled-opacity` and `--loading-opacity`. Override one family (for example `--btn-radius`) without touching the others.
- `--field-edge-color`: a boundary colour solved to 3:1 against the page, card, sunken well, sidebar and header.
- Under a gradient background the field edge (`--field-edge-color`) is also solved against the page where the body canvas paints the surface hue loudest, so it reaches 3:1 on the gradient canvas; it darkens in light mode and lightens in dark mode as `backgroundIntensity` rises (a few lightness points at `balanced`, more at `intense`). Solid backgrounds are unchanged.
- Selection tokens: `--selected-view-bg`, `--selected-view-fg` and `--selected-view-shadow` for view switches; `--selected-check-bg` and `--selected-check-fg` for checked and selected items; `--selected-mark` and `--selected-mark-fg` for underline tabs; `--selected-nav-bg` and `--selected-nav-fg` for the active navigation row. Override one family to restyle every component that reads it, Checkbox and Switch included; field choice cards still tint their container from the primary tokens directly.
- `--sidebar-active-bg`: an engine token one accent-ramp step above `--sidebar-hover-bg` (the next shade up in light mode, 0.1 more alpha in dark), so the active sidebar row always differs from a hovered one.
- `CascadeSelect` keyboard support. Opening focuses the selected item (the first enabled item of its column when the selected one is disabled), or the first enabled item, and shows that item's child column, so reopening restores the selected path's columns; Up, Down, Home and End move within a column; Right or Enter opens a child column and Left returns to the parent; Enter or Space selects a leaf and closes; Escape closes. Focus then returns to the trigger. Focus and hover move the same cursor, so a focused parent shows its children as a hovered one does; only a moving pointer moves it, so a column the keyboard scrolls under a resting pointer keeps focus on the keyboard row.
- Type roles: `--type-<role>-size`, `-weight`, `-tracking` and `-leading` on `:root`, and the utilities `type-page-title`, `type-dialog-title`, `type-section-title`, `type-label`, `type-caption` and `type-ui`. Sizes read the `--text-*` steps, so the font-size axis scales them.
- `--btn-px-sm` on every `.dr-btn`: the small size's inline padding, for rules that line a small button's label up with neighbouring text.
- `--btn-py-tight`, the vertical counterpart of `--btn-px-tight`, with the same value at every density. `Menubar` and its triggers and `NavigationMenu` triggers read it for their vertical padding, so overriding `--btn-px-tight` no longer changes their height.
- `DataTable` aligns a column's header and cells from `meta.align` (`"start" | "center" | "end"`) on its column definition. `DataTableColumnMeta` types it, and `@tanstack/react-table`'s `ColumnMeta` is augmented with it.
- `--neutral-1…12`, `--primary-1…12`, the status pairs, Badge `success`, `warning`, `info` and `*-subtle` variants, and `--chart-6…8`; the chart palette no longer follows the accent.
- The active sidebar row slides between rows as the route changes (instantly under reduced motion).
- `SplitPanelLayout` `contentActive` and `onBack`, and the `labels.layout.back` label ("Back"; Vietnamese "Quay lại").
- Kit tables and the virtualized data table viewport fade an inline edge while columns lie beyond it.
- `field-trigger` utility in the kit stylesheet: the field recipe for a picker's closed trigger, with its value in a direct child `<span>` and its icon in a direct child `<svg>`. `Select`, `CascadeSelect` and `TimePicker` use it.
- `labels.dateInputPlaceholder` (`{ year, month, day }`), `YYYY`, `MM` and `DD` in English and Vietnamese.
- `UseListboxOptions.disabled` and `UseListboxReturn.disabled`.
- `SheetBody`: the scrolling middle of a sheet; rendering one pins the sheet's header and footer, as `DialogBody` does for a dialog.
- `ComboboxContent` takes `surface`, forwarded as `data-surface-fill` like the other popups, and `ComboboxControl` takes a `ref`.
- Every popup positioned by the kit sets `--popup-available-width`, `--popup-available-height`, `--popup-anchor-width`, `--popup-anchor-height` (all in px) and `--popup-transform-origin` on itself, for consumer styles that size or animate a popup.
- `QrCode` `margin`, `label`, `onError` and `fallback`. Its `<svg>` is `role="img"`, named by `label` or `labels.qrCode.label` ("QR code"; Vietnamese "Mã QR").
- `TimePicker` `defaultValue`.
- `NavigationMenu` keyboard navigation (see the Breaking note above).
- `ScrollArea` `type` (`auto`, `always`, `scroll`, `hover`) and `scrollHideDelay` (default 600ms) now work; scrollbars carry `data-state="visible"` or `"hidden"`, and a hidden bar fades out.
- `"start"` and `"end"` for `SheetContent` `side`, `Drawer` `direction`, `VirtualizedTimeline` `scrubberSide` and the `side` of `TooltipContent`, `PopoverContent`, `HoverCardContent`, `SelectContent`, `DropdownMenuContent` and `MenubarContent`; `"top-start"`, `"top-end"`, `"bottom-start"` and `"bottom-end"` for `Toaster` and toast `position` and for `BadgeAnchor` `position`. They resolve from the computed direction: `start` is the left side in a left-to-right document and the right side in a right-to-left one. A popup's `data-side` and a Drawer's `data-direction` carry the resolved physical side.
- The `dr-icon-inline` class mirrors an icon that points along the reading order (a next arrow, a breadcrumb chevron) in a right-to-left document. Do not put it on a chevron that also rotates to show an open state.
- `useSlider().pointerToValue` takes an optional fourth argument, the direction to measure in.
- `LocaleSwitcher` takes `compact`: below 640px the trigger shows only the selected option's icon, and the language name stays as text for assistive technology. A selected option without an icon keeps its name. Below 640px a compact trigger takes the tight inline padding of an icon button (`--btn-px-tight`). The trigger carries `data-compact`, and `data-compact-icon` while the selected option has an icon; every option name carries `dr-locale-option-label`.
- `VirtualizedDropdownMenuContent` takes `isItemDisabled(item, index)`. A disabled row is skipped by the arrow keys, Home and End, ignores clicks, Enter and the pointer, and carries `data-disabled` and `aria-disabled`; the item render function receives `disabled`, and `VirtualizedDropdownMenuItem` takes `disabled`.
- `UserMenu` takes `layoutSwitcher` (the `variants`, `shellStylePinned` and `currentShellStyle` of `LayoutSwitcherProps`) and then shows a Layout submenu with the same layout and shell-style choices as `LayoutSwitcher`. Its trigger carries `.dr-user-menu-layout` and shows below 48rem only. `LayoutSwitcher`'s trigger carries `.dr-layout-switcher-trigger`.
- `focusNext` and `focusPrev` from `useDropdownMenu`, `useContextMenu`, `useMenubar` and `useSelect` take `{ loop }` to override the hook's `loop` option for one move.
- `ThemeConfig` takes `styles` and `presets`: plain-data definitions of new styles (optionally extending another) and of presets of a style. `ThemeProvider` accepts their names as `style` and `preset` values, from storage, the config defaults, synced payloads and the setters, and paints with each definition's axis values and `frosted`; `useTheme().registry` holds the resolved styles and presets. Picking a preset also stores its style, and picking a style stores `preset: "base"`.
- The theme switcher's Style control lists a config's styles after the built-ins, each by its `label`. Under `sidebarSelection: "auto"` a config style draws the look of the nearest built-in style it extends, or chips when it extends none, and a style that extends Flat drops the sidebar shadows as Flat does.
- `darkraisePrerender` takes `config`, the theme config the app passes `ThemeProvider`, and `nonce`. When the config defines styles or presets, the plugin injects `<style data-darkraise-theme="<hash>">` with their compiled CSS ahead of the pre-render script, so a config style paints on first load; `nonce` goes on both elements. Building fails, with one line per problem, when a definition has an error or `defaults.preset` names a preset of a style other than the default style. `defaults` still works when `config` is absent and is deprecated.
- A theme definition value containing `{`, `}`, `</style` (in any case), a `;` outside brackets or quotes, or an unclosed bracket, quote or comment, or a var name that is not a plain custom property name, is an error: the plugin fails the build and the provider leaves the definition out.
- `ThemeProvider` takes `nonce`. When its config defines styles or presets and the page has no `<style data-darkraise-theme>` for the same definitions (the Vite plugin injects one), the provider adds one with their compiled CSS before its first paint, carrying `nonce`, and replaces one left from other definitions. Without the plugin, a config style's tokens are missing from the first paint until the app loads. Outside production the provider warns once per config about each definition issue; a definition with an error is left out.
- `darkraise-ui/theme-config` exports the theme definition schema without React: `defineThemeConfig`, `defineStyle`, `definePreset` and their types, `PAINT_TOKENS`, `resolveRegistry` and `buildRegistry` (with `ThemeRegistry`, the type of `useTheme().registry`), `compileThemeCss`, `LAYER_STATEMENT`, `definitionsHash`, `buildThemeJsonSchema()`, and `themeStyleText(config)` and `themePrerenderScript(config)` for apps that render their own document. `darkraise-ui/theme.schema.json` is the JSON Schema (draft-07) of a theme config, for editors and for configs written as JSON. The entry carries no `"use client"` and imports nothing from React or Node.
- A preset's `shellStyle` sets the shell style of the four layouts while it is active: the user's stored pick still wins, and the preset's value beats the layout's `defaultShellStyle`. The pinned `shellStyle` prop wins over all of them. `useShellStyle` resolves the same order and still works outside a `ThemeProvider`.

### Changed

- `--shadow-dropdown` is declared in the stylesheet instead of written by the engine; Glass's deeper dropdown shadow, tinted blue-black in light mode, comes from its style file.
- The pre-render token cache's id includes a schema number (`TOKEN_CACHE_SCHEMA`, now 3), so a token set cached before 7.0, which can carry Glass's old inline fog or `--shadow-dropdown`, is discarded once: a returning user's first load after the upgrade paints the stylesheet's fallback colours until the provider hydrates, then caches the new set.
- Under a gradient background, Flat, Quiet and Tactile keep the transparent sidebar and header, and their seam is the neutral's `--neutral-7` at 60% instead of a fixed slate hue.
- Glass no longer sets the public `--fog-05` … `--fog-50` tokens; only `.dr-surface` declares them. The `glass`, `glass-thin` and `card-surface` utilities therefore stay transparent under Glass, and they no longer draw a border: add `border` where one is wanted. `glass-strong` takes `--border` as its border colour.
- The theme panel's **Shell Style** control is a single-row `SegmentGroup`. As a six-value toggle group it had no matching column rule and stacked vertically.
- `inset`, `island` and `framed` shells paint the page background as their ground, as `floating` already did, instead of the sidebar surface.
- Primary fills are solved so their label clears 4.5:1. In light mode the nine white-labelled accents (red, coral, blue, indigo, violet, purple, fuchsia, pink, rose) darken slightly; the other nine keep their fill and ink label. In dark mode the `balanced` fill darkens for nine of the eighteen accents. No accent's label colour changes.
- Status colours come as pairs of tokens per status: `-subtle`, an opaque tinted fill; `-edge`, for marks, at least 3:1 against the page, the card and its own `-subtle`; `-text`, at least 4.5:1 against the same three; and `-solid` with `-solid-foreground`, a fill whose label clears 4.5:1. Every `-solid` label is white except warning's, which is ink, in both modes, so no status label changes colour. The solid fills are the same in both modes. Destructive fills move to the solid pair, so their colour shifts: blue and green accents move from `0 84% 48%` (light) and `0 72% 56%` (dark) to `358 71% 53%` (label contrast about 4.6:1, down from about 4.9:1 in light mode), and red, rose and pink accents from `25 95% 38%` (light) and `21 90% 48%` (dark) to `26 96% 38%`. Apps that paint destructive fills themselves with `bg-destructive text-destructive-foreground` must move to `bg-destructive-solid text-destructive-solid-foreground`, since `--destructive` and `--destructive-foreground` are removed.
- `--legend` is solved against the page, card and popover instead of the page alone, so it reads slightly stronger; it is not meant for muted fills.
- Primary-coloured text in the kit (links and other accent-coloured text) now reads `--primary-text`: in light mode every accent's text colour darkens, and in dark mode indigo and violet lighten.
- Hover and press on filled controls move away from the label instead of toward it: under a white label they now darken, in dark mode too, where they used to lighten. This covers the default and destructive button and badge, the on toggle, selected calendar days, the selected time-picker item and the file-upload trigger. The old translucent and label-coloured hovers took a fill solved to 4.5:1 down to 3.3:1 in light mode.
- The fixed accent-colour badges clear 4.5:1: orange, green, emerald, teal, cyan and sky take their own -950 ink on the -500 fill, as amber, yellow and lime already did; red, rose, pink, fuchsia, blue, violet and purple darken to -600 under white; indigo is unchanged. White on green-500 measured 2.22:1. Hover moves one shade away from the label instead of turning translucent.
- `--primary-text` also clears 4.5:1 on a `--primary` tint of up to 24% over the page and card, where steps, timeline, highlight and the sidebar count (20%) put it; on a 10% tint it had failed in about half of all themes. It darkens by up to about 12 lightness points in light mode and lightens by up to about 11 in dark.
- Timing: the steps indicator moves from 250 to 200ms, the slider thumb from 100 to 150ms and calendar days from 120 to 150ms. Every other component keeps its timing, now expressed through the motion tokens.
- Buttons, toggles and fields share one height per density: compact 28px, cozy 32px, comfortable 36px, spacious 40px, scaled by the font-size axis. Outline, ghost and dark-mode secondary buttons no longer sit 2px taller, and multi-select, date input, OTP slots and segment items now follow density. On a coarse pointer (touch screens), buttons and fields are at least 40px tall at every density, and so are the collapsed sidebar rail's squares (toggle, brand slot, search trigger, nav links and group triggers); expanded sidebar rows, breadcrumb, editable and calendar keep their density height so they still fit their slots.
- Fields draw a bottom edge at 3:1 or more, with faint sides and top; unchecked checkboxes, radios and switch tracks draw that edge all round instead of the accent colour.
- Multi-select, date input and OTP slots use the field surface, so they recess inside cards and overlays like other fields; multi-select no longer carries a drop shadow.
- Textarea, tags input and multi-select take the surface radius, so they stay rounded rectangles at the `pill` radius; overlays (dialog, sheet, drawer, popover, tooltip, menus, command, toast and others) share `--overlay-radius`; kbd follows the radius setting, capped at 6px. At `pill`, tooltips become fully rounded.
- Date input and OTP slots take the control radius instead of `rounded-md`, and the select trigger takes it instead of the surface radius `--radius`, so at `pill` all three become full pills like inputs and buttons. Overlays that used `rounded-md` (`--radius` minus 2px) are 2px rounder now that they read `--overlay-radius`.
- The progress bar is 8px tall, matching the slider track.
- Focus: standalone controls draw the focus ring 2px outside; items packed into a container (menu and list rows, segment and toggle-group items, grouped buttons, buttons inside input and number-input wrappers, calendar days) draw it 2px inside. Date input, listbox and multi-select show focus with the shared utilities instead of a box-shadow ring.
- Hover: toggle, tabs, segment items, number-input steppers, icon triggers, overlay close buttons and pagination use the button's state layer, and none of them reacts to hover while disabled. The toggle's label no longer dims on hover, and accordion triggers no longer underline.
- Disabled: every disabled control uses `--disabled-opacity` (0.5); a loading button uses `--loading-opacity` (0.7). Disabled toggles, tabs, navigation-menu triggers, number-input steppers and password toggles keep pointer events and show the not-allowed cursor, so a tooltip can explain them.
- Every interactive control opts out of double-tap zoom and draws a boundary in forced-colours mode.
- Transitions use the kit's easing curves instead of CSS keywords, so short fades such as the 120ms hover wash feel sharper.
- Selected states use four families. Tabs (`default` and `outline`) and SegmentGroup select with a neutral raised pill and foreground text instead of the accent, including the default Tabs pill; their `outline` pills carry a 1px neutral ring so the variant still differs from `default`. Toggle, Listbox, TreeView, Calendar, TimePicker, TagsInput, Pagination, Steps and Timeline fill checked and selected items with the accent, outline variants included: an on outline toggle, a selected outline listbox or tree row and the outline current page now take the filled variant's fill instead of an accent border and accent text. Underline tabs and PageHeader tabs keep an accent bar under foreground text. The dashed completed-step connector in `Timeline` draws in the accent fill instead of `--primary-text`. `Listbox`, `TreeView` and `Pagination` now render `outline` and `filled` the same way.
- The sidebar's active row is drawn in the look the `sidebarSelection` setting picks (see Breaking), and the stacked layout's rail and sub-navigation follow it too. The sidebar popover's current entry is drawn in the same look with its label in the accent. The top-nav active item and the layout switcher's active option keep the `--selected-nav-bg` tint.
- Outline buttons and FloatingPanel header triggers rest on the neutral 3:1 field edge instead of the accent, and ghost buttons rest on foreground text; hover on all of them comes from the state layer, and the FloatingPanel trigger rim no longer changes on hover. Search triggers, AlertDialog Cancel and the CascadeSelect trigger are outline buttons and follow.
- Scrollbars, the ScrollArea thumb and Skeleton are neutral (a foreground alpha) instead of accent-tinted.
- Badges react to hover only when they are a link, a button or `role="button"`.
- Alert, Banner and Toast paint their status's opaque `-subtle` fill in both modes, replacing the translucent washes (Alert's 6%, Banner's 12%, 18% in dark, and the warning toast's 12%). Alert and Banner draw a 4px `-edge` rail on the left; icons take `-edge` and Alert and toast titles take `-text`, while body text stays on the foreground. Banner's frame is neutral beside its rail, and its text is no longer status-coloured in dark mode. Toasts have no status border: they keep the overlay border, and their close button and countdown bar take `-edge`.
- Toasts read the overlay tokens (`--overlay-bg` with the overlay blend mode, `--overlay-border`, `--overlay-shadow`), so Glass frosts them like other overlays.
- Menus agree on their details: separators use `--border` (select and menubar used `--muted`); shortcuts use the muted text colour instead of 60% opacity; menubar content is at least 8rem wide, like other menus (was 12rem); command items show the pointer cursor; combobox, listbox, tree and cascade rows pad by density; menu, select and menubar group labels are small, medium-weight and muted, like command's.
- NavigationMenu triggers and the Menubar are transparent at rest; the menubar keeps its border.
- Sheets round only the two corners away from their viewport edge, draw their border only on the inner side, and pad that edge 1.5rem like the other sides.
- Titles follow the type roles: page header titles are 24px at weight 600 with -0.02em tracking (were 30px at 500), card and empty-state titles 16px at 600 (card titles were 24px), and dialog, alert-dialog, drawer and sheet titles 18px at 600. Card, dialog and drawer titles drop their negative tracking, and empty-state titles move from a 1.5 to a 1 line height.
- Labels follow the `label` role (14px at 500, line height 1): `Label`, the combobox, file-upload, tags-input, date-picker, color-picker, rating-group, number-input, password-input, clipboard and editable labels, and alert and toast titles. Alert titles were 16px with negative tracking; toast titles had a 1.25 line height. Menu, menubar, select and command group labels follow the `caption` role (12px at 500).
- Badges are at least 16, 20 and 24px tall (`sm`, `default`, `lg`), take a radius of `min(var(--radius-control), 0.375rem)` instead of a full pill, and use weight 500 (was 600). The default size uses the caption role and `lg` the label role.
- Tables: header cells use the caption role (12px at 500), every head and cell uses tabular figures, and rows are at least the control height plus 8px (36, 40, 44 and 48px from compact to spacious at the default font size). Virtualized `DataTable` rows keep `virtualize.rowHeight`. Header text starts on the inline start edge, so it flips in right-to-left layouts.
- Sortable `DataTable` headers start their label on the column's text edge (they sat a few pixels left of it) and read like plain headers: 12px at 500 in the header's muted colour instead of a foreground ghost button. In an end-aligned column the sort button sits at the end.
- Virtualized `DataTable` body cells follow `meta.align`, as unvirtualized ones do; sortable headers carry no glass halo and place their sort icon on the inline-end side.
- Under every style but Glass, with a gradient background, `--primary`, `--ring`, `--focus-ring`, `--primary-text` and `--muted-foreground` are also solved against the content strip, the canvas the top 300px of the content area repaints, and `--field-edge-color` lists it too, so marks clear 3:1 and text 4.5:1 there (measured at 1440px with the blobs, aurora, mesh and spotlight patterns, and at 768px and 390px with blobs and mesh). As background intensity rises they darken in light mode and lighten slightly in dark mode. The strip paints its canvas at least 1440px wide and shows the centre of it in a narrower content area, so the blobs no longer crowd together and stack louder on small screens. Solid backgrounds and Glass are unchanged.
- Dark-mode primary tints (`--primary-1` to `--primary-5`) follow dark accent chroma: their chroma cap is 0.03 at `calm`, 0.05 at `standard` and 0.0625 at `vivid`, where it was 0.05 at every setting.
- In forced-colours mode (Windows contrast themes) every selected, checked, pressed, current or open item is painted `Highlight` with `HighlightText`, ranges get a dashed Highlight border, today is underlined, invalid fields get a dashed border, and separators, tracks, thumbs, handles and connectors are drawn in `CanvasText`. Colour swatches, the colour picker's area and hue strip and ContributionGraph cells keep their real colours (`forced-color-adjust: none`), and Tabs triggers draw their own frame there instead of the shared boundary outline.
- `TagsInputClearTrigger` renders with its own class, `.dr-tags-input-clear-trigger`, instead of the delete trigger's `.dr-tags-input-item-delete-trigger`. It sizes to its content, never below the icon square it replaced, and keeps a text label on one line, where the label used to wrap inside the 16px icon square and spill past the field; it keeps the delete trigger's hover wash, hover colour and disabled fade. Styles aimed at the clear trigger through `.dr-tags-input-item-delete-trigger` must move to `.dr-tags-input-clear-trigger`.
- Breaking: a `VirtualizedDropdownMenu` row is the menu item: it carries `role="menuitem"` and an id, and `VirtualizedDropdownMenuItem` inside it no longer carries the role. Without a width class the content takes its trigger's width, at least 8rem, instead of the popover's 18rem, so a menu opened from an icon button narrows and clips longer labels unless you pass a width class such as `w-72` to `VirtualizedDropdownMenuContent`.
- In a `ButtonGroup`, a filled button (`default`, `secondary` or `destructive`) that follows another child paints its inline-start border (block-start in a vertical group) as a 1px seam, the page colour at 35% over its fill, so adjacent filled buttons no longer read as one block. Outline buttons keep their shared edge; ghost and link buttons are unchanged.
- Breaking: every entry that uses React state or context starts with a `"use client"` directive: `darkraise-ui`, each `darkraise-ui/components/*` entry, `hooks`, `theme`, `layout`, `forms`, `data-table`, `errors`, `router`, `i18n`, `i18n/react-i18next` and `labels`. Under React Server Components these are client modules: a server component can render their components but cannot call their hooks. `darkraise-ui/lib`, `darkraise-ui/locales/en`, `darkraise-ui/locales/vi`, `darkraise-ui/theme-config` and `darkraise-ui/vite` carry no directive and import nothing from React, so server code can use them. The directives that 75 source files carried never reached `dist`, because the bundler drops them; they are removed.
- Breaking: under `prefers-reduced-motion: reduce`, transitions take `0s` instead of `0.01ms`, so no transition starts: `transitionrun`, `transitionstart` and `transitionend` no longer fire, and a computed-style read right after a change returns the new value. Animations keep `0.01ms`, so `animationend` still fires.
- Below 48rem `LayoutHeader` hides its layout switcher and passes the same choices to the user menu's Layout submenu, so a phone-width bar keeps every control inside it under the floating and island shells.
- In light mode the `flat` shell style paints its rail and bar with `--shell-flat-chrome`, a fixed 8.25-point step below `--background` lightness, instead of `--muted`, which sat at 1.05:1 against the page. The tone reads at about 1.2:1 and stays below the classic rail edge, so it does not look like a border. Dark mode keeps `--muted`.
- On the settings page (`.dr-theme-settings-page`) a toggle group with four values (Style, Gradient pattern) lays out as 2x2 instead of one row of four, and one with five values (Sidebar selection) in two columns instead of rows of three, so the longer Vietnamese labels fit the column at 1024 and 1280px and at spacious density. The theme switcher popover keeps its single row of four and its rows of three.
- Breaking: `useDropdownMenu`, `useContextMenu`, `useMenubar`, `useSelect` and `useNavigationMenu` track focus by item id. They return `focusedId` and `setFocusedId(id)` instead of `focusedIndex` and `setFocusedIndex(index)`, no longer return `getItemAt`, and `typeahead` returns the matched item's id or `null` instead of an index. The item records passed to `registerItem` take an `id`; registering an id that is already registered replaces its record without re-rendering, and `unregisterItem(id)` removes one. Focus stays on its item when other items are added or removed; when the focused item is removed, focus moves to the item that takes its place.
- Breaking: `useListbox` tracks focus by item id. `UseListboxReturn.focusedId` (`string | null`) and `setFocusedId(id)` replace `focusedIndex` and `setFocusedIndex`, and `aria-activedescendant` on `Listbox` reads `focusedId`. `registerItem` keeps its signature; registering a descriptor whose `id` is already registered replaces it in place. `ListboxItem` registers from a layout effect, so hovering an item focuses it as soon as it mounts, where it used to need a second render.
- Breaking: `ListboxItemDescriptor` gains an optional `element` and `UseListboxReturn` gains `unregisterItem(id)`. `items()` returns records in document order while every record carries an `element`, and in registration order otherwise; `ListboxItem` passes its node, so the arrow keys reach an item mounted between two others in its place. The cleanup that `registerItem` returns removes the item at once instead of at the next `items()` read. When the focused item is removed, focus moves to the enabled item that takes its position, including one that mounts in its place in the same render, else to the last enabled item, else to none, and `Listbox` re-renders, so `aria-activedescendant` no longer names a removed item.
- `useSyncedRef` stores a new value in an insertion effect instead of during render. Effects, ref callbacks and event handlers of a committed render still read the new value. Code that reads `.current` during render now sees the value of the last committed render, and a render React discards, such as one that suspends, no longer changes it.
- Breaking: `usePreviousDistinct` compares and stores during render, so the render in which the value changes already returns the previous distinct value. It used to compare in an effect after commit, so that render still returned the older answer and the new one appeared a render later. A render that repeats the current value changes nothing, so a Strict Mode double render returns the same value.
- Breaking: a popover or tooltip with an arrow sits further from its trigger by the arrow's reach, its `height` less the popup border it covers (3px for the default arrow over a 1px border). While a `PopoverArrow` or `TooltipArrow` is mounted the side offset is `sideOffset` plus that reach, so the arrow's tip stops `sideOffset` short of the trigger; an arrow taller than the offset used to reach into the trigger. To keep the old position, subtract the reach from `sideOffset`.
- Breaking: `DialogContent` and `DrawerContent` inside an explicit `DialogPortal` or `DrawerPortal` render neither a portal nor an overlay of their own, as in Radix; outside one they still bring both. Composing `XPortal`, `XOverlay` and `XContent` used to nest a second portal and render two backdrops, both kept mounted under `forceMount`. `SheetContent` and `AlertDialogContent` follow, and the portal's `container` now holds the content.
- Breaking: style tokens are layered. `darkraise-ui/styles.css` opens with `@layer theme, base, style.base, style.mode, style.when, style.preset, style.fallback, components, utilities, overrides;`, before its Tailwind import, and the built-in styles write their tokens (`--btn-shadow`, `--chrome-rail-bg`, `--overlay-backdrop` and the rest of the style contract, plus Glass's `--glass-*`) into the `style.*` layers instead of unlayered rules. A rule in `@layer overrides`, `components` or `utilities` that sets one of these tokens on the root element now beats the active style; an unlayered rule still beats every layer. Under `prefers-reduced-transparency: reduce` or `prefers-contrast: more`, a kit rule in `style.fallback` resets the chrome and overlay backdrops, the chrome canvas and the overlay fill layers to their opaque, unblurred values. The style sheets are compiled from definitions at build time; the rendered values are unchanged.
- Breaking: the style is stored under `theme-style` instead of `theme-preset`, which now stores a new `preset` axis (`base`, the style alone, is its only value until a theme config adds presets). A style that 6.x or a 7.0 pre-release left under `theme-preset` moves to `theme-style` on first load, in the pre-render script and in the provider. `<html>` carries `data-preset="base"`, `useTheme()` returns `preset` and `setPreset`, and `AxisValue<"style">` is `string`. The switcher shows no Preset control, and `create-darkraise-ui` leaves the axis out.
- `themeConfig.defaults.preset` sets the preset axis's default and applies only when it names a preset of the default style; otherwise the preset is `base`. Outside production a style name there (the 6.x meaning) warns once that the key now selects a preset and is ignored, and a preset of another style warns once that it belongs to that style.
- The pre-render script resolves the preset after the style and before the other axes, as the provider does, from a table of the config's styles and presets. The token cache id ends with a hash of those definitions (`TOKEN_CACHE_SCHEMA` is now 3), so a token set cached under other definitions is not applied.

### Removed

- The `default` preset name, replaced by the `quiet` style; stored and synced `default` becomes `quiet`.
- The `sidebar-gradient-overlay` and `header-gradient-overlay` classes. Shell regions paint the canvas behind frosted chrome through `--chrome-canvas`.
- The tokens listed in the Breaking note on removed tokens above.
- The `labels.controls` key `"Each preset's own indicator"` (the sidebar indicator's `default` option in 6.x), with the rest of the sidebar indicator's option labels. The Sidebar Selection options are labelled by `labels.theme.sidebarSelections`.
- The Sci-fi preset, its `frame` axis and its stylesheet. The theme switcher and `create-darkraise-ui` no longer offer it.
- `supportedModes` on presets, which only Sci-fi used, and the provider and switcher logic that enforced it.
- The `--shadow-card`, `--card-border` and `--glow-surface` tokens, which no stylesheet read, and `PresetSurfaceRecipe.overrides.shadowCard` on the preset type.
- The `data-sidebar-active-bar` attribute on `<html>`. Read the setting from `useTheme().sidebarSelection`.
- The glass `[data-glass-halo="none"]` rule, which nothing could trigger since the halo axis moved to the global glow axes.
- The `.dr-image-editor-history-trigger` and `.dr-image-editor-extension` rules, which no component rendered.
- The tokens and utility listed in the Breaking note above: `--density-cell`, `--density-cell-base`, `--density-cell-sm`, `--density-cell-lg`, `--density-button-px`, `--density-button-py` and their `-sm` / `-lg` forms, `--density-input-px`, `--density-input-py`, `--radius-button`, and `focus-ring-tight`.
- Breaking: `NavigationMenuViewport`, which rendered an always-hidden element and had no effect; delete it where you render it.

### Fixed

- Glass no longer restyles content controls, so the defects of those rules are gone: under Glass a mouse press never showed the pressed state, a hovered disabled button regained its halo, focused fields lost the primary focus ring, buttons and modals dropped the inner glow, ten components and the sidebar dropped the affordance glow, the outline tabs indicator lost its ring, the vertical underline tab glowed off the wrong edge, and the segment group grew 2px.
- Synced theme payloads are validated: unknown axes, invalid values and preset axes of removed presets (such as `scifi`) are dropped instead of being applied and saved again.
- The pre-hydration `:root` block declares every token the engine emits, including the sidebar text tokens, so the first paint is a complete light theme.
- Menubar content plays its exit animation when it closes.
- `create-darkraise-ui` offers all 18 accents and 12 neutrals; it listed 17 accents and only `slate`.
- `create-darkraise-ui --port` accepts only an integer from 1 to 65535 and exits with an error otherwise. `--port abc` wrote `port: NaN` into the generated `vite.config.ts`, and `--port 0` was ignored.
- A new app's `npm run lint` failed because the scaffold added ESLint but no config. The scaffold now writes an `eslint.config.js` (typescript-eslint, React Hooks and React Refresh rules) and adds the packages it imports. ESLint moves from `^9` to `^10`.
- A multilingual app's language switcher now lives in `src/language-switcher.tsx` and the i18n setup in `src/i18n.ts`, since React Refresh can hot-update only a module whose every export is a component. Both shared `src/i18n.tsx`, which the new lint config rejects.
- Dropdown, context-menu and menubar content and their submenus no longer draw the browser's default focus outline when the menu container takes focus without a prior click, as it does with `defaultOpen`. Focused items keep their own indicator.
- `Clipboard`, `useClipboard` and `JsonTreeView`'s copy buttons failed with "Failed to copy" outside a secure context. `navigator.clipboard` does not exist on plain HTTP, such as a dev server opened by LAN address, so every copy threw. They now go through `writeClipboardText`.
- A scrolling shell region lost its edge under `inset`, `island` and `floating`. Its 1px edge was an inset `box-shadow`, which paints beneath the region's children, so content scrolled toward the edge covered it. Detached regions now draw a real 1px border, which stays above scrolled content. `--shell-region-border` accordingly holds the border colour rather than a shadow.
- The toast action button painted status fills under the brand label (1.92:1 on dark success, 2.52:1 on dark info), and the loading toast painted it on the muted text colour. Each variant now sets its own fill and label pair.
- Sidebar links and triggers, accordion triggers, page-header tabs, the banner close button, toast action and cancel buttons, multi-select, chip remove buttons, the calendar caption, theme swatches, colour-picker swatches, sidebar popover children, top-navigation items, stacked-layout rail items and the JSON tree's show-more button and links had no focus indicator of their own.
- Under the glass preset the slider thumb lost its focus ring; the ring is now an outline.
- The floating-panel drag handle and the virtualized-timeline scrubber showed no focus indicator, the image-cropper selection's permanent ring looked the same focused or not, and a focused JSON tree row showed only a 10% tint. Each now draws the focus ring.
- `--ring` could fall to 1.89:1 on the light page (yellow); it now gets the same 3:1 repair as `--focus-ring`.
- Dialog, sheet and drawer transitioned every property alongside their enter and exit animation, so theme changes animated on open overlays.
- The colours painted before the theme provider hydrates were stale; they now equal the engine's default light output.
- Content inside an elevated `Card` or card accordion item keeps the page's elevation ramp. It used to take the light ramp in dark mode, and in light mode the card's own level (a `flat` card zeroed every nested shadow), because the card reused the theme's `data-elevation` attribute.
- Under the glass preset the switch thumb sat 1px from one edge of its track and 3px from the other.
- AlertDialog buttons sat 16px apart when stacked on mobile; the footer's 8px gap is now the only spacing.
- Under the glass preset the combobox drew two nested borders, and grouped OTP slots drew a 2px seam between each pair.
- Under the glass preset fields never showed the invalid state.
- InputOTP showed no invalid state. `aria-invalid` on `InputOTP` now draws its slots in the destructive colour, with a destructive ring on the active slot, under both presets, and reaches every slot input in the separate variant.
- In forced-colours mode every focus ring was pushed 2px outside its control, so inset rings inside clipping wrappers were cut off.
- Packed toolbar buttons (image-editor tools and annotation kinds, JSON tree toolbar actions) drew focus rings over their neighbours.
- CascadeSelect drew a focus ring on the active path permanently, even under the mouse.
- In light mode the primary mark (`--primary`, `--ring`) of about one theme in five, mostly amber, green, yellow, lime, orange and coral, took the primary edge colour (`--primary-7`), and `--primary-12` took `--primary-11`, so two roles painted the same colour. Each now keeps its own hue and sits just past the step before it.
- The toast countdown bar painted its status edge colour at 60% alpha, about 2.0:1 on the error toast. It now paints the status text colour, opaque, at 3:1 or more on the toast and on its track.
- A detail route such as `/orders/ord-1` keeps its list item active in the sidebar, the stacked layout and the mobile drawer; one row is active per nav.
- The active sidebar row is visible on Glass light, where its fill matched the rail.
- The table footer is opaque, so a sticky footer hides the rows scrolled beneath it.
- Data table pagination wraps on narrow screens instead of pushing its page buttons off-screen.
- Under the floating shell, content clears a collapsed sidebar by the same gutter as an expanded one.
- Breaking: below 768px the layout header hides its own brand mark, the `BrandLogo` that `TopNavLayout` and `SplitPanelLayout` place directly in it, and shows the search trigger as an icon, so the header controls fit a phone. A `BrandLogo` passed in `headerSlot` stays visible.
- Under the floating shell, content drops the rail and panel offsets below 768px, where the rails are hidden.
- A long `Select` value ends in an ellipsis, and the chevron keeps its gap and never shrinks.
- `DateInput` segments show `YYYY`, `MM` and `DD` placeholders in segment order, so its year-month-day, month-day-year and day-month-year forms read differently when empty.
- `Editable`'s edit, submit and cancel controls sit on the value's row.
- `MultiSelect` and `TagsInput` chips separate from the field on card wells in light mode.
- A grouped `Input` (prefix, suffix or actions) shows its invalid edge and ring on the group and fades as one surface when disabled; a disabled `Input` or `Textarea` no longer takes the read-only fill and default cursor.
- `NumberInput` steppers use `--icon-size-sm` icons and `--input` dividers in a 32px column, and no longer overflow the field at compact density.
- Colour picker swatches carry a 3:1 edge, the selected swatch draws a primary ring, and the trigger swatch's border uses `--field-edge`.
- The switch's off thumb takes `--field-edge`, so its position reads against the track; its colour change animates.
- The angle slider's dial has a 3:1 edge on the field fill, and its pointer is a round knob like the slider thumb.
- A vertical `Slider` lays out upright without a className, and a two-thumb range spans exactly between its thumbs.
- An indeterminate `Checkbox` takes the checked fill and draws a minus; `MenubarCheckboxItem`, `ContextMenuCheckboxItem` and `DropdownMenuCheckboxItem` draw a minus for `checked="indeterminate"`.
- A `Badge` icon no longer touches its label, and `Alert` icons are sized with `--icon-size`.
- `Kbd` draws the 3:1 `--field-edge` along its bottom.
- A disabled `Listbox` ignores pointer selection and fades; disabled `Accordion` triggers fade and show the not-allowed cursor; `DateInput` and `NumberInput` fade once at the root; a disabled tag in `TagsInput` fades; `Button asChild` with `disabled` fades, shows the not-allowed cursor and no longer reacts to hover.
- A read-only `Editable` no longer fades and shows the default cursor, like a read-only `Input`.
- Calendar disabled days no longer fade twice, `TimerActionTrigger` fades when `disabled` is passed, and the overlay close button fades when disabled.
- The slider thumb, TreeView rows, Menubar items, RatingGroup items, the ColorPicker area and the Resizable handle show the not-allowed cursor when disabled, and hover no longer paints on disabled CascadeSelect, TreeView and Menubar rows, the FileUpload dropzone and clear trigger, or Timer actions.
- Popups (Popover, Tooltip, HoverCard, menus, Select and the pickers built on Popover) follow their trigger when the page or a container scrolls or the window resizes.
- Dropdown, context and menubar menus, their submenus, Select, Combobox and VirtualizedDropdownMenu lists stop at the edge of the viewport and scroll, instead of running off screen.
- Popups grow from the edge facing their trigger instead of from their centre, and a Select popup is at least as wide as its trigger.
- The Tour popover stays inside the viewport for targets near an edge and flips above a target by its measured height.
- FloatingPanel, the Tour popover and the chart, contribution-graph and timeline tooltips paint the overlay fill, so they follow Glass and the `surface` prop like every other popup.
- Pressing Escape in an open Combobox inside a dialog closes only the Combobox.
- In the theme settings page layout, segmented controls keep a 0.5rem inset around each label, and a column whose label would not fit widens instead of the label filling its cell edge to edge.
- The virtualized timeline rail draws every tick mark in one column at its edge, centred on its date, so unlabelled marks no longer cross the labels; a group header spaces its checkbox, toggle and label 8px apart.
- A vertical `Toolbar` is as wide as its widest item instead of its container.
- A `SegmentGroup` disabled through a disabled `Fieldset` shows the not-allowed cursor.
- Right-to-left layout: the Switch thumb stays in its track, ButtonGroup joins, Input and NumberInput addons, field end slots, menu insets and indicators, alert and banner rails, timeline and calendar text, OTP slots, enclosed and vertical Tabs, the ScrollArea bar, NavigationMenu content, carousel buttons, toasts and the shell rails all use logical sides; breadcrumb, pagination, calendar, carousel, submenu and cascade arrows point the right way; `Select`, `DropdownMenu` and `ContextMenu` honour `dir`; portalled popups take their trigger's direction; the mobile navigation drawer and collapsed-sidebar tooltips open from the inline side.
- Forced-colours mode no longer hides the selected tab, segment, list or tree row, toggle, page, switch state, calendar day or menu row, and no longer erases separators, slider and progress tracks, scroll thumbs and resize handles.
- The BackgroundPage spotlight follows the pointer in a right-to-left document.
- The table's scroll-edge state reads the direction once per mount and resize instead of on every scroll event.
- `Marquee` renders as many copies as it takes to cover its container, so no blank band shows at any point in the loop, and each loop moves exactly one copy and its gap, so it no longer jumps when it restarts. Under right-to-left it travels toward the right; it used to move left and leave the container empty for part of each loop. Every copy after the first is hidden from assistive technology and its links and other controls leave the tab order, so the content is read once and Tab leaves the marquee after the first copy; a link in any copy still follows a click.
- `VirtualizedTimeline` no longer mounts and unmounts its scrubber rail on every frame when the rail's own width narrows the tiles until the content fits; the rail stays out until the content overflows beside it.
- `Frame` passes the host colour scheme as a zero-specificity `:where(:root)` rule in the frame head instead of an inline style on the frame root, so a stylesheet passed through `head` can set its own `color-scheme`.
- A callback ref is called once when the element mounts, including one on an `asChild` child, on menu, popover, tooltip, hover-card and navigation-menu triggers; dropdown, context and menubar items and sub-triggers; the menubar root; `Checkbox`, `Switch`, `AccordionTrigger`, `ToggleGroupItem`, `RadioGroupItem`, `TabsList` and `TabsTrigger`; dialog and drawer content; `SelectItem`, `ComboboxControl`, `ScrollArea` and `ScrollBar`. It used to be called with `null` and then the element again on every re-render, and so were the popups' own positioning refs.
- The `UserMenu` trigger is named by a new `userMenu.trigger` label, "Account menu" by default, instead of the avatar initials.
- In `DropdownMenu`, `ContextMenu` and `Menubar`, ArrowDown and ArrowUp reach sub-triggers, which used to be skipped, and opening a submenu from the keyboard moves focus to its first item instead of leaving it on the sub-trigger. A `Menubar` submenu closes when the pointer moves onto another item of its menu, as the other two menus do.
- Arrow keys, Home, End and typeahead in `DropdownMenu`, `ContextMenu` and `Menubar` pass over a row whose element computes to `display: none`, as they pass over a disabled row.
- `DropdownMenuContent`, `ContextMenuContent`, `MenubarContent`, `SelectContent`, `PopoverContent`, `TooltipContent` and `HoverCardContent` keep their position when given a `style` prop. A consumer style used to replace the inline `position`, `top` and `left`, which detached the popup from its trigger.
- A `ContextMenu` submenu anchors to its sub-trigger, as a `DropdownMenu` submenu does. It used to open at a point read from the row when it opened, so a submenu opened from the keyboard before the menu had settled at the pointer stayed at that stale point.
- `NavigationMenu` panels are positioned like the other popups: below their trigger with a 6px gap, flipping above it and shifting to stay 8px inside the viewport when there is no room, capped to the room left, and following the trigger when the page scrolls or the window resizes. A panel used to hang from its item with `position: absolute`, so one near the inline end of the viewport ran off screen and an ancestor with `overflow: hidden` cut it off. The panel stays inside the nav in the DOM and is placed with `position: fixed`, so a `NavigationMenu` inside an ancestor with `transform`, `filter` or `backdrop-filter` (for example a Glass shell bar) is clipped by that ancestor, which becomes the containing block of fixed descendants.
- `NavigationMenuIndicator` sits under the open trigger in both directions and follows it when the window resizes. It wrote a physical `left` without being positioned, so it never moved.
- `useScrollLock` uses the same scroll lock as `Dialog` and `Drawer`: it pads the body by the scrollbar width, and releasing it no longer lets the page scroll while a dialog or drawer still holds the lock.
- When scroll locks are released in a different order from the one they were taken in, for example a drawer closed before the dialog it opened, the page scrolls again once the last one is released. It used to stay locked.
- The scroll lock of `Dialog`, `Drawer` and `useScrollLock` pads the body on the side the page scrollbar is on, measured when the lock is taken. It always padded the right, so in a browser that puts the scrollbar on the left of a right-to-left page, such as Firefox with `layout.scrollbar.side` set to follow the page, the content shifted by the scrollbar width when a dialog opened.
- The scroll lock finds the page scrollbar's side with a probe in the top layer, so a `transform`, `filter` or `contain` on `<html>` or `<body>` no longer makes it pad the left of a page whose scrollbar is on the right, which moved the content by the scrollbar width when a dialog or drawer opened. Browsers without the popover API still measure under `<body>`.
- A middle-click on a disabled `DropdownMenuItem`, `ContextMenuItem` or `MenubarItem` rendered as a link with `asChild` no longer opens the link; the item's `onAuxClick` still runs.
- The `Combobox` list grows from the edge facing its input, like the other popups; it scaled from its centre.
- `VirtualizedDropdownMenu` announces the highlighted row: the menu points `aria-activedescendant` at it while the row is rendered, so after Home or End it names the row once the list has scrolled to it rather than an id with no element. Its content caps its own height, border and padding included, so the popup stays inside the collision padding; the list used to take all the room left and the border and padding ran past it.
- Under browser zoom, a re-render of the sidebar nav no longer cuts the active row's slide short. The indicator compares the row's position and size as numbers, with half a pixel of tolerance, instead of reading back its inline style, which rounds a fractional pixel to six significant digits.
- A disabled `TreeView` row calls the consumer `onClick` on `TreeViewItem` and `TreeViewBranchControl`, as other disabled kit elements do, and still does not focus, select or expand.
- A read-only `Editable` renders no edit trigger, and its preview is plain text instead of a button that does nothing. A read-only `Editable` that is also disabled keeps its disabled trigger.
- `JsonTreeView` arrow keys work on nested rows: Up and Down moved from the root row and Left collapsed the whole tree, because the focused row was taken to be the first row containing it. Each expanded row's children carry `role="group"`, and the focused toolbar keeps its dark-mode lift under the focus ring.
- A `ResizableHandle` without a grip between panels that fill their group no longer shrinks to 0px, so its divider paints.
- `VirtualizedTimeline` tiles and list rows draw the focus ring inside their box, where the list's clipping cannot cut it off, and take `touch-action: manipulation`.
- `VirtualizedTimeline` places a `start` or `end` scrubber by the current direction, so a locale switch after mount moves the rail to the other side. `data-scrubber-side` carries the `scrubberSide` value as given instead of the side resolved at mount.
- `DateInput` moves to the next segment when one is full, so a whole date can be typed without Tab, and Backspace removes one digit; it moves back to the previous segment only from an empty one.
- `QrCode` treats a `margin` of `NaN` or `Infinity` as the default four-module quiet zone instead of breaking its viewBox.
- With `syncDocument`, `AppI18nProvider` leaves `<html dir>` as it found it for a locale pack without `dir`, instead of writing `ltr`, so such a pack inherits the page direction.
- Forced colours: a focused checked `SegmentGroup` item rings in HighlightText, as a focused pressed toggle does, instead of Highlight on its Highlight indicator; the field inside a checked choice card takes the row's HighlightText even when invalid; and the `InputOtp` fake caret carries `dr-input-otp-caret`, which the forced-colours rule now targets instead of a Tailwind animation class.
- Enclosed tabs inside an elevated dark card paint the card's lift (`--card-lift-tint`) over their opaque fill, so the active tab and its panel match the card instead of reading as a recessed panel.
- `JsonTreeView` string values, URLs included, wrap inside a narrow tree instead of pushing the row copy actions past its edge.
- Hover styles apply only on devices that can hover: every hover rule in the kit, including those the stylesheet wrote as `hover:` utilities in `@apply`, sits inside `@media (hover: hover)`. A touch screen keeps `:hover` on the last tapped element, so a tapped control kept its hover wash until the next tap; it now returns to rest. The keyboard ring on `Command`, `Combobox`, `Listbox` and `VirtualizedDropdownMenu` rows is no longer dropped on the last tapped row. Controls revealed on hover (the toast close button, `JsonTreeView` row actions and copy button, the collapsed sidebar's expand toggle) show at rest on a device without hover, and a `Marquee` with `pauseOnHover` does not pause on a tap.
- `PopoverArrow` keeps its position when given a `style`: the consumer style is merged under the arrow's `position`, `left` and `top` instead of replacing them, so the arrow no longer drops into the content's flow.
- `TooltipArrow` is placed by the tooltip's arrow middleware, as `PopoverArrow` is: it is absolutely positioned at the offset the middleware computes, and the tooltip scales from it, instead of sitting in the content's flow. A consumer `style` does not replace that position.
- `PopoverArrow` and `TooltipArrow` sit outside the content box, on the edge that faces the trigger, and point at the trigger on every side; they used to sit inside the box and always point down. The tooltip's text is wrapped in `.dr-tooltip-body`, which clips overflow instead of the content box, so the arrow is no longer cut off.
- The root `ContextMenu` is first shown at the pointer. It used to mount at the viewport origin and move to the pointer a few milliseconds later, so a pointer resting there could hover its rows; it now stays hidden until positioned and takes focus once shown.
- `Tour` shows its popover where it settles when it first opens. It used to be inserted at the viewport origin and move beside its target a few milliseconds later; it now stays hidden until first positioned and takes focus once shown.
- A `UserMenu` given `user` and `layoutSwitcher` but no `onProfile`, `onSettings` or `onLogout` hides the separator under the name and email together with the Layout entry at 48rem and wider, instead of ending the menu with a lone separator.
- `Pagination` wraps onto centred rows when its links do not fit the width, instead of running past both edges of a narrow screen (`.dr-pagination-content` is `flex-wrap` and `justify-center`; rows keep the 0.25rem gap).
- A `ThemeProvider` whose parent re-renders it with an inline `config` equal to the previous one keeps the same context value, so `useTheme` consumers no longer re-render with it.
- A `ContextMenu` opened through `open` or `defaultOpen` sits below its trigger, aligned to its start edge, and stays hidden until it is placed. It used to open at the pointer of the last right-click, or at the viewport origin when there had been none; the menu now forgets the pointer when it closes.
- `CommandInput` keeps a callback `ref` attached across renders while the callback stays the same; it used to detach it with `null` and attach it again on every render.
- `DateInput` no longer loops when a typed digit and the echo of its previous commit land in one render. Its segments and its value synced through two effects that swapped each other's state, so fast typing logged `Maximum update depth exceeded` and could commit the wrong year (`0202` for `2026`). Edits now commit from the input handlers.
- `DropdownMenuContent`, `ContextMenuContent` and `MenubarContent` honour `loop`: with `loop={false}` the arrow keys stop at the first and last item instead of wrapping, and the prop no longer lands on the content element as a `loop` attribute.
- `DropdownMenuPortal`, `ContextMenuPortal` and `MenubarPortal` honour `forceMount`: it is the default for the content inside the portal, so a closed menu's content stays mounted with `data-state="closed"`. A content's own `forceMount` still wins, and a submenu does not inherit its parent menu's portal value.
- `PopoverPortal`, `DialogPortal` and `DrawerPortal` honour `forceMount` the same way, and so do `SheetPortal` and `AlertDialogPortal`, which are `DialogPortal`. Under a forcing `DialogPortal` or `DrawerPortal`, a `DialogOverlay` or `DrawerOverlay` without its own `forceMount` stays mounted too. A popover, dialog or drawer nested inside the forced content does not inherit the value.
- `Command`'s arrow keys, Home and End skip disabled items and move nothing when every item is disabled, and Enter does nothing while the active item is disabled; they used to land on disabled items, and Enter ran the item's `onClick`. `Command` reads `loop` (default `true`): `false` stops the arrows at the first and last enabled item. `loop` used to reach the root `div` as an attribute and changed nothing.
- `Command` and `CommandItem` keep a callback `ref` attached across renders while the callback stays the same; they used to detach it with `null` and attach it again on every render.
- A consumer `onPointerEnter` on `ListboxItem` runs, and hovering still focuses the item unless the handler calls `preventDefault()`; the consumer's handler used to replace the item's own, so hovering stopped focusing it.
- `Tour` reopened at another step stays hidden until it is placed beside the new target. It used to show for a frame at the position it had when it closed.
- `Tour` keeps Tab and Shift+Tab inside its popover, wrapping from the last control to the first and back. Its focus trap used to start before the popover was mounted, so it never trapped.
- `useFocusTrap` and `FocusTrap` send Shift+Tab to the last tabbable while the container itself has focus, as it does when it is the trap's `initialFocus`; it used to leave the trap.
- `PopoverArrow` and `TooltipArrow` fill with the popup's base colour (`--surface-overlay-base`) and stroke their two outer edges with its border colour (`--overlay-border`), so the popup's border runs on around the arrow. In dark mode the arrow also takes the popup's tonal lift (`--elevation-lift-tint-medium`). They used to fill with the popup's text colour. A `fill` or `className` on the arrow still wins, and under forced colours the arrow fills with `Canvas` and strokes with `CanvasText`.
- A `ContextMenu` reopened while its content is still mounted, during its exit animation or under `forceMount`, stays hidden until it is placed at the new pointer, and one opened through `open` after a right-click sits at its trigger. It used to show for a frame at the previous pointer, or stay there.
- `Command` moves the active item to the first enabled visible item when the active one becomes disabled, and to none when every item is disabled. It used to stay on the disabled item until the item was filtered out.
- `useListbox` clears its pending typeahead timer when it unmounts, as the menu hooks do.
- A `Tour` that moves from a step without a target onto one with a target keeps its popover shown, centred, until the new target is measured, so focus stays in the popover. It used to hide the popover for that moment, which turned its focus trap off and sent focus back to the opener.

Breaking: `.dr-surface`, its `--flat` modifier and its `dr-surface-{brand,cyan,success,warning,danger,info}` hue classes are removed, with the `--fog-05` … `--fog-50` tokens they alone gave values to. The `glass`, `glass-thin`, `glass-strong` and `card-surface` utilities are removed: outside `.dr-surface` they painted nothing. Replace one with `rounded-[var(--radius)]` and, if you relied on it, `transition-[background-color,color,border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-in-out)]`.

Breaking: `TooltipContent` wraps its children in a `<div class="dr-tooltip-body">`, so a layout class passed to `TooltipContent` (for example `flex items-center gap-1`) now lays out that single wrapper instead of the children. Put layout classes on an element inside `TooltipContent`; padding, width and colour classes still apply on `TooltipContent`.

Breaking: `.overlay-surface` is now a utility that applies the overlay recipe (`background: var(--overlay-bg)`, its blend mode, `border-color: var(--overlay-border)` and the overlay backdrop filter). It no longer sets a border width, radius or shadow. Every kit popup applies it.

Breaking: the `collapsible-down` and `collapsible-up` keyframes are removed; use Collapsible, whose `dr-collapsible-*` animation reads `--collapsible-content-height`.

In dark mode each elevation level now lightens its surface as well as shadowing it: `--elevation-lift-low`, `--elevation-lift-medium` and `--elevation-lift-high` hold the step and lead every dark `--elevation-*` and `--card-elevation-*` value, and popups lift by the medium step. Fields and other `--field-edge` marks inside an elevated card or a popup take `--field-edge-lifted` (from the new engine token `--field-edge-lifted-color`), a neutral step solved to 3:1 against the brightest lifted card or muted face (a brighter face under Glass, whose overlays paint fog over a translucent fill); in light mode it equals `--field-edge-color`. The image editor's panels and toolbars and the JSON tree view's toolbar, which take the low lift, do the same. `--elevation-lift-tint-{low,medium,high}` hold each lift's overlay colour, and an elevated card exposes its own as `--card-lift-tint`, which the timeline's sticky bucket header paints over its opaque fill so it matches the card. Status toasts drop the lift and draw `--shadow-dropdown` with the outer and inner glows instead of `--overlay-shadow`, so under Glass they also lose its deeper shadow, inset highlight and tint glow: their edge and text colours are solved on the bare status fill.

Tactile gives surfaces a material: cards take a raised edge (a lit top edge and sheen in dark) and the default and outline tab tracks and the segment group recess. New tokens `--card-edge`, `--card-sheen` and `--track-well` are no-ops in the other styles. Dark Tactile buttons, fields and selected segments have stronger edges.

Glass light chrome shows an accent-tinted canvas through lighter fog at rest.

The root declares `color-scheme` per mode, so native scrollbars, date pickers and form controls follow dark mode; the date and password-reveal indicators no longer invert. Frame passes the host's colour scheme into its document.

The neutral accent swatch shows near-white in dark mode, as the accent renders, with the title "Neutral (near-white)"; the active swatch takes a ring outside its edge.

Fixed: the virtualized timeline's sticky header is opaque and follows the page or card it sits in (`--timeline-header-bg`); toast action buttons hover toward their fill's wash, so a dark label keeps its contrast; sidebar groups animate open and closed.

## [6.9.6] — 2026-09-30

## [6.9.5] — 2026-09-25

### Fixed

- A dialog, sheet, popover, dropdown menu or select that moves focus no longer opens a tooltip or hover card on the element it lands on. After an Escape the browser counts that move as keyboard focus, so closing a dialog handed focus back to its trigger with the trigger's tooltip open, and the next Escape closed only the tooltip — closing a sheet under a dialog took three presses. The overlays now move focus with `focusProgrammatically`, exported for app code that restores focus itself, and `TooltipTrigger` and `HoverCardTrigger` ignore focus moved that way. Tabbing to a trigger still opens its tooltip.

## [6.9.4] — 2026-09-24

### Fixed

- Escape with a `HoverCard` open inside a `Dialog` or `Sheet` closes only the card. The card closed on its own document `keydown` listener and never joined the dismissable-layer stack, so the dialog around it still counted itself as the top layer and one Escape closed both. `HoverCardContent` is now a `DismissableLayer`, active while the card is open, as `TooltipContent` became in 6.9.3.
- A horizontal or responsive `Field` nudges only its own checkbox or radio down a pixel. The rule was written `[&>[role=checkbox],[role=radio]]`, whose second branch compiled to a descendant selector, so every radio anywhere inside the Field — one in its description block, say — got the nudge too.

## [6.9.3] — 2026-09-24

### Fixed

- A `Switch` inside a vertical or responsive `Field` keeps its size. The Field's width reset on its children (`.dr-field[data-orientation=…] > *`) outranked `.dr-switch`, so a responsive group at `@md` collapsed the track to a 20×20 dot with the thumb spilling out, and a vertical field stretched it across the row. A `Checkbox` lost its size the same way, since its size rule ties on specificity and `field.css` loads after it. The reset now skips `[role=switch]`, `[role=checkbox]` and `[role=radio]`, which size themselves.
- Escape with a `Tooltip` open inside a `Dialog` or `Sheet` closes only the tooltip. The tooltip closed on its own document `keydown` listener and never joined the layer stack, so the dialog underneath still counted itself as topmost and answered the same key. `TooltipContent` is now a `DismissableLayer`, active while the tooltip is open; the next Escape reaches the dialog, and with no tooltip open the first one does.

## [6.9.2] — 2026-09-23

### Fixed

- A layer that is closing no longer swallows Escape. Content stays mounted through its exit animation, and since 6.9.1 a nested layer blocks its parent, so an Escape pressed in that window — closing a dialog and then the sheet under it in quick succession — went to the dialog already on its way out and did nothing. `DismissableLayer` takes an `active` prop, which every overlay passes its open state to; an inactive layer neither answers Escape nor blocks the layer beneath it.

## [6.9.1] — 2026-09-23

### Fixed

- One Escape no longer closes two layers when the upper one is portalled out of the lower one — a `Dialog` opened from inside a `Sheet`, for example. `DismissableLayer` decided the topmost layer by DOM containment, and a portalled layer is never inside its parent's node, so both answered the key. Each layer now carries its ancestor chain through React context, which crosses portals, and is topmost while no other open layer renders inside it.

## [6.9.0] — 2026-09-08

### Added

- Add controlled locale providers, English/Vietnamese packs, partial consumer
  overrides, custom language registration, and shared Intl formatters.
- Add an optional isolated i18next adapter and a controlled LocaleSwitcher.
- Localize component controls, accessible text, image tools, theme options,
  calendars, and numeric/date displays while retaining no-provider behavior.
- Connect the demo and opt-in starter to shared language preferences.
- Add an optional notification slot across all four layout shells.
- Add optional locale option icons in the trigger and dropdown, with reusable
  US/Vietnam SVG flags and custom SVG/image support.

## [6.8.2] — 2026-09-07

### Deprecated

- `Calendar`'s `components` prop is deprecated and will be removed in 7.0.0. It has never been read — it is typed `unknown`, is not destructured, and the component takes no rest spread, so passing it has no effect of any kind. Typed but undocumented, it read in an editor as the escape hatch for replacing the calendar's chrome — which meant the hardcoded English navigation labels had no override path at all. That gap is closed by the `calendar` and `datePicker` label groups added in 6.8.1, so the prop now has nothing left to offer and is removed rather than wired.

## [6.8.1] — 2026-09-07

## [6.8.0] — 2026-09-04

## [6.7.0] — 2026-08-28

## [6.6.0] — 2026-08-27

## [6.5.0] — 2026-08-26

### Added

- All twelve neutral surface ramps are selectable. `SURFACE_COLORS` previously exposed `slate` plus the seventeen accents, leaving `gray`, `cool`, `zinc`, `neutral`, `iron`, `mauve`, `graphite`, `stone`, `sand`, `olive` and `sepia` built and registered but unreachable. Widening the constant alone was not enough: `resolveSurfaceScale`, `resolveSfHueTokens`, `--surface-tint` and the switcher's swatch preview each hardcoded `slate` as the only neutral and sent every other name to `accentColors`, where the new ramps do not exist. Each now dispatches on whether the name is a registered ramp.
- `resolveNeutralScale` and `isAccentSurface` are exported from the theme engine. The first is the scale the text tiers and borders are measured against — a chosen neutral now carries its own hue there, so a warm ground is not paired with slate-derived text. The second is the predicate the accent branches narrow with.
- A `coral` accent, `hsl(12, 75%, 59%)` at its mid-tone. It sits between `red` at hue 0 and `orange` at hue 25 and matched neither, so a consumer wanting it had to override `--ring`, `--focus-ring`, the destructive branch and the three `--primary*` tokens before touching the chart ramp. Lightness follows red's profile; saturation is red's scaled so the mid-tone lands on the brand value rather than the two-scale midpoint, which at 89% reads as a signal colour.
- `--legend`, a third text tier below `--muted-foreground`, for column heads, captions and unit suffixes. Two tiers forced a caption either to compete with body text or to fail its contrast floor.
- `DataTable` gains `facets` and `virtualize`, both opt-in and both defaulting off, so a table that does not pass them renders the markup it did on 6.4.0. `facets` takes column ids and renders a multi-select value filter per column, with each distinct value and its count; selecting two values within one facet is a union. `virtualize` takes `{ rowHeight, height, overscan? }` and windows the list instead of paginating it, keeping `aria-rowcount` at the full length and giving each mounted row its true `aria-rowindex`. Row height is declared rather than measured, because every row in this kit is one `density` cell tall and a declared height keeps the arithmetic deterministic.
- `DataTableFacet` and the `DataTableVirtualization` type are exported, and `labels.dataTable.filterBy(column)` names the facet control.

### Changed

- Selecting one of the eleven newly exposed ramps changes `--foreground`, `--muted-foreground` and `--card-foreground` to that ramp's neutrals rather than slate's. No existing consumer is affected: `slate` and every accent surface resolve exactly as before, which the palette suite pins.
- `ACCENT_COLORS` gains an eighteenth entry, inserted after `red` to keep the swatch grid hue-ordered. `resolveSfHueTokens` picks a gradient's second hue by stepping three places along that list and wrapping, so an accent surface under `backgroundStyle: "gradient"` may resolve a different `--sf-hue-2` than it did on 6.4.0. Only the decorative gradient hue moves; no semantic token does.
- **The text tiers are computed against the page background instead of snapped to ramp steps, which moves `--muted-foreground` for every consumer.** The steps are too coarse to carry three tiers: across the twelve neutral ramps, light step 500 measures 4.31:1 and step 600 measures 6.61:1, so nothing could sit below 500 and still clear the 4.5:1 AA floor. Snapping also left `--muted-foreground` itself _under_ AA on the warmer ramps — worst case 4.31:1 in light. Each tier is now the quietest value on the ramp's hue that clears its target: `--muted-foreground` at 7:1, `--legend` at 4.6:1. Measured on slate, light `--muted-foreground` moves from `215 16% 47%` (4.51:1) to `215 16% 35%` (7.03:1), so muted text renders darker in light mode. Worst case across all twelve ramps is now 7.00:1 for muted and 4.64:1 for legend, in both modes.
- `--sidebar-foreground-muted` is now exactly `--muted-foreground` rather than a parallel pair of ramp steps, and moves with it.

### Fixed

- Four light-mode values that could not be seen against the page are raised to their floor. Measured before: `--focus-ring` 1.28–1.58:1, `--success` (emerald-500) 2.48:1 and `--warning` (amber-500) 2.03:1, all against a 3:1 requirement for a mark; `--destructive` under 4.5:1 as text, which is how it labels the action it describes. `--primary` is a fifth — at sky it measured 2.74:1, and `dist/styles.css` documents that form controls take their focus indicator from `--primary` rather than `--focus-ring`, so every text field, select and textarea in every consuming app had a sub-3:1 focus ring in light mode.
- Each is repaired by moving to the nearest lightness on its own hue that clears the floor, so a value that already passed keeps its exact place on the accent ladder. Dark mode is covered by the same sweep and was already clean.
- `DropdownMenuCheckboxItem` no longer cancels the toggle when `onSelect` prevents default. Preventing default is how a caller stops the menu dismissing, which is exactly what a multi-select list needs; coupling it to whether the item was chosen made such an item impossible to check. `ColumnVisibility` gets the same benefit.

### Known limitations

- **Button labels are held to 3:1, not 4.5:1.** `pickForeground` picks white or ink for a `--primary-fill` label against `FOREGROUND_MIN_RATIO = 3`, and 77 accent/intensity/mode combinations sit under AA. Worst case per step, measured across all eighteen accents:

  | Step     | Light | Dark     |
  | -------- | ----- | -------- |
  | calm     | 3.29  | **4.75** |
  | balanced | 3.29  | 4.10     |
  | vivid    | 3.29  | 3.59     |
  | intense  | 3.29  | 3.18     |

  `dark` + `calm` is the only combination that clears AA, which is why a consumer needing accessible button labels should pin it. The floor is deliberately not raised here: doing so makes the label flip to ink on many accents, which the `VIBRANCY` notes call out as making label colour vary by accent, and it requires moving fills off the pinned OKLCH lightness ladder, which would make light mode vary across an axis documented as dark-mode-only. That is a design decision rather than a contrast repair, and it is left for a major.

## [6.4.0] — 2026-08-21

## [6.3.0] — 2026-08-20

## [6.2.0] — 2026-08-18

## [6.1.0] — 2026-08-18

## [6.0.0] — 2026-08-14

Breaking: `SidebarNav` rebuilds the markup of an item that has `children`, and two of its class names are gone. The expanded row is now a `.dr-sidebar-nav-collapsible-row` wrapping a `.dr-sidebar-nav-link` and a separate `.dr-sidebar-nav-chevron-button`, in place of the single full-row trigger, so `.dr-sidebar-nav-collapsible-trigger` no longer exists. The `Collapsible` around them carries `.dr-sidebar-nav-collapsible`, which spaces the row from its children by the same step that separates any two rows. In the collapsed popover the `<p class="dr-sidebar-nav-popover-label">` heading is replaced by a link carrying `.dr-sidebar-popover-child.dr-sidebar-nav-popover-parent`, followed by a `.dr-sidebar-nav-popover-separator`. `.dr-sidebar-nav-item` moves onto the row itself, so the hover fill and the active indicator span the toggle rather than stopping at the link, and the link and the chevron paint no background of their own. Because `activeClassName` can only land on the anchor, the row's active state is resolved from the current path and published as `data-status="active"` — the same mechanism `StackedLayout`'s rail already uses. Consumers styling either removed class must retarget; presets are unaffected, since they key off `.dr-sidebar-nav-item`, which the row carries. A parent whose `href` was a placeholder such as `"#"` now renders a live link to it — `href` has always been required on `NavItem`, and every other layout already navigates to a parent's own href.

### Changed

- `SidebarNav` parent items are navigable. Expanded, the row pairs a link to the item's own `href` with a separate chevron button that owns the toggle; collapsed, the rail item's popover opens with a link to the parent's route ahead of its children. Previously the whole expanded row was the collapsible trigger and the collapsed popover listed only children under a static heading, so a parent's own route could not be reached in either state. The same fix reaches `StackedLayout`, which renders `SidebarItem` for its sub-navigation.
- `SidebarNav` parent groups follow the route instead of all mounting expanded. A group opens when the current path is its own or any descendant's — matched exactly or on a path-segment boundary, so `/settings` never claims `/settings-old` — and it opens again if navigation later moves into it. It never closes on its own: a group the user collapsed by hand stays collapsed when the route leaves it. A sidebar of five parents therefore boots showing only the one you are in, where every group used to start open regardless of where you were.
- Nested `SidebarNav` items are the same size as every other row. They previously shrank to `text-xs` with tighter vertical padding, so a child sat visibly smaller than its parent; indentation alone now marks the level. `data-depth="nested"` stays on the element for consumers who want to restore a size difference.
- `StackedLayout` picks its active rail group by walking each item's children as well as the item itself, so a group whose match is a nested child now highlights rather than leaving the rail blank.

### Fixed

- Nested nav items were invisible to the command palette. Every layout built `SearchCommand`'s list with `nav.flatMap((g) => g.items.map(…))`, which stops at the top level, so giving an item `children` removed those children from search — nesting a page and hiding it from ⌘K were the same act. `SidebarLayout`, `LayoutHeader`, `TopNavLayout`, and `SplitPanelLayout` now share a `flattenNavItems` walk of the whole tree, de-duplicated by `href` so a section parent pointing at its own index child yields one row rather than two under the same React key.
- A collapsed `SidebarNav` parent item had no accessible name. Its rail trigger was a `<button>` containing only an icon — no text, no `aria-label`, and unlike leaf items no tooltip — leaving screen-reader users with an unlabelled button. It now takes the item's label as its accessible name. The expanded chevron toggle is named the same way rather than "Expand"/"Collapse", since it also labels the submenu region and a state-varying name would rename that region on every toggle; `aria-expanded` carries the state.
- A collapsed `SidebarNav` parent item never showed as active. Its rail icon stands in for the whole group, but nothing marked it when one of its children was the current page, so the collapsed rail could show no active item at all. It now carries `data-status="active"` whenever it or a descendant covers the route, picking up the same indicator every other item uses.
- A `SidebarNav` parent item silently dropped its `badge`, and its label was a bare `<span>` without `.dr-sidebar-nav-label`, so it neither truncated nor flexed like every leaf label.

## [5.0.0] — 2026-08-14

Breaking: `ThemeConfig` gains two required properties, `defaults.fontSize` and `switcher.axes.fontSize`, matching the other eleven axes. Consumers passing their own `config` object must add both before upgrading:

```ts
defaults: { …, fontSize: "medium" },
switcher: { axes: { …, fontSize: true } },
```

Once added, the new `fontSize: "medium"` default renders exactly as before.

Breaking: `ThemeConfig` gains two required properties, `defaults.accentVibrancy` and `switcher.axes.accentVibrancy`, matching the other twelve axes. `GenerateTokensInput` gains a required `accentVibrancy` field as well, so a consumer calling `generateTokens` directly must also supply it. Consumers passing their own `config` object or calling `generateTokens` must add the field before upgrading:

```ts
defaults: { …, accentVibrancy: "balanced" },
switcher: { axes: { …, accentVibrancy: true } },
```

Once added, the new `accentVibrancy: "balanced"` default renders exactly as before. The axis controls how loud the brand accent renders in dark mode only — light mode ignores it entirely — with four steps (`calm`, `balanced`, `vivid`, `intense`) driving `--primary-fill`'s lightness and chroma cap and `--primary`'s chroma cap. At the default `balanced` step, filled-control labels (`--primary-foreground` on `--primary-fill`) measure roughly 4.10:1 contrast, below WCAG AA's 4.5:1 floor for normal text. This is a deliberate, accepted trade-off rather than a defect: selecting `calm` restores AA-clean labels (4.70:1). `ACCENT_VIBRANCIES` and the `AccentVibrancy` type are intentionally not re-exported from the theme barrel, consistent with `FONT_SIZES`.

Breaking: `UiLabels` gains a required `passwordInput` group. Consumers passing a `DeepPartialLabels<UiLabels>` to `UiLabelsProvider` — the documented usage — are unaffected, and so is anyone spreading `defaultLabels`. Only code that declares a complete `UiLabels` object by hand must add the group before upgrading:

```ts
passwordInput: {
  show: "Show password",
  hide: "Hide password",
  visible: "Password visible",
  hidden: "Password hidden",
},
```

Once added, the defaults render exactly the strings the component hardcoded before.

### Added

- `passwordInput` labels group covering `PasswordInputVisibilityTrigger`'s accessible name (`show` / `hide`) and its `aria-live` status announcement (`visible` / `hidden`). An explicit `aria-label` on the trigger still wins over the label, so per-instance overrides are unchanged.
- `fontSize` theme axis with `small`, `medium`, `large`, and `extra-large` steps, defaulting to `medium`. Re-binds Tailwind's `--text-*` scale — body sizes take the full multiplier, display sizes a damped one — while line heights are untouched, since Tailwind already declares them as unitless ratios that scale on their own.
- Icon-size token ladder (`--icon-size-2xs` through `--icon-size-3xl`), derived from `--icon-scale`, that every library-owned SVG glyph now reads so icons stay visually matched to the text beside them. Glyphs bound by fixed control geometry — the Checkbox check, the RadioGroup dot, menu-item indicators — deliberately stay pinned, since their containers don't grow.
- Minimum control heights that grow at the two larger `fontSize` steps via a base/derived split (`--density-cell-base` × `--control-scale`), letting the density and font-size axes compose instead of overwriting each other.
- `ThemeSwitcher` font-size control, first-paint restoration in the template app, and `create-app --font-size` scaffolding support.
- `Timeline` compound component: vertical event rail with `complete`, `current`, and `upcoming` statuses, solid or dashed connectors, an opposite-side timestamp slot, and an alternating variant that collapses to a single rail below 640px.
- `ContributionGraph`: GitHub-style calendar heatmap with configurable date range, week start, and intensity thresholds. Ships month and weekday labels (crowded labels suppressed), a legend, a shared hover tooltip, click handling, and arrow-key navigation. Intensity colours derive from `--primary`, so the ramp follows the accent colour and every preset. Any non-zero value lands on at least level 1, so a single contribution never renders as empty.
- `ContributionGraph` gains a `size` prop (`sm`, `md`, `lg`; default `md`, which is the previous geometry) and a `variant` prop (`default` plus the seventeen fixed accent hues; default `default`, which keeps following `--primary`). The four intensity levels are now oklab mixes of a single `--contrib-base` variable, so a hue swap is one declaration, and level zero stays neutral on `--muted` for every hue. Cells also outline on hover via the overridable `--contrib-cell-outline` variable, inset so nothing shifts.
- `AccentHue` and `ACCENT_HUES` are exported from the package root and `darkraise-ui/lib`. `BadgeAccentVariant` is now an alias of `AccentHue`; the type is unchanged for consumers.
- `VirtualizedTimeline`: date-bucketed scroller for collections too large to render. Bucket heights derive from declared item counts rather than measurement, so the scrollbar and the scrubber are exact as soon as the container is measured; item sizes are never measured at all, so content arriving later shifts nothing and the scrollbar never jumps as buckets load. Windows both buckets and the rows inside them; loads items lazily per bucket with in-flight de-duplication, skeletons in final positions, retry on failure, and least-recently-seen eviction. Ships a draggable, keyboard-operable scrubber, sticky bucket headers, item and whole-bucket selection with shift-ranges, collapsible buckets, roving-tabindex keyboard navigation, an optional jump-to-date control, and a `scrollToDate` / `scrollToBucket` / `getVisibleBucketIds` imperative handle. A `renderBucket` plus `getBucketHeight` pair is the escape hatch for bucket bodies that are not tile grids. The jump-to-date control is off by default and unmounted while off, but its `DatePicker` and `Calendar` weight is imported statically all the same — deliberately, because lazy-loading it would hang a Suspense boundary and a loading state on a toolbar control. A consumer who needs that weight gone should mount the exported `VirtualizedTimelineJumpToDate` themselves instead of expecting the timeline to defer it. The scrubber is a date index rather than a scrollbar: year and month tick marks with labels that thin themselves to the space available, a caret marking the current position with a bracket showing how much of the collection is on screen, a bubble naming the date under the pointer while hovering or dragging, and a `scrubberSide` prop putting the rail on either edge. The rail is a sibling of the scroll viewport rather than an overlay, so it cannot cover content.
- `Tabs` animates the selection. The active-state chrome for every variant now lives on a single sliding indicator inside `TabsList` instead of being painted on the active trigger, so changing tabs eases the fill, ring, underline, or folder tab into place over 200ms rather than repainting two triggers — the same treatment `SegmentGroup` already had. The indicator is rendered by `TabsList` itself and marked `aria-hidden`, so no markup changes are needed, though it does add one element as the strip's first child. Presets travel with it: Glass keeps its gradient and halo, Neon its outlined translucent fill and glow, Sci-fi its notched clip, and Playful its bounce easing and 4% pop. Enclosed keeps its notch while sliding, because the indicator carries the opaque fill that erases the strip's baseline.
- `Tabs` supports `orientation="vertical"` for real. The orientation previously existed only in the type union and styled nothing, so a vertical tab strip meant wrapping the list and the panels in your own flex container and hand-writing `flex-col`, widths, and alignment onto `TabsList` and every `TabsTrigger`. The root now carries a `dr-tabs` class alongside `data-variant` and `data-color`, and becomes the row container itself, so the markup is identical in both orientations. All four variants are styled vertically: `underline` moves its rule to the list's right edge, and `enclosed` becomes a left-edge folder — the baseline runs down the list's right side, the active tab erases it across its own height, and the panel's left edge is that same line, so the two read as one surface. `enclosed` vertical honours `color="accent"` on the same three borders as its horizontal counterpart. Vertical keyboard navigation (arrow up and down) already worked and is unchanged.
- `VirtualizedTimeline` gains a `layout` prop (`grid`, the previous and default behaviour, or `list`) and a `rowHeight` prop. List layout renders full-width rows with listbox semantics — `role="listbox"` with `role="option"` children carrying `aria-setsize` and `aria-posinset` — virtualized by the same windowing as the tile grid, so selection, collapse, lazy loading, the scrubber, and the roving tab stop all work unchanged. Arrow left and right are inert in a list, since one column makes them duplicate arrow up and down. `minTileWidth` and `tileAspect` are ignored in list layout and warn in development; `gap` defaults to 0 there rather than 4.
- `--text-2xs` type step (9/10/11/12px across the `fontSize` axis) for micro-labels below Tailwind's `xs`. Badge `sm`, Kbd `sm`, the notification count, timeline ticks, and the JSON tree's "show more" previously used a literal `text-[10px]` and froze at that size regardless of the axis. There is no `text-2xs` utility — consume it as `text-[length:var(--text-2xs)]`, or `font-size: var(--text-2xs)` in plain CSS.
- `Listbox` gains `variant` (`filled`, the default and previous behaviour, or `outline`). `outline` marks selection with a 1px primary ring instead of a solid fill; the ring is an inset shadow, so both variants occupy the same box and switching between them shifts no layout. Glass keeps its halo but drops its frosted selected fill; under Sci-fi the preset's active glow stands in for the ring.
- `SidebarNav`'s `activeBar` prop widens from `boolean` to `boolean | "bar" | "ring" | "both"`. `"both"` renders the 1px ring and the 3px left rail together, previously impossible because the indicator was a single `box-shadow` and the two looks were competing values of it. Omitting the prop now means "this preset's own indicator" and is no longer equivalent to `true`: an omitted prop renders exactly what each preset rendered before — Glass a ring plus a rail, Sci-fi a ring, everything else a rail. Explicit `true` and `false` now force a look on every preset, where previously Glass and Sci-fi ignored them: `true` maps to `"bar"` (rail only) and `false` to `"ring"` (ring only). Under Glass, code that passes `activeBar={true}` explicitly therefore renders a rail alone where it used to render a ring plus a rail — intended, since it is what makes the prop mean the same thing everywhere, but worth knowing before upgrading.
- `SidebarLayout` gains `showActiveBarToggle` (default `false`), rendering a header toggle for the above.
- `LayoutHeader` gains `showSearch` (default `true`). `SidebarLayout` now sets it `false` and hosts `SearchCommand` at the top of its rail instead; `TopNavLayout`, `StackedLayout`, and `SplitPanelLayout` keep search in the header.
- `SearchCommand` gains `collapsed` (default `false`), rendering as an icon-only square sized to match the collapsed rail's nav icons.
- `ChartContainer` gains `initialDimension`, the size `ResponsiveContainer` assumes for the single render before its `ResizeObserver` fires. Defaults to 320×180, matching the `aspect-video` on `.dr-chart`.
- `accentVibrancy` theme axis with `calm`, `balanced`, `vivid`, and `intense` steps, defaulting to `balanced`. Governs how loud the brand accent renders in dark mode only — light mode is unaffected — by capping `--primary-fill`'s OKLCH lightness and chroma and `--primary`'s chroma. `ThemeSwitcher` accent-vibrancy control, `create-app --accent-vibrancy` scaffolding support. Unlike every other axis, it is verified by token value rather than a `data-*` attribute, since it has none to set.

### Changed

- `--icon-size` and its ladder now run 16/18/20/22px across the `fontSize` axis, one step up from the previous 14/16/18/20. The glyphs that were pinned to literals — menu, select and combobox indicators, tree and JSON chevrons, chip-remove buttons, the resize grip, the spinner, and the sidebar nav icon — now read the tokens too, so the axis reaches them.
- Sci-fi's button and badge chrome is scoped per variant. It was previously unscoped and outranked the component stylesheets, so ghost and link buttons drew borders and every badge variant — `destructive` and the seventeen fixed hues included — rendered in the preset's primary hue. Default and secondary buttons are also pushed further apart, the corner notch extends to icon buttons, the checkbox and the file-upload dropzone, and the HUD//OK card pseudo-element is gone.

### Fixed

- `SelectValue` rendered the raw value instead of the selected item's label whenever the value was set programmatically rather than chosen from the menu. `SelectItem` registers its label only when `SelectContent` mounts, and that is gated on `open`, so before the first open there was nothing to resolve against and the fallback chain reached `value`. An app driving a `Select` from outside — a filter chip, a restored query string, a loaded record — therefore showed the API's own enum to the user. `Select` now also reads labels from its declared element tree, preferring an item's `textValue` and otherwise concatenating its text exactly as `textContent` would, so a tree-read label and a DOM-read label cannot disagree. Items produced by indirection the walk cannot see resolve on first open, as before.
- `PasswordInputVisibilityTrigger`'s default `aria-label` and its `sr-only` `aria-live` status were hardcoded English. The label was overridable per instance, but the status text had no override at all, so a translated app could not localise what a screen reader announces on toggle. Both now read from the `passwordInput` labels group.
- Sidebar nav icons stayed pinned at 16px while their labels grew with the `fontSize` axis.
- `Listbox` selected items were styled with `font-medium` alone, making selection effectively invisible outside the Glass preset.
- `CommandDialog`'s close button sat below its search row, straddling the row's bottom border: it used `DialogContent`'s `top-4` offset, which is calibrated against a `p-6` padding the dialog overrides to `p-0`.
- `DataTable` drew two stacked 1px borders — its own frame plus `.dr-table-wrapper`'s — which read as a doubled edge.
- `ThemeSwitcher`'s panel clipped its axis rows at larger `fontSize` and `density` steps.
- Collapsed sidebar group labels used `invisible` and kept their full box in flow, reserving a wide empty strip per group on the rail.
- A preset declaring `supportedModes` only had it enforced when the user switched presets. The boot path read the mode from storage or `config.defaults` independently of the preset, so a dark-only preset stored or configured alongside `light` painted its near-black surface recipes onto a light rail — Neon booted with `--background` at `210 40% 98%`. A stored `system` is deliberately left alone and clamped at resolve time instead, so switching to a preset that supports both modes still follows the OS.
- `ImageEditor`'s annotation colour control nested `ColorPickerSwatch`, which renders its own popover-trigger button, inside `ColorPickerTrigger`. The resulting button-inside-a-button is invalid HTML and React reported it on every render of the annotation toolbar.
- Every chart logged recharts' `width(-1) and height(-1)` warning on mount. `ResponsiveContainer` defaults `initialDimension` to `-1 × -1` and warns during the render before its `ResizeObserver` fires, which no container CSS can prevent; `ChartContainer` now seeds a positive size.
- `ThemeSettingsPanel`'s `page` layout painted toggle labels outside their own cell and over the neighbouring one, and clipped the last column off both swatch grids. Its axis rows reserved a fixed 8rem label column beside the control, a budget sized for the 34rem popover; in the two-column page grid each column is roughly 19rem, leaving too little for a three- or four-cell toggle group or the 16.5rem swatch grid. Rows now stack the label above a full-width control below 26rem of available width, measured with a container query against the panel rather than the viewport, so the popover is unchanged. Swatch grids wrap to fewer than nine per row instead of clipping, and a toggle cell clips its own label rather than overlapping its neighbour.

## [4.1.0] — 2026-08-14

Additive release. No breaking changes; existing component APIs are unchanged.

### Added

- `darkraise-ui/labels` entry point exporting `UiLabels`, `defaultLabels`, `UiLabelsProvider`, and `useUiLabels()`. The data table, layout shell (including `SkipLink`), theme switcher, and error pages read their strings through it, defaulting to English with no provider mounted. Nested providers merge over the nearest ancestor, so a subtree can override a subset of keys. Some label values are functions (`pageInfo`, `rowsSelected`, `searchWithShortcut`) so a language that orders operands differently expresses that in its own function body. The package ships no translations and has no concept of a locale.

### Changed

- Five `aria-label` values on the theme switcher's axis controls, so translated apps do not strand screen-reader users on English strings when labels are overridden.

### Removed

- The Sci-fi preset's stylesheet no longer `@import`s Orbitron from Google Fonts. It renders Orbitron only when the host system or the consuming app already provides the font, falling through to Rajdhani and the generic families otherwise. This removes a third-party network request from every page load of every consuming app; a build guard now throws if any absolute `@import` reaches the bundle.

## [3.0.0] — 2026-05-07

Major release. The zero-dep components initiative replaces every external runtime dependency that backed a component primitive with an in-house implementation. The public API of every component is preserved (anatomy parts, prop names, accessibility contract). Where we shipped additional anatomy parts (`PopoverArrow`, `PopoverAnchor`, `PopoverClose`, `TooltipArrow`), they are additive. Where minor behavior changed, it is documented below.

### Added

- `packages/ui/src/primitives/` — internal foundation utilities (`Slot`, `Presence`, `FocusTrap`, `DismissableLayer`, `Portal`, `useFloating` + `FloatingArrow`, `useControllableState`, `useId`, `useEvent`, `aria/announcer`, `useVirtualizer`).
- `@floating-ui/react` is the only new runtime dependency; it replaces every internal use of Radix's positioning logic.

### In-house replacements

Each replaced primitive ships a colocated `use<Name>.ts` hook, full keyboard + ARIA test coverage, and Storybook stories. Anatomy parts retain their Radix names so consumer JSX is unchanged.

#### Phase 2 — Trivial primitives

- **Label** — replaces `@radix-ui/react-label`. Native `<label>` with double-click selection guard; pairs with the in-house `useLabel` hook.
- **Separator** — replaces `@radix-ui/react-separator`. Decorative + non-decorative modes via `useSeparator` returning role/`aria-orientation`/`data-orientation`.
- **AspectRatio** — replaces `@radix-ui/react-aspect-ratio`. Padding-bottom ratio strategy returned by `useAspectRatio`.
- **Avatar** — replaces `@radix-ui/react-avatar`. Hand-rolled `useImageLoadingStatus` (re-exported as `useAvatar`) for image probe + fallback delay.
- **Progress** — replaces `@radix-ui/react-progress`. `useProgress` derives `aria-valuenow/min/max`, `aria-valuetext`, indicator transform.
- **Switch** — replaces `@radix-ui/react-switch`. `role="switch"`, controlled/uncontrolled `checked`, Space toggles, native form input mirror.
- **Toggle** — replaces `@radix-ui/react-toggle`. `aria-pressed`, button-style variants; hook exposes `getButtonProps()`.
- **ToggleGroup** — replaces `@radix-ui/react-toggle-group`. `single` and `multiple` selection, roving tabindex, Arrow/Home/End nav.
- **Checkbox** — replaces `@radix-ui/react-checkbox`. Indeterminate state, `aria-checked="mixed"`, hidden form input parity.
- **RadioGroup** — replaces `@radix-ui/react-radio-group`. Roving tabindex, Arrow/Home/End, hidden form inputs per item.
- **SegmentGroup** — wraps in-house `RadioGroup`; ships `useSegmentGroup` re-export and the animated indicator pill.
- **Slider** — replaces `@radix-ui/react-slider`. 1- and 2-thumb modes, Arrow/Shift+Arrow/Home/End/PageUp/PageDown, RTL aware.
- **Collapsible** — replaces `@radix-ui/react-collapsible`. `data-state="open|closed"`, controllable, disabled state, animation hooks.
- **Accordion** — replaces `@radix-ui/react-accordion`. Single + multiple modes, Arrow/Home/End between headers, region/heading semantics.
- **Tabs** — replaces `@radix-ui/react-tabs`. Manual + automatic activation, Arrow/Home/End nav, `aria-controls` + `aria-selected` wiring.

#### Phase 3 — Overlay primitives

- **Dialog** — replaces `@radix-ui/react-dialog`. Adds in-house scroll lock with body padding compensation. Public anatomy preserved (`Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`).
- **AlertDialog** — replaces `@radix-ui/react-alert-dialog`. Composes `useDialog` with `role="alertdialog"`; preserves `AlertDialogAction`/`AlertDialogCancel`.
- **Popover** — replaces `@radix-ui/react-popover`. Adds `useFloating` middleware preset; `PopoverArrow`, `PopoverAnchor`, `PopoverClose` are additive parts.
- **Tooltip** — replaces `@radix-ui/react-tooltip`. Single `TooltipProvider` for delay coordination, focus delegation, hover intent; `TooltipArrow` is additive.
- **HoverCard** — replaces `@radix-ui/react-hover-card`. Open/close delays, pointer + focus intent, dismissable layer stacking.
- **Sheet** — repointed onto in-house `Dialog`; `side` (top/right/bottom/left) drives content anchor.
- **OverlayPrimitives** — repointed onto in-house `Dialog`; `OverlayCloseButton` works with or without an enclosing dialog context.

#### Phase 4 — Composite menus + listboxes

- **DropdownMenu** — replaces `@radix-ui/react-dropdown-menu`. Radio/checkbox items, submenus, typeahead, Arrow/Enter/Escape; built on shared `_internal/useMenu`.
- **ContextMenu** — replaces `@radix-ui/react-context-menu`. Point-anchored variant of DropdownMenu sharing the same `useMenu` core.
- **Menubar** — replaces `@radix-ui/react-menubar`. Top-level horizontal nav with `useMenu` instances per menu and submenu Right/Left traversal.
- **NavigationMenu** — replaces `@radix-ui/react-navigation-menu`. Click/keyboard opens a menu; hover only fast-switches between already-open menus (intentional change from upstream).
- **Select** — replaces `@radix-ui/react-select`. Typeahead, keyboard scroll, position-anchored content, hidden form input parity.
- **Command** — replaces `cmdk`. Composes in-house `Combobox` and `Dialog`; `useCommand` hook re-exports `useCombobox`.
- **VirtualizedDropdownMenu** — replaces `@tanstack/react-virtual` (in this scope). Fixed-height virtualizer keeps `aria-activedescendant` math correct off-screen.
- **ScrollArea** — replaces `@radix-ui/react-scroll-area`. Viewport renders children directly without the inline `display:table` wrapper that previously broke `w-full` descendants.

#### Phase 5 — Behavior libs

- **Carousel** — replaces `embla-carousel-react`. Slides + snap + autoplay + pointer drag + keyboard; new `CarouselApi` is the supported handle.
- **Drawer** — replaces `vaul`. Reuses Dialog foundation; `direction` prop sets bottom/top/right/left; swipe-to-dismiss kept.
- **Resizable** — replaces `react-resizable-panels`. Splitter primitive with `orientation`, multiple panels, keyboard resize via Arrow keys.
- **ColorPicker** — replaces `react-colorful`. Saturation/hue/alpha surfaces and hex/rgb/hsl inputs; reuses in-house Combobox + Slider.
- **Calendar** — replaces `react-day-picker`. Month grid, single/multi/range modes, locale + RTL via `Intl.DateTimeFormat`; the v9 first-click range gotcha is gone.
- **DatePicker** — repointed onto new Calendar; drops `date-fns` for native helpers in `lib/date.ts`.
- **QrCode** — replaces `react-qr-code`. In-house `qrEncoder` produces the matrix; `<svg>` is JSX-rendered with `currentColor`.
- **InputOtp** — replaces `input-otp`. OTP grid with paste handling, pattern validation, controlled/uncontrolled value.
- **Toast (Sonner)** — replaces `sonner`. Imperative `toast()` API parity (`success`/`error`/`warning`/`info`/`loading`/`promise`/`dismiss`/`custom`); uses `aria/announcer` + Presence + Portal. `useSonner` exposes the live toast list for custom UIs.

### Changed

- 26 `@radix-ui/react-*` packages removed. Internal hand-rolled equivalents replace each one.
- `cmdk` removed; `Command` now composes the in-house `Combobox` and `Dialog` directly.
- `embla-carousel-react`, `vaul`, `react-resizable-panels`, `react-colorful`, `react-day-picker`, `react-qr-code`, `input-otp`, `sonner`, `@tanstack/react-virtual`, `date-fns` all removed; in-house implementations replace them.
- `useVirtualizer` is fixed-height only (`itemHeight: number`); the prior `@tanstack/react-virtual` callback shape is no longer supported. `VirtualizedDropdownMenu` was migrated.
- `Carousel` API exposes `scrollPrev / scrollNext / scrollTo / canScrollPrev / canScrollNext / selectedScrollSnap / on / off`. Embla-specific handles are gone.
- `Drawer` accepts `direction` (top/right/bottom/left); `shouldScaleBackground` is a no-op for source compatibility.
- `Calendar` re-exports `Matcher` and `DateRange` types from its own module (not from `react-day-picker`).
- `ScrollArea` Viewport renders user children directly; the inline `display:table` wrapper Radix shipped is gone (resolves the gotcha that broke `w-full` descendants in narrow ancestors).
- `NavigationMenu` no longer hover-opens a closed menu; opening requires click or keyboard. Hover still fast-switches between already-open menus.

### Removed

- Direct dependencies removed: 37 packages (26 Radix primitives + `cmdk`, `embla-carousel-react`, `vaul`, `react-resizable-panels`, `react-colorful`, `react-day-picker`, `react-qr-code`, `input-otp`, `sonner`, `@tanstack/react-virtual`, `date-fns`).
- Dead unlayered sonner overrides removed from `packages/ui/src/styles/theme.css`.

### Migration

- Consumers using only the public anatomy of replaced components need no changes.
- Consumers using internal `XxxPrimitive.*` namespace imports (e.g. `import * as DialogPrimitive from "@radix-ui/react-dialog"`) must switch to the public exports from `darkraise-ui/components/<name>`.
- Consumers using `embla-carousel-react`'s internal API directly via the old `setApi` hook need to switch to the slim `CarouselApi` shape; the old API isn't used by the template app and isn't exposed by the in-house `Carousel`.
- Consumers using `@tanstack/react-virtual`'s `estimateSize` callback for variable-height virtualization must keep using `@tanstack/react-virtual` independently — the in-house `useVirtualizer` is fixed-height only.

### Deferred (not part of this release)

- `recharts` (charting). `@tanstack/react-table` (table state). Both retained as runtime deps; future spec/plan will address them.
- `useVirtualizer` variable-height support.

## [2.1.1] — 2026-05-07

Maintenance release. Phase 0 of the in-house primitives initiative: all runtime dependencies bumped to their latest stable versions before replacement work begins. No public API changes; no breakers surfaced.

### Changed

- Bumped 9 runtime dependencies to latest stable: `@tanstack/react-virtual` 3.13.23 → 3.13.24, `lucide-react` 1.7.0 → 1.14.0, `react-resizable-panels` 4.9.0 → 4.11.0, `zustand` 5.0.12 → 5.0.13. (`react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`, `typescript` patch bumps.) The full upgrade list is captured in the PR description for `chore(ui): bump deps to latest stable (Phase 0)`.
- Bumped Storybook tooling (10.3.4 → 10.3.6), Vitest (4.1.2 → 4.1.5), Vite (8.0.5 → 8.0.11), and other dev infra dependencies. Test infra is not part of the public package surface.

## [2.1.0] — 2026-05-06

Additive release. No breaking changes; existing component APIs are unchanged. Seventeen new components ported from the ark-ui anatomy without taking on `@ark-ui/react` as a dependency. Each new component composes the package's existing Radix-based primitives (`Popover`, `Input`, `Calendar`, `RadioGroup`, `Collapsible`, `Button`, `Badge`) and ships its own state machine in idiomatic React (`useState` / `useReducer`).

### Added

#### Phase 1 — Trivial primitives

- **Clipboard** — copy-to-clipboard control with success-state feedback, polite live-region a11y announcement, error-path callback, and timeout-driven idle revert.
- **Highlight** — pure render utility wrapping query matches in `<mark>`. Supports string or string-array queries, case-insensitive matching, longest-match-first alternation ordering, optional `renderMatch` override.
- **Swap** — CSS crossfade between two children gated by a `pressed` boolean. First-paint flicker suppressed via mounted ref. Controlled and uncontrolled.
- **Timer** — countdown or stopwatch with `start` / `pause` / `resume` / `reset` actions. State machine `idle | running | paused | completed`. `onComplete` fires exactly once. Render parts: `Area`, `Item` (days / hours / minutes / seconds / milliseconds), `Separator`, `Control`, `ActionTrigger` with disabled-state mapping.

#### Phase 2 — Wraps over existing primitives

- **PasswordInput** — composes `Input` with a visibility-toggle button. Polite live-region announces "Password visible / hidden". Mouse-down `preventDefault` keeps focus on the trigger after click.
- **NumberInput** — numeric field with `Intl.NumberFormat` locale formatting, min / max clamp on blur, step on Up / Down arrows, page-step on PageUp / PageDown, fast-step on Shift+Arrow, mouse-wheel support, press-and-hold stepper repeat (400 ms initial delay then 100 ms interval).
- **SegmentGroup** — iOS-style segmented control built atop `RadioGroup` with an animated indicator pill driven by `useLayoutEffect` and `ResizeObserver`. Vertical orientation supported.
- **RatingGroup** — star ratings with hover preview separate from committed value, half-step support, keyboard nav (Arrow / Home / End / Enter / Space), `role="radiogroup"` semantics, optional hidden form input.
- **Editable** — click-to-edit text. State machine `preview | edit`. Submit on Enter, cancel on Escape, optional submit-on-blur. Auto-focus and select-on-focus when entering edit mode. Controlled and uncontrolled.
- **Steps** — wizard / stepper with content slots and linear or non-linear gating. Item status emitted as `data-status="complete | current | upcoming"`. Roving tabindex, ArrowKeys / Home / End focus traversal, NextTrigger / PrevTrigger with boundary disable, optional CompletedContent.

#### Phase 3 — Composite components

- **Combobox** — searchable input with dropdown listbox, `aria-activedescendant` virtual focus, keyboard nav (Up / Down / Home / End / Enter / Escape), single and multi-select, async-friendly (consumer drives `items` prop), empty-state slot, clear trigger, hidden form input.
- **DatePicker** — calendar popover with masked input. Single-date and range modes (discriminated union types), date presets, min / max constraints. Composes the existing `Calendar` (built on `react-day-picker`).
- **TagsInput** — chip-based tag entry. Configurable delimiters (chars and key names), validation hook, duplicate rejection, max-items enforcement, paste-split, two-step backspace deletion, in-place edit per tag, hidden inputs for form serialization.
- **FileUpload** — drag-and-drop multi-file upload. Validation with reasoned reject details (`TOO_LARGE` / `TOO_SMALL` / `FILE_INVALID_TYPE` / `TOO_MANY_FILES`), drag-counter to avoid flicker between child elements, image previews via `URL.createObjectURL` with revoke-on-unmount.
- **TreeView** — recursive nav tree. Selection (single / multi / none), controlled or uncontrolled expansion, full WAI-ARIA tree keyboard pattern (Up / Down / Right / Left / Home / End / Enter / Space), per-node disabled, indentation via configurable `--tree-view-indent` CSS variable. Auto-recursive `TreeViewNode` helper plus manual `Branch` / `Item` composition.

#### Phase 4 — Wraps over small libraries

- **ColorPicker** — wraps `react-colorful` for the picker surface, composes `Popover` for the dropdown. Hex input with revert-on-invalid, swatch presets, optional EyeDropper trigger (only mounted when the native Web API is available).
- **QrCode** — wraps `react-qr-code`, which renders the QR as a real `<svg>` element tree via JSX. Optional logo overlay positioned absolutely. Theme-aware foreground via `currentColor`.

### Dependencies added

- `react-colorful` — for the color-picker surface.
- `react-qr-code` — for the QR generator.

### Demo coverage

Every new component ships a corresponding page under `apps/template/src/routes/_authenticated/components/<name>.tsx` using the existing `ShowcasePage` and `ShowcaseExample` helpers, plus an entry in the component index page at `/components`.

### Conventions preserved

- Six-axis theme system (`packages/ui/src/styles/theme.css` plus `packages/ui/src/theme/engine/`) untouched. Components consume existing tokens (`--density-cell`, `--density-button-py`, `text-muted-foreground`, `bg-muted`, etc.).
- Class-shorten convention: every component owns a `dr-{name}` root class with optional sub-part classes (`dr-{name}-{part}`). `data-*` attributes drive all variant styling. No raw Tailwind utility classes leak into JSX.
- No `!important`, no `!` modifiers, no string-based DOM injection. All SVG content (QrCode) is JSX-rendered.
- No `@ark-ui/react` dependency. Ark source at `D:/Repositories/Community/ark/packages/react/src/components/<name>/` was used as anatomy and event-flow reference only.

## [2.0.0] — 2026-04-22

Initial public release. Forty-seven themed components, thirty-eight hooks, six-axis theming, layout variants, errors / router / forms / data-table sub-packages.
