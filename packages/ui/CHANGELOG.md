# Changelog

All notable changes to `darkraise-ui` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Breaking: `ThemeConfig` gains two required properties, `defaults.borderIntensity` and `switcher.axes.borderIntensity`. Consumers passing their own `config` object must add both before upgrading:

```ts
defaults: { …, borderIntensity: "balanced" },
switcher: { axes: { …, borderIntensity: true } },
```

Once added, the `balanced` default renders exactly as before. A config that still omits it at runtime also renders as before rather than throwing.

Breaking: the Sci-fi preset is removed, and with it the `supportedModes` field on presets. `PresetName` is now `"default" | "glass"`, so a config or call naming `"scifi"` fails to type-check. A user whose stored or synced settings name `scifi` loads the configured default preset and keeps its stored mode: dark, unless the user chose System, which follows the OS.

Breaking: `Card` and card-variant `AccordionItem` expose their elevation as `data-card-elevation` instead of `data-elevation`, so a selector such as `.dr-card[data-elevation="high"]` must become `.dr-card[data-card-elevation="high"]`. Also removed: the `--shadow-card`, `--card-border` and `--glow-surface` tokens, `PresetSurfaceRecipe.overrides.shadowCard`, and the `data-sidebar-active-bar` attribute on `<html>`; see Removed.

Breaking: control sizing, radius and focus tokens are renamed, with no aliases. `--density-cell`, `--density-cell-base`, `--density-cell-sm` and `--density-cell-lg` are replaced by `--control-height` (with the scale `--control-height-xs` … `--control-height-xl`, `--control-height-default` set by density and `--control-height-min`, the coarse-pointer floor); `--density-button-px`, `--density-button-py` and their `-sm` / `-lg` forms by `--btn-height`, `--btn-px` and `--btn-px-tight`; `--density-input-px` and `--density-input-py` by `--field-px` and `--field-py`; `--radius-button` by `--radius-control`. The `focus-ring-tight` utility is removed; use `focus-ring-inset`, which now draws 2px inside the element. Badge, Kbd and Spinner size `md` is now `default`, and TreeView and Pagination variant `outlined` is now `outline`.

### Added

- A `borderIntensity` theme axis — `subtle`, `balanced`, `strong`, `bold` — shown in the theme panel's Depth group as **Border Intensity**. It moves `--border`, `--input`, `--border-subtle`, `--border-default`, `--border-strong` and `--sidebar-border` toward the page or toward the text colour in OKLCH lightness, keeping each border's own hue and chroma; a translucent border, such as dark glass's white hairline, has its alpha scaled instead. It runs after a preset's own tokens are merged, so it applies under every preset. Elements that rebind `--border` in CSS, such as the `.dr-surface` utility, keep their own border.
- `writeClipboardText` in `darkraise-ui/lib`: writes through the async Clipboard API and falls back to a selection copy when that API is missing or rejects.
- `--primary-text` (utility `text-primary-text`): the accent as a text colour, solved to 4.5:1 against the page and the card. The kit's links and other accent-coloured text use it; apps that colour text with `text-primary` should move to `text-primary-text`, since `--primary` itself only clears 3:1.
- `--destructive-solid` and `--destructive-solid-foreground` (utilities `bg-destructive-solid`, `text-destructive-solid-foreground`): a destructive fill that carries a white label at 4.5:1 in both modes. The destructive button, destructive badge and notification count use it.
- `--primary-fill-wash` and `--destructive-solid-wash`: what a hover or press mixes into the matching fill, black under a white label and white under an ink label. Mixing toward them always raises the label's contrast.
- Control tokens: `--btn-height`, `--btn-px`, `--btn-px-tight`, `--btn-radius`; `--field-height`, `--field-px`, `--field-py`, `--field-radius`, `--field-edge`; `--overlay-bg`, `--overlay-border`, `--overlay-shadow`, `--overlay-radius`; `--track-height`; `--disabled-opacity` and `--loading-opacity`. Override one family (for example `--btn-radius`) without touching the others.
- `--field-edge-color`: a boundary colour solved to 3:1 against the page, card, sunken well, deep well, sidebar and header, and to 3.5:1 under the glass preset, whose translucent cards let the canvas shift the ground a field sits on. `borderIntensity` does not move it.
- Selection tokens: `--selected-view-bg`, `--selected-view-fg` and `--selected-view-shadow` for view switches; `--selected-check-bg` and `--selected-check-fg` for checked and selected items; `--selected-mark` and `--selected-mark-fg` for underline tabs; `--selected-nav-bg` and `--selected-nav-fg` for the active navigation row. Override one family to restyle every component that reads it, Checkbox and Switch included; field choice cards still tint their container from the primary tokens directly.
- `--status-tint` (0.1): the alpha Alert, Banner and Toast wash their status colour at, in both modes.
- `--sidebar-active-bg`: an engine token one accent-ramp step above `--sidebar-hover-bg` (the next shade up in light mode, 0.1 more alpha in dark), so the active sidebar row always differs from a hovered one.

