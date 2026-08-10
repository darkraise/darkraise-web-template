# Variant matrix coverage record

This file records the outcome of the 2026-08-09 sweep to give every component
demo page a compile-enforced variant matrix (`allOf<T>()` + `VariantMatrix`,
see `-variant-axes.ts` and `-variant-matrix.tsx`). It exists so nobody
re-audits the same components looking for missed matrix work. `.md` extension
so TanStack Router ignores this file despite the `-` prefix.

## Enforcement is real, not aspirational

Verified end to end: temporarily adding `"warning"` to `ButtonVariant` in
`packages/ui/src/components/button/Button.tsx`, rebuilding `darkraise-ui`,
and running `pnpm --filter darkraise-web-template typecheck` fails with:

```
src/routes/_authenticated/components/buttons.tsx(43,3): error TS2345: Argument of type
'[string, string, string, string, string, string]' is not assignable to parameter of type 'never'.
  The intersection '["default", "destructive", "outline", "secondary", "ghost", "link"] & ["missing", "warning"]'
  was reduced to 'never' because property '0' has conflicting types in some constituents.
```

`buttons.tsx`'s `BUTTON_VARIANTS` constant is named directly, and the missing
member (`"warning"`) is named directly. The change was reverted, the package
rebuilt, and typecheck confirmed green again — the working tree is clean.
This is the property the whole exercise buys: a new variant added to the UI
package breaks the template's typecheck until the demo page is updated to
show it, so coverage cannot silently decay.

## 2026-08-10 fix wave

A final whole-branch review found genuine coverage gaps. They were closed as
follows.

- **accordion** previously showed only a two-value `variant` row. It now has a
  `variant` x `elevation` cross-product (`AccordionVariant` x `CardElevation`),
  a single-axis `border` row (`CardBorder`), and a single-axis `orientation`
  row. `border` and `elevation` only paint under `variant="card"` — the
  component gates `data-border` / `data-elevation` on `isCard`
  (`Accordion.tsx:199-204`) — so the `variant="default"` row carries the muted
  footnote used elsewhere on this branch, and the `border` row is pinned to
  `variant="card"`.
- **field** covered only the `FieldLegend` `legend|label` variant. It now also
  has an `orientation` row over all three of `vertical | horizontal |
responsive`, which `field.css` styles individually.
- **pagination** gained a real `allOf<PaginationVariant>()` matrix (see the
  correction below).

### Inline unions are now named exports

Five pages were calling `allOf` with a **local copy** of a union, because the
package declared the prop inline with no named export. A local copy enforces
removals but not additions: widening the union in the package would leave the
demo compiling, which is the exact decay this branch exists to prevent. The
following aliases were added beside the inline declarations and the demo pages
now import them:

| Type                                     | Declared in                          | Used by               |
| ---------------------------------------- | ------------------------------------ | --------------------- |
| `TooltipSide`, `TooltipAlign`            | `tooltip/Tooltip.tsx`                | `tooltip.tsx`         |
| `ToolbarOrientation`                     | `toolbar/Toolbar.tsx`                | `toolbar.tsx`         |
| `ButtonGroupOrientation`                 | `button-group/ButtonGroup.tsx`       | `button-group.tsx`    |
| `NavigationMenuOrientation`              | `navigation-menu/NavigationMenu.tsx` | `navigation-menu.tsx` |
| `FieldLegendVariant`, `FieldOrientation` | `field/Field.tsx`                    | `field.tsx`           |
| `PaginationVariant`                      | `pagination/Pagination.tsx`          | `pagination.tsx`      |

Adding `export` to a type that is **also** declared elsewhere in the same
component folder triggers `TS2308` through that folder's barrel, and because
`tsup` runs with `clean: true` the DTS build aborts and leaves
`packages/ui/dist` with no declaration files at all. Every name above was
grepped across `packages/ui/src` first and confirmed to occur exactly once.

### Still unenforced

Enforcement is **not** blanket. These remain uncovered by `allOf`:

- **accordion's `orientation`** is still a local copy. The package declares it
  inline on `AccordionCommonProps` (`Accordion.tsx:75`) with no named export,
  and unlike the six types above it was not in scope for the export pass. The
  demo constant carries a comment saying so.
- **`TimelineConnectorVariant`** (`"solid" | "dashed"`, exported at
  `Timeline.tsx:11`) has both values rendering in `timeline.tsx`'s "Dashed
  connectors" example, but there is no `allOf` call naming the type, so a third
  connector variant would not break the build.
- **`ToggleGroup`** accepts `ToggleVariant` / `ToggleSize` but its page covers
  only `orientation`. Those two unions are shared with `Toggle`, whose page
  carries the full enforced `variant` x `size` matrix, so enforcement exists
  indirectly — a new toggle variant breaks `toggle.tsx`, not
  `toggle-group.tsx`.

