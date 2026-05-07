# Changelog

All notable changes to `darkraise-ui` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