### Changed

- The theme panel's **Shell Style** control is a single-row `SegmentGroup`. As a six-value toggle group it had no matching column rule and stacked vertically.
- `inset`, `island` and `framed` shells paint the page background as their ground, as `floating` already did, instead of the sidebar surface.
- Primary fills are solved so their label clears 4.5:1. In light mode the nine white-labelled accents (red, coral, blue, indigo, violet, purple, fuchsia, pink, rose) darken slightly; the other nine keep their fill and ink label. In dark mode the `balanced` fill darkens for nine of the eighteen accents, and each Accent Intensity step's lightness is now a ceiling, so neighbouring steps can produce the same fill: on slate, orange, emerald, teal and fuchsia at `vivid` and `intense`, and sky at `balanced` and `vivid`. Light-mode `balanced`, `vivid` and `intense` already shared one fill. Under the glass preset the set of darkened accents differs. No accent's label colour changes.
- Status colours follow one policy: each clears 4.5:1 against the page and the card, and its `-foreground` is whichever of white or ink reads better on it. In light mode success, warning and info darken and the warning label becomes white; in dark mode every status label becomes ink, including `--destructive-foreground`, and `--destructive` lightens slightly. Destructive fills use the new solid pair, so their colour shifts: in light mode blue and green accents move from `0 84% 48%` to `358 71% 53%` (label contrast about 4.6:1, down from about 4.9:1), and red, rose and pink accents from `25 95% 38%` to `26 96% 38%`; in dark mode blue and green accents move from `0 72% 56%` to `0 72% 51%`. Apps that paint destructive fills themselves with `bg-destructive text-destructive-foreground` should move to `bg-destructive-solid text-destructive-solid-foreground`, since the dark label is now ink.
- `--legend` is solved against the page, card and popover instead of the page alone, so it reads slightly stronger; it is not meant for muted fills.
- Primary-coloured text in the kit (links and other accent-coloured text) now reads `--primary-text`: in light mode every accent's text colour darkens, and in dark mode indigo and violet lighten. Glass paints its accent text foregrounds with it too.
- Hover and press on filled controls move away from the label instead of toward it: under a white label they now darken, in dark mode too, where they used to lighten. This covers the default and destructive button and badge, the on toggle, selected calendar days, the selected time-picker item and the file-upload trigger. The old translucent and label-coloured hovers took a fill solved to 4.5:1 down to 3.3:1 in light mode. Under the glass preset the default and destructive badges swap their `--primary` / `--destructive` tint, which measured 2.67:1 in dark, for a sheen of the wash.
- Under the glass preset the default and destructive buttons paint an opaque fill under a sheen of the wash instead of a translucent fill mixed toward white, which measured 2.57–2.91:1 on the light glass page. Their border, halo and backdrop blur are unchanged, and hover comes from the shared state layer.
- The fixed accent-colour badges clear 4.5:1: orange, green, emerald, teal, cyan and sky take their own -950 ink on the -500 fill, as amber, yellow and lime already did; red, rose, pink, fuchsia, blue, violet and purple darken to -600 under white; indigo is unchanged. White on green-500 measured 2.22:1. Hover moves one shade away from the label instead of turning translucent.
- `--primary-text` also clears 4.5:1 on a `--primary` tint of up to 24% over the page and card, where steps, timeline, highlight and the sidebar count (20%) put it; on a 10% tint it had failed in about half of all themes. It darkens by up to about 12 lightness points in light mode and lightens by up to about 11 in dark. The status colours likewise clear 4.5:1 on their own tint of up to 12%, as alert and toast titles use them: success and warning darken by up to about 4 points in light, info by up to about 7, and destructive moves by up to about 7 in both modes.
- Timing: the steps indicator moves from 250 to 200ms, the slider thumb from 100 to 150ms and calendar days from 120 to 150ms. Every other component keeps its timing, now expressed through the motion tokens.
- Buttons, toggles and fields share one height per density: compact 28px, cozy 32px, comfortable 36px, spacious 40px, scaled by the font-size axis. Outline, ghost and dark-mode secondary buttons no longer sit 2px taller, and multi-select, date input, OTP slots and segment items now follow density. On a coarse pointer (touch screens), buttons and fields are at least 40px tall at every density; sidebar controls, the collapsed search trigger, breadcrumb, editable and calendar keep their density height so they still fit their slots.
- Fields draw a bottom edge at 3:1 or more, with faint sides and top; unchecked checkboxes, radios and switch tracks draw that edge all round instead of the accent colour. Under the glass preset the frosted sides stay and the edge is added.
- Multi-select, date input and OTP slots use the field surface, so they recess inside cards and overlays like other fields; multi-select no longer carries a drop shadow.
- Textarea, tags input and multi-select take the surface radius, so they stay rounded rectangles at the `pill` radius; overlays (dialog, sheet, drawer, popover, tooltip, menus, command, toast and others) share `--overlay-radius`; kbd follows the radius setting, capped at 6px. At `pill`, tooltips become fully rounded.
- Date input and OTP slots take the control radius instead of `rounded-md`, and the select trigger and the glass combobox control take it instead of the surface radius `--radius`, so at `pill` all four become full pills like inputs and buttons. Overlays that used `rounded-md` (`--radius` minus 2px) are 2px rounder now that they read `--overlay-radius`.
- The progress bar is 8px tall, matching the slider track.
- Focus: standalone controls draw the focus ring 2px outside; items packed into a container (menu and list rows, segment and toggle-group items, grouped buttons, buttons inside input and number-input wrappers, calendar days) draw it 2px inside. Date input, listbox and multi-select show focus with the shared utilities instead of a box-shadow ring.
- Hover: toggle, tabs, segment items, number-input steppers, icon triggers, overlay close buttons and pagination use the button's state layer, and none of them reacts to hover while disabled. The toggle's label no longer dims on hover, and accordion triggers no longer underline.
- Disabled: every disabled control uses `--disabled-opacity` (0.5); a loading button uses `--loading-opacity` (0.7). Disabled toggles, tabs, navigation-menu triggers, number-input steppers and password toggles keep pointer events and show the not-allowed cursor, so a tooltip can explain them.
- Every interactive control opts out of double-tap zoom and draws a boundary in forced-colours mode.
- Transitions use the kit's easing curves instead of CSS keywords, so short fades such as the 120ms hover wash feel sharper.
- Selected states use four families. Tabs (`default` and `outline`) and SegmentGroup select with a neutral raised pill and foreground text instead of the accent, including the default Tabs pill; their `outline` pills carry a 1px neutral ring so the variant still differs from `default`. Toggle, Listbox, TreeView, Calendar, TimePicker, TagsInput, Pagination, Steps and Timeline fill checked and selected items with the accent, outline variants included: an on outline toggle, a selected outline listbox or tree row and the outline current page now take the filled variant's fill instead of an accent border and accent text. Underline tabs and PageHeader tabs keep an accent bar under foreground text. The dashed completed-step connector in `Timeline` draws in the accent fill instead of `--primary-text`. `Listbox`, `TreeView` and `Pagination` now render `outline` and `filled` the same way, apart from a primary ring on the glass outline listbox. Under the glass preset the SegmentGroup pill is the opaque `--card` instead of the translucent card fill.
- `PaginationLink` marks the current page with `data-active="true"` and stays a ghost button in both variants; the filled variant used to render it as a `data-variant="default"` button. `Pagination` writes its `variant` on its root as `data-variant`.
- The sidebar's active row is a tint one step stronger than hover, plus its bolder label and primary icon. The 3px bar is opt-in through `sidebarActiveBar` (`bar` or `both`): "Auto" no longer draws it under the default preset (glass keeps its ring and rail), and the stacked layout's rail and sub-navigation follow the setting too. The sidebar popover's active child, the top-nav active item and the layout switcher's active option use the same tint.
- Outline buttons and FloatingPanel header triggers rest on the neutral 3:1 field edge instead of the accent, and ghost buttons rest on foreground text; hover on all of them comes from the state layer, and the FloatingPanel trigger rim no longer changes on hover. Search triggers, AlertDialog Cancel and the CascadeSelect trigger are outline buttons and follow.
- Scrollbars, the ScrollArea thumb and Skeleton are neutral (a foreground alpha) instead of accent-tinted.
- Badges react to hover only when they are a link, a button or `role="button"`.
- Alert, Banner and Toast share a 10% status tint in both modes, painted over an opaque base: Alert's wash moves from 6%, Banner's from 12% (18% in dark) and the warning toast's from 12%. The icon and title take the status colour and body text stays on the foreground; Banner's frame is neutral beside its 4px rail, and its dark-mode text is no longer status-coloured. Toasts have no status border.
- Toasts read the overlay tokens (`--overlay-bg` with the overlay blend mode, `--overlay-border`, `--overlay-shadow`), so the glass preset frosts them like other overlays.
- Menus agree on their details: separators use `--border` (select and menubar used `--muted`); shortcuts use the muted text colour instead of 60% opacity; menubar content is at least 8rem wide, like other menus (was 12rem); command items show the pointer cursor; combobox, listbox, tree and cascade rows pad by density; menu, select and menubar group labels are small, medium-weight and muted, like command's.
- NavigationMenu triggers and the Menubar are transparent at rest; the menubar keeps its border.
- Sheets round only the two corners away from their viewport edge, draw their border only on the inner side, and pad that edge 1.5rem like the other sides.

