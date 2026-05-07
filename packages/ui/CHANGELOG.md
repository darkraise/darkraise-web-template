# Changelog

All notable changes to `darkraise-ui` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