## Deliberate exceptions

### background-page — no matrix by design

`background-page` has 12 variants but intentionally has **no** `VariantMatrix`.
It is already covered by a pre-existing carousel that maps over
`BACKGROUND_PAGE_VARIANTS`, the package's own exported metadata array. That is
a stronger guarantee than a hand-written matrix list: the carousel cannot fall
behind when a new background variant is added, because it reads the same
array the package exports rather than a copy duplicated into the demo. A
`VariantMatrix` was built for this page during the sweep and then deliberately
removed — it would have added 12 more animated background instances to the
page for zero coverage gain over what the carousel already proves.

### navigation-menu — orientation axis kept despite a dead prop

The `orientation` axis is present in `navigation-menu`'s matrix and both
`"horizontal"` and `"vertical"` values render, but they currently look
identical. The component's `orientation` prop is dead: it is declared at
`packages/ui/src/components/navigation-menu/NavigationMenu.tsx:49` but never
destructured, and `data-orientation="horizontal"` is hardcoded at lines 162
and 185 regardless of the prop's value. The demo page carries a footnote
stating this. The axis was deliberately kept in the matrix rather than
dropped to one value, so that once the component bug is fixed, `allOf`
continues enforcing both values are shown. This dead-prop bug in
`packages/ui` is tracked as separate follow-up work, not fixed by this sweep.

### contribution-graph and carousel — axes shown separately, not crossed

Both components list every value of every axis, but the axes are **not**
crossed into a grid. A single instance of either component is wide enough
that a full cross-product grid would produce cells too narrow to be useful
(contribution-graph is a calendar-width heatmap; carousel is a full-width
slider). Every variant/size and every align/orientation value is rendered
somewhere on the page; only the pairwise crossing is dropped for layout
reasons, not coverage reasons.

## Components with no enumerable presentational axis (55)

An earlier revision of this list wrongly included `pagination`. It has
`PaginationVariant = "filled" | "outlined"`
(`packages/ui/src/components/pagination/Pagination.tsx:8`); both values already
rendered on the page, so there was never a visual gap, but the claim was false.
The type is now exported and the page has a proper `allOf` matrix, so
`pagination` has been removed from the list below.

These components have no `variant`/`size`/`color`/`side`/`align`/`position`/
`status`/`shape`/`tone`/`border`/`elevation`/`density`-shaped prop to cross —
they are behavioural or compositional rather than presentational. Each was
reviewed individually during the sweep; no matrix applies to any of them.

- `_internal`
- `alert-dialog`
- `angle-slider`
- `aspect-ratio`
- `avatar`
- `breadcrumb`
- `calendar`
- `cascade-select`
- `chart`
- `clipboard`
- `collapsible`
- `color-picker`
- `combobox`
- `command`
- `context-menu`
- `date-input`
- `date-picker`
- `dialog`
- `download-trigger`
- `drawer`
- `editable`
- `empty-state`
- `fieldset`
- `file-upload`
- `floating-panel`
- `frame`
- `highlight`
- `image-common`
- `image-cropper`
- `image-editor`
- `input`
- `json-tree-view`
- `label`
- `marquee`
- `menu-primitives`
- `multi-select`
- `number-input`
- `overlay-primitives`
- `password-input`
- `progress`
- `qr-code`
- `rating-group`
- `signature-pad`
- `skeleton`
- `stat`
- `swap`
- `switch`
- `table`
- `tags-input`
- `textarea`
- `time-picker`
- `timer`
- `tour`
- `virtualized-dropdown-menu`
- `virtualized-timeline`

Of these, `_internal`, `image-common`, `menu-primitives` and
`overlay-primitives` also have no demo page at all — they are internal
support modules, not user-facing components, so no page was ever expected.

## Full suite results (2026-08-10 verification pass)

- `pnpm --filter darkraise-ui test` — 138 test files, 1570 tests, all passing.
- `pnpm --filter darkraise-ui build` — clean.
- `pnpm --filter darkraise-web-template typecheck` — clean.
- `pnpm --filter darkraise-web-template lint` — clean.
- `pnpm --filter darkraise-web-template test` — 3 test files, 11 tests, all
  passing.
- `pnpm --filter darkraise-web-template test:e2e` — **1328 tests passing in
  7.4 minutes, identical to the pre-sweep baseline.** The variant matrices
  added no measurable e2e cost: the count is unchanged because
  `e2e/02-routes.spec.ts` and `e2e/05-component-preset-matrix.spec.ts`
  iterate over existing routes rather than adding one test per new matrix
  cell. Recorded here deliberately — "measured and confirmed unchanged" is
  more useful to the next reader than silence on the topic.