### Removed

- The Sci-fi preset, its `frame` axis and its stylesheet. The theme switcher and `create-darkraise-ui` no longer offer it.
- `supportedModes` on presets, which only Sci-fi used, and the provider and switcher logic that enforced it.
- The `--shadow-card`, `--card-border` and `--glow-surface` tokens, which no stylesheet read, and `PresetSurfaceRecipe.overrides.shadowCard` on the preset type.
- The `data-sidebar-active-bar` attribute on `<html>`. Read the setting from `useTheme().sidebarActiveBar`; the sidebar still writes its own `data-active-bar`.
- The glass `[data-glass-halo="none"]` rule, which nothing could trigger since the halo axis moved to the global glow axes.
- The tokens and utility listed in the Breaking note above: `--density-cell`, `--density-cell-base`, `--density-cell-sm`, `--density-cell-lg`, `--density-button-px`, `--density-button-py` and their `-sm` / `-lg` forms, `--density-input-px`, `--density-input-py`, `--radius-button`, and `focus-ring-tight`.

### Fixed

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
- Under the glass preset fields never showed the invalid state (InputOTP has no invalid state in either preset yet).
- The stacked layout ignored the sidebar's Bar, Ring and Both indicator settings.
- In forced-colours mode every focus ring was pushed 2px outside its control, so inset rings inside clipping wrappers were cut off.
- Packed toolbar buttons (image-editor tools and annotation kinds, JSON tree toolbar actions) drew focus rings over their neighbours.
- CascadeSelect drew a focus ring on the active path permanently, even under the mouse.

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
