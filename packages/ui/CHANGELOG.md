# Changelog

All notable changes to `darkraise-ui` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
