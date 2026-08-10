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

## Components with no enumerable presentational axis (56)

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
- `pagination`
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
